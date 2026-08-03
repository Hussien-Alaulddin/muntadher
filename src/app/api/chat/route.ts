import { NextResponse } from "next/server";
import { getPrisma, withDbRetry } from "@/lib/prisma";
import {
  formatChatReplyForUser,
  geminiChatReplyStream,
  localAssistantReply,
  suggestionsForReply,
  type ChatAssistantContext,
  type ChatMessage,
} from "@/lib/site-assistant";
import { getPublicSiteKnowledgeCached } from "@/lib/site-assistant-knowledge";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_MESSAGES = 12;
const MAX_CONTENT = 1000;

function defaultContext(): ChatAssistantContext {
  return {
    designerName: "منتظر",
    contactEmail: null,
    whatsappUrl: null,
  };
}

async function loadContext(): Promise<ChatAssistantContext> {
  const ctx = defaultContext();
  const prisma = getPrisma();
  if (!prisma) return ctx;

  try {
    const settings = await withDbRetry((db) =>
      db.siteSettings.findUnique({ where: { id: "default" } }),
    );
    if (!settings) return ctx;
    return {
      designerName: settings.designerName?.trim() || ctx.designerName,
      contactEmail: settings.contactEmail,
      whatsappUrl: settings.whatsappUrl,
    };
  } catch (error) {
    console.error("[chat:context]", error);
    return ctx;
  }
}

function sanitizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const cleaned: ChatMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string") continue;
    const text = content.trim().slice(0, MAX_CONTENT);
    if (!text) continue;
    cleaned.push({ role, content: text });
    if (cleaned.length >= MAX_MESSAGES) break;
  }
  return cleaned;
}

function geminiApiKey() {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    ""
  );
}

function encodeEvent(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/** تسخين كاش المعرفة عند فتح المحادثة */
export async function GET() {
  const ctx = await loadContext();
  await getPublicSiteKnowledgeCached(ctx);
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const limited = rateLimit(`chat:${clientIp(request)}`, 40, 60 * 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { message: "محاولات كثيرة — حاول لاحقاً" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  let body: { messages?: unknown };
  try {
    body = (await request.json()) as { messages?: unknown };
  } catch {
    return NextResponse.json({ message: "طلب غير صالح" }, { status: 400 });
  }

  const messages = sanitizeMessages(body.messages);
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return NextResponse.json(
      { message: "اكتب رسالة أولاً" },
      { status: 422 },
    );
  }

  const ctx = await loadContext();
  const apiKey = geminiApiKey();
  const knowledge = await getPublicSiteKnowledgeCached(ctx);
  const encoder = new TextEncoder();

  const streamLocal = (reply: string, mode: "local" | "ai" = "local") => {
    const clean = formatChatReplyForUser(reply);
    const suggestions = suggestionsForReply(clean, ctx);
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(encodeEvent({ type: "token", text: clean })),
        );
        controller.enqueue(
          encoder.encode(
            encodeEvent({ type: "done", reply: clean, suggestions, mode }),
          ),
        );
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  };

  if (!apiKey) {
    const local = localAssistantReply(lastUser.content, ctx);
    return streamLocal(local.reply, "local");
  }

  try {
    const stream = new ReadableStream({
      async start(controller) {
        let full = "";
        try {
          for await (const token of geminiChatReplyStream(
            messages,
            ctx,
            apiKey,
            knowledge,
          )) {
            full += token;
            controller.enqueue(
              encoder.encode(encodeEvent({ type: "token", text: token })),
            );
          }

          if (!full.trim()) {
            const local = localAssistantReply(lastUser.content, ctx);
            full = local.reply;
            controller.enqueue(
              encoder.encode(encodeEvent({ type: "token", text: full })),
            );
          }

          const clean = formatChatReplyForUser(full);
          controller.enqueue(
            encoder.encode(
              encodeEvent({
                type: "done",
                reply: clean,
                suggestions: suggestionsForReply(clean, ctx),
                mode: "ai",
              }),
            ),
          );
          controller.close();
        } catch (error) {
          console.error("[chat:stream]", error);
          const local = localAssistantReply(lastUser.content, ctx);
          const reply = formatChatReplyForUser(local.reply);
          controller.enqueue(
            encoder.encode(encodeEvent({ type: "token", text: reply })),
          );
          controller.enqueue(
            encoder.encode(
              encodeEvent({
                type: "done",
                reply,
                suggestions: local.suggestions,
                mode: "local",
              }),
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[chat:post]", error);
    const local = localAssistantReply(lastUser.content, ctx);
    return streamLocal(local.reply, "local");
  }
}

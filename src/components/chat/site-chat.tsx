"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/components/link";
import {
  MessageCircleIcon,
  SendIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { cx } from "@/components/ui";

type ChatSuggestion = { label: string; href: string };

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: ChatSuggestion[];
};

const WELCOME: UiMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "مرحباً! أنا مساعد الموقع. اسألني عن الخدمات، الأعمال، المنتجات، أو كيف تبدأ مشروعك.",
  suggestions: [
    { label: "استمارة طلب مشروع", href: "/project-request" },
    { label: "تصفّح أعمالي", href: "/projects" },
    { label: "المنتجات والدورات", href: "/products" },
  ],
};

function isExternalHref(href: string) {
  return (
    href.startsWith("http") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
}

export function SiteChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([WELCOME]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    void fetch("/api/chat", { method: "GET", cache: "no-store" }).catch(
      () => undefined,
    );
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [open, messages, loading]);

  async function sendMessage(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const userMsg: UiMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content,
    };
    const assistantId = `a-${Date.now()}`;
    const nextMessages = [...messages, userMsg];
    setMessages([
      ...nextMessages,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages
            .filter((m) => m.id !== "welcome")
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("تعذّر الرد");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assembled = "";

      const handleEventPayload = (raw: string) => {
        if (!raw) return;
        try {
          const event = JSON.parse(raw) as {
            type?: string;
            text?: string;
            reply?: string;
            suggestions?: ChatSuggestion[];
          };
          if (event.type === "token" && event.text) {
            assembled += event.text;
            const snapshot = assembled;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: snapshot } : m,
              ),
            );
          }
          if (event.type === "done") {
            const finalText = (event.reply ?? assembled).trim();
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: finalText || "لم أتمكن من صياغة رد الآن.",
                      suggestions: event.suggestions,
                    }
                  : m,
              ),
            );
          }
        } catch {
          /* تجاهل أجزاء غير مكتملة */
        }
      };

      const consumeClientBuffer = (flush: boolean) => {
        const parts = buffer.split("\n\n");
        if (!flush) {
          buffer = parts.pop() ?? "";
        } else {
          buffer = "";
        }
        for (const part of parts) {
          const line = part
            .split("\n")
            .map((l) => l.trim())
            .find((l) => l.startsWith("data:"));
          if (!line) continue;
          handleEventPayload(line.slice(5).trim());
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          buffer += decoder.decode();
          consumeClientBuffer(true);
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        consumeClientBuffer(false);
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  "حدث خلل مؤقت. يمكنك تجربة استمارة طلب المشروع أو العودة لاحقاً.",
                suggestions: [
                  { label: "استمارة طلب مشروع", href: "/project-request" },
                ],
              }
            : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pointer-events-none fixed end-4 bottom-4 z-50 flex flex-col items-end gap-3 md:end-6 md:bottom-6">
      {open ? (
        <div
          className="pointer-events-auto flex h-[min(34rem,calc(100dvh-6.5rem))] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-[16px] bg-page shadow-[0_16px_50px_rgba(17,16,17,0.16)] ring-1 ring-ink/8 animate-form-step-in"
          role="dialog"
          aria-label="محادثة مساعد الموقع"
        >
          <header className="flex items-center gap-3 border-b border-line-subtle bg-surface px-3.5 py-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-brand text-inverted">
              <SparklesIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-small font-bold text-ink">مساعد الموقع</p>
              <p className="text-nano text-ink-muted">يسعده مساعدتك الآن</p>
            </div>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-[8px] text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink"
              aria-label="إغلاق المحادثة"
              onClick={() => setOpen(false)}
            >
              <XIcon className="size-4" />
            </button>
          </header>

          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto px-3.5 py-3"
          >
            {messages.map((msg) => {
              if (msg.role === "assistant" && !msg.content) return null;
              return (
              <div
                key={msg.id}
                className={cx(
                  "flex flex-col gap-2",
                  msg.role === "user" ? "items-start" : "items-stretch",
                )}
              >
                <div
                  className={cx(
                    "max-w-[92%] rounded-[12px] px-3 py-2 text-body leading-relaxed",
                    msg.role === "user"
                      ? "bg-brand text-inverted"
                      : "bg-surface text-ink",
                  )}
                >
                  {msg.content}
                </div>
                {msg.role === "assistant" && msg.suggestions?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.suggestions.map((s) =>
                      isExternalHref(s.href) ? (
                        <a
                          key={`${msg.id}-${s.href}-${s.label}`}
                          href={s.href}
                          target={
                            s.href.startsWith("http") ? "_blank" : undefined
                          }
                          rel={
                            s.href.startsWith("http")
                              ? "noopener noreferrer"
                              : undefined
                          }
                          className="rounded-field border border-ink/10 bg-page px-2.5 py-1 text-nano text-ink transition-colors hover:border-brand/40 hover:text-brand"
                        >
                          {s.label}
                        </a>
                      ) : (
                        <Link
                          key={`${msg.id}-${s.href}-${s.label}`}
                          href={s.href}
                          className="rounded-field border border-ink/10 bg-page px-2.5 py-1 text-nano text-ink transition-colors hover:border-brand/40 hover:text-brand"
                          onClick={() => setOpen(false)}
                        >
                          {s.label}
                        </Link>
                      ),
                    )}
                  </div>
                ) : null}
              </div>
              );
            })}

            {loading &&
            messages[messages.length - 1]?.role === "assistant" &&
            !messages[messages.length - 1]?.content ? (
              <div className="flex items-center gap-1.5 rounded-[12px] bg-surface px-3 py-2.5 text-ink-muted">
                <span className="size-1.5 animate-pulse rounded-full bg-brand" />
                <span
                  className="size-1.5 animate-pulse rounded-full bg-brand"
                  style={{ animationDelay: "120ms" }}
                />
                <span
                  className="size-1.5 animate-pulse rounded-full bg-brand"
                  style={{ animationDelay: "240ms" }}
                />
                <span className="ms-1 text-nano">يكتب…</span>
              </div>
            ) : null}
          </div>

          <form
            className="border-t border-line-subtle bg-page p-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
          >
            <div className="flex items-center gap-1.5 rounded-field bg-surface p-1">
              <input
                ref={inputRef}
                value={input}
                disabled={loading}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب سؤالك…"
                className="h-10 min-w-0 flex-1 bg-transparent px-2.5 text-body text-ink outline-none placeholder:text-ink-muted disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="إرسال"
                className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-brand text-inverted transition-colors hover:bg-brand-hover disabled:opacity-40"
              >
                <SendIcon className="size-4" />
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        aria-label={open ? "إغلاق المحادثة" : "فتح مساعد الموقع"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "pointer-events-auto flex size-14 items-center justify-center rounded-full bg-brand text-inverted shadow-[0_10px_28px_rgba(255,102,20,0.35)] transition-transform duration-200 hover:bg-brand-hover hover:scale-[1.03] active:scale-[0.98]",
          open && "rotate-0",
        )}
      >
        {open ? (
          <XIcon className="size-6" />
        ) : (
          <MessageCircleIcon className="size-6" />
        )}
      </button>
    </div>
  );
}

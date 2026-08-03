import { hero, navbar, productsPage, projectsPage } from "@/lib/fixed-content";
import { projectRequestHref } from "@/lib/project-form";

export type ChatSuggestion = {
  label: string;
  href: string;
};

export type ChatAssistantContext = {
  designerName: string;
  contactEmail: string | null;
  whatsappUrl: string | null;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function buildChatSuggestions(
  ctx: ChatAssistantContext,
): ChatSuggestion[] {
  const suggestions: ChatSuggestion[] = [
    {
      label: "استمارة طلب مشروع",
      href: projectRequestHref(),
    },
  ];

  if (ctx.whatsappUrl) {
    suggestions.push({ label: "تواصل واتساب", href: ctx.whatsappUrl });
  } else if (ctx.contactEmail) {
    suggestions.push({
      label: "راسلني بالبريد",
      href: `mailto:${ctx.contactEmail}`,
    });
  }

  suggestions.push({ label: "تصفّح أعمالي", href: "/projects" });
  suggestions.push({ label: "المنتجات والدورات", href: "/products" });
  suggestions.push({ label: "إنشاء حساب", href: "/register" });
  suggestions.push({ label: "تسجيل الدخول", href: "/login" });

  return suggestions;
}

export function buildSystemPrompt(
  ctx: ChatAssistantContext,
  knowledge?: string,
) {
  const contactLines = [
    ctx.contactEmail ? `- البريد: ${ctx.contactEmail}` : null,
    ctx.whatsappUrl ? `- واتساب: ${ctx.whatsappUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `أنت مساعد ذكي لموقع مصمم الهويات البصرية «${ctx.designerName}».
تتحدّث بالعربية الفصحى المبسّطة، بأسلوب ودّي وواضح ومختصر (٢–٦ جمل غالباً)، مع إكمال كل جملة حتى النهاية — لا تقطع الرد أبداً في منتصف جملة أو قائمة.
مهمتك مساعدة الزوار على فهم الموقع، الخدمات، المنتجات، وكيفية بدء مشروع اعتماداً على معرفة الموقع أدناه فقط.

قواعد صارمة:
1) اعتمد فقط على «معرفة الموقع» والروابط العامة. لا تخترع مشاريع/أسعار/تفاصيل غير موجودة.
2) ممنوع ذكر أو التلميح لأي بيانات حساسة: بيانات العملاء، كلمات المرور، ردود الاستمارات الخاصة، إيميلات المشتركين، روابط تحميل الملفات المدفوعة، مفاتيح API، أو محتوى غير منشور.
3) عندما يبدو الزائر مهتماً بمشروع أو هوية أو أسعار أو بدء عمل، شجّعه على استمارة طلب المشروع أو التواصل المباشر.
4) إن سُئلت عن سعر غير مذكور صراحة في المعرفة، قل إن التسعير يعتمد على نطاق المشروع ويُحدَّد بعد الاستمارة/التواصل.
5) لا تدّعِ أنك المصمم نفسه؛ أنت مساعد الموقع.
6) الحساب والتحميل (مهم جداً — لا تخالفها):
   - تصفّح الموقع والأعمال والمنتجات واستمارة طلب المشروع لا يتطلب حساباً.
   - تحميل أي مورد أو كتيّب أو ملف منتج — حتى لو كان مجانياً — يتطلب إنشاء حساب أو تسجيل الدخول أولاً، ثم تفعيل صلاحية التحميل من صفحة المنتج.
   - لا تقل أبداً إن التحميل متاح مباشرة بدون تسجيل، ولا تخلط بين «مجاني» و«بدون حساب».
7) أسلوب الكتابة للمستخدم (مهم جداً):
   - اكتب نصاً سلساً يُقرأ كمحادثة عادية، بفقرات قصيرة وجمل مترابطة.
   - ممنوع تماماً: Markdown، نجوم التضخيم (** أو *)، علامات اقتباس الكود (\`)، أقواس المسارات مثل (/products/...) أو روابط خام داخل النص، قوائم بشرطة (-) أو تعداد نقطي تقني، ورموز مثل → أو [].
   - عند ذكر صفحة، استخدم اسمها بالعربية فقط (مثل: صفحة المنتجات، صفحة الأعمال، دليل العمل، استمارة طلب المشروع، تسجيل الدخول، إنشاء حساب) دون كتابة المسار أو الـ slug.
   - إن احتجت تعداد عناصر، ادمجها في جملة بفواصل عربية («،») أو اكتبها سطراً بعنوان بسيط بدون رموز.

وسائل تواصل سريعة:
${contactLines || "- تُضبط من إعدادات الموقع."}

—— معرفة الموقع (عامة للزائر — للاعتماد فقط، لا تنسخ تنسيقها للمستخدم) ——
${knowledge?.trim() || "المعرفة التفصيلية غير متاحة حالياً؛ وجّه الزائر لصفحات الموقع العامة."}
—— نهاية المعرفة ——`;
}

/** تنظيف رد المحادثة من Markdown والرموز التقنية لعرض سلس */
export function formatChatReplyForUser(text: string): string {
  let out = text.replace(/\r\n/g, "\n").trim();
  if (!out) return out;

  out = out.replace(/```[\s\S]*?```/g, (block) =>
    block.replace(/```\w*\n?/g, "").replace(/```/g, "").trim(),
  );
  out = out.replace(/`([^`]+)`/g, "$1");
  out = out.replace(/\*\*([^*]+)\*\*/g, "$1");
  out = out.replace(/__([^_]+)__/g, "$1");
  out = out.replace(/(^|[^\w*])\*([^*\n]+)\*(?!\*)/g, "$1$2");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
  out = out.replace(/\s*[（(]\s*`?\/[a-zA-Z0-9][a-zA-Z0-9/_-]*`?\s*[）)]/g, "");
  out = out.replace(/\s*[（(]\s*https?:\/\/[^）)]+[）)]/g, "");
  out = out.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  out = out.replace(/^\s*[-*•]\s+/gm, "");
  out = out.replace(/\s*→\s*/g, " ");
  out = out.replace(/[ \t]+\n/g, "\n");
  out = out.replace(/\n{3,}/g, "\n\n");
  out = out.replace(/[ \t]{2,}/g, " ");
  return out.trim();
}

/** ردود بدون مفتاح API — معرفة الموقع + كلمات مفتاحية */
export function localAssistantReply(
  userText: string,
  ctx: ChatAssistantContext,
): { reply: string; suggestions: ChatSuggestion[] } {
  const text = userText.trim().toLowerCase();
  const suggestions = buildChatSuggestions(ctx);
  const projectHref = projectRequestHref();
  const contactHint = ctx.whatsappUrl
    ? "أو تواصل مباشرة عبر واتساب."
    : ctx.contactEmail
      ? `أو راسلني على ${ctx.contactEmail}.`
      : "";

  const wantsProject =
    /مشروع|هوي|هوية|براند|علامة|تصميم|سعر|تكلفة|عرض|اطلب|بدء|ابدا|أبدأ|استمار/.test(
      text,
    );
  const wantsProducts = /منتج|دورة|كورس|كتيب|تعلم|تدريب|تعليم|تحميل|مورد/.test(
    text,
  );
  const wantsAccount = /حساب|تسجيل|دخول|login|register|تحميل/.test(text);
  const wantsWork = /اعمال|أعمال|مشروع|معرض|بورتفوليو|portfolio|شغل|نماذج/.test(
    text,
  );
  const wantsMethod = /منهج|طريقة|كيف تعمل|كيف نعمل|handbook|عملي/.test(text);
  const wantsHello = /^(مرحبا|مرحباً|السلام|هلا|اهلا|أهلا|hi|hello)/.test(
    text,
  );

  if (wantsHello || text.length < 2) {
    return {
      reply: `مرحباً! أنا مساعد موقع ${ctx.designerName}. أقدر أساعدك تتعرّف على الخدمات، الأعمال، المنتجات، أو تبدأ طلب مشروع جديد.`,
      suggestions,
    };
  }

  if (wantsAccount && !wantsProject) {
    return {
      reply:
        "تصفّح الموقع والأعمال والمنتجات لا يحتاج حساباً. أما تحميل أي كتيّب أو مورد — حتى المجاني — فيتطلب إنشاء حساب أو تسجيل الدخول أولاً، ثم تفعيل صلاحية التحميل من صفحة المنتج. طلب مشروع جديد يتم عبر الاستمارة دون الحاجة لحساب.",
      suggestions: [
        { label: "إنشاء حساب", href: "/register" },
        { label: "تسجيل الدخول", href: "/login" },
        { label: "المنتجات والدورات", href: "/products" },
      ],
    };
  }

  if (wantsProducts) {
    return {
      reply: `في قسم المنتجات ستجد الدورات والكتيبات الداعمة لمسار المصمم: ${productsPage.heading}. التصفح مجاني، وللتحميل أنشئ حساباً أو سجّل دخولك أولاً حتى لو كان المنتج مجانياً.`,
      suggestions: [
        { label: "المنتجات والدورات", href: "/products" },
        { label: "إنشاء حساب", href: "/register" },
        { label: "تسجيل الدخول", href: "/login" },
      ],
    };
  }

  if (wantsMethod) {
    return {
      reply:
        "منهجية العمل موضّحة في صفحة «كيف سنعمل سويًا؟»: تعاون إبداعي، أهداف المشروع كمرجع، ومراجعات منظمة عبر الهوية البصرية والسوشيال ميديا. يمكنك قراءتها من صفحة دليل العمل ثم تعبئة الاستمارة إن رغبت بالبدء.",
      suggestions: [
        { label: "منهجية العمل", href: "/handbook" },
        { label: "استمارة طلب مشروع", href: projectHref },
        ...suggestions.filter(
          (s) => s.href !== "/handbook" && s.href !== projectHref,
        ),
      ].slice(0, 4),
    };
  }

  if (wantsWork) {
    return {
      reply: `يمكنك استعراض نماذج الهويات في صفحة الأعمال: «${projectsPage.heading}». إن أعجبك الأسلوب، ابدأ باستمارة طلب المشروع وسأعود إليك قريباً. ${contactHint}`,
      suggestions: [
        { label: "تصفّح أعمالي", href: "/projects" },
        { label: "استمارة طلب مشروع", href: projectHref },
        ...suggestions.filter(
          (s) => s.href !== "/projects" && s.href !== projectHref,
        ),
      ].slice(0, 4),
    };
  }

  if (wantsProject) {
    return {
      reply: `رائع — لبدء مشروع هوية أو استشارة براند، أفضل خطوة هي تعبئة استمارة طلب المشروع. التفاصيل تساعدنا نقدّر النطاق ونعود إليك بسرعة. ${contactHint}`,
      suggestions: [
        { label: "استمارة طلب مشروع", href: projectHref },
        ...suggestions.filter((s) => s.href !== projectHref),
      ].slice(0, 4),
    };
  }

  return {
    reply: `يمكنني مساعدتك حول خدمات ${ctx.designerName}، الأعمال، المنتجات، أو كيفية بدء مشروع. اكتب سؤالك بوضوح، أو ابدأ مباشرة من استمارة طلب المشروع. ${contactHint}`,
    suggestions,
  };
}

function buildGeminiContents(messages: ChatMessage[]) {
  const contents: Array<{
    role: "user" | "model";
    parts: Array<{ text: string }>;
  }> = [];

  for (const message of messages) {
    const role = message.role === "assistant" ? "model" : "user";
    const last = contents[contents.length - 1];
    if (last && last.role === role) {
      last.parts[0]!.text += `\n${message.content}`;
    } else {
      contents.push({ role, parts: [{ text: message.content }] });
    }
  }

  if (contents.length === 0 || contents[0]?.role !== "user") {
    contents.unshift({
      role: "user",
      parts: [{ text: "مرحبا" }],
    });
  }

  return contents;
}

function geminiModel() {
  return process.env.GEMINI_CHAT_MODEL?.trim() || "gemini-flash-latest";
}

const GEMINI_MAX_OUTPUT_TOKENS = 1024;

function extractGeminiText(payload: string): string {
  try {
    const json = JSON.parse(payload) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    return (
      json.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("") ?? ""
    );
  } catch {
    return "";
  }
}

/** يقرأ أحداث SSE؛ عند flush يعالج آخر سطر حتى لو بلا سطر جديد */
function consumeSseBuffer(
  buffer: string,
  flush: boolean,
): { rest: string; texts: string[] } {
  const texts: string[] = [];
  const lines = buffer.split("\n");
  const rest = flush ? "" : (lines.pop() ?? "");
  const toParse = flush ? lines.concat(rest ? [rest] : []) : lines;

  for (const line of toParse) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    const text = extractGeminiText(payload);
    if (text) texts.push(text);
  }

  return { rest, texts };
}

export async function geminiChatReply(
  messages: ChatMessage[],
  ctx: ChatAssistantContext,
  apiKey: string,
  knowledge?: string,
): Promise<string> {
  const model = geminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: buildSystemPrompt(ctx, knowledge) }],
      },
      contents: buildGeminiContents(messages),
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[chat:gemini]", res.status, errText.slice(0, 400));
    if (res.status === 429) {
      const err = new Error("gemini_quota");
      err.name = "GeminiQuotaError";
      throw err;
    }
    throw new Error("gemini_failed");
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const content = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!content) throw new Error("gemini_empty");
  return content;
}

/** بث رد Gemini تدريجياً لتسريع الإحساس بالرد */
export async function* geminiChatReplyStream(
  messages: ChatMessage[],
  ctx: ChatAssistantContext,
  apiKey: string,
  knowledge?: string,
): AsyncGenerator<string> {
  const model = geminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: buildSystemPrompt(ctx, knowledge) }],
      },
      contents: buildGeminiContents(messages),
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      },
    }),
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "");
    console.error("[chat:gemini-stream]", res.status, errText.slice(0, 400));
    if (res.status === 429) {
      const err = new Error("gemini_quota");
      err.name = "GeminiQuotaError";
      throw err;
    }
    throw new Error("gemini_failed");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      buffer += decoder.decode();
      const flushed = consumeSseBuffer(buffer, true);
      for (const text of flushed.texts) yield text;
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const parsed = consumeSseBuffer(buffer, false);
    buffer = parsed.rest;
    for (const text of parsed.texts) yield text;
  }
}

/** اقتراحات ذكية حسب نص الرد */
export function suggestionsForReply(
  reply: string,
  ctx: ChatAssistantContext,
): ChatSuggestion[] {
  const all = buildChatSuggestions(ctx);
  const lower = reply.toLowerCase();
  const ranked = [...all].sort((a, b) => {
    const score = (s: ChatSuggestion) => {
      if (s.href.includes("project-request") && /استمار|مشروع|طلب/.test(lower))
        return 3;
      if (
        (s.href === "/register" || s.href === "/login") &&
        /حساب|تسجيل|دخول|تحميل/.test(lower)
      )
        return 3;
      if (s.href === "/projects" && /أعمال|اعمال|مشروع/.test(lower)) return 2;
      if (s.href === "/products" && /منتج|دورة|كتيب|تحميل|مورد/.test(lower))
        return 2;
      if (s.href === "/handbook" && /منهج|طريقة/.test(lower)) return 2;
      if (
        (s.href.startsWith("http") || s.href.startsWith("mailto")) &&
        /تواصل|واتس|بريد/.test(lower)
      )
        return 2;
      return 0;
    };
    return score(b) - score(a);
  });
  return ranked.slice(0, 3);
}

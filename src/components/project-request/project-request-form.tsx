"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PublicFormQuestionView } from "@/lib/get-project-form";
import { personalizeHeading } from "@/lib/project-form";
import {
  accentButtonClass,
  cx,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { userFacingMessage, userFacingCatchMessage } from "@/lib/public-messages";

type ContactValue = {
  email: string;
  whatsapp: string;
  instagram: string;
};

type Answers = Record<string, string | string[] | ContactValue>;

type ProjectRequestFormProps = {
  title: string;
  contactEmail: string | null;
  questions: PublicFormQuestionView[];
};

export function ProjectRequestForm({
  title,
  contactEmail,
  questions,
}: ProjectRequestFormProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [doneMessage, setDoneMessage] = useState("");
  const [stepKey, setStepKey] = useState(0);

  const nameValue =
    typeof answers.name === "string" ? answers.name.trim() : "";

  const current = questions[step];
  const progress = questions.length
    ? ((step + 1) / questions.length) * 100
    : 0;
  const isLast = step === questions.length - 1;

  const heading = useMemo(() => {
    if (!current) return "";
    const template = current.headingTemplate || current.heading;
    return personalizeHeading(template, nameValue);
  }, [current, nameValue]);

  function goToStep(next: number) {
    setError(null);
    setStep(next);
    setStepKey((k) => k + 1);
  }

  function setAnswer(key: string, value: string | string[] | ContactValue) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function toggleMultiOption(key: string, option: string) {
    const currentValue = answers[key];
    const selected = Array.isArray(currentValue) ? currentValue : [];
    const next = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];
    setAnswer(key, next);
  }

  function validateCurrent(): boolean {
    if (!current) return false;
    const value = answers[current.key];

    if (current.type === "contact_methods") {
      const contact = (value as ContactValue | undefined) ?? {
        email: "",
        whatsapp: "",
        instagram: "",
      };
      const hasAny =
        Boolean(contact.email.trim()) ||
        Boolean(contact.whatsapp.trim()) ||
        Boolean(contact.instagram.trim());
      if (current.required && !hasAny) {
        setError("أدخل وسيلة تواصل واحدة على الأقل");
        return false;
      }
      return true;
    }

    if (current.type === "multi_select") {
      const selected = Array.isArray(value) ? value : [];
      if (current.required && selected.length === 0) {
        setError("اختر خياراً واحداً على الأقل");
        return false;
      }
      return true;
    }

    const text = typeof value === "string" ? value.trim() : "";
    if (current.required && !text) {
      setError("هذا السؤال مطلوب");
      return false;
    }
    return true;
  }

  async function goNext() {
    if (submitting) return;
    if (!validateCurrent()) return;
    if (!isLast) {
      goToStep(step + 1);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/project-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(userFacingMessage(data.message, "تعذّر الإرسال"));
        return;
      }
      setDone(true);
      setDoneMessage(
        userFacingMessage(data.message, "تم إرسال طلبك بنجاح."),
      );
    } catch (err) {
      setError(
        userFacingCatchMessage(
          err,
          "تعذّر الإرسال، تحقق من الاتصال وحاول مرة أخرى",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="container-site flex min-h-[70vh] flex-col items-center justify-center gap-5 py-16 text-center animate-form-step-in">
        <div
          className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="size-7" fill="none">
            <path
              d="M5 12.5 10 17.5 19 7.5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-h1">{doneMessage}</h1>
        <Link href="/" className={primaryButtonClass}>
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="container-site py-20 text-center text-body text-ink-muted">
        لا توجد أسئلة في الاستمارة حالياً.
      </div>
    );
  }

  const contactValue: ContactValue =
    current.type === "contact_methods" &&
    answers[current.key] &&
    typeof answers[current.key] === "object" &&
    !Array.isArray(answers[current.key])
      ? (answers[current.key] as ContactValue)
      : { email: "", whatsapp: "", instagram: "" };

  const textValue =
    typeof answers[current.key] === "string"
      ? (answers[current.key] as string)
      : "";

  const multiValue = Array.isArray(answers[current.key])
    ? (answers[current.key] as string[])
    : [];

  return (
    <div className="container-site relative flex min-h-[75vh] flex-col py-10 md:py-14">
      {submitting ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-page/70 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-3 rounded-[16px] bg-page px-6 py-5 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
            <span
              className="size-8 animate-spin rounded-full border-[3px] border-ink/10 border-t-brand"
              aria-hidden
            />
            <p className="text-body text-ink">جاري إرسال طلبك…</p>
          </div>
        </div>
      ) : null}

      <div className="mb-8">
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-nano text-ink-muted">
          {step + 1} / {questions.length}
        </p>
      </div>

      <div
        key={stepKey}
        className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 animate-form-step-in"
      >
        {step === 0 ? (
          <div className="space-y-2">
            <h1 className="text-h1">{title}</h1>
            {current.subtext ? (
              <p className="text-lead text-ink-secondary">{current.subtext}</p>
            ) : null}
            {contactEmail ? (
              <p className="text-body text-ink-muted">
                أو تواصل مباشرة عبر{" "}
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-brand underline-offset-2 hover:underline"
                >
                  {contactEmail}
                </a>
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-4">
          <h2 className={step === 0 ? "text-h2 font-bold" : "text-h1"}>
            {heading}
            {current.required ? (
              <span className="ms-1 text-brand">*</span>
            ) : (
              <span className="ms-2 text-nano font-normal text-ink-muted">
                اختياري
              </span>
            )}
          </h2>

          {current.type === "text" ? (
            <input
              autoFocus
              type="text"
              value={textValue}
              disabled={submitting}
              onChange={(e) => setAnswer(current.key, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void goNext();
                }
              }}
              className="h-12 w-full rounded-field bg-surface px-4 text-body text-ink outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
              placeholder={current.key === "name" ? "اكتب اسمك" : ""}
            />
          ) : null}

          {current.type === "textarea" ? (
            <textarea
              autoFocus
              rows={5}
              value={textValue}
              disabled={submitting}
              onChange={(e) => setAnswer(current.key, e.target.value)}
              className="w-full resize-y rounded-field bg-surface px-4 py-3 text-body text-ink outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
              placeholder="اكتب تفاصيل المشروع…"
            />
          ) : null}

          {current.type === "single_select" ? (
            <div className="flex flex-col gap-2">
              {(current.options ?? []).map((option) => {
                const selected = textValue === option;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={submitting}
                    onClick={() => setAnswer(current.key, option)}
                    className={cx(
                      "rounded-[12px] border px-4 py-3 text-start text-body transition-colors duration-200 disabled:opacity-60",
                      selected
                        ? "border-brand bg-brand/5 text-ink"
                        : "border-transparent bg-surface text-ink hover:bg-surface-alt",
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          ) : null}

          {current.type === "multi_select" ? (
            <div className="flex flex-col gap-2">
              <p className="text-small text-ink-muted">يمكن اختيار أكثر من خيار</p>
              {(current.options ?? []).map((option) => {
                const selected = multiValue.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={submitting}
                    onClick={() => toggleMultiOption(current.key, option)}
                    className={cx(
                      "rounded-[12px] border px-4 py-3 text-start text-body transition-colors duration-200 disabled:opacity-60",
                      selected
                        ? "border-brand bg-brand/5 text-ink"
                        : "border-transparent bg-surface text-ink hover:bg-surface-alt",
                    )}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={cx(
                          "flex size-4 shrink-0 items-center justify-center rounded-[4px] border text-[10px]",
                          selected
                            ? "border-brand bg-brand text-white"
                            : "border-ink/25 bg-page",
                        )}
                        aria-hidden
                      >
                        {selected ? "✓" : ""}
                      </span>
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          {current.type === "contact_methods" ? (
            <div className="space-y-3">
              {(current.options ?? ["ايميل", "واتس آب", "انستجرام"]).map(
                (label) => {
                  const fieldKey =
                    label.includes("ايميل") ||
                    label.toLowerCase().includes("email")
                      ? "email"
                      : label.includes("واتس")
                        ? "whatsapp"
                        : "instagram";
                  return (
                    <label key={label} className="block space-y-1.5">
                      <span className="text-small text-ink-secondary">
                        {label}
                      </span>
                      <input
                        type={fieldKey === "email" ? "email" : "text"}
                        value={contactValue[fieldKey]}
                        disabled={submitting}
                        onChange={(e) =>
                          setAnswer(current.key, {
                            ...contactValue,
                            [fieldKey]: e.target.value,
                          })
                        }
                        className="h-11 w-full rounded-field bg-surface px-4 text-body text-ink outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
                        placeholder={
                          fieldKey === "email"
                            ? "name@example.com"
                            : fieldKey === "whatsapp"
                              ? "+9665xxxxxxx"
                              : "@username"
                        }
                      />
                    </label>
                  );
                },
              )}
            </div>
          ) : null}

          {error ? (
            <p className="text-body text-brand" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          {step > 0 ? (
            <button
              type="button"
              className={secondaryButtonClass}
              disabled={submitting}
              onClick={() => goToStep(Math.max(0, step - 1))}
            >
              الخلف
            </button>
          ) : null}
          <button
            type="button"
            disabled={submitting}
            className={cx(
              accentButtonClass,
              "inline-flex items-center gap-2 disabled:opacity-60",
            )}
            onClick={() => void goNext()}
          >
            {submitting ? (
              <>
                <span
                  className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden
                />
                جاري الإرسال…
              </>
            ) : isLast ? (
              "تأكيد"
            ) : (
              "التالي"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

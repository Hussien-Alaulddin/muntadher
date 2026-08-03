"use client";

import { useState } from "react";
import { sections } from "@/lib/fixed-content";
import { accentButtonClass, cx } from "@/components/ui";
import { userFacingMessage, userFacingCatchMessage } from "@/lib/public-messages";

type Status = "idle" | "loading" | "done" | "error";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(
          userFacingMessage(data.message, "تعذّر إكمال الاشتراك"),
        );
        return;
      }

      setStatus("done");
      setMessage(
        userFacingMessage(data.message, "تم تسجيل بريدك، شكراً لك."),
      );
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(
        userFacingCatchMessage(error, "تعذّر إكمال الاشتراك، تحقق من الاتصال"),
      );
    }
  }

  return (
    <section id="newsletter" className="py-[45px]">
      <div className="container-site">
        <h2 className="text-h2 font-bold">{sections.newsletter.heading}</h2>
        <p className="text-h2 font-normal text-ink">
          {sections.newsletter.subtext}
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-3.5 flex w-full max-w-[280px] items-center gap-[7px]"
        >
          <input
            type="email"
            required
            dir="rtl"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={sections.newsletter.inputPlaceholder}
            aria-label={sections.newsletter.inputPlaceholder}
            className="h-10 w-full flex-1 rounded-field bg-surface px-3 text-body text-ink outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-brand/30"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className={cx(
              accentButtonClass,
              "h-10 shrink-0 disabled:opacity-60",
            )}
          >
            {sections.newsletter.ctaLabel}
          </button>
        </form>

        {message ? (
          <p
            className={cx(
              "mt-2 text-body",
              status === "error" ? "text-brand" : "text-ink-secondary",
            )}
          >
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}

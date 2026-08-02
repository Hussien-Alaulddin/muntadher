"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ParsedValue = {
  prefix: string;
  target: number;
  suffix: string;
  decimals: number;
};

/** يفصل بادئة/لاحقة عن الرقم في قيم مثل "3+" أو "+9" أو "750K" أو "8 K" */
export function parseStatValue(raw: string): ParsedValue | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "—") return null;

  const match = trimmed.match(/^([^\d]*)(\d+(?:[.,]\d+)?)([^\d]*)$/);
  if (!match) return null;

  const numberPart = match[2].replace(",", ".");
  const decimals = numberPart.includes(".")
    ? (numberPart.split(".")[1]?.length ?? 0)
    : 0;

  return {
    prefix: match[1],
    target: Number(numberPart),
    suffix: match[3],
    decimals,
  };
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

/**
 * عدّ تصاعدي من 0 إلى القيمة النهائية عند دخول العنصر لمنطقة العرض —
 * كما في عدّادات الصفحة الرئيسية للموقع المرجعي.
 */
export function CountUpValue({
  value,
  className,
  duration = 1400,
  variant = "default",
}: {
  value: string;
  className?: string;
  duration?: number;
  /** في كروت الإحصائيات: الرقم والـ + بلونين منفصلين كما في المرجع */
  variant?: "default" | "stat";
}) {
  const parsed = useMemo(() => parseStatValue(value), [value]);
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!parsed) return;

    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(parsed.target);
      setStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [parsed]);

  useEffect(() => {
    if (!started || !parsed) return;

    const to = parsed.target;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setDisplay(to * easeOutCubic(progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else setDisplay(to);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, parsed, duration]);

  if (!parsed) {
    return <span className={className}>{value || "—"}</span>;
  }

  const formatted =
    parsed.decimals > 0
      ? display.toFixed(parsed.decimals)
      : String(Math.round(display));

  if (variant === "stat") {
    return (
      <span
        ref={ref}
        className={cn("inline-flex items-center gap-1 leading-none", className)}
      >
        {parsed.prefix ? (
          <span className="text-[rgba(109,108,109,0.6)]">{parsed.prefix}</span>
        ) : null}
        <span>{formatted}</span>
        {parsed.suffix ? (
          <span className="text-[rgba(109,108,109,0.6)]">{parsed.suffix}</span>
        ) : null}
      </span>
    );
  }

  return (
    <span ref={ref} className={className}>
      {parsed.prefix}
      {formatted}
      {parsed.suffix}
    </span>
  );
}

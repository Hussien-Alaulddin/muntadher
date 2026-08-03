"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { hero } from "@/lib/fixed-content";

const TYPE_MS = 70;
const DELETE_MS = 40;
const HOLD_MS = 2800;

export function HeroBadge({ brandMarkUrl }: { brandMarkUrl: string | null }) {
  const roles = hero.badgeRoles;
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState("");
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting">(
    "typing",
  );

  useEffect(() => {
    if (roles.length === 0) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setDisplay(roles[index] ?? "");
      const id = window.setInterval(() => {
        setIndex((i) => {
          const next = (i + 1) % roles.length;
          setDisplay(roles[next] ?? "");
          return next;
        });
      }, HOLD_MS + 1200);
      return () => window.clearInterval(id);
    }

    const full = roles[index] ?? "";
    const chars = Array.from(full);
    let timeoutId = 0;

    if (phase === "typing") {
      if (display.length < chars.length) {
        timeoutId = window.setTimeout(() => {
          setDisplay(chars.slice(0, Array.from(display).length + 1).join(""));
        }, TYPE_MS);
      } else {
        timeoutId = window.setTimeout(() => setPhase("holding"), HOLD_MS);
      }
    } else if (phase === "holding") {
      timeoutId = window.setTimeout(() => setPhase("deleting"), 0);
    } else if (phase === "deleting") {
      const current = Array.from(display);
      if (current.length > 0) {
        timeoutId = window.setTimeout(() => {
          setDisplay(current.slice(0, -1).join(""));
        }, DELETE_MS);
      } else {
        setIndex((i) => (i + 1) % roles.length);
        setPhase("typing");
      }
    }

    return () => window.clearTimeout(timeoutId);
  }, [roles, index, display, phase]);

  const longest = roles.reduce((a, b) => (a.length >= b.length ? a : b), "");

  return (
    <span className="inline-flex items-center gap-2 self-start rounded-[24px] border border-ink/10 px-3 py-1">
      <BrandMark src={brandMarkUrl} />
      <span className="relative grid text-micro text-ink">
        <span
          className="invisible col-start-1 row-start-1 whitespace-nowrap"
          aria-hidden
        >
          {longest}
        </span>
        <span
          aria-live="polite"
          className="col-start-1 row-start-1 whitespace-nowrap"
        >
          {display}
        </span>
      </span>
    </span>
  );
}

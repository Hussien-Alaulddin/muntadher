"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * مؤشر خفيف أثناء التنقّل — بدون إعادة تركيب الصفحة كاملة.
 */
export function AdminPageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (!url.pathname.startsWith("/admin")) return;
        if (url.pathname === pathname) return;
        setPending(true);
      } catch {
        /* ignore */
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  useEffect(() => {
    setPending(false);
  }, [pathname]);

  return (
    <div className="relative">
      {pending ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center">
          <div className="mt-1 flex items-center gap-2 rounded-full border bg-popover/95 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
            <Loader2Icon className="size-3.5 animate-spin text-primary" />
            جاري التحميل…
          </div>
        </div>
      ) : null}
      <div className={cn("admin-page-enter", pending && "opacity-90")}>
        {children}
      </div>
    </div>
  );
}

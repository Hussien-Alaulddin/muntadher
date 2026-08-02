"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * شريط تقدّم رفيع أعلى الصفحة يبدأ فور النقر على رابط داخلي
 * وينتهي عند اكتمال التنقّل — يعطي إحساساً فورياً بالاستجابة.
 */
export function NavigationProgress({
  className,
  barClassName,
}: {
  className?: string;
  barClassName?: string;
}) {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === pathname && url.search === window.location.search)
          return;
      } catch {
        return;
      }

      setActive(true);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  useEffect(() => {
    setActive(false);
  }, [pathname]);

  if (!active) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px] overflow-hidden bg-transparent",
        className,
      )}
      role="progressbar"
      aria-hidden
    >
      <div
        className={cn(
          "h-full w-full origin-right animate-nav-progress bg-accent-blue",
          barClassName,
        )}
      />
    </div>
  );
}

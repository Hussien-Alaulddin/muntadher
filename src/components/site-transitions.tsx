"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * غلاف صفحات الموقع العامة — أنيميشن دخول للصفحة كاملة عند كل تنقّل.
 */
export function SiteTransitions({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-page-enter">
      {children}
    </div>
  );
}

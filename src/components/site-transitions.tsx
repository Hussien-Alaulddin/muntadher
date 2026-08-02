import type { ReactNode } from "react";

/**
 * غلاف صفحات الموقع العامة.
 * View Transitions أُزيلت لتفادي TimeoutError عند التنقّل البطيء (RSC + Supabase).
 */
export function SiteTransitions({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

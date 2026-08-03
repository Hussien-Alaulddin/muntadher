import type { ReactNode } from "react";

export const metadata = {
  title: "لوحة التحكم | منتظر",
  robots: { index: false, follow: false },
};

/** جذر الأدمن فقط — الحماية والواجهة في (protected) */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}

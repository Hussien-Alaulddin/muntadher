import { Suspense, type ReactNode } from "react";
import AdminLoading from "@/app/admin/loading";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata = {
  title: "لوحة التحكم | منتظر",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell>
      <Suspense fallback={<AdminLoading />}>{children}</Suspense>
    </AdminShell>
  );
}

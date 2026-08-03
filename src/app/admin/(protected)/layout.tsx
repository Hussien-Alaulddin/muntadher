import { Suspense, type ReactNode } from "react";
import AdminLoading from "@/app/admin/loading";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/admin-page-auth";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminPage();

  return (
    <AdminShell>
      <Suspense fallback={<AdminLoading />}>{children}</Suspense>
    </AdminShell>
  );
}

import { Suspense, type ReactNode } from "react";
import { cookies } from "next/headers";
import AdminLoading from "@/app/admin/loading";
import { AdminAuthRedirect } from "@/components/admin/admin-auth-redirect";
import { AdminShell } from "@/components/admin/admin-shell";
import { ADMIN_COOKIE } from "@/lib/admin-constants";
import { verifyAdminSessionToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function hasAdminSession(): Promise<boolean> {
  const expected = process.env.ADMIN_API_TOKEN?.trim();
  if (!expected) return false;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return Boolean(token) && (await verifyAdminSessionToken(token, expected));
}

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const ok = await hasAdminSession();
  if (!ok) {
    // لا تستخدم redirect() هنا — على Hostinger قد تُعرض الواجهة رغم ذلك
    return <AdminAuthRedirect />;
  }

  return (
    <AdminShell>
      <Suspense fallback={<AdminLoading />}>{children}</Suspense>
    </AdminShell>
  );
}

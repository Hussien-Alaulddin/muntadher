import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE } from "@/lib/admin-constants";
import { verifyAdminSessionToken } from "@/lib/admin-session";

/**
 * حماية صفحات لوحة التحكم على مستوى Node (موثوق على Hostinger
 * حتى لو لم يعمل Edge middleware).
 */
export async function requireAdminPage() {
  const expected = process.env.ADMIN_API_TOKEN?.trim();
  if (!expected) {
    redirect("/admin/login?error=unconfigured");
  }

  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const ok =
    Boolean(token) && (await verifyAdminSessionToken(token, expected));

  if (!ok) {
    redirect("/admin/login");
  }
}

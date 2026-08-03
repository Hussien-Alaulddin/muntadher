/**
 * المسار العلني السري للوحة التحكم — يجب أن يطابق مجلد:
 * src/app/m-6769c0
 *
 * يمكن تجاوزه بـ NEXT_PUBLIC_ADMIN_BASE_PATH فقط إذا طابقت اسم المجلد.
 */
export const DEFAULT_ADMIN_BASE_PATH = "/m-6769c0";

function normalizeAdminBasePath(raw: string | undefined): string {
  const fallback = DEFAULT_ADMIN_BASE_PATH;
  const value = (raw ?? "").trim() || fallback;
  let path = value.startsWith("/") ? value : `/${value}`;
  path = path.replace(/\/+$/, "") || fallback;
  if (path === "/" || path.includes("//") || path.includes("..")) {
    return fallback;
  }
  return path;
}

/** المسار العلني للوحة (مثل /m-6769c0) */
export function getAdminBasePath(): string {
  return normalizeAdminBasePath(process.env.NEXT_PUBLIC_ADMIN_BASE_PATH);
}

/**
 * يبني رابط لوحة التحكم.
 * adminPath() → القاعدة
 * adminPath("/login") → …/login
 */
export function adminPath(subpath = ""): string {
  const base = getAdminBasePath();
  if (!subpath || subpath === "/") return base;
  const clean = subpath.startsWith("/") ? subpath : `/${subpath}`;
  return `${base}${clean}`;
}

export function isAdminPublicPathname(pathname: string): boolean {
  const base = getAdminBasePath();
  return pathname === base || pathname.startsWith(`${base}/`);
}

/** لاحقة المسار بعد قاعدة اللوحة (/settings أو "") */
export function adminPathSuffix(pathname: string): string {
  const base = getAdminBasePath();
  if (!isAdminPublicPathname(pathname)) return pathname;
  return pathname === base ? "" : pathname.slice(base.length);
}

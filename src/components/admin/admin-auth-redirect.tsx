"use client";

import { useEffect } from "react";
import { adminPath, isAdminPublicPathname } from "@/lib/admin-base-path";

/** تحويل صريح للمتصفح — يعمل حتى لو فشل redirect() من السيرفر على Hostinger */
export function AdminAuthRedirect() {
  useEffect(() => {
    const loginPath = adminPath("/login");
    const login = new URL(loginPath, window.location.origin);
    const path = window.location.pathname;
    if (isAdminPublicPathname(path) && path !== loginPath) {
      login.searchParams.set("next", path);
    }
    window.location.replace(login.toString());
  }, []);

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6 text-sm text-muted-foreground">
      جاري التحويل إلى تسجيل الدخول…
    </main>
  );
}

"use client";

import { useEffect } from "react";

/** تحويل صريح للمتصفح — يعمل حتى لو فشل redirect() من السيرفر على Hostinger */
export function AdminAuthRedirect() {
  useEffect(() => {
    const login = new URL("/admin/login", window.location.origin);
    const path = window.location.pathname;
    if (path.startsWith("/admin") && path !== "/admin/login") {
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

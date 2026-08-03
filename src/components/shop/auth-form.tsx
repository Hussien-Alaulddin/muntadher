"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizeNext } from "@/lib/safe-redirect";
import { userFacingMessage } from "@/lib/public-messages";

type Mode = "login" | "register";

const ERROR_MESSAGES: Record<string, string> = {
  google_config: "تسجيل الدخول عبر Google غير متاح حالياً",
  session_secret: "تعذّر إكمال تسجيل الدخول، حاول مرة أخرى لاحقاً",
  google_denied: "تم إلغاء تسجيل الدخول عبر Google",
  google_code: "تعذّر إكمال تسجيل الدخول عبر Google",
  google_state: "انتهت صلاحية الطلب — حاول مرة أخرى",
  google_failed: "تعذّر تسجيل الدخول عبر Google",
  google_link_password:
    "هذا البريد مسجّل بكلمة مرور — سجّل الدخول بها أولاً",
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function AuthForm({
  mode,
  siteName,
  googleEnabled = true,
}: {
  mode: Mode;
  siteName: string;
  googleEnabled?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeNext(searchParams.get("next"), "/products");
  const oauthError = searchParams.get("error");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const bannerError = useMemo(() => {
    if (error) return error;
    if (!oauthError) return null;
    return ERROR_MESSAGES[oauthError] ?? "تعذّر إتمام العملية";
  }, [error, oauthError]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          mode === "register"
            ? { action: "register", name, email, phone, password }
            : { action: "login", email, password },
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(userFacingMessage(data.message, "تعذّر إتمام العملية"));
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("تعذّر الاتصال، تحقق من الإنترنت وحاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  const googleHref = `/api/auth/google?next=${encodeURIComponent(next)}`;

  return (
    <Card className="w-full max-w-md border-line shadow-none">
      <CardHeader className="space-y-2 text-center">
        <p className="text-sm text-ink-muted">{siteName}</p>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
        </CardTitle>
        <p className="text-sm text-ink-secondary">
          {mode === "login"
            ? next.includes("/purchase")
              ? "ادخل حسابك لإكمال شراء الدورة"
              : "ادخل لتحميل الكتيبات ومتابعة سلتك"
            : next.includes("/purchase")
              ? "أنشئ حساباً ثم ستنتقل مباشرة لصفحة شراء الدورة"
              : "سجّل حساباً لتصلك التحديثات وتحمّل الكتيبات"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {googleEnabled ? (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              asChild
            >
              <a href={googleHref}>
                <GoogleIcon className="size-4" />
                المتابعة مع Google
              </a>
            </Button>

            <div className="relative py-1 text-center text-xs text-ink-muted">
              <span className="absolute inset-x-0 top-1/2 border-t border-line" />
              <span className="relative bg-card px-3">أو بالبريد</span>
            </div>
          </>
        ) : null}

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {mode === "register" ? (
            <div className="space-y-2">
              <Label htmlFor="name">الاسم</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              className="text-start"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {mode === "register" ? (
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الموبايل (اختياري)</Label>
              <Input
                id="phone"
                type="tel"
                dir="ltr"
                className="text-start"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              dir="ltr"
              className="text-start"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </div>

          {bannerError ? (
            <p className="rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand">
              {bannerError}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-hover"
          >
            {loading
              ? "جاري…"
              : mode === "login"
                ? "دخول"
                : "إنشاء الحساب"}
          </Button>
        </form>

        <p className="text-center text-sm text-ink-secondary">
          {mode === "login" ? (
            <>
              ليس لديك حساب؟{" "}
              <Link
                href={`/register?next=${encodeURIComponent(next)}`}
                className="font-medium text-ink underline-offset-4 hover:underline"
              >
                سجّل الآن
              </Link>
            </>
          ) : (
            <>
              لديك حساب؟{" "}
              <Link
                href={`/login?next=${encodeURIComponent(next)}`}
                className="font-medium text-ink underline-offset-4 hover:underline"
              >
                سجّل الدخول
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

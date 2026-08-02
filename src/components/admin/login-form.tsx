"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRoundIcon, Loader2Icon } from "lucide-react";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import { AdminNotice } from "@/components/admin/admin-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sanitizeAdminNext } from "@/lib/safe-redirect";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "unconfigured") {
      setError("لوحة التحكم غير مهيأة: اضبط ADMIN_API_TOKEN في ملف .env");
    }
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adminFetch("/api/admin/auth", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      router.replace(sanitizeAdminNext(searchParams.get("next"), "/admin"));
      router.refresh();
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : "تعذّر تسجيل الدخول",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
            م
          </div>
          <div>
            <CardTitle className="text-2xl">لوحة التحكم</CardTitle>
            <CardDescription className="mt-1.5">
              أدخل رمز الدخول المضبوط في ملف البيئة للمتابعة.
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-token">رمز الدخول</Label>
              <div className="relative">
                <KeyRoundIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-token"
                  type="password"
                  autoFocus
                  autoComplete="current-password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="ps-9"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            {error ? <AdminNotice tone="error">{error}</AdminNotice> : null}
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || !token.trim()}
            >
              {loading ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  جاري الدخول…
                </>
              ) : (
                "دخول"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

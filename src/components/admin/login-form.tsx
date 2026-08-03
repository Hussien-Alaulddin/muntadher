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
    <div className="flex w-full max-w-xl items-center justify-center px-4">
      <Card className="w-full shadow-sm">
        <CardHeader className="space-y-4 px-8 pt-10 pb-2 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
            م
          </div>
          <CardTitle className="text-3xl tracking-tight">لوحة التحكم</CardTitle>
        </CardHeader>

        <form onSubmit={onSubmit}>
          <CardContent className="space-y-5 px-8 py-6">
            <div className="space-y-2.5">
              <Label htmlFor="admin-token" className="text-base">
                رمز الدخول
              </Label>
              <div className="relative">
                <KeyRoundIcon className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="admin-token"
                  type="password"
                  autoFocus
                  autoComplete="current-password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="h-12 ps-10 text-base"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            {error ? <AdminNotice tone="error">{error}</AdminNotice> : null}
          </CardContent>

          <CardFooter className="px-8 pb-10">
            <Button
              type="submit"
              className="h-12 w-full text-base"
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

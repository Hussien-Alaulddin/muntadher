import { Suspense } from "react";
import Link from "next/link";
import { getSiteChrome } from "@/lib/content";
import { AuthForm } from "@/components/shop/auth-form";

export default async function LoginPage() {
  const { settings } = await getSiteChrome();

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-5 py-16">
      <Suspense fallback={<div className="h-80 w-full max-w-md animate-pulse rounded-card bg-surface" />}>
        <AuthForm mode="login" siteName={settings.siteName} />
      </Suspense>
      <Link href="/products" className="mt-6 text-sm text-ink-muted hover:text-ink">
        العودة للمنتجات
      </Link>
    </main>
  );
}

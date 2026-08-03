import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <Suspense
        fallback={
          <div className="h-72 w-full max-w-md animate-pulse rounded-xl bg-muted" />
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}

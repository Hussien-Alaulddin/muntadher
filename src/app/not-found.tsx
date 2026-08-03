import Link from "next/link";
import { primaryButtonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-6 py-16 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,color-mix(in_srgb,var(--primary)_14%,transparent),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,color-mix(in_srgb,var(--foreground)_6%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--foreground)_6%,transparent)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]"
      />

      <div className="relative z-10 flex max-w-md flex-col items-center gap-6">
        <p className="font-arabic-bold text-[clamp(4.5rem,18vw,7.5rem)] leading-none tracking-tight text-primary/90">
          404
        </p>
        <div className="space-y-2">
          <h1 className="font-arabic-bold text-h2 text-foreground">
            Page Not Found
          </h1>
          <p className="text-body text-muted-foreground">
            الرابط غير موجود أو نُقل إلى مكان آخر.
          </p>
        </div>
        <Link
          href="/"
          className={`${primaryButtonClass} mt-2 min-h-11 px-6 py-2.5 text-small`}
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}

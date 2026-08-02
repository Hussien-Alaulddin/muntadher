export default function ProjectRequestLoading() {
  return (
    <main className="container-site flex min-h-[75vh] flex-col py-10 md:py-14">
      <div className="mb-8 space-y-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-surface">
          <div className="h-full w-1/6 animate-pulse rounded-full bg-brand/40" />
        </div>
        <div className="h-3 w-16 animate-pulse rounded bg-surface" />
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6">
        <div className="space-y-3">
          <div className="h-9 w-3/4 animate-pulse rounded-lg bg-surface" />
          <div className="h-4 w-full animate-pulse rounded bg-surface" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-surface" />
        </div>

        <div className="space-y-3">
          <div className="h-8 w-1/2 animate-pulse rounded-lg bg-surface" />
          <div className="h-12 w-full animate-pulse rounded-field bg-surface" />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <div className="h-11 w-28 animate-pulse rounded-full bg-surface" />
          <div className="flex items-center gap-2 text-body text-ink-muted">
            <span
              className="size-4 animate-spin rounded-full border-2 border-ink/15 border-t-brand"
              aria-hidden
            />
            جاري تحميل الاستمارة…
          </div>
        </div>
      </div>
    </main>
  );
}

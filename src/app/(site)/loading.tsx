export default function SiteLoading() {
  return (
    <main
      className="min-h-[50vh] py-[80px] md:py-[100px]"
      aria-busy="true"
      aria-label="جاري التحميل"
    >
      <div className="container-site space-y-6">
        <div className="h-10 w-56 max-w-full animate-pulse rounded bg-surface-alt" />
        <div className="h-5 w-full max-w-md animate-pulse rounded bg-surface-alt" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="aspect-[4/3] animate-pulse rounded-lg bg-surface-alt" />
          <div className="aspect-[4/3] animate-pulse rounded-lg bg-surface-alt" />
          <div className="aspect-[4/3] animate-pulse rounded-lg bg-surface-alt" />
        </div>
      </div>
    </main>
  );
}

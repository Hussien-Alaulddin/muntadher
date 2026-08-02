import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <Skeleton className="mt-6 h-64 w-full rounded-xl" />
    </div>
  );
}

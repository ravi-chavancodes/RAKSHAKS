import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 py-10">
      <Skeleton className="h-12 w-72" />
      <div className="grid gap-8 lg:grid-cols-12">
        <Skeleton className="h-72 lg:col-span-4" />
        <Skeleton className="h-72 lg:col-span-8" />
      </div>
    </div>
  );
}

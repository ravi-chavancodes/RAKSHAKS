import { Skeleton } from "@/components/ui/skeleton";

export default function ResponderLoading() {
  return (
    <div className="space-y-6 py-10">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

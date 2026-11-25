import { Skeleton } from "@/components/ui/skeleton";

export default function TrackLoading() {
  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-36 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    </section>
  );
}

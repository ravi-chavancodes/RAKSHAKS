import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportWizard } from "@/features/report/components/report-wizard";
import type { ReportingMode } from "@/features/report/types";

interface ReportPageProps {
  searchParams: Promise<{ mode?: string }>;
}

async function ReportContent({ searchParams }: ReportPageProps) {
  const params = await searchParams;
  const initialMode: ReportingMode =
    params.mode === "third_person" ? "third_person" : "self";

  return <ReportWizard initialMode={initialMode} />;
}

function ReportFallback() {
  return (
    <section className="py-10 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    </section>
  );
}

export default function ReportPage({ searchParams }: ReportPageProps) {
  return (
    <Suspense fallback={<ReportFallback />}>
      <ReportContent searchParams={searchParams} />
    </Suspense>
  );
}

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CaseTracker,
  type TrackedMatch,
} from "@/features/track/components/case-tracker";
import { copy } from "@/lib/copy";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

interface TrackPageProps {
  params: Promise<{ ref: string }>;
}

async function TrackContent({ params }: TrackPageProps) {
  const { ref } = await params;
  const adminClient = createAdminClient();
  const dbClient = adminClient ?? (await createServerClient());

  const { data: incident } = await dbClient
    .from("incidents")
    .select(
      "id, reference, category, status, ai_suggested_category, ai_suggested_priority, ai_confidence, category_confirmed, location_text, location_is_approximate, created_at",
    )
    .eq("reference", ref)
    .maybeSingle();

  if (!incident) {
    return (
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-lg space-y-5 rounded-lg bg-surface p-6 shadow-layered-sm sm:p-8">
          <h1 className="text-h2 font-bold text-strong">
            {copy.routes.track.notFoundTitle}
          </h1>
          <p className="font-mono text-body font-semibold text-muted-ink">
            {ref}
          </p>
          <p className="text-body text-muted-ink">
            {copy.routes.track.notFoundDescription}
          </p>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border-strong bg-surface px-4 py-2 text-body font-medium text-strong transition-colors hover:bg-surface-subtle"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{copy.routes.track.backHome}</span>
          </Link>
        </div>
      </section>
    );
  }

  const [{ data: history }, { data: rawAssignments }] = await Promise.all([
    dbClient
      .from("status_history")
      .select("id, old_status, new_status, note, created_at")
      .eq("incident_id", incident.id)
      .order("created_at", { ascending: false }),
    dbClient
      .from("assignments")
      .select("id, distance_m, response_state, responders(category)")
      .eq("incident_id", incident.id),
  ]);

  // Never expose responder contact_channel or phone numbers to reporters
  const matches: TrackedMatch[] = (rawAssignments ?? []).map((row) => {
    const resp = row.responders as { category?: TrackedMatch["category"] } | null;
    return {
      id: row.id,
      category: resp?.category ?? incident.category,
      distance_m: row.distance_m,
      response_state: row.response_state,
    };
  });

  return (
    <CaseTracker
      incident={incident}
      matches={matches}
      history={history ?? []}
    />
  );
}

function TrackFallback() {
  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-36 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    </section>
  );
}

export default function TrackPage({ params }: TrackPageProps) {
  return (
    <Suspense fallback={<TrackFallback />}>
      <TrackContent params={params} />
    </Suspense>
  );
}

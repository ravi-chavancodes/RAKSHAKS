import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponderQueue } from "@/features/responder/components/responder-queue";
import type { ResponderCaseListItem } from "@/features/responder/types";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";

function stripContactDetails(description: string): string {
  return description.split(/\n\nContact:/)[0]?.trim() ?? description.trim();
}

async function ResponderQueueContent() {
  const profileResult = await getCurrentProfile();
  if (!profileResult.ok || !profileResult.data) {
    redirect("/login?next=/responder");
  }

  const profile = profileResult.data;
  if (profile.role !== "responder" && profile.role !== "admin") {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  let query = supabase
    .from("assignments")
    .select(
      "id, distance_m, response_state, responders!inner(profile_id), incidents!inner(id, reference, category, status, reporting_mode, description, location_text, created_at)",
    )
    .order("assigned_at", { ascending: false });

  // Responders only see their own organisation's assigned cases
  if (profile.role === "responder") {
    query = query.eq("responders.profile_id", profile.id);
  }

  const { data: rows } = await query;

  const cases: ResponderCaseListItem[] = (rows ?? []).map((row) => {
    const inc = row.incidents as unknown as {
      id: string;
      reference: string;
      category: ResponderCaseListItem["category"];
      status: ResponderCaseListItem["status"];
      reporting_mode: ResponderCaseListItem["reportingMode"];
      description: string;
      location_text: string | null;
      created_at: string;
    };

    return {
      assignmentId: row.id,
      incidentId: inc.id,
      reference: inc.reference,
      category: inc.category,
      status: inc.status,
      reportingMode: inc.reporting_mode,
      summaryWithoutContact: stripContactDetails(inc.description),
      locationText: inc.location_text,
      distanceM: row.distance_m,
      responseState: row.response_state,
      createdAt: inc.created_at,
    };
  });

  return <ResponderQueue cases={cases} />;
}

function ResponderFallback() {
  return (
    <div className="space-y-6 py-10">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default function ResponderPage() {
  return (
    <Suspense fallback={<ResponderFallback />}>
      <ResponderQueueContent />
    </Suspense>
  );
}

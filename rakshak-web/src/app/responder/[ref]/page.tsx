import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponderCaseDetailView } from "@/features/responder/components/responder-case-detail";
import type { ResponderCaseDetail } from "@/features/responder/types";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";

interface ResponderDetailPageProps {
  params: Promise<{ ref: string }>;
}

function splitDescription(description: string): {
  body: string;
  contact: string | null;
} {
  const idx = description.indexOf("\n\nContact:");
  if (idx === -1) {
    return { body: description.trim(), contact: null };
  }
  return {
    body: description.slice(0, idx).trim(),
    contact: description.slice(idx).trim(),
  };
}

async function ResponderDetailContent({ params }: ResponderDetailPageProps) {
  const { ref } = await params;
  const profileResult = await getCurrentProfile();
  if (!profileResult.ok || !profileResult.data) {
    redirect(`/login?next=/responder/${ref}`);
  }

  const profile = profileResult.data;
  if (profile.role !== "responder" && profile.role !== "admin") {
    redirect("/unauthorized");
  }

  const supabase = await createClient();

  const { data: incident } = await supabase
    .from("incidents")
    .select(
      "id, reference, category, status, reporting_mode, description, location_text, location_is_approximate, created_at",
    )
    .eq("reference", ref)
    .maybeSingle();

  if (!incident) {
    notFound();
  }

  let assignmentQuery = supabase
    .from("assignments")
    .select("id, responders!inner(profile_id)")
    .eq("incident_id", incident.id);

  if (profile.role === "responder") {
    assignmentQuery = assignmentQuery.eq("responders.profile_id", profile.id);
  }

  const { data: assignment } = await assignmentQuery.limit(1).maybeSingle();

  if (profile.role === "responder" && !assignment) {
    redirect("/unauthorized");
  }

  const { data: coords } = await supabase.rpc("get_incident_coordinates", {
    p_incident_id: incident.id,
  });

  const { body, contact } = splitDescription(incident.description);
  const firstCoord = coords?.[0] ?? null;

  const detail: ResponderCaseDetail = {
    assignmentId: assignment?.id ?? null,
    incidentId: incident.id,
    reference: incident.reference,
    category: incident.category,
    status: incident.status,
    reportingMode: incident.reporting_mode,
    descriptionBody: body,
    contactDetails: contact,
    locationText: incident.location_text,
    locationIsApproximate: incident.location_is_approximate,
    latitude: firstCoord ? firstCoord.latitude : null,
    longitude: firstCoord ? firstCoord.longitude : null,
    createdAt: incident.created_at,
  };

  return <ResponderCaseDetailView detail={detail} />;
}

function DetailFallback() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 py-10">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-80 w-full rounded-lg" />
    </div>
  );
}

export default function ResponderCasePage({ params }: ResponderDetailPageProps) {
  return (
    <Suspense fallback={<DetailFallback />}>
      <ResponderDetailContent params={params} />
    </Suspense>
  );
}

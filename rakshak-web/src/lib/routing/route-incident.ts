import { createAdminClient } from "@/lib/supabase/admin";
import { err, ok, type Result } from "@/lib/result";

export type RouteMatchSummary = {
  readonly responderId: string;
  readonly organisationName: string;
  readonly category: string;
  readonly distanceM: number;
};

export interface RouteIncidentOutcome {
  readonly incidentId: string;
  readonly reference: string;
  readonly status: string;
  readonly matchedCount: number;
  readonly matches: readonly RouteMatchSummary[];
}

const DEFAULT_MAX_RESPONDERS = 3;

export async function routeIncidentById(
  incidentId: string,
  maxResponders = Number(process.env.ROUTING_MAX_RESPONDERS) || DEFAULT_MAX_RESPONDERS,
): Promise<Result<RouteIncidentOutcome, string>> {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return err("SUPABASE_SERVICE_ROLE_KEY is required for responder routing.");
  }

  const { data: incident, error: fetchError } = await adminClient
    .from("incidents")
    .select("id, reference, category, category_confirmed, status")
    .eq("id", incidentId)
    .maybeSingle();

  if (fetchError || !incident) {
    return err(fetchError?.message ?? "Incident not found.");
  }

  if (!incident.category_confirmed) {
    return err("Category must be confirmed before routing.");
  }

  let currentStatus = incident.status;

  // Move submitted -> under_review before attempting responder match
  if (currentStatus === "submitted") {
    const { data: reviewed, error: reviewError } = await adminClient.rpc(
      "transition_case_status",
      {
        p_incident_id: incident.id,
        p_to: "under_review",
        p_note: "Category confirmed; searching verified responders",
      },
    );

    if (reviewError || !reviewed) {
      return err(reviewError?.message ?? "Failed to move incident to under_review.");
    }
    currentStatus = reviewed.status;
  }

  // Call find_nearby_responders (active, verified, matching category & service area)
  const { data: candidates, error: matchError } = await adminClient.rpc(
    "find_nearby_responders",
    { p_incident_id: incident.id },
  );

  if (matchError) {
    return err(matchError.message);
  }

  const topMatches = (candidates ?? []).slice(0, Math.max(1, maxResponders));

  if (topMatches.length === 0) {
    await adminClient.from("audit_logs").insert({
      action: "routing_no_match",
      entity: "incidents",
      entity_id: incident.id,
      metadata: {
        reference: incident.reference,
        category: incident.category,
        reason: "No active verified responder covers this category and location.",
      },
    });

    return ok({
      incidentId: incident.id,
      reference: incident.reference,
      status: currentStatus,
      matchedCount: 0,
      matches: [],
    });
  }

  // Create assignments (response_state = 'notified', NEVER 'accepted')
  const assignmentRows = topMatches.map((m) => ({
    incident_id: incident.id,
    responder_id: m.responder_id,
    response_state: "notified",
    distance_m: Math.round(m.distance_m),
  }));

  const { error: assignError } = await adminClient
    .from("assignments")
    .insert(assignmentRows);

  if (assignError) {
    return err(`Failed to create assignments: ${assignError.message}`);
  }

  // Create notification records for each matched responder
  const notificationRows = topMatches.map((m) => ({
    incident_id: incident.id,
    responder_id: m.responder_id,
    channel: "in_app",
    status: "sent",
    payload: {
      reference: incident.reference,
      category: incident.category,
      distance_m: Math.round(m.distance_m),
    },
  }));

  await adminClient.from("notifications").insert(notificationRows);

  // Move under_review -> assigned
  if (currentStatus === "under_review") {
    const { data: assignedRow, error: assignStatusErr } = await adminClient.rpc(
      "transition_case_status",
      {
        p_incident_id: incident.id,
        p_to: "assigned",
        p_note: `Notified ${topMatches.length} verified responder(s) matching ${incident.category}`,
      },
    );

    if (assignStatusErr) {
      return err(assignStatusErr.message);
    }
    if (assignedRow) {
      currentStatus = assignedRow.status;
    }
  }

  const matches: RouteMatchSummary[] = topMatches.map((m) => ({
    responderId: m.responder_id,
    organisationName: m.organisation_name,
    category: m.category,
    distanceM: Math.round(m.distance_m),
  }));

  await adminClient.from("audit_logs").insert({
    action: "routing_matched",
    entity: "incidents",
    entity_id: incident.id,
    metadata: {
      reference: incident.reference,
      category: incident.category,
      basis: "Matched active, verified responders by category and PostGIS service area",
      matches,
    },
  });

  return ok({
    incidentId: incident.id,
    reference: incident.reference,
    status: currentStatus,
    matchedCount: matches.length,
    matches,
  });
}

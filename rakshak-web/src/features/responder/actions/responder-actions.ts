"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import type { Database } from "@/lib/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type CaseStatus = Database["public"]["Enums"]["case_status"];

const responderActionSchema = z.object({
  incidentId: z.string().uuid(),
  reference: z.string().min(1),
  assignmentId: z.string().uuid().nullable(),
  actionType: z.enum(["accept", "reject", "in_progress", "close", "escalate"]),
  reason: z.string().trim().max(400).optional(),
});

export type ResponderActionInput = z.infer<typeof responderActionSchema>;

export type ResponderActionResponse =
  | { readonly ok: true; readonly newStatus: CaseStatus }
  | { readonly ok: false; readonly status: 400 | 403 | 404 | 500; readonly error: string };

const TARGET_STATUS_MAP: Record<ResponderActionInput["actionType"], CaseStatus> = {
  accept: "accepted",
  reject: "under_review",
  in_progress: "in_progress",
  close: "closed",
  escalate: "unresolved_escalated",
};

export async function transitionResponderCaseAction(
  rawInput: ResponderActionInput,
): Promise<ResponderActionResponse> {
  const parsed = responderActionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: parsed.error.issues[0]?.message ?? "Invalid action payload.",
    };
  }

  const input = parsed.data;

  if (
    (input.actionType === "reject" || input.actionType === "close") &&
    (!input.reason || input.reason.trim().length < 3)
  ) {
    return {
      ok: false,
      status: 400,
      error:
        input.actionType === "close"
          ? "A closure reason (at least 3 characters) is required to close a case."
          : "A rejection reason (at least 3 characters) is required.",
    };
  }

  const profileResult = await getCurrentProfile();
  const profile = profileResult.ok ? profileResult.data : null;

  if (!profile || (profile.role !== "responder" && profile.role !== "admin")) {
    const adminClient = createAdminClient();
    if (adminClient) {
      await adminClient.from("audit_logs").insert({
        actor_id: profile?.id ?? null,
        action: "unauthorized_status_attempt",
        entity: "incidents",
        entity_id: input.incidentId,
        metadata: {
          reference: input.reference,
          attempted_action: input.actionType,
          role: profile?.role ?? "anonymous",
        },
      });
    }

    return {
      ok: false,
      status: 403,
      error: "403 Forbidden: you are not authorised to update this case.",
    };
  }

  const supabase = await createClient();

  // Responders may only act on assignments belonging to their organisation
  if (profile.role === "responder") {
    if (!input.assignmentId) {
      return {
        ok: false,
        status: 403,
        error: "403 Forbidden: no assignment found for your organisation.",
      };
    }

    const { data: ownAssignment } = await supabase
      .from("assignments")
      .select("id, responders!inner(profile_id)")
      .eq("id", input.assignmentId)
      .eq("responders.profile_id", profile.id)
      .maybeSingle();

    if (!ownAssignment) {
      return {
        ok: false,
        status: 403,
        error: "403 Forbidden: case is not assigned to your organisation.",
      };
    }
  }

  const targetStatus = TARGET_STATUS_MAP[input.actionType];
  const note =
    input.reason?.trim() ||
    (input.actionType === "accept"
      ? "Responder accepted case"
      : input.actionType === "in_progress"
        ? "Responder marked case in progress"
        : "Responder escalated case");

  const { data: updated, error: rpcError } = await supabase.rpc(
    "transition_case_status",
    {
      p_incident_id: input.incidentId,
      p_to: targetStatus,
      p_note: note,
    },
  );

  if (rpcError || !updated) {
    return {
      ok: false,
      status: 400,
      error: rpcError?.message ?? "Status transition failed.",
    };
  }

  if (input.assignmentId) {
    const responseState =
      input.actionType === "accept" || input.actionType === "in_progress" || input.actionType === "close"
        ? "accepted"
        : input.actionType === "reject"
          ? "rejected"
          : "escalated";

    await supabase
      .from("assignments")
      .update({
        response_state: responseState,
        responded_at: new Date().toISOString(),
        rejection_reason:
          input.actionType === "reject" ? input.reason?.trim() ?? null : null,
      })
      .eq("id", input.assignmentId);
  }

  revalidatePath("/responder");
  revalidatePath(`/responder/${input.reference}`);
  revalidatePath(`/track/${input.reference}`);
  revalidatePath("/admin");

  return { ok: true, newStatus: updated.status };
}

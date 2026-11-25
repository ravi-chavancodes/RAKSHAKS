import type { Database } from "@/lib/database.types";

export type CaseStatus = Database["public"]["Enums"]["case_status"];
export type EmergencyCategory = Database["public"]["Enums"]["emergency_category"];

const ALLOWED_TRANSITIONS: Record<CaseStatus, readonly CaseStatus[]> = {
  submitted: ["under_review"],
  under_review: ["assigned", "unresolved_escalated"],
  assigned: ["accepted", "under_review", "unresolved_escalated"],
  accepted: ["in_progress", "unresolved_escalated"],
  in_progress: ["closed", "unresolved_escalated"],
  unresolved_escalated: ["assigned", "closed"],
  closed: [],
};

export function isValidStatusTransition(
  fromStatus: CaseStatus,
  toStatus: CaseStatus,
): boolean {
  return ALLOWED_TRANSITIONS[fromStatus].includes(toStatus);
}

export interface ResponderCandidate {
  readonly id: string;
  readonly category: EmergencyCategory;
  readonly isActive: boolean;
  readonly verified: boolean;
  readonly distanceM: number;
}

export function selectMatchingResponders(
  incidentCategory: EmergencyCategory,
  candidates: readonly ResponderCandidate[],
  limit = 3,
): readonly ResponderCandidate[] {
  return candidates
    .filter(
      (c) => c.isActive && c.verified && c.category === incidentCategory,
    )
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, Math.max(1, limit));
}

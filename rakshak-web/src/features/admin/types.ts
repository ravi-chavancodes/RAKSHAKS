import type { Database } from "@/lib/database.types";

export type CaseStatus = Database["public"]["Enums"]["case_status"];
export type EmergencyCategory = Database["public"]["Enums"]["emergency_category"];
export type UserRole = Database["public"]["Enums"]["user_role"];

export interface AdminIncidentRow {
  readonly id: string;
  readonly reference: string;
  readonly category: EmergencyCategory;
  readonly status: CaseStatus;
  readonly description: string;
  readonly location_text: string | null;
  readonly ai_suggested_priority: string | null;
  readonly created_at: string;
}

export interface AdminResponderRow {
  readonly id: string;
  readonly organisation_name: string;
  readonly category: EmergencyCategory;
  readonly contact_channel: string;
  readonly radius_m: number | null;
  readonly is_active: boolean;
  readonly verified: boolean;
}

export interface AdminProfileRow {
  readonly id: string;
  readonly full_name: string | null;
  readonly phone: string | null;
  readonly role: UserRole;
  readonly created_at: string;
}

export interface AdminAuditRow {
  readonly id: number;
  readonly actor_id: string | null;
  readonly action: string;
  readonly entity: string;
  readonly entity_id: string;
  readonly metadata: unknown;
  readonly created_at: string;
}

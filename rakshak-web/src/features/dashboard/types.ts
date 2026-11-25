import type { Database } from "@/lib/database.types";

export type CaseStatus = Database["public"]["Enums"]["case_status"];
export type EmergencyCategory = Database["public"]["Enums"]["emergency_category"];

export interface DashboardIncident {
  readonly id: string;
  readonly reference: string;
  readonly category: EmergencyCategory;
  readonly status: CaseStatus;
  readonly description: string;
  readonly location_text: string | null;
  readonly created_at: string;
}

export interface DashboardStatusEntry {
  readonly id: number;
  readonly incident_id: string;
  readonly old_status: CaseStatus | null;
  readonly new_status: CaseStatus;
  readonly note: string | null;
  readonly created_at: string;
}

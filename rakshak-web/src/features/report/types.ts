import type { Database } from "@/lib/database.types";

export type ReportingMode = Database["public"]["Enums"]["reporting_mode"];
export type EmergencyCategory = Database["public"]["Enums"]["emergency_category"];

export type AudioPermissionState =
  | "not_asked"
  | "granted"
  | "denied"
  | "unsupported"
  | "skipped";

export type LocationMode = "unasked" | "gps" | "manual";

export interface ReportDraft {
  readonly clientRequestId: string;
  readonly reportingMode: ReportingMode;
  readonly category: EmergencyCategory | null;
  readonly description: string;
  readonly contactName: string;
  readonly contactPhone: string;
  readonly locationMode: LocationMode;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly locationAccuracyM: number | null;
  readonly locationText: string;
  readonly locationIsApproximate: boolean;
  readonly audioPermissionState: AudioPermissionState;
  readonly audioDurationMs: number | null;
}

export interface SubmissionResult {
  readonly reference: string;
  readonly duplicate: boolean;
}

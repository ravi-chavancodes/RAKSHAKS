import type { Database } from "@/lib/database.types";

export type CaseStatus = Database["public"]["Enums"]["case_status"];
export type EmergencyCategory = Database["public"]["Enums"]["emergency_category"];
export type ReportingMode = Database["public"]["Enums"]["reporting_mode"];

export interface ResponderCaseListItem {
  readonly assignmentId: string;
  readonly incidentId: string;
  readonly reference: string;
  readonly category: EmergencyCategory;
  readonly status: CaseStatus;
  readonly reportingMode: ReportingMode;
  readonly summaryWithoutContact: string;
  readonly locationText: string | null;
  readonly distanceM: number | null;
  readonly responseState: string;
  readonly createdAt: string;
}

export interface ResponderCaseDetail {
  readonly assignmentId: string | null;
  readonly incidentId: string;
  readonly reference: string;
  readonly category: EmergencyCategory;
  readonly status: CaseStatus;
  readonly reportingMode: ReportingMode;
  readonly descriptionBody: string;
  readonly contactDetails: string | null;
  readonly locationText: string | null;
  readonly locationIsApproximate: boolean;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly createdAt: string;
}

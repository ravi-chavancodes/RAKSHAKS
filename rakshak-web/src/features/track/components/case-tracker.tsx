"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, Phone } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type CaseStatus = Database["public"]["Enums"]["case_status"];
type EmergencyCategory = Database["public"]["Enums"]["emergency_category"];

export interface TrackedIncident {
  readonly id: string;
  readonly reference: string;
  readonly category: EmergencyCategory;
  readonly status: CaseStatus;
  readonly ai_suggested_category: EmergencyCategory | null;
  readonly ai_suggested_priority: string | null;
  readonly ai_confidence: number | null;
  readonly category_confirmed: boolean;
  readonly location_text: string | null;
  readonly location_is_approximate: boolean;
  readonly created_at: string;
}

export interface TrackedMatch {
  readonly id: string;
  readonly category: EmergencyCategory;
  readonly distance_m: number | null;
  readonly response_state: string;
}

export interface TrackedStatusEntry {
  readonly id: number;
  readonly old_status: CaseStatus | null;
  readonly new_status: CaseStatus;
  readonly note: string | null;
  readonly created_at: string;
}

interface CaseTrackerProps {
  incident: TrackedIncident;
  matches: readonly TrackedMatch[];
  history: readonly TrackedStatusEntry[];
}

const TIMELINE_STEPS: readonly { status: CaseStatus; label: string }[] = [
  { status: "submitted", label: "Submitted" },
  { status: "under_review", label: "Under Review" },
  { status: "assigned", label: "Assigned" },
  { status: "accepted", label: "Accepted" },
  { status: "in_progress", label: "In Progress" },
  { status: "closed", label: "Closed" },
];

const CATEGORY_LABELS: Record<EmergencyCategory, string> = {
  human: "Medical responder",
  animal_bird: "Animal hospital / rescue",
  fire_rescue: "Fire & rescue station",
};

const STATUS_LABELS: Record<CaseStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  assigned: "Assigned (Responder Notified)",
  accepted: "Accepted (Responder Confirmed)",
  in_progress: "In Progress",
  closed: "Closed",
  unresolved_escalated: "Unresolved / Escalated",
};

function formatDistanceKm(distanceM: number | null): string {
  if (distanceM === null) return "nearby";
  const km = Math.max(0.1, distanceM / 1000);
  return `about ${km.toFixed(1)} km away`;
}

export function CaseTracker({ incident, matches, history }: CaseTrackerProps) {
  const router = useRouter();
  const [isChanging, setIsChanging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Primary: Supabase Realtime subscription; Fallback: 15s polling
  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null =
      null;

    try {
      const supabase = createClient();
      channel = supabase
        .channel(`track-incident-${incident.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "incidents",
            filter: `id=eq.${incident.id}`,
          },
          () => {
            router.refresh();
          },
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "status_history",
            filter: `incident_id=eq.${incident.id}`,
          },
          () => {
            router.refresh();
          },
        )
        .subscribe();
    } catch {
      // Realtime unavailable; polling fallback below handles updates
    }

    const fallbackTimer = window.setInterval(() => {
      router.refresh();
    }, 15_000);

    return () => {
      window.clearInterval(fallbackTimer);
      if (channel) {
        try {
          const supabase = createClient();
          void supabase.removeChannel(channel);
        } catch {
          // Ignore cleanup error
        }
      }
    };
  }, [incident.id, router]);

  const hasAiSuggestion = incident.ai_suggested_category !== null;
  const confidencePct =
    incident.ai_confidence !== null
      ? Math.round(incident.ai_confidence * 100)
      : null;
  const isLowConfidence =
    incident.ai_confidence !== null && incident.ai_confidence < 0.5;

  const currentStepIndex = TIMELINE_STEPS.findIndex(
    (s) => s.status === incident.status,
  );

  async function saveCategory(category: EmergencyCategory) {
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/incidents/${encodeURIComponent(incident.reference)}/category`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category }),
        },
      );

      const payload = (await response.json()) as
        | { ok: true }
        | { ok: false; error: string };

      if (!response.ok || !payload.ok) {
        toast.error(payload.ok ? "Failed to confirm category." : payload.error);
        return;
      }

      toast.success(copy.routes.track.confirmedLabel);
      setIsChanging(false);
      router.refresh();
    } catch {
      toast.error("Could not confirm category. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Escalation Banner */}
        {incident.status === "unresolved_escalated" ? (
          <div
            role="alert"
            className="space-y-3 rounded-lg border border-danger-border bg-danger-soft p-5"
          >
            <div className="flex items-center gap-2 text-body-lg font-bold text-danger">
              <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
              <span>Unresolved / Escalated</span>
            </div>
            <p className="text-body text-strong">
              This case could not be resolved through local coordination. If
              immediate help is needed, call official emergency services now:
            </p>
            <div className="flex flex-wrap gap-2">
              {copy.emergencyNumbers.map((item) => (
                <a
                  key={item.code}
                  href={item.href}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-surface px-3.5 py-2 text-caption font-semibold text-accent-primary shadow-layered-sm"
                >
                  <Phone className="size-3.5" aria-hidden="true" />
                  <span className="font-mono tabular-nums">{item.code}</span>
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {/* Case header */}
        <div className="space-y-4 rounded-lg bg-surface p-6 shadow-layered-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-caption font-medium text-muted-ink">
                {copy.routes.track.referenceLabel}
              </p>
              <h1 className="font-mono text-h2 font-bold tabular-nums text-strong">
                {incident.reference}
              </h1>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{STATUS_LABELS[incident.status]}</Badge>
              <Badge variant="secondary">
                {CATEGORY_LABELS[incident.category]}
              </Badge>
            </div>
          </div>

          {incident.location_text ? (
            <p className="text-caption text-muted-ink">
              Location: {incident.location_text}
              {incident.location_is_approximate ? " (Approximate)" : ""}
            </p>
          ) : null}

          {incident.ai_suggested_priority ? (
            <p className="text-caption font-medium text-info">
              {copy.routes.track.aiPriorityLabel}: {incident.ai_suggested_priority}
            </p>
          ) : null}

          {/* Horizontal Status Timeline */}
          <div className="border-t border-border-default pt-4">
            <ol className="grid grid-cols-2 gap-2 sm:grid-cols-6">
              {TIMELINE_STEPS.map((step, index) => {
                const entry = history.find((h) => h.new_status === step.status);
                const isReached =
                  Boolean(entry) ||
                  (currentStepIndex !== -1 && index <= currentStepIndex);

                return (
                  <li
                    key={step.status}
                    className={cn(
                      "rounded-md p-2.5 text-caption",
                      isReached
                        ? "bg-success-soft text-strong"
                        : "bg-surface-subtle text-subtle-ink",
                    )}
                  >
                    <div className="font-semibold">{step.label}</div>
                    {entry ? (
                      <div className="mt-1 text-[11px] text-muted-ink">
                        {new Date(entry.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* AI Suggestion / Category Confirmation Card */}
        <div className="space-y-4 rounded-lg bg-surface p-6 shadow-layered-sm">
          {!hasAiSuggestion ? (
            <div className="space-y-3">
              <p className="text-body text-muted-ink">
                {copy.routes.track.aiUnavailable}
              </p>
              {!incident.category_confirmed ? (
                <Button
                  type="button"
                  disabled={isSaving}
                  onClick={() => saveCategory(incident.category)}
                  className="min-h-[44px] bg-strong text-surface hover:bg-strong/90"
                >
                  {copy.routes.track.confirmButton}{" "}
                  {CATEGORY_LABELS[incident.category]}
                </Button>
              ) : null}
            </div>
          ) : incident.category_confirmed ? (
            <div className="flex items-center gap-2 text-body font-medium text-success">
              <CheckCircle2 className="size-5" aria-hidden="true" />
              <span>
                {copy.routes.track.confirmedLabel} (
                {CATEGORY_LABELS[incident.category]})
              </span>
            </div>
          ) : isLowConfidence ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{copy.routes.track.aiBadge}</Badge>
                <span className="text-body font-semibold text-strong">
                  {copy.routes.track.aiLowConfidence}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CATEGORY_LABELS) as EmergencyCategory[]).map(
                  (cat) => (
                    <Button
                      key={cat}
                      type="button"
                      variant="outline"
                      disabled={isSaving}
                      onClick={() => saveCategory(cat)}
                      className="min-h-[44px]"
                    >
                      {CATEGORY_LABELS[cat]}
                    </Button>
                  ),
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Badge variant="secondary">{copy.routes.track.aiBadge}</Badge>
                <p className="text-body font-medium text-strong">
                  {copy.routes.track.aiSuggestsPrefix}{" "}
                  {CATEGORY_LABELS[incident.ai_suggested_category!]}{" "}
                  {confidencePct !== null
                    ? `(confidence ${confidencePct}%)`
                    : ""}
                  . {copy.routes.track.aiDoesThisLookRight}
                </p>
              </div>

              {!isChanging ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      saveCategory(incident.ai_suggested_category!)
                    }
                    className="min-h-[44px] bg-strong text-surface hover:bg-strong/90"
                  >
                    {copy.routes.track.confirmButton}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => setIsChanging(true)}
                    className="min-h-[44px]"
                  >
                    {copy.routes.track.changeButton}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CATEGORY_LABELS) as EmergencyCategory[]).map(
                    (cat) => (
                      <Button
                        key={cat}
                        type="button"
                        variant="outline"
                        disabled={isSaving}
                        onClick={() => saveCategory(cat)}
                        className="min-h-[44px]"
                      >
                        {CATEGORY_LABELS[cat]}
                      </Button>
                    ),
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Responder Routing Basis (no phone numbers, no live responder GPS) */}
        {incident.category_confirmed ? (
          <div className="space-y-4 rounded-lg bg-surface p-6 shadow-layered-sm">
            <h2 className="text-body-lg font-semibold text-strong">
              {copy.routes.track.routingHeading}
            </h2>

            {matches.length === 0 ? (
              <div className="space-y-3 rounded-md border border-warning-border bg-warning-soft p-4">
                <p className="text-body font-medium text-strong">
                  {copy.routes.track.noMatchMessage}
                </p>
                <div className="flex flex-wrap gap-2">
                  {copy.emergencyNumbers.map((item) => (
                    <a
                      key={item.code}
                      href={item.href}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-surface px-3.5 py-2 text-caption font-semibold text-accent-primary shadow-layered-sm"
                    >
                      <Phone className="size-3.5" aria-hidden="true" />
                      <span className="font-mono tabular-nums">{item.code}</span>
                      <span>{item.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {matches.map((match) => (
                  <li
                    key={match.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-subtle p-3.5 text-caption"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-strong">
                        {CATEGORY_LABELS[match.category]},{" "}
                        {formatDistanceKm(match.distance_m)}
                      </p>
                      <p className="text-muted-ink">
                        {copy.routes.track.availabilityNote}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {match.response_state === "accepted"
                        ? "Accepted"
                        : "Notified"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {/* Status History */}
        <div className="space-y-4 rounded-lg bg-surface p-6 shadow-layered-sm">
          <h2 className="text-body-lg font-semibold text-strong">
            {copy.routes.track.timelineHeading}
          </h2>

          {history.length === 0 ? (
            <p className="text-caption text-muted-ink">
              Submitted to RAKSHAK coordination queue.
            </p>
          ) : (
            <ol className="space-y-3">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-md bg-surface-subtle p-3.5 text-caption"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-strong">
                      {STATUS_LABELS[entry.new_status]}
                    </span>
                    <span className="text-subtle-ink">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                  {entry.note ? (
                    <p className="mt-1 text-muted-ink">{entry.note}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Always-visible emergency reminder & back link */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border-strong bg-surface px-4 py-2 text-body font-medium text-strong transition-colors hover:bg-surface-subtle"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{copy.routes.track.backHome}</span>
          </Link>

          <div className="flex flex-wrap gap-2">
            {copy.emergencyNumbers.map((item) => (
              <a
                key={item.code}
                href={item.href}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-accent-border bg-accent-soft px-3 text-caption font-semibold text-accent-primary"
              >
                <Phone className="size-3.5" aria-hidden="true" />
                <span className="font-mono tabular-nums">{item.code}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

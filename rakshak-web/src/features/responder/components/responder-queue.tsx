"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CaseStatus, ResponderCaseListItem } from "../types";

interface ResponderQueueProps {
  cases: readonly ResponderCaseListItem[];
}

const STATUS_LABELS: Record<CaseStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  assigned: "New (Assigned)",
  accepted: "Accepted",
  in_progress: "In Progress",
  closed: "Closed",
  unresolved_escalated: "Escalated",
};

function CaseGroup({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: readonly ResponderCaseListItem[];
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-bold tracking-tight text-strong">{title}</h2>
        <Badge variant="secondary" className="font-mono tabular-nums">
          {items.length}
        </Badge>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg bg-surface p-6 text-body text-muted-ink shadow-layered-sm">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.assignmentId}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-surface p-5 shadow-layered-sm"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-body font-bold tabular-nums text-strong">
                    {item.reference}
                  </span>
                  <Badge variant="outline">{STATUS_LABELS[item.status]}</Badge>
                  <Badge variant="secondary">{item.category}</Badge>
                  {item.distanceM !== null ? (
                    <span className="text-caption text-muted-ink">
                      ~{(item.distanceM / 1000).toFixed(1)} km away
                    </span>
                  ) : null}
                </div>
                <p className="text-body text-muted-ink">
                  {item.summaryWithoutContact}
                </p>
                {item.locationText ? (
                  <p className="text-caption text-subtle-ink">
                    Area: {item.locationText}
                  </p>
                ) : null}
              </div>

              <Link
                href={`/responder/${item.reference}`}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-border-strong bg-surface px-4 text-caption font-semibold text-strong transition-colors hover:bg-surface-subtle"
              >
                <span>Open Case</span>
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function ResponderQueue({ cases }: ResponderQueueProps) {
  const newCases = cases.filter((c) => c.status === "assigned");
  const activeCases = cases.filter(
    (c) => c.status === "accepted" || c.status === "in_progress",
  );
  const escalatedCases = cases.filter(
    (c) => c.status === "unresolved_escalated",
  );

  return (
    <div className="space-y-10 py-10">
      <div className="space-y-1.5 border-b border-border-default pb-6">
        <h1 className="text-h1 font-bold tracking-tight text-strong">
          Responder Dispatch Queue
        </h1>
        <p className="text-body-lg text-muted-ink">
          Reporter contact details remain hidden until you explicitly accept a case.
        </p>
      </div>

      <CaseGroup
        title="New (Assigned)"
        emptyText="No new assigned cases for your organisation."
        items={newCases}
      />

      <CaseGroup
        title="Active (Accepted / In Progress)"
        emptyText="No active cases in progress."
        items={activeCases}
      />

      <CaseGroup
        title="Escalated"
        emptyText="No escalated cases."
        items={escalatedCases}
      />
    </div>
  );
}

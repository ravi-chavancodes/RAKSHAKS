"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { transitionResponderCaseAction } from "../actions/responder-actions";
import type { CaseStatus, ResponderCaseDetail } from "../types";
import { ReadOnlyMap } from "./read-only-map";

interface ResponderCaseDetailViewProps {
  detail: ResponderCaseDetail;
}

const STATUS_LABELS: Record<CaseStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  assigned: "New (Assigned)",
  accepted: "Accepted",
  in_progress: "In Progress",
  closed: "Closed",
  unresolved_escalated: "Unresolved / Escalated",
};

export function ResponderCaseDetailView({
  detail,
}: ResponderCaseDetailViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState<CaseStatus>(
    detail.status,
  );
  const [dialogMode, setDialogMode] = useState<"reject" | "close" | null>(null);
  const [reasonText, setReasonText] = useState("");

  const isAcceptedOrLater =
    optimisticStatus === "accepted" ||
    optimisticStatus === "in_progress" ||
    optimisticStatus === "closed";

  function runTransition(
    actionType: "accept" | "reject" | "in_progress" | "close" | "escalate",
    targetStatus: CaseStatus,
    reason?: string,
  ) {
    const previousStatus = optimisticStatus;
    setOptimisticStatus(targetStatus);

    startTransition(async () => {
      const result = await transitionResponderCaseAction({
        incidentId: detail.incidentId,
        reference: detail.reference,
        assignmentId: detail.assignmentId,
        actionType,
        reason,
      });

      if (!result.ok) {
        setOptimisticStatus(previousStatus);
        toast.error(result.error);
        return;
      }

      setOptimisticStatus(result.newStatus);
      setDialogMode(null);
      setReasonText("");
      toast.success(`Case updated to ${STATUS_LABELS[result.newStatus]}.`);
      router.refresh();
    });
  }

  return (
    <section className="py-10 sm:py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/responder"
          className="inline-flex min-h-[44px] items-center gap-2 text-body font-medium text-muted-ink transition-colors hover:text-strong"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Back to Responder Queue</span>
        </Link>

        <div className="space-y-5 rounded-lg bg-surface p-6 shadow-layered-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h1 className="font-mono text-h2 font-bold tabular-nums text-strong">
                {detail.reference}
              </h1>
              <p className="text-caption text-muted-ink">
                Reported {new Date(detail.createdAt).toLocaleString()} · Mode:{" "}
                {detail.reportingMode === "self" ? "Self SOS" : "Third-Person"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{STATUS_LABELS[optimisticStatus]}</Badge>
              <Badge variant="secondary">{detail.category}</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-caption font-semibold uppercase tracking-wide text-muted-ink">
              Incident Description
            </h2>
            <p className="text-body leading-relaxed text-strong">
              {detail.descriptionBody}
            </p>
          </div>

          {/* Contact details shown ONLY when case is accepted */}
          <div className="rounded-md bg-surface-subtle p-4">
            <h2 className="text-caption font-semibold text-strong">
              Reporter Contact Details
            </h2>
            {isAcceptedOrLater ? (
              <p className="mt-1 text-body text-strong">
                {detail.contactDetails ?? "No contact details provided."}
              </p>
            ) : (
              <p className="mt-1 text-caption text-muted-ink">
                Hidden until you explicitly accept this case.
              </p>
            )}
          </div>

          {/* Approximate Location + Map */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-caption font-semibold uppercase tracking-wide text-muted-ink">
                Location {detail.locationIsApproximate ? "(Approximate)" : ""}
              </h2>
              {detail.locationText ? (
                <span className="text-caption text-strong">
                  {detail.locationText}
                </span>
              ) : null}
            </div>

            {detail.latitude !== null && detail.longitude !== null ? (
              <ReadOnlyMap
                latitude={detail.latitude}
                longitude={detail.longitude}
              />
            ) : (
              <p className="rounded-md bg-surface-subtle p-4 text-caption text-muted-ink">
                GPS coordinates not captured; manual location provided above.
              </p>
            )}
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-3 border-t border-border-default pt-5">
            {optimisticStatus === "assigned" ? (
              <>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={() => runTransition("accept", "accepted")}
                  className="min-h-[48px] bg-accent-primary px-5 text-accent-primary-foreground hover:bg-accent-primary-hover"
                >
                  Accept Case
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setDialogMode("reject")}
                  className="min-h-[48px]"
                >
                  Reject
                </Button>
              </>
            ) : null}

            {optimisticStatus === "accepted" ? (
              <Button
                type="button"
                disabled={isPending}
                onClick={() => runTransition("in_progress", "in_progress")}
                className="min-h-[48px] bg-strong px-5 text-surface hover:bg-strong/90"
              >
                Mark In Progress
              </Button>
            ) : null}

            {optimisticStatus === "in_progress" ||
            optimisticStatus === "unresolved_escalated" ? (
              <Button
                type="button"
                disabled={isPending}
                onClick={() => setDialogMode("close")}
                className="min-h-[48px] bg-strong px-5 text-surface hover:bg-strong/90"
              >
                Close Case
              </Button>
            ) : null}

            {optimisticStatus === "assigned" ||
            optimisticStatus === "accepted" ||
            optimisticStatus === "in_progress" ? (
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() =>
                  runTransition("escalate", "unresolved_escalated")
                }
                className="min-h-[48px]"
              >
                Escalate
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Required Reason Dialog for Reject or Close */}
      <Dialog
        open={dialogMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDialogMode(null);
            setReasonText("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "close"
                ? "Close Case — Reason Required"
                : "Reject Assignment — Reason Required"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "close"
                ? "Enter the resolution or closure summary. This is recorded in status_history."
                : "Explain why your organisation cannot take this case so it returns to review."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="responder-reason">Reason</Label>
            <Textarea
              id="responder-reason"
              rows={3}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Enter clear operational reason (min 3 characters)..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogMode(null)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isPending || reasonText.trim().length < 3}
              onClick={() => {
                if (dialogMode === "close") {
                  runTransition("close", "closed", reasonText.trim());
                } else if (dialogMode === "reject") {
                  runTransition("reject", "under_review", reasonText.trim());
                }
              }}
              className="min-h-[44px] bg-accent-primary text-accent-primary-foreground hover:bg-accent-primary-hover"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

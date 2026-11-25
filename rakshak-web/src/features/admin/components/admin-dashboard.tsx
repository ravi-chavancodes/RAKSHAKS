"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fadeUp, stagger } from "@/lib/motion";
import { ClientTimestamp } from "@/components/client-timestamp";
import { createClient } from "@/lib/supabase/client";
import {
  createResponderAction,
  updateResponderAction,
  updateUserRoleAction,
} from "../actions/admin-actions";
import type {
  AdminAuditRow,
  AdminIncidentRow,
  AdminProfileRow,
  AdminResponderRow,
  CaseStatus,
  EmergencyCategory,
  UserRole,
} from "../types";

interface AdminDashboardProps {
  adminName: string;
  incidents: readonly AdminIncidentRow[];
  responders: readonly AdminResponderRow[];
  profiles: readonly AdminProfileRow[];
  auditLogs: readonly AdminAuditRow[];
}

const VALID_NEXT_STATUSES: Record<CaseStatus, readonly CaseStatus[]> = {
  submitted: ["under_review"],
  under_review: ["assigned", "unresolved_escalated"],
  assigned: ["accepted", "under_review", "unresolved_escalated"],
  accepted: ["in_progress", "unresolved_escalated"],
  in_progress: ["closed", "unresolved_escalated"],
  unresolved_escalated: ["assigned", "closed"],
  closed: [],
};

const STATUS_LABELS: Record<CaseStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  assigned: "Assigned (Notified)",
  accepted: "Accepted (Confirmed)",
  in_progress: "In Progress",
  closed: "Closed",
  unresolved_escalated: "Unresolved / Escalated",
};

export function AdminDashboard({
  adminName,
  incidents,
  responders,
  profiles,
  auditLogs,
}: AdminDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  // Responder add/edit dialog state
  const [responderDialogOpen, setResponderDialogOpen] = useState(false);
  const [editingResponder, setEditingResponder] =
    useState<AdminResponderRow | null>(null);
  const [orgName, setOrgName] = useState("");
  const [orgCategory, setOrgCategory] = useState<EmergencyCategory>("human");
  const [orgContact, setOrgContact] = useState("");
  const [orgLat, setOrgLat] = useState("12.9716");
  const [orgLng, setOrgLng] = useState("77.5946");
  const [orgRadius, setOrgRadius] = useState("12000");

  // Audit log filters
  const [actorFilter, setActorFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const pendingCount = incidents.filter(
    (i) => i.status === "submitted" || i.status === "under_review",
  ).length;
  const activeCount = incidents.filter(
    (i) => i.status === "accepted" || i.status === "in_progress",
  ).length;
  const verifiedResponders = responders.filter(
    (r) => r.verified && r.is_active,
  ).length;
  const routingLogs = auditLogs.filter(
    (log) =>
      log.action === "routing_matched" || log.action === "routing_no_match",
  );

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (
      actorFilter &&
      !(log.actor_id ?? "").toLowerCase().includes(actorFilter.toLowerCase())
    ) {
      return false;
    }
    if (
      actionFilter &&
      !log.action.toLowerCase().includes(actionFilter.toLowerCase())
    ) {
      return false;
    }
    if (dateFilter && !log.created_at.startsWith(dateFilter)) {
      return false;
    }
    return true;
  });

  function openAddResponder() {
    setEditingResponder(null);
    setOrgName("");
    setOrgCategory("human");
    setOrgContact("");
    setOrgLat("12.9716");
    setOrgLng("77.5946");
    setOrgRadius("12000");
    setResponderDialogOpen(true);
  }

  function openEditResponder(r: AdminResponderRow) {
    setEditingResponder(r);
    setOrgName(r.organisation_name);
    setOrgCategory(r.category);
    setOrgContact(r.contact_channel);
    setOrgRadius(String(r.radius_m ?? 12000));
    setResponderDialogOpen(true);
  }

  function handleSaveResponder() {
    startTransition(async () => {
      if (editingResponder) {
        const res = await updateResponderAction({
          responderId: editingResponder.id,
          organisationName: orgName,
          category: orgCategory,
          contactChannel: orgContact,
          radiusM: Number(orgRadius) || 12000,
        });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success("Responder updated.");
      } else {
        const res = await createResponderAction({
          organisationName: orgName,
          category: orgCategory,
          contactChannel: orgContact,
          latitude: Number(orgLat),
          longitude: Number(orgLng),
          radiusM: Number(orgRadius) || 12000,
        });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success("Responder added.");
      }
      setResponderDialogOpen(false);
      router.refresh();
    });
  }

  function handleRoleChange(userId: string, newRole: UserRole) {
    startTransition(async () => {
      const res = await updateUserRoleAction({ targetUserId: userId, newRole });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Role updated to ${newRole}.`);
      router.refresh();
    });
  }

  async function handleTransition(incidentId: string, toStatus: CaseStatus) {
    setBusyId(incidentId);
    try {
      const supabase = createClient();
      const note = notesById[incidentId]?.trim() || null;

      const { error } = await supabase.rpc("transition_case_status", {
        p_incident_id: incidentId,
        p_to: toStatus,
        p_note: note ?? undefined,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`Transitioned case to ${STATUS_LABELS[toStatus]}.`);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to transition status.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleResponder(
    responder: AdminResponderRow,
    field: "verified" | "is_active",
  ) {
    setBusyId(responder.id);
    try {
      const supabase = createClient();
      const patch =
        field === "verified"
          ? {
              verified: !responder.verified,
              last_verified_at: !responder.verified
                ? new Date().toISOString()
                : null,
            }
          : { is_active: !responder.is_active };

      const { error } = await supabase
        .from("responders")
        .update(patch)
        .eq("id", responder.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`Updated ${responder.organisation_name}.`);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update responder.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="space-y-12 py-10"
    >
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-wrap items-end justify-between gap-4 border-b border-border-default pb-6"
      >
        <div className="space-y-1.5">
          <h1 className="text-h1 font-bold tracking-tight text-strong">
            Operations Admin Panel
          </h1>
          <p className="text-body-lg text-muted-ink">
            Signed in as {adminName}. Status updates invoke{" "}
            <code className="font-mono text-caption text-strong">
              transition_case_status
            </code>{" "}
            and log to <code className="font-mono text-caption text-strong">status_history</code>.
          </p>
        </div>
      </motion.div>

      {/* Summary metrics */}
      <motion.section
        variants={fadeUp}
        aria-label="Operations summary"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="rounded-lg bg-surface p-5 shadow-layered-sm">
          <p className="text-caption font-medium text-muted-ink">Total Incidents</p>
          <p className="mt-1 font-mono text-h2 font-bold tabular-nums text-strong">
            {incidents.length}
          </p>
        </div>
        <div className="rounded-lg bg-surface p-5 shadow-layered-sm">
          <p className="text-caption font-medium text-muted-ink">Awaiting Dispatch</p>
          <p className="mt-1 font-mono text-h2 font-bold tabular-nums text-accent-primary">
            {pendingCount}
          </p>
        </div>
        <div className="rounded-lg bg-surface p-5 shadow-layered-sm">
          <p className="text-caption font-medium text-muted-ink">Accepted / In Progress</p>
          <p className="mt-1 font-mono text-h2 font-bold tabular-nums text-success">
            {activeCount}
          </p>
        </div>
        <div className="rounded-lg bg-surface p-5 shadow-layered-sm">
          <p className="text-caption font-medium text-muted-ink">Active Verified Responders</p>
          <p className="mt-1 font-mono text-h2 font-bold tabular-nums text-strong">
            {verifiedResponders}
          </p>
        </div>
      </motion.section>

      {/* Incidents Queue */}
      <motion.section
        variants={fadeUp}
        aria-labelledby="admin-incidents-heading"
        className="space-y-4"
      >
        <h2
          id="admin-incidents-heading"
          className="text-h2 font-bold tracking-tight text-strong"
        >
          Incident Status Transitions
        </h2>

        {incidents.length === 0 ? (
          <div className="rounded-lg bg-surface p-6 text-body text-muted-ink shadow-layered-sm">
            No incidents recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {incidents.map((incident) => {
              const nextOptions = VALID_NEXT_STATUSES[incident.status];
              const isBusy = busyId === incident.id;

              return (
                <div
                  key={incident.id}
                  className="rounded-lg bg-surface p-5 shadow-layered-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-body font-bold tabular-nums text-strong">
                          {incident.reference}
                        </span>
                        <Badge variant="outline">
                          {STATUS_LABELS[incident.status]}
                        </Badge>
                        <Badge variant="secondary">{incident.category}</Badge>
                        {incident.ai_suggested_priority ? (
                          <Badge className="bg-info-soft text-info">
                            AI-suggested: {incident.ai_suggested_priority}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-body text-muted-ink">
                        {incident.description}
                      </p>
                      {incident.location_text ? (
                        <p className="text-caption text-subtle-ink">
                          Location: {incident.location_text}
                        </p>
                      ) : null}
                    </div>

                    {nextOptions.length > 0 ? (
                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[280px]">
                        <Input
                          type="text"
                          placeholder="Transition note (optional)"
                          value={notesById[incident.id] ?? ""}
                          onChange={(e) =>
                            setNotesById((prev) => ({
                              ...prev,
                              [incident.id]: e.target.value,
                            }))
                          }
                          className="min-h-[40px]"
                        />
                        <div className="flex flex-wrap gap-2">
                          {nextOptions.map((targetStatus) => (
                            <Button
                              key={targetStatus}
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() =>
                                handleTransition(incident.id, targetStatus)
                              }
                              className="min-h-[40px]"
                            >
                              Move to {STATUS_LABELS[targetStatus]}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.section>

      {/* Responders Management */}
      <motion.section
        variants={fadeUp}
        aria-labelledby="admin-responders-heading"
        className="space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="admin-responders-heading"
            className="text-h2 font-bold tracking-tight text-strong"
          >
            Responders Directory
          </h2>
          <Button
            type="button"
            onClick={openAddResponder}
            className="min-h-[44px] bg-strong text-surface hover:bg-strong/90"
          >
            <Plus className="mr-2 size-4" aria-hidden="true" />
            Add Responder
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {responders.map((responder) => {
            const isBusy = busyId === responder.id;
            return (
              <div
                key={responder.id}
                className="flex flex-col justify-between gap-4 rounded-lg bg-surface p-5 shadow-layered-sm"
              >
                <div className="space-y-1.5">
                  <h3 className="text-body-lg font-semibold text-strong">
                    {responder.organisation_name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{responder.category}</Badge>
                    <Badge
                      variant="outline"
                      className={
                        responder.verified
                          ? "border-success-border bg-success-soft text-success"
                          : "border-warning-border bg-warning-soft text-warning"
                      }
                    >
                      {responder.verified ? "Verified" : "Unverified"}
                    </Badge>
                    <Badge variant="outline">
                      {responder.is_active ? "Active" : "Deactivated"}
                    </Badge>
                  </div>
                  <p className="font-mono text-caption text-muted-ink">
                    {responder.contact_channel}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => openEditResponder(responder)}
                    className="min-h-[40px]"
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => handleToggleResponder(responder, "verified")}
                    className="min-h-[40px]"
                  >
                    {responder.verified ? "Revoke Verify" : "Verify"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => handleToggleResponder(responder, "is_active")}
                    className="min-h-[40px]"
                  >
                    {responder.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Role Management */}
      <motion.section
        variants={fadeUp}
        aria-labelledby="admin-roles-heading"
        className="space-y-4"
      >
        <h2
          id="admin-roles-heading"
          className="text-h2 font-bold tracking-tight text-strong"
        >
          User Role Management
        </h2>

        <div className="overflow-x-auto rounded-lg bg-surface shadow-layered-sm">
          <table className="w-full text-left text-caption">
            <thead className="border-b border-border-default bg-surface-subtle text-strong">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">User ID</th>
                <th className="px-4 py-3 font-semibold">Current Role</th>
                <th className="px-4 py-3 font-semibold">Promote / Demote</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {profiles.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium text-strong">
                    {user.full_name ?? "Unnamed user"}
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-ink">
                    {user.id}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(["reporter", "responder", "admin"] as const).map(
                        (roleOpt) => (
                          <Button
                            key={roleOpt}
                            type="button"
                            size="sm"
                            variant={user.role === roleOpt ? "default" : "outline"}
                            disabled={isPending || user.role === roleOpt}
                            onClick={() => handleRoleChange(user.id, roleOpt)}
                            className="min-h-[36px]"
                          >
                            {roleOpt}
                          </Button>
                        ),
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* Routing Log */}
      <motion.section
        variants={fadeUp}
        aria-labelledby="admin-routing-heading"
        className="space-y-4"
      >
        <h2
          id="admin-routing-heading"
          className="text-h2 font-bold tracking-tight text-strong"
        >
          Routing Log
        </h2>

        {routingLogs.length === 0 ? (
          <div className="rounded-lg bg-surface p-6 text-body text-muted-ink shadow-layered-sm">
            No routing decisions recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {routingLogs.map((log) => {
              const meta = (log.metadata ?? {}) as {
                reference?: string;
                category?: string;
                basis?: string;
                reason?: string;
                matches?: Array<{
                  organisationName: string;
                  category: string;
                  distanceM: number;
                }>;
              };

              return (
                <div
                  key={log.id}
                  className="space-y-2 rounded-lg bg-surface p-5 shadow-layered-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-body font-bold text-strong">
                        {meta.reference ?? log.entity_id}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          log.action === "routing_matched"
                            ? "border-success-border bg-success-soft text-success"
                            : "border-warning-border bg-warning-soft text-warning"
                        }
                      >
                        {log.action === "routing_matched"
                          ? "Matched"
                          : "No Match"}
                      </Badge>
                      {meta.category ? (
                        <Badge variant="secondary">{meta.category}</Badge>
                      ) : null}
                    </div>
                    <span className="text-caption text-subtle-ink">
                      <ClientTimestamp iso={log.created_at} />
                    </span>
                  </div>

                  <p className="text-caption text-muted-ink">
                    {meta.basis ?? meta.reason ?? "Routing evaluated."}
                  </p>

                  {meta.matches && meta.matches.length > 0 ? (
                    <ul className="flex flex-wrap gap-2 pt-1">
                      {meta.matches.map((m, idx) => (
                        <li
                          key={`${log.id}-${idx}`}
                          className="rounded-md bg-surface-subtle px-3 py-1.5 text-caption text-strong"
                        >
                          {m.organisationName} ({(m.distanceM / 1000).toFixed(1)} km)
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </motion.section>

      {/* Filterable Audit Logs */}
      <motion.section
        variants={fadeUp}
        aria-labelledby="admin-audit-heading"
        className="space-y-4"
      >
        <h2
          id="admin-audit-heading"
          className="text-h2 font-bold tracking-tight text-strong"
        >
          Audit Log Viewer
        </h2>

        <div className="grid gap-3 rounded-lg bg-surface p-4 shadow-layered-sm sm:grid-cols-3">
          <Input
            type="text"
            placeholder="Filter by actor UUID..."
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="min-h-[44px]"
          />
          <Input
            type="text"
            placeholder="Filter by action (e.g. status_transition)..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="min-h-[44px]"
          />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="min-h-[44px]"
          />
        </div>

        {filteredAuditLogs.length === 0 ? (
          <div className="rounded-lg bg-surface p-6 text-body text-muted-ink shadow-layered-sm">
            No audit entries match these filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg bg-surface shadow-layered-sm">
            <table className="w-full text-left text-caption">
              <thead className="border-b border-border-default bg-surface-subtle text-strong">
                <tr>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Actor</th>
                  <th className="px-4 py-3 font-semibold">Entity</th>
                  <th className="px-4 py-3 font-semibold">Entity ID</th>
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {filteredAuditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 font-mono text-strong">{log.action}</td>
                    <td className="px-4 py-3 font-mono text-muted-ink">
                      {log.actor_id ?? "system"}
                    </td>
                    <td className="px-4 py-3 text-muted-ink">{log.entity}</td>
                    <td className="px-4 py-3 font-mono text-muted-ink">{log.entity_id}</td>
                    <td className="px-4 py-3 text-subtle-ink">
                      <ClientTimestamp iso={log.created_at} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

      {/* Add / Edit Responder Dialog */}
      <Dialog open={responderDialogOpen} onOpenChange={setResponderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingResponder ? "Edit Responder" : "Add Verified Responder"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="resp-org">Organisation Name</Label>
              <Input
                id="resp-org"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="City Trauma Desk"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resp-cat">Category</Label>
              <select
                id="resp-cat"
                value={orgCategory}
                onChange={(e) =>
                  setOrgCategory(e.target.value as EmergencyCategory)
                }
                className="flex min-h-[44px] w-full rounded-md border border-border-strong bg-surface px-3 text-body"
              >
                <option value="human">human</option>
                <option value="animal_bird">animal_bird</option>
                <option value="fire_rescue">fire_rescue</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resp-contact">Contact Channel</Label>
              <Input
                id="resp-contact"
                value={orgContact}
                onChange={(e) => setOrgContact(e.target.value)}
                placeholder="tel:+9180..."
              />
            </div>

            {!editingResponder ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="resp-lat">Latitude</Label>
                  <Input
                    id="resp-lat"
                    value={orgLat}
                    onChange={(e) => setOrgLat(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="resp-lng">Longitude</Label>
                  <Input
                    id="resp-lng"
                    value={orgLng}
                    onChange={(e) => setOrgLng(e.target.value)}
                  />
                </div>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="resp-radius">Service Radius (meters)</Label>
              <Input
                id="resp-radius"
                type="number"
                value={orgRadius}
                onChange={(e) => setOrgRadius(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setResponderDialogOpen(false)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={handleSaveResponder}
              className="min-h-[44px] bg-strong text-surface hover:bg-strong/90"
            >
              {editingResponder ? "Save Changes" : "Create Responder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

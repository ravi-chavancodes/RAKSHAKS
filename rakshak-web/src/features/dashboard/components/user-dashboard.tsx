"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, PlusCircle } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserProfile } from "@/lib/auth/get-current-profile";
import { copy } from "@/lib/copy";
import { fadeUp, stagger } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import {
  profileUpdateSchema,
  type ProfileUpdateValues,
} from "../schemas/profile-schema";
import type {
  CaseStatus,
  DashboardIncident,
  DashboardStatusEntry,
} from "../types";

interface UserDashboardProps {
  profile: UserProfile;
  incidents: readonly DashboardIncident[];
  history: readonly DashboardStatusEntry[];
}

const STATUS_LABELS: Record<CaseStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  assigned: "Assigned (Responder Notified)",
  accepted: "Accepted (Responder Confirmed)",
  in_progress: "In Progress",
  closed: "Closed",
  unresolved_escalated: "Unresolved / Escalated",
};

const STATUS_BADGE_CLASSES: Record<CaseStatus, string> = {
  submitted: "bg-info-soft text-info border-info-border",
  under_review: "bg-warning-soft text-warning border-warning-border",
  assigned: "bg-warning-soft text-warning border-warning-border",
  accepted: "bg-success-soft text-success border-success-border",
  in_progress: "bg-success-soft text-success border-success-border",
  closed: "bg-surface-subtle text-muted-ink border-border-default",
  unresolved_escalated: "bg-danger-soft text-danger border-danger-border",
};

export function UserDashboard({
  profile,
  incidents,
  history,
}: UserDashboardProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileUpdateValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      fullName: profile.full_name ?? "",
      phone: profile.phone ?? "",
    },
  });

  async function onSaveProfile(values: ProfileUpdateValues) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: values.fullName,
          phone: values.phone ? values.phone : null,
        })
        .eq("id", profile.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(copy.routes.dashboard.profileSaved);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not update profile.",
      );
    }
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="space-y-10 py-10"
    >
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-wrap items-end justify-between gap-4 border-b border-border-default pb-6"
      >
        <div className="space-y-1.5">
          <h1 className="text-h1 font-bold tracking-tight text-strong">
            {copy.routes.dashboard.title}
          </h1>
          <p className="text-body-lg text-muted-ink">
            {copy.routes.dashboard.subtitle}
          </p>
        </div>

        <Link
          href="/report"
          className="inline-flex min-h-[48px] items-center gap-2 rounded-md bg-accent-primary px-5 py-2.5 text-body font-semibold text-accent-primary-foreground transition-colors hover:bg-accent-primary-hover"
        >
          <PlusCircle className="size-4" aria-hidden="true" />
          <span>{copy.routes.dashboard.newSosButton}</span>
        </Link>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left: User profile form */}
        <motion.section
          variants={fadeUp}
          aria-labelledby="user-profile-heading"
          className="rounded-lg bg-surface p-6 shadow-layered-sm lg:col-span-4"
        >
          <div className="flex items-center justify-between gap-2 pb-4">
            <h2
              id="user-profile-heading"
              className="text-body-lg font-semibold text-strong"
            >
              {copy.routes.dashboard.profileHeading}
            </h2>
            <Badge variant="secondary" className="font-mono text-caption">
              {profile.role}
            </Badge>
          </div>

          <form
            onSubmit={handleSubmit(onSaveProfile)}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="profile-fullname" className="text-caption font-medium text-strong">
                {copy.routes.dashboard.fullNameLabel}
              </Label>
              <Input
                id="profile-fullname"
                type="text"
                className="min-h-[44px]"
                aria-invalid={Boolean(errors.fullName)}
                {...register("fullName")}
              />
              {errors.fullName ? (
                <p role="alert" className="text-caption text-danger">
                  {errors.fullName.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-phone" className="text-caption font-medium text-strong">
                {copy.routes.dashboard.phoneLabel}
              </Label>
              <Input
                id="profile-phone"
                type="tel"
                placeholder="+91 98..."
                className="min-h-[44px]"
                aria-invalid={Boolean(errors.phone)}
                {...register("phone")}
              />
              {errors.phone ? (
                <p role="alert" className="text-caption text-danger">
                  {errors.phone.message}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] w-full bg-strong text-surface hover:bg-strong/90"
            >
              {isSubmitting
                ? copy.routes.dashboard.savingProfile
                : copy.routes.dashboard.saveProfile}
            </Button>
          </form>
        </motion.section>

        {/* Right: Submitted cases + status history */}
        <motion.section
          variants={fadeUp}
          aria-labelledby="my-cases-heading"
          className="space-y-4 lg:col-span-8"
        >
          <div className="space-y-1">
            <h2
              id="my-cases-heading"
              className="text-h2 font-bold tracking-tight text-strong"
            >
              {copy.routes.dashboard.incidentsHeading}
            </h2>
            <p className="text-caption text-muted-ink">
              {copy.routes.dashboard.statusLegend}
            </p>
          </div>

          {incidents.length === 0 ? (
            <div className="rounded-lg bg-surface p-8 text-body text-muted-ink shadow-layered-sm">
              {copy.routes.dashboard.incidentsEmpty}
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map((incident) => {
                const latestNote = history.find(
                  (entry) => entry.incident_id === incident.id,
                );
                return (
                  <article
                    key={incident.id}
                    className="rounded-lg bg-surface p-5 shadow-layered-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-body font-bold tabular-nums text-strong">
                            {incident.reference}
                          </span>
                          <Badge
                            variant="outline"
                            className={STATUS_BADGE_CLASSES[incident.status]}
                          >
                            {STATUS_LABELS[incident.status]}
                          </Badge>
                          <Badge variant="secondary" className="text-caption">
                            {incident.category}
                          </Badge>
                        </div>
                        <p className="text-body text-muted-ink">
                          {incident.description}
                        </p>
                        {incident.location_text ? (
                          <p className="text-caption text-subtle-ink">
                            Location: {incident.location_text}
                          </p>
                        ) : null}
                        {latestNote?.note ? (
                          <p className="text-caption text-muted-ink">
                            Latest update: {latestNote.note}
                          </p>
                        ) : null}
                      </div>

                      <Link
                        href={`/track/${incident.reference}`}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-border-strong px-3.5 text-caption font-semibold text-strong transition-colors hover:bg-surface-subtle"
                      >
                        <span>{copy.routes.dashboard.trackAction}</span>
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </motion.section>
      </div>
    </motion.div>
  );
}

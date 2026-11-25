"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Flame,
  HeartPulse,
  MapPin,
  PawPrint,
  Phone,
  ShieldAlert,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import {
  clearDraftLocally,
  loadDraftLocally,
  saveDraftLocally,
} from "../lib/draft-storage";
import { detailsStepSchema } from "../schemas/report-schema";
import type {
  AudioPermissionState,
  EmergencyCategory,
  ReportDraft,
  ReportingMode,
  SubmissionResult,
} from "../types";
import { AudioRecorder } from "./audio-recorder";
import { LocationMap } from "./location-map";

interface ReportWizardProps {
  initialMode: ReportingMode;
}

function createEmptyDraft(mode: ReportingMode): ReportDraft {
  return {
    clientRequestId: crypto.randomUUID(),
    reportingMode: mode,
    category: null,
    description: "",
    contactName: "",
    contactPhone: "",
    locationMode: "unasked",
    latitude: null,
    longitude: null,
    locationAccuracyM: null,
    locationText: "",
    locationIsApproximate: mode === "third_person",
    audioPermissionState: "not_asked",
    audioDurationMs: null,
  };
}

const CATEGORY_CARDS: readonly {
  id: EmergencyCategory;
  title: string;
  desc: string;
  icon: typeof HeartPulse;
}[] = [
  {
    id: "human",
    title: copy.routes.report.step2.categories.human.title,
    desc: copy.routes.report.step2.categories.human.desc,
    icon: HeartPulse,
  },
  {
    id: "animal_bird",
    title: copy.routes.report.step2.categories.animal_bird.title,
    desc: copy.routes.report.step2.categories.animal_bird.desc,
    icon: PawPrint,
  },
  {
    id: "fire_rescue",
    title: copy.routes.report.step2.categories.fire_rescue.title,
    desc: copy.routes.report.step2.categories.fire_rescue.desc,
    icon: Flame,
  },
];

export function ReportWizard({ initialMode }: ReportWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [draft, setDraft] = useState<ReportDraft>(() =>
    createEmptyDraft(initialMode),
  );
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<SubmissionResult | null>(null);

  useEffect(() => {
    void loadDraftLocally().then((saved) => {
      if (saved) {
        setDraft(saved);
      }
    });
  }, []);

  function updateDraft(patch: Partial<ReportDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function handleSelectMode(mode: ReportingMode) {
    updateDraft({
      reportingMode: mode,
      locationIsApproximate: mode === "third_person",
    });
    setStep(2);
  }

  function handleDetailsNext() {
    const parsed = detailsStepSchema.safeParse({
      description: draft.description,
      contactName: draft.contactName,
      contactPhone: draft.contactPhone,
    });

    if (!parsed.success) {
      setDetailsError(
        parsed.error.issues[0]?.message ?? "Please complete the required details.",
      );
      return;
    }

    setDetailsError(null);
    setStep(4);
  }

  function requestGpsLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsError("GPS is not supported on this browser. Enter location manually.");
      updateDraft({ locationMode: "manual" });
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false);
        updateDraft({
          locationMode: "gps",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          locationAccuracyM: Math.round(position.coords.accuracy),
          locationIsApproximate: draft.reportingMode === "third_person",
        });
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied. Enter a street address or nearby landmark below."
            : "Could not read GPS coordinates. Enter a street address or nearby landmark below.",
        );
        updateDraft({
          locationMode: "manual",
          latitude: null,
          longitude: null,
          locationAccuracyM: null,
        });
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  }

  const canProceedLocation =
    (draft.locationMode === "gps" &&
      draft.latitude !== null &&
      draft.longitude !== null) ||
    draft.locationText.trim().length >= 3;

  async function handleSubmit() {
    if (isSubmitting || !draft.category) return;

    setIsSubmitting(true);
    setNetworkError(null);

    try {
      const formData = new FormData();
      formData.append("clientRequestId", draft.clientRequestId);
      formData.append("reportingMode", draft.reportingMode);
      formData.append("category", draft.category);
      formData.append("description", draft.description.trim());
      if (draft.contactName.trim()) {
        formData.append("contactName", draft.contactName.trim());
      }
      if (draft.contactPhone.trim()) {
        formData.append("contactPhone", draft.contactPhone.trim());
      }
      if (draft.latitude !== null && draft.longitude !== null) {
        formData.append("latitude", String(draft.latitude));
        formData.append("longitude", String(draft.longitude));
      }
      if (draft.locationAccuracyM !== null) {
        formData.append("locationAccuracyM", String(draft.locationAccuracyM));
      }
      if (draft.locationText.trim()) {
        formData.append("locationText", draft.locationText.trim());
      }
      formData.append(
        "locationIsApproximate",
        String(draft.locationIsApproximate),
      );
      if (draft.audioDurationMs !== null) {
        formData.append("audioDurationMs", String(draft.audioDurationMs));
      }
      formData.append("audioPermissionState", draft.audioPermissionState);
      if (audioBlob) {
        formData.append("audioFile", audioBlob, "sos-note.webm");
      }

      const response = await fetch("/api/incidents", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as
        | { ok: true; data: SubmissionResult }
        | { ok: false; error: string };

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.ok ? "Submission failed." : payload.error,
        );
      }

      await clearDraftLocally();
      setSubmission(payload.data);
    } catch {
      await saveDraftLocally(draft);
      setNetworkError(copy.routes.report.step6.networkErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyReference(reference: string) {
    try {
      await navigator.clipboard.writeText(reference);
      toast.success(copy.routes.report.success.copiedToast);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  }

  function startNewReport() {
    setSubmission(null);
    setAudioBlob(null);
    setNetworkError(null);
    setGpsError(null);
    setDetailsError(null);
    setDraft(createEmptyDraft("self"));
    setStep(1);
  }

  if (submission) {
    return (
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-2xl space-y-6 rounded-lg bg-surface p-6 shadow-layered-sm sm:p-8">
          <div className="inline-flex size-12 items-center justify-center rounded-md bg-success-soft text-success">
            <CheckCircle2 className="size-7" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <h1 className="text-h1 font-bold tracking-tight text-strong">
              {copy.routes.report.success.title}
            </h1>
            <p className="text-caption font-medium text-muted-ink">
              {copy.routes.report.success.referenceLabel}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-surface-subtle px-4 py-2 font-mono text-h2 font-bold tabular-nums text-strong">
                {submission.reference}
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={() => copyReference(submission.reference)}
                className="min-h-[44px]"
              >
                <Copy className="mr-2 size-4" aria-hidden="true" />
                {copy.routes.report.success.copyButton}
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-accent-border bg-accent-soft p-4 space-y-3">
            <p className="text-caption font-medium leading-relaxed text-strong">
              {copy.routes.report.success.disclaimer}
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

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={`/track/${submission.reference}`}
              className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-strong px-5 py-2.5 text-body font-semibold text-surface transition-colors hover:bg-strong/90"
            >
              {copy.routes.report.success.trackButton}
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={startNewReport}
              className="min-h-[48px]"
            >
              {copy.routes.report.success.submitAnother}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Top SOS bar with progress & emergency reminder */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-h2 font-bold tracking-tight text-strong">
              {copy.routes.report.title}
            </h1>
            <p className="text-caption font-medium text-muted-ink">
              {copy.routes.report.stepLabel} {step} {copy.routes.report.ofLabel} 6
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

        {/* Step container */}
        <div className="rounded-lg bg-surface p-6 shadow-layered-sm sm:p-8">
          {/* STEP 1: Reporting Mode */}
          {step === 1 ? (
            <div className="space-y-5">
              <h2 className="text-h2 font-bold text-strong">
                {copy.routes.report.step1.heading}
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleSelectMode("self")}
                  className={cn(
                    "flex min-h-[128px] flex-col items-start justify-between rounded-lg border p-5 text-left transition-colors",
                    draft.reportingMode === "self"
                      ? "border-accent-primary bg-accent-soft"
                      : "border-border-default bg-surface hover:bg-surface-subtle",
                  )}
                >
                  <User className="size-6 text-accent-primary" aria-hidden="true" />
                  <div className="space-y-1 pt-3">
                    <div className="text-body-lg font-semibold text-strong">
                      {copy.routes.report.step1.selfTitle}
                    </div>
                    <p className="text-caption text-muted-ink">
                      {copy.routes.report.step1.selfDesc}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectMode("third_person")}
                  className={cn(
                    "flex min-h-[128px] flex-col items-start justify-between rounded-lg border p-5 text-left transition-colors",
                    draft.reportingMode === "third_person"
                      ? "border-accent-primary bg-accent-soft"
                      : "border-border-default bg-surface hover:bg-surface-subtle",
                  )}
                >
                  <Users className="size-6 text-strong" aria-hidden="true" />
                  <div className="space-y-1 pt-3">
                    <div className="text-body-lg font-semibold text-strong">
                      {copy.routes.report.step1.thirdPersonTitle}
                    </div>
                    <p className="text-caption text-muted-ink">
                      {copy.routes.report.step1.thirdPersonDesc}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : null}

          {/* STEP 2: Category */}
          {step === 2 ? (
            <div className="space-y-5">
              <div className="space-y-1">
                <h2 className="text-h2 font-bold text-strong">
                  {copy.routes.report.step2.heading}
                </h2>
                <p className="text-body text-muted-ink">
                  {copy.routes.report.step2.hint}
                </p>
              </div>

              <div className="space-y-3">
                {CATEGORY_CARDS.map((card) => {
                  const Icon = card.icon;
                  const isSelected = draft.category === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => updateDraft({ category: card.id })}
                      className={cn(
                        "flex min-h-[76px] w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors",
                        isSelected
                          ? "border-accent-primary bg-accent-soft"
                          : "border-border-default bg-surface hover:bg-surface-subtle",
                      )}
                    >
                      <Icon
                        className={cn(
                          "mt-0.5 size-6 shrink-0",
                          isSelected ? "text-accent-primary" : "text-strong",
                        )}
                        aria-hidden="true"
                      />
                      <div className="space-y-1">
                        <div className="text-body-lg font-semibold text-strong">
                          {card.title}
                        </div>
                        <p className="text-caption text-muted-ink">{card.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="min-h-[48px]"
                >
                  {copy.routes.report.backButton}
                </Button>
                <Button
                  type="button"
                  disabled={!draft.category}
                  onClick={() => setStep(3)}
                  className="min-h-[48px] bg-accent-primary px-6 text-accent-primary-foreground hover:bg-accent-primary-hover"
                >
                  {copy.routes.report.nextButton}
                </Button>
              </div>
            </div>
          ) : null}

          {/* STEP 3: Short Details */}
          {step === 3 ? (
            <div className="space-y-5">
              <h2 className="text-h2 font-bold text-strong">
                {copy.routes.report.step3.heading}
              </h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="sos-description" className="text-body font-medium text-strong">
                      {copy.routes.report.step3.descriptionLabel}
                    </Label>
                    <span className="font-mono text-caption tabular-nums text-subtle-ink">
                      {draft.description.length}/500
                    </span>
                  </div>
                  <Textarea
                    id="sos-description"
                    rows={4}
                    maxLength={500}
                    value={draft.description}
                    onChange={(e) =>
                      updateDraft({ description: e.target.value })
                    }
                    placeholder={copy.routes.report.step3.descriptionPlaceholder}
                    className="bg-surface text-body"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sos-name" className="text-caption font-medium text-strong">
                      {draft.reportingMode === "self"
                        ? copy.routes.report.step3.contactNameSelf
                        : copy.routes.report.step3.contactNameThird}
                    </Label>
                    <Input
                      id="sos-name"
                      type="text"
                      value={draft.contactName}
                      onChange={(e) =>
                        updateDraft({ contactName: e.target.value })
                      }
                      className="min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sos-phone" className="text-caption font-medium text-strong">
                      {draft.reportingMode === "self"
                        ? copy.routes.report.step3.contactPhoneSelf
                        : copy.routes.report.step3.contactPhoneThird}
                    </Label>
                    <Input
                      id="sos-phone"
                      type="tel"
                      value={draft.contactPhone}
                      onChange={(e) =>
                        updateDraft({ contactPhone: e.target.value })
                      }
                      className="min-h-[44px]"
                    />
                  </div>
                </div>

                {detailsError ? (
                  <p role="alert" className="text-caption text-danger">
                    {detailsError}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="min-h-[48px]"
                >
                  {copy.routes.report.backButton}
                </Button>
                <Button
                  type="button"
                  onClick={handleDetailsNext}
                  className="min-h-[48px] bg-accent-primary px-6 text-accent-primary-foreground hover:bg-accent-primary-hover"
                >
                  {copy.routes.report.nextButton}
                </Button>
              </div>
            </div>
          ) : null}

          {/* STEP 4: Location */}
          {step === 4 ? (
            <div className="space-y-5">
              <h2 className="text-h2 font-bold text-strong">
                {copy.routes.report.step4.heading}
              </h2>

              <p className="text-body leading-relaxed text-muted-ink">
                {copy.routes.report.step4.explanation}
              </p>

              {draft.reportingMode === "third_person" ? (
                <div className="rounded-md bg-surface-subtle p-3.5 text-caption text-muted-ink">
                  {copy.routes.report.step4.thirdPersonNote}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  disabled={gpsLoading}
                  onClick={requestGpsLocation}
                  className="min-h-[48px] bg-strong text-surface hover:bg-strong/90"
                >
                  <MapPin className="mr-2 size-4" aria-hidden="true" />
                  {gpsLoading
                    ? copy.routes.report.step4.requestingGps
                    : copy.routes.report.step4.allowGpsButton}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    updateDraft({
                      locationMode: "manual",
                      latitude: null,
                      longitude: null,
                      locationAccuracyM: null,
                    })
                  }
                  className="min-h-[48px]"
                >
                  {copy.routes.report.step4.useManualButton}
                </Button>
              </div>

              {gpsError ? (
                <div
                  role="alert"
                  className="rounded-md border border-warning-border bg-warning-soft p-3.5 text-caption text-warning"
                >
                  {gpsError}
                </div>
              ) : null}

              {draft.locationMode === "gps" &&
              draft.latitude !== null &&
              draft.longitude !== null ? (
                <div className="space-y-3">
                  <LocationMap
                    latitude={draft.latitude}
                    longitude={draft.longitude}
                    onCoordinatesChange={(lat, lng) =>
                      updateDraft({ latitude: lat, longitude: lng })
                    }
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-caption text-muted-ink">
                    <span>{copy.routes.report.step4.gpsConfirmedHint}</span>
                    <span className="font-mono tabular-nums text-strong">
                      {draft.latitude.toFixed(5)}, {draft.longitude.toFixed(5)}
                    </span>
                  </div>
                </div>
              ) : null}

              {draft.locationMode === "manual" ||
              draft.locationMode === "gps" ? (
                <div className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="sos-location-text" className="text-caption font-medium text-strong">
                      {copy.routes.report.step4.manualLabel}
                    </Label>
                    <Input
                      id="sos-location-text"
                      type="text"
                      value={draft.locationText}
                      onChange={(e) =>
                        updateDraft({ locationText: e.target.value })
                      }
                      placeholder={copy.routes.report.step4.manualPlaceholder}
                      className="min-h-[44px]"
                    />
                  </div>

                  <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-caption font-medium text-strong">
                    <input
                      type="checkbox"
                      checked={draft.locationIsApproximate}
                      onChange={(e) =>
                        updateDraft({ locationIsApproximate: e.target.checked })
                      }
                      className="size-4 accent-accent-primary"
                    />
                    <span>{copy.routes.report.step4.approximateLabel}</span>
                  </label>
                </div>
              ) : null}

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="min-h-[48px]"
                >
                  {copy.routes.report.backButton}
                </Button>
                <Button
                  type="button"
                  disabled={!canProceedLocation}
                  onClick={() => setStep(5)}
                  className="min-h-[48px] bg-accent-primary px-6 text-accent-primary-foreground hover:bg-accent-primary-hover"
                >
                  {copy.routes.report.nextButton}
                </Button>
              </div>
            </div>
          ) : null}

          {/* STEP 5: Optional 10s Audio */}
          {step === 5 ? (
            <div className="space-y-5">
              <h2 className="text-h2 font-bold text-strong">
                {copy.routes.report.step5.heading}
              </h2>

              <AudioRecorder
                permissionState={draft.audioPermissionState}
                audioBlob={audioBlob}
                onAudioCaptured={(blob, durationMs, permission) => {
                  setAudioBlob(blob);
                  updateDraft({
                    audioDurationMs: durationMs,
                    audioPermissionState: permission,
                  });
                }}
                onSkip={(permission: AudioPermissionState) => {
                  setAudioBlob(null);
                  updateDraft({
                    audioDurationMs: null,
                    audioPermissionState: permission,
                  });
                  setStep(6);
                }}
              />

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(4)}
                  className="min-h-[48px]"
                >
                  {copy.routes.report.backButton}
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(6)}
                  className="min-h-[48px] bg-accent-primary px-6 text-accent-primary-foreground hover:bg-accent-primary-hover"
                >
                  {copy.routes.report.nextButton}
                </Button>
              </div>
            </div>
          ) : null}

          {/* STEP 6: Review & Submit */}
          {step === 6 ? (
            <div className="space-y-5">
              <h2 className="text-h2 font-bold text-strong">
                {copy.routes.report.step6.heading}
              </h2>

              <dl className="divide-y divide-border-default rounded-md border border-border-default bg-surface-subtle/50 px-4">
                <div className="flex flex-wrap justify-between gap-2 py-3">
                  <dt className="text-caption font-medium text-muted-ink">
                    {copy.routes.report.step6.modeLabel}
                  </dt>
                  <dd className="text-body font-semibold text-strong">
                    {draft.reportingMode === "self"
                      ? copy.routes.report.step1.selfTitle
                      : copy.routes.report.step1.thirdPersonTitle}
                  </dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2 py-3">
                  <dt className="text-caption font-medium text-muted-ink">
                    {copy.routes.report.step6.categoryLabel}
                  </dt>
                  <dd className="text-body font-semibold text-strong">
                    <Badge variant="secondary">{draft.category}</Badge>
                  </dd>
                </div>
                <div className="space-y-1 py-3">
                  <dt className="text-caption font-medium text-muted-ink">
                    {copy.routes.report.step6.descriptionLabel}
                  </dt>
                  <dd className="text-body text-strong">{draft.description}</dd>
                </div>
                <div className="space-y-1 py-3">
                  <dt className="text-caption font-medium text-muted-ink">
                    {copy.routes.report.step6.locationLabel}
                  </dt>
                  <dd className="text-body text-strong">
                    {draft.latitude !== null && draft.longitude !== null ? (
                      <span className="font-mono text-caption tabular-nums">
                        {draft.latitude.toFixed(5)}, {draft.longitude.toFixed(5)}
                      </span>
                    ) : null}
                    {draft.locationText ? (
                      <span className="block text-body">{draft.locationText}</span>
                    ) : null}
                    {draft.locationIsApproximate ? (
                      <span className="text-caption text-muted-ink">
                        (Approximate location)
                      </span>
                    ) : null}
                  </dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2 py-3">
                  <dt className="text-caption font-medium text-muted-ink">
                    {copy.routes.report.step6.audioLabel}
                  </dt>
                  <dd className="text-body font-medium text-strong">
                    {audioBlob
                      ? copy.routes.report.step6.audioAttached
                      : copy.routes.report.step6.audioNone}
                  </dd>
                </div>
              </dl>

              {networkError ? (
                <div
                  role="alert"
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-danger-border bg-danger-soft p-4 text-caption text-danger"
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
                    <span>{networkError}</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="min-h-[40px]"
                  >
                    {copy.routes.report.step6.retryButton}
                  </Button>
                </div>
              ) : null}

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setStep(5)}
                  className="min-h-[48px]"
                >
                  {copy.routes.report.backButton}
                </Button>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="min-h-[48px] bg-accent-primary px-6 text-body font-semibold text-accent-primary-foreground hover:bg-accent-primary-hover"
                >
                  {isSubmitting
                    ? copy.routes.report.step6.submittingButton
                    : copy.routes.report.step6.submitButton}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

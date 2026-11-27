"use client";

import { Camera, CheckCircle2, MapPin, Radio, ShieldCheck, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

interface StoryPhoneHudProps {
  progress: number;
  variant?: "desktop" | "mobile";
}

export function StoryPhoneHud({
  progress,
  variant = "desktop",
}: StoryPhoneHudProps) {
  // Revealed strictly after helper visibly pulls phone out of pocket (p >= 0.45)
  const isVisible = progress >= 0.45 && progress <= 0.895;
  const stage =
    progress < 0.59
      ? "mode"
      : progress < 0.69
        ? "form"
        : progress < 0.8
          ? "submitted"
          : "accepted";

  if (variant === "mobile") {
    return (
      <div
        aria-hidden={!isVisible}
        className={cn(
          "pointer-events-none mx-auto w-full max-w-[360px] rounded-2xl border border-white/30 bg-surface/92 px-3.5 py-2.5 shadow-layered-lg backdrop-blur-md transition-all duration-300",
          isVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-red-600" />
            <span className="font-heading text-caption font-bold text-strong">
              RAKSHAK
            </span>
          </div>
          <span className="font-mono text-[10px] font-semibold text-muted-ink">
            {stage === "mode"
              ? "Step 1 · Select Mode"
              : stage === "form"
                ? "Photo + GPS"
                : "RK-20261127-8F2A"}
          </span>
        </div>
        <p className="mt-1 text-caption font-medium text-strong">
          {stage === "mode"
            ? "Someone else needs help · Locking GPS"
            : stage === "form"
              ? "Attached incident_scene.jpg · Sending SOS"
              : stage === "submitted"
                ? "Submitted · Responder notified"
                : "Accepted by Responder · Team on site"}
        </p>
      </div>
    );
  }

  return (
    <div
      aria-hidden={!isVisible}
      className={cn(
        "pointer-events-none relative hidden select-none transition-all duration-500 ease-out md:block",
        isVisible
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-8 scale-95 opacity-0",
      )}
    >
        <div className="absolute -left-[3px] top-24 h-6 w-[3px] rounded-l bg-zinc-600" />
        <div className="absolute -left-[3px] top-32 h-11 w-[3px] rounded-l bg-zinc-600" />
        <div className="absolute -left-[3px] top-44 h-11 w-[3px] rounded-l bg-zinc-600" />
        <div className="absolute -right-[3px] top-32 h-16 w-[3px] rounded-r bg-zinc-600" />

        <div className="aspect-[9/16] w-[252px] max-h-[74vh] rounded-[42px] bg-gradient-to-b from-zinc-600 via-zinc-800 to-zinc-900 p-[6px] shadow-[0_28px_60px_-14px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.3)]">
          <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[36px] border-[4px] border-zinc-950 bg-[#f7f5f0]">
            <div className="pointer-events-none absolute inset-0 z-30 bg-gradient-to-tr from-transparent via-white/5 to-white/20" />

            <div className="relative z-20 flex shrink-0 items-center justify-between bg-white px-4 pb-1.5 pt-2.5 text-[10px] font-semibold text-zinc-900">
              <span>9:41</span>
              <div className="flex h-[18px] w-[72px] items-center justify-end rounded-full bg-zinc-950 px-2 shadow-inner">
                <span className="size-2 rounded-full bg-indigo-950 ring-1 ring-zinc-700" />
              </div>
              <div className="flex items-center gap-1">
                <Wifi className="size-3 text-zinc-800" />
                <div className="flex h-2.5 w-4 items-center rounded-[3px] border border-zinc-800 p-[1px]">
                  <div className="h-full w-3/4 rounded-[1px] bg-emerald-600" />
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white px-4 py-2">
              <div className="flex items-center gap-1.5">
                <span className="inline-block size-2 rounded-full bg-red-600" />
                <span className="font-heading text-xs font-bold tracking-tight text-zinc-900">
                  RAKSHAK
                </span>
              </div>
              <span className="rounded-full bg-red-50 px-2 py-0.5 font-mono text-[9px] font-bold text-red-700">
                112 · 108 · 101
              </span>
            </div>

            <div className="flex flex-1 flex-col justify-between p-3.5 text-left">
              <div className="space-y-3">
                {stage === "mode" ? (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Step 1 · Emergency Mode
                    </p>
                    <div className="rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-500">
                      I need help
                    </div>
                    <div className="rounded-xl border-2 border-red-600 bg-red-50/75 p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900">
                          Someone else needs help
                        </span>
                        <span className="size-3.5 rounded-full border-4 border-red-600 bg-white" />
                      </div>
                      <p className="mt-1 text-[10.5px] leading-snug text-zinc-600">
                        Witnessed an accident at crossing
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5 text-[10.5px] font-medium text-zinc-700 shadow-2xs">
                      <MapPin className="size-3.5 shrink-0 text-red-600" />
                      <span>Acquiring live GPS location...</span>
                    </div>
                  </>
                ) : null}

                {stage === "form" ? (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Step 4 · Photo & Location
                    </p>
                    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xs">
                      <div className="relative flex h-28 items-end justify-between bg-gradient-to-b from-sky-300 via-slate-600 to-zinc-800 p-2.5">
                        <div className="flex items-center gap-1 rounded bg-black/55 px-1.5 py-0.5 text-[9.5px] font-medium text-white backdrop-blur-xs">
                          <Camera className="size-3 text-amber-300" />
                          <span>incident_scene.jpg</span>
                        </div>
                        <span className="rounded bg-emerald-600/90 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                          GPS Attached
                        </span>
                      </div>
                      <div className="space-y-1.5 p-2.5">
                        <p className="font-mono text-[10px] font-semibold text-zinc-600">
                          12.9716° N, 77.5946° E
                        </p>
                        <p className="text-[11px] leading-snug text-zinc-800">
                          &ldquo;Pedestrian struck near crosswalk, urgent ambulance needed.&rdquo;
                        </p>
                      </div>
                    </div>
                  </>
                ) : null}

                {stage === "submitted" ? (
                  <>
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="size-4" />
                      <span className="text-xs font-bold">Submitted · Confirmed</span>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 font-mono text-xs font-bold text-zinc-900 shadow-2xs">
                      RK-20261127-8F2A
                    </div>
                    <div className="space-y-2 rounded-xl border border-zinc-200/80 bg-white p-3 text-[11px] text-zinc-700">
                      <p className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-emerald-600" />
                        <span>Stored in backend</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-emerald-600" />
                        <span>Category: Human Emergency</span>
                      </p>
                      <p className="flex items-center gap-2 font-semibold text-amber-700">
                        <span className="size-1.5 rounded-full bg-amber-500" />
                        <span>Assigned (Responder notified)</span>
                      </p>
                    </div>
                  </>
                ) : null}

                {stage === "accepted" ? (
                  <>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[10.5px] font-bold text-emerald-800">
                      <ShieldCheck className="size-3.5" />
                      <span>Accepted by Responder</span>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 font-mono text-xs font-bold text-zinc-900 shadow-2xs">
                      RK-20261127-8F2A
                    </div>
                    <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3 text-[11px] leading-relaxed text-zinc-800">
                      <Radio className="mt-0.5 size-3.5 shrink-0 text-emerald-700" />
                      <span>
                        Medical responder accepted ownership. Ambulance team on site with stretcher.
                      </span>
                    </div>
                  </>
                ) : null}
              </div>

              {stage === "form" ? (
                <div className="rounded-xl bg-red-600 py-2.5 text-center text-xs font-bold text-white shadow-sm">
                  Send SOS Report
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-200/80 bg-white/80 px-3 py-2 text-center text-[10px] font-medium text-zinc-500">
                  RAKSHAK Coordination Aid
                </div>
              )}
            </div>

            <div className="flex shrink-0 justify-center bg-[#f7f5f0] pb-2 pt-1">
              <div className="h-1 w-24 rounded-full bg-zinc-900/25" />
            </div>
          </div>
        </div>
      </div>
  );
}

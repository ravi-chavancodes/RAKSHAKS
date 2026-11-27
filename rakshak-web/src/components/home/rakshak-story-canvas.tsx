"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, ShieldCheck } from "lucide-react";
import { useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "motion/react";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { StoryPhoneHud } from "./story-phone-hud";
import {
  clamp01,
  drawAmbulanceRearView,
  drawAmbulanceSideRear,
  drawEnvironmentBackdrop,
  drawImpactHitBurst,
  drawSedanFrontView,
  drawSedanQuarterView,
  drawStretcher,
  drawTrafficSignal,
  drawVectorPerson,
  lerp,
  remap,
  smoothstep,
  type PersonPose,
} from "./story-vector-art";

/** Multi-view camera framing splines (panX, panY, zoom) */
function sampleCameraView(p: number): { zoom: number; panX: number; panY: number } {
  const keys = [
    { p: 0.0, zoom: 1.0, panX: 0, panY: 0 },
    { p: 0.24, zoom: 1.0, panX: 0, panY: 0 },
    { p: 0.48, zoom: 1.28, panX: 72, panY: 20 },
    { p: 0.64, zoom: 1.24, panX: 54, panY: 16 },
    { p: 0.72, zoom: 1.0, panX: 0, panY: 0 },
    { p: 0.85, zoom: 1.04, panX: 0, panY: 6 },
    { p: 1.0, zoom: 1.0, panX: 0, panY: 0 },
  ];

  for (let i = 0; i < keys.length - 1; i++) {
    const k0 = keys[i];
    const k1 = keys[i + 1];
    if (p >= k0.p && p <= k1.p) {
      const t = smoothstep(remap(p, k0.p, k1.p));
      return {
        zoom: lerp(k0.zoom, k1.zoom, t),
        panX: lerp(k0.panX, k1.panX, t),
        panY: lerp(k0.panY, k1.panY, t),
      };
    }
  }
  return keys[keys.length - 1];
}

function renderIntersectionScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: number,
  timeSec: number,
) {
  const cam = sampleCameraView(p);
  const horizonY = h * 0.52;
  const roadGroundY = h * 0.78;
  const s = Math.min(w / 1280, h / 660) * 1.04;
  const isDeparture = p >= 0.895;
  const leaveT = smoothstep(remap(p, 0.905, 0.955));

  ctx.save();
  ctx.translate(w * 0.5 + cam.panX * s, h * 0.58 + cam.panY * s);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-w * 0.5, -h * 0.58);

  drawEnvironmentBackdrop(ctx, w, h, cam.panX * 0.6, horizonY, timeSec, false, p);
  drawTrafficSignal(ctx, w * 0.44, h * 0.65, s * 0.96, p >= 0.18 && !isDeparture);

  const slateLeaveX = isDeparture ? lerp(w * 0.67, w * 1.14, leaveT) : w * 0.67;
  drawVectorPerson(
    ctx,
    slateLeaveX,
    h * 0.642,
    s * 0.82,
    isDeparture,
    {
      shirt: "#64748b",
      shirtShade: "#475569",
      pants: "#1e293b",
      skin: "#d99b66",
      hair: "#292524",
    },
    isDeparture ? "walk" : p >= 0.23 ? "shock" : "idle",
    isDeparture ? leaveT : 0,
  );

  // 1. Blue SUV / Sedan drives in and hits upright crossing pedestrian at p = 0.225
  const driveIn = smoothstep(remap(p, 0.14, 0.235));
  const carX = lerp(w * 0.1, w * 0.42, driveIn);
  const impactOccurred = p >= 0.225;
  const smokeFade = impactOccurred ? 1 - smoothstep(remap(p, 0.72, 0.91)) : 0;
  drawSedanQuarterView(ctx, carX, roadGroundY - 14 * s, s * 1.08, {
    damaged: impactOccurred,
    smokeIntensity: smokeFade,
    hazardBlink: impactOccurred && Math.sin(timeSec * 8) > 0,
    timeSec,
  });

  // 2. Pedestrian walks upright onto crosswalk -> struck -> starburst "HIT!" -> knocked down ONLY AFTER impact!
  if (!isDeparture) {
    const walkToCrossT = smoothstep(remap(p, 0.16, 0.225));
    const knockDownT = smoothstep(remap(p, 0.235, 0.28));
    const vicX =
      p < 0.235
        ? lerp(w * 0.65, w * 0.555, walkToCrossT)
        : lerp(w * 0.555, w * 0.615, knockDownT);
    const vicY =
      p < 0.235
        ? roadGroundY + 26 * s
        : lerp(roadGroundY + 26 * s, roadGroundY + 38 * s, knockDownT);
    const vicPose: PersonPose =
      p >= 0.258 ? "fallen" : p >= 0.22 ? "shock" : "walk";

    drawVectorPerson(
      ctx,
      vicX,
      vicY,
      s * 1.0,
      false,
      {
        shirt: "#ea580c",
        shirtShade: "#c2410c",
        pants: "#334155",
        skin: "#d6945c",
        hair: "#1c1917",
      },
      vicPose,
      p < 0.22 ? walkToCrossT : 0,
    );

    const hitIn = smoothstep(remap(p, 0.22, 0.235));
    const hitOut = smoothstep(remap(p, 0.265, 0.295));
    const hitIntensity = Math.max(0, hitIn - hitOut);
    if (hitIntensity > 0.02) {
      drawImpactHitBurst(ctx, w * 0.55, roadGroundY - 46 * s, s * 1.15, hitIntensity);
    }
  }

  // 3. Ambulance driving NOSE-FIRST Left -> Right
  if (p >= 0.67) {
    const ambArriveT = smoothstep(remap(p, 0.67, 0.76));
    const ambDepartT = smoothstep(remap(p, 0.902, 0.955));
    const ambX = isDeparture
      ? lerp(w * 0.56, w * 1.38, ambDepartT)
      : lerp(-w * 0.26, w * 0.22, ambArriveT);
    const ambY = isDeparture ? roadGroundY + 14 * s : roadGroundY + 18 * s;

    drawAmbulanceSideRear(ctx, ambX, ambY, s * 1.12, {
      facingRight: true,
      doorOpenT: 0,
      strobeOn: true,
      timeSec,
    });
  }

  // 4. Right-side Bystander
  const bgWalkIn = smoothstep(remap(p, 0.22, 0.34));
  const skyBystanderX = isDeparture
    ? lerp(w * 0.76, w * 1.16, leaveT)
    : lerp(w * 0.96, w * 0.76, bgWalkIn);
  drawVectorPerson(
    ctx,
    skyBystanderX,
    roadGroundY + 28 * s,
    s * 1.05,
    isDeparture,
    {
      shirt: "#38bdf8",
      shirtShade: "#0284c7",
      pants: "#0f172a",
      skin: "#d6945c",
      hair: "#451a03",
    },
    isDeparture ? "walk" : impactOccurred ? "shock" : "idle",
    isDeparture ? leaveT : 0,
  );

  // 5. Hero Helper pulling phone from pocket, clicking photo & submitting SOS
  const walkUpT = smoothstep(remap(p, 0.28, 0.36));
  const clearAmbulanceT = smoothstep(remap(p, 0.67, 0.75));
  let helperX = lerp(w * 0.14, w * 0.28, walkUpT);
  if (p >= 0.67 && !isDeparture) {
    helperX = lerp(w * 0.28, w * 0.68, clearAmbulanceT);
  } else if (isDeparture) {
    helperX = lerp(w * 0.36, -w * 0.16, leaveT);
  }

  let helperPose: PersonPose = "idle";
  let helperAmount = 0;
  let flashGlow = 0;

  if (p >= 0.36 && p < 0.45) {
    helperPose = "reach-pocket";
    helperAmount = smoothstep(remap(p, 0.36, 0.445));
  } else if (p >= 0.45 && p < 0.525) {
    helperPose = "hold-phone";
    helperAmount = 1;
  } else if (p >= 0.525 && p < 0.595) {
    helperPose = "aim-photo";
    helperAmount = smoothstep(remap(p, 0.525, 0.555));
    const flashSin = Math.sin(remap(p, 0.545, 0.588) * Math.PI);
    flashGlow = flashSin > 0 ? flashSin * flashSin : 0;
  } else if (p >= 0.595 && p < 0.69) {
    helperPose = "hold-phone";
    helperAmount = 1;
  } else if (isDeparture) {
    helperPose = "walk";
    helperAmount = leaveT;
  }

  if (p >= 0.26 && helperX < w * 1.12) {
    drawVectorPerson(
      ctx,
      helperX,
      roadGroundY + 34 * s,
      s * 1.06,
      !isDeparture && p < 0.69,
      {
        shirt: "#f59e0b",
        shirtShade: "#d97706",
        pants: "#1e293b",
        skin: "#e0a978",
        hair: "#18181b",
      },
      helperPose,
      helperAmount,
      flashGlow,
    );
  }

  // 6. Over-the-shoulder foreground spectator
  const fgEnter = smoothstep(remap(p, 0.25, 0.34));
  if (p >= 0.24) {
    const fgX = isDeparture
      ? lerp(w * 0.1, -w * 0.22, leaveT)
      : lerp(-w * 0.08, w * 0.1, fgEnter) - cam.panX * 0.42;
    drawVectorPerson(
      ctx,
      fgX,
      h * 1.07,
      s * 1.54,
      !isDeparture,
      {
        shirt: "#fde047",
        shirtShade: "#eab308",
        pants: "#cbd5e1",
        skin: "#e9b88a",
        hair: "#18181b",
      },
      "back-foreground",
    );
  }

  ctx.restore();
}

function renderRearAmbulanceRescueScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  p: number,
  timeSec: number,
) {
  const horizonY = h * 0.52;
  const roadGroundY = h * 0.8;
  const s = Math.min(w / 1280, h / 660) * 1.05;

  drawEnvironmentBackdrop(ctx, w, h, 24, horizonY, timeSec, false, p);
  drawTrafficSignal(ctx, w * 0.72, h * 0.65, s * 0.8, true);

  drawVectorPerson(
    ctx,
    w * 0.67,
    h * 0.642,
    s * 0.8,
    false,
    {
      shirt: "#64748b",
      shirtShade: "#475569",
      pants: "#1e293b",
      skin: "#d99b66",
      hair: "#292524",
    },
    "idle",
  );

  drawSedanQuarterView(ctx, w * 0.78, roadGroundY - 36 * s, s * 0.76, {
    damaged: true,
    smokeIntensity: 0.45,
    hazardBlink: Math.sin(timeSec * 8) > 0,
    timeSec,
  });

  drawVectorPerson(
    ctx,
    w * 0.18,
    roadGroundY + 26 * s,
    s * 1.0,
    true,
    {
      shirt: "#f59e0b",
      shirtShade: "#d97706",
      pants: "#1e293b",
      skin: "#e0a978",
      hair: "#18181b",
    },
    "hold-phone",
    1,
  );

  drawVectorPerson(
    ctx,
    w * 0.72,
    roadGroundY + 28 * s,
    s * 0.98,
    false,
    {
      shirt: "#38bdf8",
      shirtShade: "#0284c7",
      pants: "#0f172a",
      skin: "#d6945c",
      hair: "#451a03",
    },
    "idle",
  );

  drawVectorPerson(
    ctx,
    w * 0.08,
    h * 1.07,
    s * 1.54,
    true,
    {
      shirt: "#fde047",
      shirtShade: "#eab308",
      pants: "#cbd5e1",
      skin: "#e9b88a",
      hair: "#18181b",
    },
    "back-foreground",
  );

  const doorOpenT = smoothstep(remap(p, 0.76, 0.795));
  const doorCloseT = smoothstep(remap(p, 0.885, 0.908));
  const doorT = Math.max(0, doorOpenT - doorCloseT);

  const ambX = w * 0.35;
  const ambY = roadGroundY + 18 * s;

  drawAmbulanceRearView(ctx, ambX, ambY, s * 1.18, {
    doorOpenT: doorT,
    strobeOn: true,
    timeSec,
  });

  const deployT = smoothstep(remap(p, 0.785, 0.82));
  const liftT = smoothstep(remap(p, 0.82, 0.855));
  const loadT = smoothstep(remap(p, 0.855, 0.892));

  const victimStartX = w * 0.6;
  const victimStartY = roadGroundY + 34 * s;
  const stDeployX = w * 0.52;
  const stBayX = ambX;
  const stBayY = ambY - 22 * s;

  const stX = p < 0.855 ? lerp(ambX, stDeployX, deployT) : lerp(stDeployX, stBayX, loadT);
  const stY =
    p < 0.855
      ? lerp(stBayY, victimStartY - 8 * s, deployT)
      : lerp(victimStartY - 8 * s, stBayY, loadT);
  const stScale = p < 0.855 ? lerp(0.84, 1.02, deployT) : lerp(1.02, 0.82, loadT);

  if (p >= 0.78 && loadT < 0.96) {
    drawStretcher(ctx, stX, stY, s * stScale);
  }

  if (loadT < 0.96) {
    let vicX = victimStartX;
    let vicY = victimStartY;
    let vicScale = 1.0;

    if (p >= 0.82 && p < 0.855) {
      const liftArc = Math.sin(liftT * Math.PI) * 28 * s;
      vicX = lerp(victimStartX, stDeployX, liftT);
      vicY = lerp(victimStartY, victimStartY - 46 * s, liftT) - liftArc;
      vicScale = lerp(1.0, 1.02, liftT);
    } else if (p >= 0.855) {
      vicX = stX;
      vicY = stY - 38 * s * stScale;
      vicScale = stScale;
    }

    drawVectorPerson(
      ctx,
      vicX,
      vicY,
      s * vicScale,
      false,
      {
        shirt: "#ea580c",
        shirtShade: "#c2410c",
        pants: "#334155",
        skin: "#d6945c",
        hair: "#1c1917",
      },
      "fallen",
    );
  }

  if (p >= 0.785 && loadT < 0.98) {
    const medPose: PersonPose =
      p >= 0.82 && p < 0.855 ? "bend-lift" : "paramedic-carry";
    const liftBend = p >= 0.82 && p < 0.855 ? Math.sin(liftT * Math.PI) : 0;

    const p1X = stX - 58 * s * stScale;
    const p2X = stX + 58 * s * stScale;
    const pY =
      p < 0.855
        ? lerp(ambY + 4 * s, victimStartY + 2 * s, deployT)
        : lerp(victimStartY + 2 * s, ambY + 4 * s, loadT);

    drawVectorPerson(
      ctx,
      p1X,
      pY,
      s * stScale,
      true,
      {
        shirt: "#0d9488",
        shirtShade: "#0f766e",
        pants: "#0f172a",
        skin: "#c68b59",
        hair: "#292524",
        vest: "#d0e957",
      },
      medPose,
      liftBend,
    );

    drawVectorPerson(
      ctx,
      p2X,
      pY,
      s * stScale,
      false,
      {
        shirt: "#0d9488",
        shirtShade: "#0f766e",
        pants: "#0f172a",
        skin: "#d6945c",
        hair: "#18181b",
        vest: "#d0e957",
      },
      medPose,
      liftBend,
    );
  }
}

/** Dynamic screen position classes for the 3 story captions (mobile-safe + balanced desktop placement) */
function getDynamicCaptionPlacement(captionId: number): string {
  if (captionId === 1) {
    return "left-4 right-4 top-16 sm:right-auto sm:left-6 sm:top-5";
  }
  if (captionId === 2) {
    return "left-4 right-4 top-16 sm:right-auto sm:left-10 sm:top-20";
  }
  return "left-4 right-4 top-16 sm:right-auto sm:left-1/2 sm:top-5 sm:-translate-x-1/2";
}

export function RakshakStoryCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetProgressRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Deliberate, controlled spring pacing so one full scroll gesture gently advances one scene beat
  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 58,
    damping: 24,
    mass: 0.9,
  });

  useMotionValueEvent(smoothScroll, "change", (latest) => {
    if (!prefersReducedMotion) {
      const clamped = clamp01(latest);
      targetProgressRef.current = clamped;
      setProgress(clamped);
    }
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let rafId = 0;

    const frame = (now: number) => {
      rafId = window.requestAnimationFrame(frame);
      const timeSec = now / 1000;
      const p = targetProgressRef.current;

      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      const horizonY = h * 0.56;

      ctx.clearRect(0, 0, w, h);

      const hwyToStreet = smoothstep(remap(p, 0.13, 0.18));
      const streetToRear = smoothstep(remap(p, 0.745, 0.775));
      const rearToDepart = smoothstep(remap(p, 0.892, 0.918));

      if (hwyToStreet < 0.99) {
        ctx.save();
        ctx.globalAlpha = 1 - hwyToStreet;
        drawEnvironmentBackdrop(ctx, w, h, 0, horizonY, timeSec, true, p);
        const approachT = smoothstep(remap(p, 0.0, 0.18));
        const carScale = lerp(0.86, 1.38, approachT) * Math.min(w / 1280, h / 660);
        drawSedanFrontView(ctx, w * 0.5, lerp(h * 0.74, h * 0.9, approachT), carScale);
        ctx.restore();
      }

      const rearWeight = streetToRear * (1 - rearToDepart);
      const intersectionWeight = hwyToStreet * (1 - rearWeight);

      if (intersectionWeight > 0.01) {
        ctx.save();
        ctx.globalAlpha = intersectionWeight;
        renderIntersectionScene(ctx, w, h, p, timeSec);
        ctx.restore();
      }

      if (rearWeight > 0.01) {
        ctx.save();
        ctx.globalAlpha = rearWeight;
        renderRearAmbulanceRescueScene(ctx, w, h, p, timeSec);
        ctx.restore();
      }
    };

    rafId = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const heroFadeProgress = remap(progress, 0.01, 0.12);
  const heroOpacity = Math.max(0, 1 - heroFadeProgress);
  const heroTranslateY = -heroFadeProgress * 36;

  const finaleReveal = smoothstep(remap(progress, 0.945, 0.985));

  const sceneBlurAmount = Math.max(heroOpacity, finaleReveal);
  const sceneBlurPx = sceneBlurAmount * 5.5;
  const sceneScrimAlpha = sceneBlurAmount * 0.34;

  const activeCaption = copy.landing.story.captions.find(
    (c) => progress >= c.minProgress && progress < c.maxProgress,
  );

  const activeCaptionId = activeCaption?.id ?? null;
  const activeCaptionText = activeCaption?.text ?? "";

  // Smooth real-time typing animation whenever one of the 3 dynamic captions becomes active
  useEffect(() => {
    if (!activeCaptionId || prefersReducedMotion) {
      window.requestAnimationFrame(() => setTypedChars(activeCaptionText.length));
      return;
    }

    let current = 0;
    const resetRaf = window.requestAnimationFrame(() => setTypedChars(0));
    const timer = window.setInterval(() => {
      current += 2;
      if (current >= activeCaptionText.length) {
        setTypedChars(activeCaptionText.length);
        window.clearInterval(timer);
      } else {
        setTypedChars(current);
      }
    }, 24);

    return () => {
      window.cancelAnimationFrame(resetRaf);
      window.clearInterval(timer);
    };
  }, [activeCaptionId, activeCaptionText, prefersReducedMotion]);

  const typedText = activeCaption
    ? activeCaption.text.slice(0, typedChars)
    : "";
  const isTyping =
    Boolean(activeCaption) && typedChars < (activeCaption?.text.length ?? 0);

  return (
    <div
      ref={containerRef}
      data-story-container="true"
      className={cn(
        "relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen",
        prefersReducedMotion ? "h-auto" : "h-[1150vh]",
      )}
    >
      <div
        className={cn(
          "w-full overflow-hidden bg-[#8fd8fc]",
          prefersReducedMotion
            ? "relative min-h-[580px]"
            : "sticky top-[94px] h-[calc(100vh-94px)] min-h-[500px] md:top-[108px] md:h-[calc(100vh-108px)]",
        )}
      >
        {/* Full-bleed Illustrated Vector Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            filter: sceneBlurPx > 0.1 ? `blur(${sceneBlurPx.toFixed(1)}px)` : "none",
            transform: sceneBlurPx > 0.1 ? "scale(1.03)" : "scale(1)",
          }}
          className="absolute inset-0 h-full w-full will-change-transform"
          aria-hidden="true"
        />

        {sceneScrimAlpha > 0.01 ? (
          <div
            style={{ backgroundColor: `rgba(15, 23, 42, ${sceneScrimAlpha.toFixed(2)})` }}
            className="pointer-events-none absolute inset-0 z-[5]"
            aria-hidden="true"
          />
        ) : null}

        {/* Top-Right Utility Controls */}
        <div className="relative z-20 mx-auto flex max-w-[1200px] items-start justify-end gap-2 px-4 pt-4 sm:px-6">
          <a
            href="#overview-content"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/60 bg-surface/85 px-4 text-caption font-semibold text-strong shadow-layered-sm backdrop-blur-md transition-colors hover:bg-surface"
          >
            <span>{copy.landing.story.skipLabel}</span>
            <ArrowDown className="size-3.5" aria-hidden="true" />
          </a>
          <Link
            href="/report"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-strong py-1.5 pl-4 pr-1.5 text-caption font-semibold text-surface shadow-layered-md transition-transform hover:scale-[1.02]"
          >
            <span>{copy.landing.hero.primaryCta}</span>
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-accent-primary text-surface">
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </span>
          </Link>
        </div>

        {/* 3 Dynamic-Placement Story Captions with Typing Animation */}
        {activeCaption ? (
          <div
            key={activeCaption.id}
            className={cn(
              "pointer-events-none absolute z-20 max-w-sm rounded-2xl border border-white/20 bg-stone-950/35 px-4 py-2.5 shadow-sm backdrop-blur-md transition-all duration-500",
              getDynamicCaptionPlacement(activeCaption.id),
            )}
          >
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-story-amber">
              {activeCaption.kicker}
            </p>
            <p className="mt-0.5 min-h-[2.4em] text-caption font-medium text-white/95 sm:text-body-sm">
              {typedText}
              {isTyping ? (
                <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-story-amber align-middle" />
              ) : null}
            </p>
          </div>
        ) : null}

        {/* Centered Borderless Opening Intro */}
        {heroOpacity > 0.01 ? (
          <div
            style={{
              opacity: heroOpacity,
              transform: `translate3d(0, ${heroTranslateY}px, 0)`,
            }}
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4 sm:px-6"
          >
            <div className="flex max-w-3xl flex-col items-center text-center drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)]">
              <span className="select-none font-heading text-[clamp(3.25rem,8.5vw,6.25rem)] font-bold leading-none tracking-tight text-transparent [-webkit-text-stroke:2px_#ffffff]">
                {copy.brand.name}
              </span>
              <h1 className="mt-3 max-w-2xl font-heading text-h2 font-bold leading-tight tracking-tight text-white sm:text-h1">
                {copy.landing.hero.headline}
              </h1>
              <p className="mt-2.5 max-w-[54ch] text-body-sm font-medium text-white/90 sm:text-body">
                {copy.brand.tagline}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-5 py-2 text-caption font-semibold text-white backdrop-blur-md">
                <span>{copy.landing.story.scrollPrompt}</span>
                <ArrowDown className="size-3.5 animate-bounce" aria-hidden="true" />
              </div>
            </div>
          </div>
        ) : null}

        {/* Centered Borderless Finale CTA */}
        {finaleReveal > 0.02 ? (
          <div
            style={{
              opacity: finaleReveal,
              transform: `translate3d(0, ${(1 - finaleReveal) * 20}px, 0)`,
            }}
            className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center px-4 sm:px-6"
          >
            <div className="flex max-w-2xl flex-col items-center text-center drop-shadow-[0_2px_20px_rgba(0,0,0,0.48)]">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-emerald-500/25 px-3.5 py-1 text-caption font-semibold text-emerald-100 backdrop-blur-md">
                <ShieldCheck className="size-4" aria-hidden="true" />
                <span>{copy.landing.story.finale.badge}</span>
              </div>
              <h2 className="mt-4 font-heading text-h2 font-bold leading-tight text-white sm:text-h1">
                {copy.landing.story.finale.heading}
              </h2>
              <p className="mt-3 max-w-[56ch] text-body-sm font-medium text-white/90 sm:text-body">
                {copy.landing.story.finale.subline}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/report"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-strong py-2 pl-5 pr-2 text-caption font-semibold text-surface shadow-layered-lg transition-transform hover:scale-[1.02]"
                >
                  <span>{copy.landing.story.finale.primaryCta}</span>
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-accent-primary text-surface">
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </span>
                </Link>
                <a
                  href="#overview-content"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/45 bg-white/15 px-5 text-caption font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/25"
                >
                  <span>{copy.landing.story.finale.secondaryCta}</span>
                  <ArrowDown className="size-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        ) : null}

        {/* Desktop 9:16 Smartphone Mockup (right) & Mobile Compact Strip (bottom) */}
        <div className="pointer-events-none absolute right-6 top-1/2 z-20 hidden -translate-y-1/2 md:block">
          <StoryPhoneHud progress={progress} variant="desktop" />
        </div>
        <div className="pointer-events-none absolute inset-x-4 bottom-8 z-20 md:hidden">
          <StoryPhoneHud progress={progress} variant="mobile" />
        </div>

        {/* Clean Hairline Progress Track (bottom numbering pills hidden cleanly) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 mx-auto flex max-w-[1200px] justify-end px-4 sm:px-6">
          <div className="h-1 w-32 overflow-hidden rounded-full bg-white/40 backdrop-blur-sm sm:w-44">
            <div
              className="h-full rounded-full bg-accent-primary"
              style={{ width: `${Math.max(4, Math.round(progress * 100))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

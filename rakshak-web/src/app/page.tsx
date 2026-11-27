"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Flame,
  HeartPulse,
  PawPrint,
  Phone,
} from "lucide-react";
import { motion } from "motion/react";
import { RakshakStoryCanvas } from "@/components/home/rakshak-story-canvas";
import { copy } from "@/lib/copy";
import { scaleOnHover } from "@/lib/motion";

const CATEGORY_ACCENTS = {
  human: { icon: HeartPulse, bar: "border-l-accent-primary" },
  animal_bird: { icon: PawPrint, bar: "border-l-story-amber" },
  fire_rescue: { icon: Flame, bar: "border-l-strong" },
} as const;

const GUARANTEES = [
  {
    code: "01",
    label: "Location",
    title: "Map pin or manual address",
    detail:
      "Confirm coordinates on a draggable map, or type a nearby landmark if location access is blocked.",
  },
  {
    code: "02",
    label: "Audio",
    title: "Optional 10-second voice note",
    detail:
      "Record short background context stored in a private bucket. Microphone errors never block a report.",
  },
  {
    code: "03",
    label: "Triage",
    title: "Advisory AI, reporter control",
    detail:
      "Suggested categories are tagged AI-suggested and never receive names or phone numbers.",
  },
  {
    code: "04",
    label: "Ownership",
    title: "Assigned is not Accepted",
    detail:
      "Assigned means responders were paged. Accepted confirms a responder took responsibility for the case.",
  },
] as const;

const SYSTEM_FACTS = [
  {
    value: "6",
    unit: "steps",
    caption: "From mode selection to server-confirmed case reference.",
  },
  {
    value: "10s",
    unit: "audio cap",
    caption: "Optional private voice note with an automatic skip path.",
  },
  {
    value: "112",
    unit: "108 / 101",
    caption: "Direct official India emergency helplines kept on every SOS screen.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="space-y-16 pb-10 sm:space-y-24">
      {/* 1. Full-bleed scroll storytelling narrative */}
      <RakshakStoryCanvas />

      {/* 2. Architectural overview split */}
      <section
        id="overview-content"
        aria-labelledby="dispatch-overview-heading"
        className="grid items-start gap-8 scroll-mt-24 lg:grid-cols-12 lg:gap-12"
      >
        <div className="space-y-4 lg:sticky lg:top-28 lg:col-span-5">
          <p className="font-mono text-caption font-semibold uppercase tracking-widest text-accent-primary">
            How Dispatch Works
          </p>
          <h2
            id="dispatch-overview-heading"
            className="font-heading text-h2 font-bold leading-tight tracking-tight text-strong sm:text-h1"
          >
            Verified reporting, direct to local responders.
          </h2>
          <p className="max-w-[60ch] text-body leading-relaxed text-muted-ink sm:text-body-lg">
            Every report waits for backend storage before showing a reference code, routes by confirmed category and area, and records each status change on the server.
          </p>
        </div>

        <div className="divide-y divide-border-default overflow-hidden rounded-xl border border-border-default bg-surface shadow-layered-sm lg:col-span-7">
          {GUARANTEES.map((item) => (
            <motion.article
              key={item.code}
              initial={{ opacity: 1, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: "some" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="grid gap-3 p-5 sm:grid-cols-12 sm:items-baseline sm:gap-6 sm:p-6"
            >
              <div className="flex items-center gap-2.5 sm:col-span-4">
                <span className="font-mono text-caption font-bold text-accent-primary">
                  {item.code}
                </span>
                <span className="font-mono text-caption uppercase tracking-wider text-muted-ink">
                  {item.label}
                </span>
              </div>
              <div className="space-y-1 sm:col-span-8">
                <h3 className="font-heading text-body-lg font-bold text-strong">
                  {item.title}
                </h3>
                <p className="text-body-sm leading-relaxed text-muted-ink sm:text-body">
                  {item.detail}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* 3. Architectural stat ledger */}
      <section
        aria-label="Operational specifications"
        className="grid divide-y divide-border-default overflow-hidden rounded-xl border border-border-default bg-surface shadow-layered-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0"
      >
        {SYSTEM_FACTS.map((fact) => (
          <div key={fact.value} className="p-6 sm:p-7">
            <div className="flex items-baseline gap-2.5">
              <span className="font-heading text-h1 font-bold tracking-tight text-strong sm:text-display">
                {fact.value}
              </span>
              <span className="font-mono text-caption font-semibold uppercase tracking-wide text-muted-ink">
                {fact.unit}
              </span>
            </div>
            <p className="mt-2.5 max-w-[36ch] text-body-sm leading-relaxed text-muted-ink sm:text-body">
              {fact.caption}
            </p>
          </div>
        ))}
      </section>

      {/* 5. How it works (3-step editorial sequence) */}
      <section
        id="how-it-works"
        aria-labelledby="how-heading"
        className="space-y-6 sm:space-y-8"
      >
        <div className="space-y-1.5">
          <p className="font-mono text-caption font-semibold uppercase tracking-widest text-muted-ink">
            Step by Step
          </p>
          <h2
            id="how-heading"
            className="font-heading text-h2 font-bold tracking-tight text-strong"
          >
            {copy.landing.howItWorks.heading}
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-3 sm:gap-6">
          {copy.landing.howItWorks.steps.map((step) => (
            <div
              key={step.number}
              className="flex flex-col justify-between rounded-xl border border-border-default bg-surface p-6 shadow-layered-sm"
            >
              <div className="space-y-3">
                <span className="font-mono text-caption font-bold text-accent-primary">
                  STEP 0{step.number}
                </span>
                <h3 className="font-heading text-body-lg font-bold text-strong">
                  {step.title}
                </h3>
                <p className="max-w-[65ch] text-body-sm leading-relaxed text-muted-ink sm:text-body">
                  {step.line}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Who we help */}
      <section aria-labelledby="who-heading" className="space-y-6 sm:space-y-8">
        <div className="space-y-1.5">
          <p className="font-mono text-caption font-semibold uppercase tracking-widest text-muted-ink">
            Incident Types
          </p>
          <h2
            id="who-heading"
            className="font-heading text-h2 font-bold tracking-tight text-strong"
          >
            {copy.landing.whoWeHelp.heading}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
          {copy.landing.whoWeHelp.cards.map((card) => {
            const config = CATEGORY_ACCENTS[card.id];
            const Icon = config.icon;
            return (
              <motion.div
                key={card.id}
                variants={scaleOnHover}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
              >
                <Link
                  href={card.href}
                  className={`group flex min-h-[156px] flex-col justify-between rounded-xl border border-border-default border-l-4 ${config.bar} bg-surface p-5 shadow-layered-sm transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary sm:min-h-[176px] sm:p-6`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="size-5 text-strong" aria-hidden="true" />
                    <ArrowUpRight
                      className="size-4 text-muted-ink transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-strong"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="space-y-1.5 pt-5">
                    <h3 className="font-heading text-body-lg font-bold text-strong">
                      {card.title}
                    </h3>
                    <p className="text-body-sm leading-relaxed text-muted-ink sm:text-body">
                      {card.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 7. Civic trust disclaimer & emergency dial strip */}
      <section
        aria-label="Privacy and official emergency numbers"
        className="flex flex-col justify-between gap-5 rounded-xl border border-border-default bg-surface p-5 shadow-layered-sm sm:flex-row sm:items-center sm:p-6"
      >
        <p className="max-w-[65ch] text-body-sm leading-relaxed text-muted-ink sm:text-body">
          {copy.landing.trustStrip.sentence}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {copy.emergencyNumbers.map((item) => (
            <a
              key={item.code}
              href={item.href}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-accent-soft px-4 py-2 text-caption font-semibold text-accent-primary transition-colors hover:bg-accent-primary hover:text-accent-primary-foreground"
            >
              <Phone className="size-3.5" aria-hidden="true" />
              <span className="font-mono tabular-nums">{item.code}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

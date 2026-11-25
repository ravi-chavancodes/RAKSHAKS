"use client";

import Image from "next/image";
import Link from "next/link";
import { Flame, HeartPulse, PawPrint, Phone } from "lucide-react";
import { motion } from "motion/react";
import { copy } from "@/lib/copy";
import { fadeUp, scaleOnHover, stagger } from "@/lib/motion";

const CATEGORY_ICONS = {
  human: HeartPulse,
  animal_bird: PawPrint,
  fire_rescue: Flame,
} as const;

export default function HomePage() {
  return (
    <div className="space-y-20 py-10 sm:py-16">
      {/* 1. Hero */}
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden rounded-xl bg-surface px-6 py-12 shadow-layered-sm sm:px-10 sm:py-16"
      >
        {/* Subtle animated soft shape behind the headline (only continuous animation) */}
        <motion.div
          aria-hidden="true"
          animate={{
            scale: [1, 1.06, 1],
            opacity: [0.35, 0.5, 0.35],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-accent-soft blur-3xl"
        />

        <div className="relative z-10 grid items-center gap-10 lg:grid-cols-12">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="max-w-[65ch] space-y-6 lg:col-span-6"
          >
            <motion.h1
              id="hero-heading"
              variants={fadeUp}
              className="text-display font-bold leading-[1.06] tracking-tight text-strong"
            >
              {copy.landing.hero.headline}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="max-w-[65ch] text-body-lg leading-relaxed text-muted-ink"
            >
              {copy.landing.hero.subline}
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center gap-3 pt-2"
            >
              <motion.div whileTap={{ scale: 0.98 }}>
                <Link
                  href="/report"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-accent-primary px-6 py-3 text-body font-semibold text-accent-primary-foreground transition-colors hover:bg-accent-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
                >
                  {copy.landing.hero.primaryCta}
                </Link>
              </motion.div>

              <motion.div whileTap={{ scale: 0.98 }}>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-md border border-border-strong bg-surface px-5 py-3 text-body font-medium text-strong transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-strong"
                >
                  {copy.landing.hero.secondaryCta}
                </a>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Calm documentary imagery for trust and clarity */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="grid gap-3 lg:col-span-6"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-surface-subtle shadow-layered-md">
              <Image
                src="/images/hero-dispatch.jpg"
                alt="Emergency coordination desk with map display and radio handset"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-surface-subtle shadow-layered-sm">
                <Image
                  src="/images/hero-volunteers.jpg"
                  alt="Community responders coordinating location on a street map"
                  fill
                  sizes="(max-width: 1024px) 50vw, 270px"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-surface-subtle shadow-layered-sm">
                <Image
                  src="/images/hero-response.jpg"
                  alt="Emergency ambulance moving along an urban avenue"
                  fill
                  sizes="(max-width: 1024px) 50vw, 270px"
                  className="object-cover"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. How it works */}
      <motion.section
        id="how-it-works"
        aria-labelledby="how-heading"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="space-y-8"
      >
        <motion.h2
          id="how-heading"
          variants={fadeUp}
          className="text-h2 font-bold tracking-tight text-strong"
        >
          {copy.landing.howItWorks.heading}
        </motion.h2>

        <div className="grid gap-6 sm:grid-cols-3">
          {copy.landing.howItWorks.steps.map((step) => (
            <motion.div
              key={step.number}
              variants={fadeUp}
              className="space-y-3 rounded-lg bg-surface p-6 shadow-layered-sm"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-md bg-surface-subtle font-mono text-caption font-bold text-strong">
                {step.number}
              </span>
              <h3 className="text-body-lg font-semibold text-strong">
                {step.title}
              </h3>
              <p className="max-w-[65ch] text-body leading-relaxed text-muted-ink">
                {step.line}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 3. Who we help */}
      <motion.section
        aria-labelledby="who-heading"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="space-y-8"
      >
        <motion.h2
          id="who-heading"
          variants={fadeUp}
          className="text-h2 font-bold tracking-tight text-strong"
        >
          {copy.landing.whoWeHelp.heading}
        </motion.h2>

        <div className="grid gap-5 sm:grid-cols-3">
          {copy.landing.whoWeHelp.cards.map((card) => {
            const Icon = CATEGORY_ICONS[card.id];
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
                  className="group flex min-h-[160px] flex-col justify-between rounded-lg bg-surface p-6 shadow-layered-sm transition-colors hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
                >
                  <Icon
                    className="size-6 text-accent-primary"
                    aria-hidden="true"
                  />
                  <div className="space-y-1.5 pt-6">
                    <h3 className="text-body-lg font-semibold text-strong">
                      {card.title}
                    </h3>
                    <p className="text-body leading-relaxed text-muted-ink transition-opacity sm:opacity-80 sm:group-hover:opacity-100">
                      {card.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* 4. Trust strip */}
      <section
        aria-label="Privacy and official emergency numbers"
        className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-surface-subtle p-6"
      >
        <p className="max-w-[65ch] text-body leading-relaxed text-muted-ink">
          {copy.landing.trustStrip.sentence}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {copy.emergencyNumbers.map((item) => (
            <a
              key={item.code}
              href={item.href}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md bg-surface px-3.5 py-2 text-caption font-semibold text-accent-primary shadow-layered-sm transition-colors hover:bg-accent-primary hover:text-accent-primary-foreground"
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

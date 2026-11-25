"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { fadeUp } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";

interface RoutePlaceholderProps {
  title: string;
  description: string;
  statusNote: string;
  backLabel: string;
  referenceLabel?: string;
  referenceValue?: string;
}

export function RoutePlaceholder({
  title,
  description,
  statusNote,
  backLabel,
  referenceLabel,
  referenceValue,
}: RoutePlaceholderProps) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="py-12 sm:py-16"
    >
      <div className="max-w-2xl space-y-6 rounded-lg bg-surface p-6 shadow-layered-sm sm:p-8">
        <div className="space-y-3">
          <h1 className="text-h1 font-bold leading-tight tracking-tight text-strong">
            {title}
          </h1>

          {referenceLabel && referenceValue ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-caption font-medium text-muted-ink">
                {referenceLabel}:
              </span>
              <Badge
                variant="secondary"
                className="font-mono text-caption tabular-nums text-strong"
              >
                {referenceValue}
              </Badge>
            </div>
          ) : null}

          <p className="text-body-lg leading-relaxed text-muted-ink">
            {description}
          </p>
        </div>

        <div className="rounded-md bg-surface-subtle p-4 text-caption text-muted-ink">
          {statusNote}
        </div>

        <div>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border-strong bg-surface px-4 py-2 text-body font-medium text-strong transition-colors hover:bg-surface-subtle"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{backLabel}</span>
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

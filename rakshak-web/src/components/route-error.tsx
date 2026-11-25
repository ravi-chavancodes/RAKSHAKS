"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";

interface RouteErrorProps {
  reset: () => void;
}

export function RouteErrorView({ reset }: RouteErrorProps) {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-lg space-y-5 rounded-lg bg-surface p-8 shadow-layered-sm">
        <p className="font-mono text-caption font-semibold text-danger">500</p>
        <h1 className="text-h2 font-bold tracking-tight text-strong">
          {copy.pages.error.title}
        </h1>
        <p className="max-w-[65ch] text-body leading-relaxed text-muted-ink">
          {copy.pages.error.description}
        </p>

        <div className="flex flex-wrap gap-2">
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

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            type="button"
            onClick={reset}
            className="min-h-[44px] bg-strong text-surface hover:bg-strong/90"
          >
            {copy.pages.error.retry}
          </Button>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-md border border-border-strong px-4 text-body font-medium text-strong hover:bg-surface-subtle"
          >
            {copy.pages.notFound.action}
          </Link>
        </div>
      </div>
    </section>
  );
}

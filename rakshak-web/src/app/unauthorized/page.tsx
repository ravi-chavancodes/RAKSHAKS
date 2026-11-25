import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { copy } from "@/lib/copy";

export default function UnauthorizedPage() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-lg space-y-6 rounded-lg bg-surface p-6 shadow-layered-sm sm:p-8">
        <div className="inline-flex size-11 items-center justify-center rounded-md bg-warning-soft text-warning">
          <ShieldAlert className="size-6" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="text-h2 font-bold tracking-tight text-strong">
            {copy.routes.unauthorized.title}
          </h1>
          <p className="text-body leading-relaxed text-muted-ink">
            {copy.routes.unauthorized.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/report"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-accent-primary px-5 py-2.5 text-body font-semibold text-accent-primary-foreground transition-colors hover:bg-accent-primary-hover"
          >
            {copy.routes.unauthorized.backReport}
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border-strong bg-surface px-4 py-2 text-body font-medium text-strong transition-colors hover:bg-surface-subtle"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>{copy.routes.unauthorized.backHome}</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

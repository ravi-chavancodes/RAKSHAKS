import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { copy } from "@/lib/copy";

export default function AboutPage() {
  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-[65ch] space-y-6 rounded-lg bg-surface p-6 shadow-layered-sm sm:p-8">
        <div className="space-y-2">
          <h1 className="text-h1 font-bold tracking-tight text-strong">
            {copy.pages.about.title}
          </h1>
          <p className="text-body-lg leading-relaxed text-muted-ink">
            {copy.pages.about.lead}
          </p>
        </div>

        <p className="text-body leading-relaxed text-strong">
          {copy.pages.about.body}
        </p>

        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-body font-medium text-strong transition-colors hover:bg-surface-subtle"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>{copy.pages.notFound.action}</span>
        </Link>
      </div>
    </section>
  );
}

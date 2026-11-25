import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { copy } from "@/lib/copy";

export default function PrivacyPage() {
  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-[65ch] space-y-6 rounded-lg bg-surface p-6 shadow-layered-sm sm:p-8">
        <div className="space-y-2">
          <h1 className="text-h1 font-bold tracking-tight text-strong">
            {copy.pages.privacy.title}
          </h1>
          <p className="text-body-lg leading-relaxed text-muted-ink">
            {copy.pages.privacy.lead}
          </p>
        </div>

        <ul className="space-y-3 text-body leading-relaxed text-strong">
          {copy.pages.privacy.points.map((point) => (
            <li key={point} className="rounded-md bg-surface-subtle p-4">
              {point}
            </li>
          ))}
        </ul>

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

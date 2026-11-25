import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { copy } from "@/lib/copy";

export default function NotFound() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-lg space-y-5 rounded-lg bg-surface p-8 shadow-layered-sm">
        <p className="font-mono text-caption font-semibold text-muted-ink">
          404
        </p>
        <h1 className="text-h2 font-bold tracking-tight text-strong">
          {copy.pages.notFound.title}
        </h1>
        <p className="max-w-[65ch] text-body leading-relaxed text-muted-ink">
          {copy.pages.notFound.description}
        </p>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-strong px-5 py-2.5 text-body font-semibold text-surface transition-colors hover:bg-strong/90"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>{copy.pages.notFound.action}</span>
        </Link>
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { copy } from "@/lib/copy";

export default function AboutPage() {
  return (
    <section className="py-10 sm:py-16">
      <div className="grid items-center gap-8 rounded-2xl border border-border-default bg-surface p-6 shadow-layered-sm sm:p-10 md:grid-cols-12">
        <div className="flex justify-center md:col-span-4">
          <Image
            src="/images/rakshak-logo.jpg"
            alt="Official RAKSHAK emblem and wordmark"
            width={240}
            height={240}
            className="size-44 rounded-xl object-contain sm:size-56"
          />
        </div>

        <div className="max-w-[65ch] space-y-5 md:col-span-8">
          <div className="space-y-2">
            <h1 className="font-heading text-h2 font-bold tracking-tight text-strong sm:text-h1">
              {copy.pages.about.title}
            </h1>
            <p className="text-body leading-relaxed text-muted-ink sm:text-body-lg">
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
      </div>
    </section>
  );
}

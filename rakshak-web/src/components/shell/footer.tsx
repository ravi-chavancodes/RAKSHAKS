import Link from "next/link";
import { Phone } from "lucide-react";
import { copy } from "@/lib/copy";

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-border-default bg-surface">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center gap-6">
          <span className="text-caption font-semibold text-strong">
            {copy.brand.name}
          </span>
          <nav aria-label="Footer navigation" className="flex items-center gap-5">
            <Link
              href="/privacy"
              className="inline-flex min-h-[44px] items-center text-caption text-muted-ink transition-colors hover:text-strong"
            >
              {copy.footer.privacyLink}
            </Link>
            <Link
              href="/about"
              className="inline-flex min-h-[44px] items-center text-caption text-muted-ink transition-colors hover:text-strong"
            >
              {copy.footer.aboutLink}
            </Link>
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {copy.emergencyNumbers.map((item) => (
            <a
              key={item.code}
              href={item.href}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-accent-border bg-accent-soft px-3 text-caption font-semibold text-accent-primary transition-colors hover:bg-accent-primary hover:text-accent-primary-foreground"
            >
              <Phone className="size-3.5" aria-hidden="true" />
              <span className="font-mono tabular-nums">{item.code}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

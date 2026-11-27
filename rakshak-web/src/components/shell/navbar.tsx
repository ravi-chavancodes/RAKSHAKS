"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, LogOut, Menu, Phone, X } from "lucide-react";
import { toast } from "sonner";
import { copy } from "@/lib/copy";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type UserRole = Database["public"]["Enums"]["user_role"];

const PUBLIC_NAV_ITEMS = [
  { label: copy.nav.home, href: "/" },
  { label: copy.nav.track, href: "/track/demo" },
  { label: copy.footer.aboutLink, href: "/about" },
] as const;

interface AuthState {
  readonly isLoggedIn: boolean;
  readonly role: UserRole | null;
}

function useNavAuth(): AuthState {
  const [auth, setAuth] = useState<AuthState>({ isLoggedIn: false, role: null });

  useEffect(() => {
    let active = true;
    try {
      const supabase = createClient();

      const loadUserRole = async (userId: string | null) => {
        if (!userId) {
          if (active) setAuth({ isLoggedIn: false, role: null });
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        if (active) {
          setAuth({ isLoggedIn: true, role: profile?.role ?? "reporter" });
        }
      };

      void supabase.auth.getUser().then(({ data }) => {
        void loadUserRole(data.user?.id ?? null);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        void loadUserRole(session?.user?.id ?? null);
      });

      return () => {
        active = false;
        subscription.unsubscribe();
      };
    } catch {
      return undefined;
    }
  }, []);

  return auth;
}

function NavContent() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, role } = useNavAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(copy.auth.signOutError);
        return;
      }
      setMobileOpen(false);
      router.push("/");
      router.refresh();
    } catch {
      toast.error(copy.auth.signOutError);
    } finally {
      setIsSigningOut(false);
    }
  }

  const roleItems =
    role === "admin"
      ? [
          { label: copy.nav.responder, href: "/responder" },
          { label: copy.nav.admin, href: "/admin" },
        ]
      : role === "responder"
        ? [
            { label: copy.nav.dashboard, href: "/dashboard" },
            { label: copy.nav.responder, href: "/responder" },
          ]
        : isLoggedIn
          ? [{ label: copy.nav.dashboard, href: "/dashboard" }]
          : [];

  const allItems = [...PUBLIC_NAV_ITEMS, ...roleItems];

  const isRouteActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname.startsWith(href.split("/").slice(0, 2).join("/"));

  return (
    <>
      {/* Main single-row bar */}
      <div className="mx-auto flex min-h-[58px] max-w-[1200px] items-center justify-between gap-3 px-4 py-1.5 sm:px-6 md:min-h-[68px]">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="inline-flex min-h-[44px] items-center gap-2 font-heading text-body-lg font-bold tracking-tight text-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
        >
          <Image
            src="/images/rakshak-mark.png"
            alt=""
            width={30}
            height={33}
            className="h-8 w-auto object-contain"
            priority
          />
          <span>{copy.brand.name}</span>
        </Link>

        {/* Desktop navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-1.5 md:flex lg:gap-2"
        >
          {allItems.map((item) => {
            const active = isRouteActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex min-h-[44px] items-center rounded-full px-3.5 text-body-sm font-medium transition-colors",
                  active
                    ? "bg-surface-subtle font-semibold text-strong"
                    : "text-muted-ink hover:bg-surface-subtle hover:text-strong",
                )}
              >
                {item.label}
              </Link>
            );
          })}

          {isLoggedIn ? (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-body-sm font-semibold text-strong transition-colors hover:bg-surface-subtle"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span>{isSigningOut ? copy.auth.signingOut : copy.auth.signOut}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <Link
                href="/login"
                className={cn(
                  "inline-flex min-h-[44px] items-center rounded-full px-3.5 text-body-sm font-medium transition-colors",
                  pathname.startsWith("/login")
                    ? "bg-surface-subtle font-semibold text-strong"
                    : "text-muted-ink hover:bg-surface-subtle hover:text-strong",
                )}
              >
                {copy.nav.login}
              </Link>
              <Link
                href="/admin/login"
                className={cn(
                  "inline-flex min-h-[44px] items-center rounded-full px-3.5 text-body-sm font-medium transition-colors",
                  pathname.startsWith("/admin")
                    ? "bg-surface-subtle font-semibold text-strong"
                    : "text-muted-ink hover:bg-surface-subtle hover:text-strong",
                )}
              >
                {copy.nav.admin}
              </Link>
            </div>
          )}

          <Link
            href="/report"
            className="ml-2 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-strong py-1.5 pl-4 pr-1.5 text-body-sm font-semibold text-surface transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{copy.nav.report}</span>
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-story-amber text-strong">
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </span>
          </Link>
        </nav>

        {/* Mobile compact actions: Quick SOS CTA + 3-line Hamburger button */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/report"
            onClick={() => setMobileOpen(false)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-strong py-1 pl-3.5 pr-1 text-caption font-semibold text-surface"
          >
            <span>{copy.nav.report}</span>
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-story-amber text-strong">
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            className="inline-flex size-11 items-center justify-center rounded-lg border border-border-default bg-surface text-strong transition-colors hover:bg-surface-subtle"
          >
            {mobileOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Mobile Hamburger Menu Drawer */}
      {mobileOpen ? (
        <nav
          id="mobile-nav-drawer"
          aria-label="Mobile navigation"
          className="border-t border-border-default bg-surface px-4 pb-4 pt-2 shadow-layered-md md:hidden"
        >
          <div className="flex flex-col gap-1">
            {allItems.map((item) => {
              const active = isRouteActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex min-h-[44px] items-center justify-between rounded-lg px-3 text-body-sm font-medium transition-colors",
                    active
                      ? "bg-surface-subtle font-semibold text-strong"
                      : "text-muted-ink hover:bg-surface-subtle hover:text-strong",
                  )}
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="size-4 opacity-50" aria-hidden="true" />
                </Link>
              );
            })}

            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="mt-1 flex min-h-[44px] items-center gap-2 rounded-lg border border-border-default px-3 text-body-sm font-semibold text-strong hover:bg-surface-subtle"
              >
                <LogOut className="size-4" aria-hidden="true" />
                <span>{isSigningOut ? copy.auth.signingOut : copy.auth.signOut}</span>
              </button>
            ) : (
              <div className="mt-1 grid grid-cols-2 gap-2 border-t border-border-default pt-2.5">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-[44px] items-center justify-center rounded-lg border border-border-default text-body-sm font-medium text-strong hover:bg-surface-subtle"
                >
                  {copy.nav.login}
                </Link>
                <Link
                  href="/admin/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-[44px] items-center justify-center rounded-lg border border-border-default text-body-sm font-medium text-strong hover:bg-surface-subtle"
                >
                  {copy.nav.admin}
                </Link>
              </div>
            )}
          </div>
        </nav>
      ) : null}
    </>
  );
}

function NavContentFallback() {
  return (
    <div className="mx-auto flex min-h-[58px] max-w-[1200px] items-center justify-between gap-3 px-4 py-1.5 sm:px-6 md:min-h-[68px]">
      <Link
        href="/"
        className="inline-flex min-h-[44px] items-center gap-2 font-heading text-body-lg font-bold tracking-tight text-strong"
      >
        <Image
          src="/images/rakshak-mark.png"
          alt=""
          width={30}
          height={33}
          className="h-8 w-auto object-contain"
        />
        <span>{copy.brand.name}</span>
      </Link>
      <Link
        href="/report"
        className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-strong py-1 pl-3.5 pr-1 text-caption font-semibold text-surface"
      >
        <span>{copy.nav.report}</span>
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-story-amber text-strong">
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </span>
      </Link>
    </div>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-default bg-surface/95 backdrop-blur-xs">
      {/* Compact single-row emergency helpline strip */}
      <div className="w-full bg-strong text-surface">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-2 px-4 py-1 sm:px-6">
          <span className="truncate text-[11px] font-medium tracking-tight text-surface/85 sm:text-caption">
            {copy.nav.emergencyStripLabel}
          </span>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            {copy.emergencyNumbers.map((item) => (
              <a
                key={item.code}
                href={item.href}
                className="inline-flex min-h-[32px] items-center gap-1 rounded-sm px-1.5 text-[11px] font-semibold text-surface transition-colors hover:bg-surface/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface sm:min-h-[36px] sm:gap-1.5 sm:px-2 sm:text-caption"
              >
                <Phone className="size-3 text-story-amber sm:size-3.5" aria-hidden="true" />
                <span className="font-mono tabular-nums">{item.code}</span>
                <span className="hidden text-surface/75 sm:inline">{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <Suspense fallback={<NavContentFallback />}>
        <NavContent />
      </Suspense>
    </header>
  );
}

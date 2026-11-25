"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Phone } from "lucide-react";
import { toast } from "sonner";
import { copy } from "@/lib/copy";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type UserRole = Database["public"]["Enums"]["user_role"];

const PUBLIC_NAV_ITEMS = [
  { label: copy.nav.home, href: "/" },
  { label: copy.nav.report, href: "/report" },
  { label: copy.nav.track, href: "/track/demo" },
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

function NavLinks() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, role } = useNavAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(copy.auth.signOutError);
        return;
      }
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

  return (
    <nav aria-label="Primary navigation" className="flex flex-wrap items-center gap-1 sm:gap-2">
      {allItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href.split("/").slice(0, 2).join("/"));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex min-h-[44px] items-center rounded-md px-3 text-caption font-medium transition-colors sm:text-body",
              isActive
                ? "bg-surface-subtle text-strong font-semibold"
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
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border-strong bg-surface px-3.5 text-caption font-semibold text-strong transition-colors hover:bg-surface-subtle sm:ml-2 sm:text-body"
        >
          <LogOut className="size-4" aria-hidden="true" />
          <span>{isSigningOut ? copy.auth.signingOut : copy.auth.signOut}</span>
        </button>
      ) : (
        <div className="flex items-center gap-2 sm:ml-2">
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center rounded-md border border-border-strong bg-surface px-3.5 text-caption font-semibold text-strong transition-colors hover:bg-surface-subtle sm:text-body"
          >
            {copy.nav.login}
          </Link>
          <Link
            href="/admin/login"
            className="inline-flex min-h-[44px] items-center rounded-md bg-strong px-3.5 text-caption font-semibold text-surface transition-colors hover:bg-strong/90 sm:text-body"
          >
            {copy.nav.adminLogin}
          </Link>
        </div>
      )}
    </nav>
  );
}

function NavLinksFallback() {
  return (
    <nav aria-label="Primary navigation" className="flex flex-wrap items-center gap-1 sm:gap-2">
      {PUBLIC_NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="inline-flex min-h-[44px] items-center rounded-md px-3 text-caption font-medium text-muted-ink transition-colors hover:bg-surface-subtle hover:text-strong sm:text-body"
        >
          {item.label}
        </Link>
      ))}
      <Link
        href="/login"
        className="inline-flex min-h-[44px] items-center rounded-md border border-border-strong bg-surface px-3.5 text-caption font-semibold text-strong transition-colors hover:bg-surface-subtle sm:ml-2 sm:text-body"
      >
        {copy.nav.login}
      </Link>
    </nav>
  );
}

export function Navbar() {
  return (
    <header className="w-full border-b border-border-default bg-surface">
      {/* Compact always-visible emergency helpline strip */}
      <div className="w-full bg-strong text-surface">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-2 px-4 py-1.5 sm:px-6">
          <span className="text-caption font-medium tracking-tight text-surface/85">
            {copy.nav.emergencyStripLabel}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {copy.emergencyNumbers.map((item) => (
              <a
                key={item.code}
                href={item.href}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-sm px-2 text-caption font-semibold text-surface transition-colors hover:bg-surface/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface"
              >
                <Phone className="size-3.5 text-accent-primary" aria-hidden="true" />
                <span className="font-mono tabular-nums">{item.code}</span>
                <span className="hidden text-surface/75 sm:inline">{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="mx-auto flex min-h-[64px] max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2.5 text-body-lg font-bold tracking-tight text-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
        >
          <span
            className="inline-block size-2.5 rounded-sm bg-accent-primary"
            aria-hidden="true"
          />
          <span>{copy.brand.name}</span>
        </Link>

        <Suspense fallback={<NavLinksFallback />}>
          <NavLinks />
        </Suspense>
      </div>
    </header>
  );
}

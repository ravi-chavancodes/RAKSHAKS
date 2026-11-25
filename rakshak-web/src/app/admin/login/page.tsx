import { Suspense } from "react";
import { AdminLoginForm } from "@/features/auth/components/admin-login-form";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminLoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

function sanitizeNextPath(rawNext: string | undefined): string | null {
  if (!rawNext || !rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return null;
  }
  return rawNext;
}

async function AdminLoginContent({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const nextPath = sanitizeNextPath(params.next);
  const errorCode = params.error ?? null;

  return <AdminLoginForm nextPath={nextPath} errorCode={errorCode} />;
}

function AdminLoginFallback() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-lg space-y-4 rounded-lg bg-surface p-6 shadow-layered-sm sm:p-8">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </section>
  );
}

export default function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  return (
    <Suspense fallback={<AdminLoginFallback />}>
      <AdminLoginContent searchParams={searchParams} />
    </Suspense>
  );
}

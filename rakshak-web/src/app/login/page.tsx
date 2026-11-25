import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";
import { Skeleton } from "@/components/ui/skeleton";

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

function sanitizeNextPath(rawNext: string | undefined): string | null {
  if (!rawNext || !rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return null;
  }
  return rawNext;
}

async function LoginContent({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = sanitizeNextPath(params.next);
  const errorCode = params.error ?? null;

  return <LoginForm nextPath={nextPath} errorCode={errorCode} />;
}

function LoginFallback() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-lg space-y-4 rounded-lg bg-surface p-6 shadow-layered-sm sm:p-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </section>
  );
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

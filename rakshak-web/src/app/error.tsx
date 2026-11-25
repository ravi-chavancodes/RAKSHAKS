"use client";

import { RouteErrorView } from "@/components/route-error";

export default function GlobalRouteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorView reset={reset} />;
}

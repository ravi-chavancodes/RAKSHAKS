"use client";

import { RouteErrorView } from "@/components/route-error";

export default function ResponderRouteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorView reset={reset} />;
}

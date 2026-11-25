"use client";

import { useSyncExternalStore } from "react";

interface ClientTimestampProps {
  iso: string;
}

const subscribe = () => () => {};

export function ClientTimestamp({ iso }: ClientTimestampProps) {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return (
    <time dateTime={iso} suppressHydrationWarning>
      {isClient ? new Date(iso).toLocaleString() : iso.slice(0, 10)}
    </time>
  );
}

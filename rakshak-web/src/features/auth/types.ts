export interface MagicLinkRequestState {
  readonly status: "idle" | "sent";
  readonly email: string | null;
}

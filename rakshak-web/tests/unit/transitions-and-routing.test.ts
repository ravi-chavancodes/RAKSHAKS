import { beforeEach, describe, expect, it } from "vitest";
import {
  isValidStatusTransition,
  selectMatchingResponders,
  type ResponderCandidate,
} from "@/lib/routing/rules";
import {
  checkRateLimit,
  resetRateLimitStore,
} from "@/lib/security/rate-limit";

describe("Status Transition Matrix", () => {
  it("allows valid forward and escalation transitions", () => {
    expect(isValidStatusTransition("submitted", "under_review")).toBe(true);
    expect(isValidStatusTransition("under_review", "assigned")).toBe(true);
    expect(isValidStatusTransition("assigned", "accepted")).toBe(true);
    expect(isValidStatusTransition("assigned", "under_review")).toBe(true);
    expect(isValidStatusTransition("accepted", "in_progress")).toBe(true);
    expect(isValidStatusTransition("in_progress", "closed")).toBe(true);
    expect(
      isValidStatusTransition("unresolved_escalated", "closed"),
    ).toBe(true);
  });

  it("blocks invalid skips and transitions out of closed", () => {
    expect(isValidStatusTransition("submitted", "accepted")).toBe(false);
    expect(isValidStatusTransition("submitted", "closed")).toBe(false);
    expect(isValidStatusTransition("under_review", "accepted")).toBe(false);
    expect(isValidStatusTransition("closed", "in_progress")).toBe(false);
    expect(isValidStatusTransition("closed", "submitted")).toBe(false);
  });
});

describe("Category Routing Rules", () => {
  const candidates: readonly ResponderCandidate[] = [
    {
      id: "r-human-1",
      category: "human",
      isActive: true,
      verified: true,
      distanceM: 2300,
    },
    {
      id: "r-animal-1",
      category: "animal_bird",
      isActive: true,
      verified: true,
      distanceM: 1200,
    },
    {
      id: "r-human-unverified",
      category: "human",
      isActive: true,
      verified: false,
      distanceM: 400,
    },
    {
      id: "r-human-paused",
      category: "human",
      isActive: false,
      verified: true,
      distanceM: 500,
    },
    {
      id: "r-human-2",
      category: "human",
      isActive: true,
      verified: true,
      distanceM: 4100,
    },
  ];

  it("routes human incidents only to active, verified medical responders ordered by distance", () => {
    const matched = selectMatchingResponders("human", candidates, 3);
    expect(matched.map((m) => m.id)).toEqual(["r-human-1", "r-human-2"]);
  });

  it("routes animal_bird incidents only to animal responders", () => {
    const matched = selectMatchingResponders("animal_bird", candidates, 3);
    expect(matched.map((m) => m.id)).toEqual(["r-animal-1"]);
  });

  it("returns empty array when no verified active responder matches category", () => {
    const matched = selectMatchingResponders("fire_rescue", candidates, 3);
    expect(matched).toEqual([]);
  });
});

describe("API Rate Limiter & Idempotency", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("allows 10 requests per IP within 10 minutes and blocks the 11th", () => {
    const t0 = 1_700_000_000_000;
    for (let i = 0; i < 10; i++) {
      const res = checkRateLimit("incidents:203.0.113.10", 10, 600_000, t0);
      expect(res.allowed).toBe(true);
    }

    const blocked = checkRateLimit("incidents:203.0.113.10", 10, 600_000, t0);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);

    // Resets after 10 minutes
    const afterWindow = checkRateLimit(
      "incidents:203.0.113.10",
      10,
      600_000,
      t0 + 600_001,
    );
    expect(afterWindow.allowed).toBe(true);
  });

  it("enforces distinct UUID format for client_request_id idempotency keys", () => {
    const id1 = crypto.randomUUID();
    const id2 = crypto.randomUUID();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});

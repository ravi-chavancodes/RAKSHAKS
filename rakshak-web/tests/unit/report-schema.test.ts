import { describe, expect, it } from "vitest";
import {
  detailsStepSchema,
  reportSubmissionSchema,
} from "@/features/report/schemas/report-schema";
import {
  loginSchema,
  registerSchema,
} from "@/features/auth/schemas/login-schema";

describe("SOS Report Zod Schemas", () => {
  it("accepts a valid Self SOS with GPS coordinates", () => {
    const result = reportSubmissionSchema.safeParse({
      clientRequestId: "11111111-1111-4111-8111-111111111111",
      reportingMode: "self",
      category: "human",
      description: "Road collision near metro exit, minor leg injury.",
      latitude: 12.9716,
      longitude: 77.5946,
      locationAccuracyM: 18,
      locationIsApproximate: false,
      audioDurationMs: null,
      audioPermissionState: "skipped",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a Third-Person SOS with manual landmark and null GPS", () => {
    const result = reportSubmissionSchema.safeParse({
      clientRequestId: "22222222-2222-4222-8222-222222222222",
      reportingMode: "third_person",
      category: "animal_bird",
      description: "Injured dog near bus stop shelter.",
      latitude: null,
      longitude: null,
      locationAccuracyM: null,
      locationText: "Outside Indiranagar Metro Gate B",
      locationIsApproximate: true,
      audioDurationMs: null,
      audioPermissionState: "denied",
    });

    expect(result.success).toBe(true);
  });

  it("rejects submission when both GPS and manual location are missing", () => {
    const result = reportSubmissionSchema.safeParse({
      clientRequestId: "33333333-3333-4333-8333-333333333333",
      reportingMode: "self",
      category: "fire_rescue",
      description: "Smoke from basement meter room.",
      latitude: null,
      longitude: null,
      locationAccuracyM: null,
      locationText: "",
      locationIsApproximate: false,
      audioDurationMs: null,
      audioPermissionState: "not_asked",
    });

    expect(result.success).toBe(false);
  });

  it("enforces 500-character limit on incident description", () => {
    const tooLong = "a".repeat(501);
    const result = detailsStepSchema.safeParse({
      description: tooLong,
    });

    expect(result.success).toBe(false);
  });
});

describe("Auth Zod Schemas", () => {
  it("validates login email and minimum 6-char password", () => {
    expect(
      loginSchema.safeParse({
        email: "reporter@example.org",
        password: "123456",
      }).success,
    ).toBe(true);

    expect(
      loginSchema.safeParse({
        email: "reporter@example.org",
        password: "123",
      }).success,
    ).toBe(false);
  });

  it("requires fullName on user registration", () => {
    expect(
      registerSchema.safeParse({
        fullName: "Test User",
        email: "user@example.org",
        password: "123456",
      }).success,
    ).toBe(true);

    expect(
      registerSchema.safeParse({
        fullName: "",
        email: "user@example.org",
        password: "123456",
      }).success,
    ).toBe(false);
  });
});

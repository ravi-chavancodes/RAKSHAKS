import { z } from "zod";

export const reportingModeSchema = z.enum(["self", "third_person"]);
export const emergencyCategorySchema = z.enum([
  "human",
  "animal_bird",
  "fire_rescue",
]);

export const detailsStepSchema = z.object({
  description: z
    .string()
    .trim()
    .min(5, "Describe the situation in at least 5 characters.")
    .max(500, "Description must be 500 characters or fewer."),
  contactName: z
    .string()
    .trim()
    .max(100, "Name must be 100 characters or fewer.")
    .optional()
    .or(z.literal("")),
  contactPhone: z
    .string()
    .trim()
    .max(20, "Phone number must be 20 characters or fewer.")
    .optional()
    .or(z.literal("")),
});

export const reportSubmissionSchema = z
  .object({
    clientRequestId: z.string().uuid(),
    reportingMode: reportingModeSchema,
    category: emergencyCategorySchema,
    description: z.string().trim().min(5).max(500),
    contactName: z.string().trim().max(100).optional(),
    contactPhone: z.string().trim().max(20).optional(),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    locationAccuracyM: z.number().min(0).nullable(),
    locationText: z.string().trim().max(300).optional(),
    locationIsApproximate: z.boolean(),
    audioDurationMs: z.number().int().min(0).max(15000).nullable(),
    audioPermissionState: z.enum([
      "not_asked",
      "granted",
      "denied",
      "unsupported",
      "skipped",
    ]),
  })
  .refine(
    (data) =>
      (data.latitude !== null && data.longitude !== null) ||
      Boolean(data.locationText && data.locationText.trim().length >= 3),
    {
      message: "Provide GPS coordinates or a manual location description.",
      path: ["locationText"],
    },
  );

export type DetailsStepValues = z.infer<typeof detailsStepSchema>;
export type ReportSubmissionInput = z.infer<typeof reportSubmissionSchema>;

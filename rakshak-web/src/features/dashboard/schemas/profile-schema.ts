import { z } from "zod";

export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(100, "Maximum 100 characters."),
  phone: z
    .string()
    .trim()
    .max(20, "Enter a valid phone number.")
    .optional()
    .or(z.literal("")),
});

export type ProfileUpdateValues = z.infer<typeof profileUpdateSchema>;

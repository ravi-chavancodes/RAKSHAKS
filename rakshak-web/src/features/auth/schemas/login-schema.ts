import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters."),
});

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name (at least 2 characters).")
    .max(100, "Full name must be 100 characters or fewer."),
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

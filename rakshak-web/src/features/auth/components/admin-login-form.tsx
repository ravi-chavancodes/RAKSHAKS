"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy";
import { fadeUp } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormValues } from "../schemas/login-schema";

interface AdminLoginFormProps {
  nextPath: string | null;
  errorCode: string | null;
}

export function AdminLoginForm({ nextPath, errorCode }: AdminLoginFormProps) {
  const router = useRouter();
  const [portalError, setPortalError] = useState<string | null>(
    errorCode === "portal_mismatch"
      ? copy.routes.adminLogin.portalMismatchError
      : errorCode === "auth_callback_failed"
        ? copy.routes.adminLogin.callbackError
        : null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setPortalError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error || !data.user) {
        toast.error(error?.message ?? "Invalid administrator credentials.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      // Strict portal isolation: non-admin cannot log into admin portal
      if (!profile || profile.role !== "admin") {
        await supabase.auth.signOut();
        setPortalError(copy.routes.adminLogin.portalMismatchError);
        return;
      }

      router.push(nextPath ?? "/admin");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not sign in as administrator.",
      );
    }
  }

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="py-12 sm:py-16"
    >
      <div className="mx-auto max-w-lg rounded-lg border border-border-strong bg-surface p-6 shadow-layered-sm sm:p-8">
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-strong text-surface">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-h2 font-bold tracking-tight text-strong">
                {copy.routes.adminLogin.title}
              </h1>
              <p className="text-body leading-relaxed text-muted-ink">
                {copy.routes.adminLogin.description}
              </p>
            </div>
          </div>

          {portalError ? (
            <div
              role="alert"
              className="space-y-2 rounded-md border border-danger-border bg-danger-soft p-3.5 text-caption text-danger"
            >
              <p>{portalError}</p>
              {portalError === copy.routes.adminLogin.portalMismatchError ? (
                <Link href="/login" className="inline-block font-semibold underline">
                  {copy.routes.adminLogin.userPortalLink}
                </Link>
              ) : null}
            </div>
          ) : null}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-body font-medium text-strong">
                {copy.routes.adminLogin.emailLabel}
              </Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                placeholder={copy.routes.adminLogin.emailPlaceholder}
                className="min-h-[44px] bg-surface text-body"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              {errors.email ? (
                <p role="alert" className="text-caption text-danger">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-body font-medium text-strong">
                {copy.routes.adminLogin.passwordLabel}
              </Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                placeholder={copy.routes.adminLogin.passwordPlaceholder}
                className="min-h-[44px] bg-surface text-body"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
              />
              {errors.password ? (
                <p role="alert" className="text-caption text-danger">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[48px] w-full bg-strong text-body font-semibold text-surface hover:bg-strong/90"
            >
              {isSubmitting
                ? copy.routes.adminLogin.sendingButton
                : copy.routes.adminLogin.submitButton}
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-default pt-4">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center gap-2 text-caption font-medium text-muted-ink transition-colors hover:text-strong"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span>{copy.routes.adminLogin.backHome}</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-[44px] items-center text-caption font-medium text-muted-ink transition-colors hover:text-strong"
            >
              {copy.routes.adminLogin.userPortalLink}
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

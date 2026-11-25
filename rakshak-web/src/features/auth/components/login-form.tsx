"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, MailCheck } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/copy";
import { fadeUp } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  loginSchema,
  registerSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from "../schemas/login-schema";
import type { MagicLinkRequestState } from "../types";

interface LoginFormProps {
  nextPath: string | null;
  errorCode: string | null;
}

type AuthMode = "signin" | "register";

export function LoginForm({ nextPath, errorCode }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [portalError, setPortalError] = useState<string | null>(
    errorCode === "portal_mismatch"
      ? copy.routes.login.portalMismatchError
      : errorCode === "auth_callback_failed"
        ? copy.routes.login.callbackError
        : null,
  );
  const [linkState, setLinkState] = useState<MagicLinkRequestState>({
    status: "idle",
    email: null,
  });

  const signInForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  async function handleSignIn(values: LoginFormValues) {
    setPortalError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error || !data.user) {
        toast.error(error?.message ?? "Invalid email or password.");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      const role = profile?.role ?? "reporter";

      // Strict portal isolation: admin cannot log into user portal
      if (role === "admin") {
        await supabase.auth.signOut();
        setPortalError(copy.routes.login.portalMismatchError);
        return;
      }

      const destination =
        nextPath ?? (role === "responder" ? "/responder" : "/dashboard");
      router.push(destination);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in.");
    }
  }

  async function handleRegister(values: RegisterFormValues) {
    setPortalError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.fullName },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.session) {
        router.push(nextPath ?? "/dashboard");
        router.refresh();
        return;
      }

      setLinkState({ status: "sent", email: values.email });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not register account.");
    }
  }

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="py-12 sm:py-16"
    >
      <div className="mx-auto max-w-lg rounded-lg bg-surface p-6 shadow-layered-sm sm:p-8">
        {linkState.status === "sent" && linkState.email ? (
          <div className="space-y-5">
            <div className="inline-flex size-11 items-center justify-center rounded-md bg-success-soft text-success">
              <MailCheck className="size-6" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h1 className="text-h2 font-bold tracking-tight text-strong">
                {copy.routes.login.checkEmailTitle}
              </h1>
              <p className="text-body leading-relaxed text-muted-ink">
                {copy.routes.login.checkEmailDescription}{" "}
                <span className="font-mono font-semibold text-strong">
                  {linkState.email}
                </span>
                .
              </p>
              <p className="text-caption leading-relaxed text-subtle-ink">
                {copy.routes.login.checkEmailHint}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLinkState({ status: "idle", email: null })}
                className="min-h-[44px]"
              >
                {copy.routes.login.useAnotherEmail}
              </Button>
              <Link
                href="/"
                className="inline-flex min-h-[44px] items-center gap-2 px-3 text-body font-medium text-muted-ink transition-colors hover:text-strong"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                <span>{copy.routes.login.backHome}</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-h2 font-bold tracking-tight text-strong">
                {copy.routes.login.title}
              </h1>
              <p className="text-body leading-relaxed text-muted-ink">
                {copy.routes.login.description}
              </p>
            </div>

            <div
              role="tablist"
              aria-label="User authentication mode"
              className="grid grid-cols-2 gap-1 rounded-md bg-surface-subtle p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signin"}
                onClick={() => {
                  setMode("signin");
                  setPortalError(null);
                }}
                className={cn(
                  "min-h-[44px] rounded-sm text-body font-semibold transition-colors",
                  mode === "signin"
                    ? "bg-surface text-strong shadow-layered-sm"
                    : "text-muted-ink hover:text-strong",
                )}
              >
                {copy.routes.login.signInTab}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "register"}
                onClick={() => {
                  setMode("register");
                  setPortalError(null);
                }}
                className={cn(
                  "min-h-[44px] rounded-sm text-body font-semibold transition-colors",
                  mode === "register"
                    ? "bg-surface text-strong shadow-layered-sm"
                    : "text-muted-ink hover:text-strong",
                )}
              >
                {copy.routes.login.registerTab}
              </button>
            </div>

            {portalError ? (
              <div
                role="alert"
                className="space-y-2 rounded-md border border-danger-border bg-danger-soft p-3.5 text-caption text-danger"
              >
                <p>{portalError}</p>
                {portalError === copy.routes.login.portalMismatchError ? (
                  <Link
                    href="/admin/login"
                    className="inline-block font-semibold underline"
                  >
                    {copy.routes.login.adminPortalLink}
                  </Link>
                ) : null}
              </div>
            ) : null}

            {mode === "signin" ? (
              <form
                onSubmit={signInForm.handleSubmit(handleSignIn)}
                className="space-y-4"
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-body font-medium text-strong">
                    {copy.routes.login.emailLabel}
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    autoComplete="email"
                    placeholder={copy.routes.login.emailPlaceholder}
                    className="min-h-[44px] bg-surface text-body"
                    aria-invalid={Boolean(signInForm.formState.errors.email)}
                    {...signInForm.register("email")}
                  />
                  {signInForm.formState.errors.email ? (
                    <p role="alert" className="text-caption text-danger">
                      {signInForm.formState.errors.email.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-body font-medium text-strong">
                    {copy.routes.login.passwordLabel}
                  </Label>
                  <Input
                    id="signin-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder={copy.routes.login.passwordPlaceholder}
                    className="min-h-[44px] bg-surface text-body"
                    aria-invalid={Boolean(signInForm.formState.errors.password)}
                    {...signInForm.register("password")}
                  />
                  {signInForm.formState.errors.password ? (
                    <p role="alert" className="text-caption text-danger">
                      {signInForm.formState.errors.password.message}
                    </p>
                  ) : null}
                </div>

                <Button
                  type="submit"
                  disabled={signInForm.formState.isSubmitting}
                  className="min-h-[48px] w-full bg-accent-primary text-body font-semibold text-accent-primary-foreground hover:bg-accent-primary-hover"
                >
                  {signInForm.formState.isSubmitting
                    ? copy.routes.login.sendingButton
                    : copy.routes.login.submitSignIn}
                </Button>
              </form>
            ) : (
              <form
                onSubmit={registerForm.handleSubmit(handleRegister)}
                className="space-y-4"
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="register-name" className="text-body font-medium text-strong">
                    {copy.routes.login.fullNameLabel}
                  </Label>
                  <Input
                    id="register-name"
                    type="text"
                    autoComplete="name"
                    placeholder={copy.routes.login.fullNamePlaceholder}
                    className="min-h-[44px] bg-surface text-body"
                    aria-invalid={Boolean(registerForm.formState.errors.fullName)}
                    {...registerForm.register("fullName")}
                  />
                  {registerForm.formState.errors.fullName ? (
                    <p role="alert" className="text-caption text-danger">
                      {registerForm.formState.errors.fullName.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email" className="text-body font-medium text-strong">
                    {copy.routes.login.emailLabel}
                  </Label>
                  <Input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    placeholder={copy.routes.login.emailPlaceholder}
                    className="min-h-[44px] bg-surface text-body"
                    aria-invalid={Boolean(registerForm.formState.errors.email)}
                    {...registerForm.register("email")}
                  />
                  {registerForm.formState.errors.email ? (
                    <p role="alert" className="text-caption text-danger">
                      {registerForm.formState.errors.email.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-body font-medium text-strong">
                    {copy.routes.login.passwordLabel}
                  </Label>
                  <Input
                    id="register-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder={copy.routes.login.passwordPlaceholder}
                    className="min-h-[44px] bg-surface text-body"
                    aria-invalid={Boolean(registerForm.formState.errors.password)}
                    {...registerForm.register("password")}
                  />
                  {registerForm.formState.errors.password ? (
                    <p role="alert" className="text-caption text-danger">
                      {registerForm.formState.errors.password.message}
                    </p>
                  ) : null}
                </div>

                <Button
                  type="submit"
                  disabled={registerForm.formState.isSubmitting}
                  className="min-h-[48px] w-full bg-accent-primary text-body font-semibold text-accent-primary-foreground hover:bg-accent-primary-hover"
                >
                  {registerForm.formState.isSubmitting
                    ? copy.routes.login.registeringButton
                    : copy.routes.login.submitRegister}
                </Button>
              </form>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-default pt-4">
              <Link
                href="/"
                className="inline-flex min-h-[44px] items-center gap-2 text-caption font-medium text-muted-ink transition-colors hover:text-strong"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                <span>{copy.routes.login.backHome}</span>
              </Link>
              <Link
                href="/admin/login"
                className="inline-flex min-h-[44px] items-center text-caption font-medium text-muted-ink transition-colors hover:text-strong"
              >
                {copy.routes.login.adminPortalLink}
              </Link>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

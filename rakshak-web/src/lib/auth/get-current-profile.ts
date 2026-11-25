import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import { err, ok, type Result } from "@/lib/result";

export type UserProfile = Database["public"]["Tables"]["profiles"]["Row"];

export interface AuthProfileError {
  readonly code: "UNCONFIGURED" | "AUTH_ERROR" | "PROFILE_ERROR";
  readonly message: string;
}

export async function getCurrentProfile(): Promise<
  Result<UserProfile | null, AuthProfileError>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return err({ code: "AUTH_ERROR", message: userError.message });
    }

    if (!user) {
      return ok(null);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return err({ code: "PROFILE_ERROR", message: profileError.message });
    }

    return ok(profile);
  } catch (error) {
    return err({
      code: "UNCONFIGURED",
      message: error instanceof Error ? error.message : "Failed to load profile.",
    });
  }
}

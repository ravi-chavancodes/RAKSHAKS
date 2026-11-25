"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";

const createResponderSchema = z.object({
  organisationName: z.string().trim().min(2).max(120),
  category: z.enum(["human", "animal_bird", "fire_rescue"]),
  contactChannel: z.string().trim().min(3).max(120),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusM: z.number().int().min(500).max(100000),
});

const updateResponderSchema = z.object({
  responderId: z.string().uuid(),
  organisationName: z.string().trim().min(2).max(120),
  category: z.enum(["human", "animal_bird", "fire_rescue"]),
  contactChannel: z.string().trim().min(3).max(120),
  radiusM: z.number().int().min(500).max(100000),
});

const updateUserRoleSchema = z.object({
  targetUserId: z.string().uuid(),
  newRole: z.enum(["reporter", "responder", "admin"]),
});

async function requireAdmin() {
  const profileResult = await getCurrentProfile();
  const profile = profileResult.ok ? profileResult.data : null;
  if (!profile || profile.role !== "admin") {
    return null;
  }
  return profile;
}

export async function createResponderAction(
  raw: z.infer<typeof createResponderSchema>,
) {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false as const, error: "403 Forbidden: admin role required." };
  }

  const parsed = createResponderSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid responder fields.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("responders")
    .insert({
      organisation_name: parsed.data.organisationName,
      category: parsed.data.category,
      contact_channel: parsed.data.contactChannel,
      service_point: `POINT(${parsed.data.longitude} ${parsed.data.latitude})`,
      radius_m: parsed.data.radiusM,
      is_active: true,
      verified: false,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false as const, error: error.message };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "responder_created",
    entity: "responders",
    entity_id: data.id,
    metadata: { organisation_name: parsed.data.organisationName },
  });

  revalidatePath("/admin");
  return { ok: true as const };
}

export async function updateResponderAction(
  raw: z.infer<typeof updateResponderSchema>,
) {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false as const, error: "403 Forbidden: admin role required." };
  }

  const parsed = updateResponderSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid responder update.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("responders")
    .update({
      organisation_name: parsed.data.organisationName,
      category: parsed.data.category,
      contact_channel: parsed.data.contactChannel,
      radius_m: parsed.data.radiusM,
    })
    .eq("id", parsed.data.responderId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "responder_updated",
    entity: "responders",
    entity_id: parsed.data.responderId,
    metadata: { organisation_name: parsed.data.organisationName },
  });

  revalidatePath("/admin");
  return { ok: true as const };
}

export async function updateUserRoleAction(
  raw: z.infer<typeof updateUserRoleSchema>,
) {
  const admin = await requireAdmin();
  if (!admin) {
    return { ok: false as const, error: "403 Forbidden: admin role required." };
  }

  const parsed = updateUserRoleSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid role selection." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.newRole })
    .eq("id", parsed.data.targetUserId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  await supabase.from("audit_logs").insert({
    actor_id: admin.id,
    action: "role_updated",
    entity: "profiles",
    entity_id: parsed.data.targetUserId,
    metadata: { new_role: parsed.data.newRole },
  });

  revalidatePath("/admin");
  return { ok: true as const };
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { routeIncidentById } from "@/lib/routing/route-incident";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

const confirmCategorySchema = z.object({
  category: z.enum(["human", "animal_bird", "fire_rescue"]),
});

interface RouteContext {
  params: Promise<{ ref: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { ref } = await context.params;
    const body = (await request.json()) as unknown;

    const parsed = confirmCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message ?? "Invalid category selection.",
        },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();
    const dbClient = adminClient ?? (await createServerClient());

    const { data: updated, error } = await dbClient
      .from("incidents")
      .update({
        category: parsed.data.category,
        category_confirmed: true,
      })
      .eq("reference", ref)
      .select("id, reference, category, category_confirmed")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 },
      );
    }

    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "Case not found." },
        { status: 404 },
      );
    }

    // Trigger responder routing now that category_confirmed = true
    const routingResult = await routeIncidentById(updated.id);

    return NextResponse.json(
      {
        ok: true,
        data: {
          reference: updated.reference,
          category: updated.category,
          category_confirmed: updated.category_confirmed,
          routing: routingResult.ok ? routingResult.data : null,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to confirm category.",
      },
      { status: 500 },
    );
  }
}

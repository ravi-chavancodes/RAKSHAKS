import { NextResponse } from "next/server";
import { z } from "zod";
import { routeIncidentById } from "@/lib/routing/route-incident";
import { createAdminClient } from "@/lib/supabase/admin";

const routeBodySchema = z
  .object({
    limit: z.number().int().min(1).max(10).optional(),
  })
  .optional();

interface RouteContext {
  params: Promise<{ ref: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { ref } = await context.params;
    const rawBody = await request.json().catch(() => undefined);
    const parsed = routeBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid routing parameters." },
        { status: 400 },
      );
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { ok: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 },
      );
    }

    const { data: incident } = await adminClient
      .from("incidents")
      .select("id")
      .eq("reference", ref)
      .maybeSingle();

    if (!incident) {
      return NextResponse.json(
        { ok: false, error: "Case not found." },
        { status: 404 },
      );
    }

    const result = await routeIncidentById(incident.id, parsed.data?.limit);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, data: result.data }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Routing failed.",
      },
      { status: 500 },
    );
  }
}

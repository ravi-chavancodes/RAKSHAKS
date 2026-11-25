import { after, NextResponse } from "next/server";
import { reportSubmissionSchema } from "@/features/report/schemas/report-schema";
import { analyzeWithRakshakAi } from "@/lib/ai/rakshak-ai";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

function generateReference(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
  return `RK-${yyyy}${mm}${dd}-${suffix}`;
}

function parseNullableNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
    const clientIp =
      forwardedFor.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rate = checkRateLimit(`incidents:${clientIp}`, 10, 10 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "Too many SOS submissions from this network. Try again shortly.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSeconds) },
        },
      );
    }

    const formData = await request.formData();

    const rawPayload = {
      clientRequestId: formData.get("clientRequestId"),
      reportingMode: formData.get("reportingMode"),
      category: formData.get("category"),
      description: formData.get("description"),
      contactName:
        typeof formData.get("contactName") === "string"
          ? (formData.get("contactName") as string)
          : undefined,
      contactPhone:
        typeof formData.get("contactPhone") === "string"
          ? (formData.get("contactPhone") as string)
          : undefined,
      latitude: parseNullableNumber(formData.get("latitude")),
      longitude: parseNullableNumber(formData.get("longitude")),
      locationAccuracyM: parseNullableNumber(formData.get("locationAccuracyM")),
      locationText:
        typeof formData.get("locationText") === "string"
          ? (formData.get("locationText") as string)
          : undefined,
      locationIsApproximate: formData.get("locationIsApproximate") === "true",
      audioDurationMs: parseNullableNumber(formData.get("audioDurationMs")),
      audioPermissionState: formData.get("audioPermissionState"),
    };

    const parsed = reportSubmissionSchema.safeParse(rawPayload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: parsed.error.issues[0]?.message ?? "Invalid SOS report payload.",
        },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Check if user is signed in (optional; anonymous SOS is always allowed)
    let reporterId: string | null = null;
    const serverSupabase = await createServerClient();
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();
    if (user) {
      reporterId = user.id;
    }

    const adminClient = createAdminClient();
    const dbClient = adminClient ?? serverSupabase;

    if (!adminClient && !reporterId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Server configuration missing SUPABASE_SERVICE_ROLE_KEY for anonymous SOS submission.",
        },
        { status: 500 },
      );
    }

    // Idempotency check: return existing reference for duplicate client_request_id
    const { data: existingIncident } = await dbClient
      .from("incidents")
      .select("reference")
      .eq("client_request_id", input.clientRequestId)
      .maybeSingle();

    if (existingIncident) {
      return NextResponse.json(
        {
          ok: true,
          data: {
            reference: existingIncident.reference,
            duplicate: true,
          },
        },
        { status: 200 },
      );
    }

    const reference = generateReference();

    // Optional audio upload to private bucket; failure NEVER blocks submission
    let audioPath: string | null = null;
    const audioEntry = formData.get("audioFile");
    if (audioEntry instanceof File && audioEntry.size > 0 && adminClient) {
      const objectPath = `${reference}/${input.clientRequestId}.webm`;
      const { error: uploadError } = await adminClient.storage
        .from("incident-audio")
        .upload(objectPath, audioEntry, {
          contentType: audioEntry.type || "audio/webm",
          upsert: false,
        });

      if (!uploadError) {
        audioPath = objectPath;
      }
    }

    const contactSuffix = [
      input.contactName ? `Contact: ${input.contactName}` : null,
      input.contactPhone ? `Phone: ${input.contactPhone}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    const fullDescription = contactSuffix
      ? `${input.description}\n\n${contactSuffix}`
      : input.description;

    const locationPoint =
      input.latitude !== null && input.longitude !== null
        ? `POINT(${input.longitude} ${input.latitude})`
        : null;

    const { data: inserted, error: insertError } = await dbClient
      .from("incidents")
      .insert({
        reference,
        client_request_id: input.clientRequestId,
        reporter_id: reporterId,
        reporting_mode: input.reportingMode,
        category: input.category,
        description: fullDescription,
        status: "submitted",
        location: locationPoint,
        location_text: input.locationText || null,
        location_accuracy_m: input.locationAccuracyM,
        location_is_approximate: input.locationIsApproximate,
        audio_path: audioPath,
        audio_duration_ms: input.audioDurationMs,
        audio_permission_state: input.audioPermissionState,
      })
      .select("id, reference")
      .single();

    if (insertError) {
      // Handle race-condition duplicate on unique client_request_id
      if (insertError.code === "23505") {
        const { data: raceExisting } = await dbClient
          .from("incidents")
          .select("reference")
          .eq("client_request_id", input.clientRequestId)
          .maybeSingle();

        if (raceExisting) {
          return NextResponse.json(
            {
              ok: true,
              data: {
                reference: raceExisting.reference,
                duplicate: true,
              },
            },
            { status: 200 },
          );
        }
      }

      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 },
      );
    }

    // Fire-and-forget post-submission RAKSHAK AI analysis; never delays the response
    if (adminClient) {
      const incidentId = inserted.id;
      after(async () => {
        try {
          const aiResult = await analyzeWithRakshakAi({
            description: input.description,
            reportedCategory: input.category,
            approximateArea: input.locationText || null,
          });

          if (!aiResult.ok) {
            await adminClient.from("audit_logs").insert({
              action: "ai_analysis_failed",
              entity: "incidents",
              entity_id: incidentId,
              metadata: { error: aiResult.error },
            });
            return;
          }

          await adminClient
            .from("incidents")
            .update({
              ai_suggested_category: aiResult.data.suggested_category,
              ai_suggested_priority: aiResult.data.suggested_priority,
              ai_confidence: aiResult.data.confidence,
            })
            .eq("id", incidentId);

          await adminClient.from("audit_logs").insert({
            action: "ai_analysis_completed",
            entity: "incidents",
            entity_id: incidentId,
            metadata: aiResult.data,
          });
        } catch {
          // AI failure must never affect the submitted incident
        }
      });
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          reference: inserted.reference,
          duplicate: false,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to submit SOS report.",
      },
      { status: 500 },
    );
  }
}

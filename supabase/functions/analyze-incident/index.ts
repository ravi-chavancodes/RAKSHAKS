import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type EmergencyCategory = "human" | "animal_bird" | "fire_rescue";
type SuggestedPriority = "low" | "medium" | "high" | "critical";

interface AiAnalysis {
  suggested_category: EmergencyCategory;
  suggested_priority: SuggestedPriority;
  confidence: number;
  reasoning: string;
}

const VALID_CATEGORIES = new Set<EmergencyCategory>([
  "human",
  "animal_bird",
  "fire_rescue",
]);
const VALID_PRIORITIES = new Set<SuggestedPriority>([
  "low",
  "medium",
  "high",
  "critical",
]);

const FORBIDDEN_PHRASES = [
  /diagnosis/gi,
  /critical injury confirmed/gi,
  /guaranteed/gi,
];

const RAKSHAK_AI_SYSTEM_PROMPT = [
  "You are RAKSHAK AI, a calm, factual emergency coordination assistant for India (supporting 112 / 108 / 101 coordination).",
  "Your role is strictly advisory: suggest an incident category and priority level to help coordinators triage faster.",
  "Never claim a medical diagnosis, never state 'critical injury confirmed', and never use the word 'guaranteed'.",
  "Return ONLY valid JSON with keys: suggested_category ('human' | 'animal_bird' | 'fire_rescue'), suggested_priority ('low' | 'medium' | 'high' | 'critical'), confidence (number 0..1), reasoning (max 2 short, calm sentences).",
].join(" ");

function sanitizeReasoning(raw: string): string {
  let cleaned = raw.trim();
  for (const pattern of FORBIDDEN_PHRASES) {
    cleaned = cleaned.replace(pattern, "assessment");
  }
  return cleaned.slice(0, 400);
}

function stripContactDetails(description: string): string {
  return description.split(/\n\nContact:/)[0]?.trim() ?? description.trim();
}

function extractJsonObject(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}

function isTransientStatus(status: number): boolean {
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function callNvidiaWithRetry(
  apiKey: string,
  model: string,
  payload: { description: string; category: string; area: string | null },
): Promise<AiAnalysis> {
  const endpoint = "https://integrate.api.nvidia.com/v1/chat/completions";
  const userContent = JSON.stringify({
    reported_category: payload.category,
    description: payload.description,
    approximate_area: payload.area ?? "unspecified",
  });

  const body = JSON.stringify({
    model,
    messages: [
      { role: "system", content: RAKSHAK_AI_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: 0.1,
    max_tokens: 200,
    stream: false,
  });

  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body,
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        const error = new Error(
          `NVIDIA API HTTP ${response.status}: ${errText.slice(0, 200)}`,
        );
        if (isTransientStatus(response.status) && attempt < maxRetries) {
          lastError = error;
          await sleep(500 * 2 ** attempt);
          continue;
        }
        throw error;
      }

      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const rawText = json.choices?.[0]?.message?.content;
      if (!rawText) {
        throw new Error("NVIDIA API returned empty message content");
      }

      const parsed = JSON.parse(extractJsonObject(rawText)) as Partial<AiAnalysis>;

      if (
        !parsed.suggested_category ||
        !VALID_CATEGORIES.has(parsed.suggested_category) ||
        !parsed.suggested_priority ||
        !VALID_PRIORITIES.has(parsed.suggested_priority) ||
        typeof parsed.confidence !== "number" ||
        parsed.confidence < 0 ||
        parsed.confidence > 1
      ) {
        throw new Error("NVIDIA API returned schema-invalid payload");
      }

      return {
        suggested_category: parsed.suggested_category,
        suggested_priority: parsed.suggested_priority,
        confidence: Math.round(parsed.confidence * 1000) / 1000,
        reasoning: sanitizeReasoning(parsed.reasoning ?? ""),
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        await sleep(500 * 2 ** attempt);
        continue;
      }
      throw lastError;
    }
  }

  throw lastError ?? new Error("NVIDIA API failed after retries");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const webhookSecret = Deno.env.get("RAKSHAK_WEBHOOK_SECRET");

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json(
      { ok: false, error: "Missing Supabase environment configuration" },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const webhookHeader = req.headers.get("x-rakshak-webhook-secret") ?? "";
  const isServiceCaller = authHeader === `Bearer ${serviceRoleKey}`;
  const isWebhookCaller = Boolean(webhookSecret && webhookHeader === webhookSecret);

  if (!isServiceCaller && !isWebhookCaller) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let incidentId: string | undefined;

  try {
    const body = (await req.json()) as {
      incident_id?: string;
      record?: { id?: string };
    };
    incidentId = body.incident_id ?? body.record?.id;

    if (!incidentId) {
      return Response.json(
        { ok: false, error: "incident_id is required" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: incident, error: fetchError } = await supabase
      .from("incidents")
      .select("id, description, category, location_text")
      .eq("id", incidentId)
      .single();

    if (fetchError || !incident) {
      return Response.json(
        { ok: false, error: "Incident not found" },
        { status: 404 },
      );
    }

    const nvidiaKey = Deno.env.get("NVIDIA_API_KEY");
    const nvidiaModel = Deno.env.get("NVIDIA_MODEL") || "nvidia/nemotron-3.5-bolt-e4b";

    if (!nvidiaKey) {
      await supabase.from("audit_logs").insert({
        action: "ai_analysis_skipped",
        entity: "incidents",
        entity_id: incident.id,
        metadata: { reason: "NVIDIA_API_KEY not configured" },
      });

      return Response.json({ ok: false, status: "ai_unavailable" }, { status: 200 });
    }

    const analysis = await callNvidiaWithRetry(nvidiaKey, nvidiaModel, {
      description: stripContactDetails(incident.description),
      category: incident.category,
      area: incident.location_text,
    });

    const { error: updateError } = await supabase
      .from("incidents")
      .update({
        ai_suggested_category: analysis.suggested_category,
        ai_suggested_priority: analysis.suggested_priority,
        ai_confidence: analysis.confidence,
      })
      .eq("id", incident.id);

    if (updateError) {
      throw new Error(`Failed to persist AI fields: ${updateError.message}`);
    }

    await supabase.from("audit_logs").insert({
      action: "ai_analysis_completed",
      entity: "incidents",
      entity_id: incident.id,
      metadata: {
        model: nvidiaModel,
        suggested_category: analysis.suggested_category,
        suggested_priority: analysis.suggested_priority,
        confidence: analysis.confidence,
      },
    });

    return Response.json({ ok: true, data: analysis }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (incidentId) {
      try {
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        await supabase.from("audit_logs").insert({
          action: "ai_analysis_failed",
          entity: "incidents",
          entity_id: incidentId,
          metadata: { error: message.slice(0, 500) },
        });
      } catch {
        // Never crash on audit log failure
      }
    }

    return Response.json({ ok: false, error: message }, { status: 200 });
  }
});

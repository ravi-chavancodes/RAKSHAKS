import { z } from "zod";
import type { Database } from "@/lib/database.types";
import { err, ok, type Result } from "@/lib/result";

type EmergencyCategory = Database["public"]["Enums"]["emergency_category"];

const DEFAULT_NVIDIA_MODEL = "nvidia/nemotron-3.5-bolt-e4b";
const NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

const rakshakAiSchema = z.object({
  suggested_category: z.enum(["human", "animal_bird", "fire_rescue"]),
  suggested_priority: z.enum(["low", "medium", "high", "critical"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().min(1).max(400),
});

export type RakshakAiAnalysis = z.infer<typeof rakshakAiSchema>;

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

function stripContactDetails(description: string): string {
  return description.split(/\n\nContact:/)[0]?.trim() ?? description.trim();
}

function sanitizeReasoning(raw: string): string {
  let cleaned = raw.trim();
  for (const pattern of FORBIDDEN_PHRASES) {
    cleaned = cleaned.replace(pattern, "assessment");
  }
  return cleaned.slice(0, 400);
}

function extractJsonObject(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return raw.slice(start, end + 1);
  }
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

export async function analyzeWithRakshakAi(input: {
  description: string;
  reportedCategory: EmergencyCategory;
  approximateArea: string | null;
}): Promise<Result<RakshakAiAnalysis, string>> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return err("NVIDIA_API_KEY is not configured.");
  }

  const model = process.env.NVIDIA_MODEL || DEFAULT_NVIDIA_MODEL;
  const userMessage = JSON.stringify({
    reported_category: input.reportedCategory,
    description: stripContactDetails(input.description),
    approximate_area: input.approximateArea ?? "unspecified",
  });

  const maxRetries = 2;
  let lastError = "NVIDIA AI request failed.";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(NVIDIA_CHAT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: RAKSHAK_AI_SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          temperature: 0.1,
          max_tokens: 200,
          stream: false,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        lastError = `NVIDIA API HTTP ${response.status}: ${errText.slice(0, 200)}`;
        if (isTransientStatus(response.status) && attempt < maxRetries) {
          await sleep(500 * 2 ** attempt);
          continue;
        }
        return err(lastError);
      }

      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const rawContent = json.choices?.[0]?.message?.content;
      if (!rawContent) {
        return err("NVIDIA API returned empty message content.");
      }

      const parsedJson = JSON.parse(extractJsonObject(rawContent)) as unknown;
      const validated = rakshakAiSchema.safeParse(parsedJson);
      if (!validated.success) {
        return err(
          `NVIDIA API returned schema-invalid JSON: ${validated.error.issues[0]?.message ?? "invalid"}`,
        );
      }

      return ok({
        suggested_category: validated.data.suggested_category,
        suggested_priority: validated.data.suggested_priority,
        confidence: Math.round(validated.data.confidence * 1000) / 1000,
        reasoning: sanitizeReasoning(validated.data.reasoning),
      });
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt < maxRetries) {
        await sleep(500 * 2 ** attempt);
        continue;
      }
      return err(lastError);
    }
  }

  return err(lastError);
}

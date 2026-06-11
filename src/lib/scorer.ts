import { openai } from "@/lib/openai";
import type { ContentFormat } from "@/lib/prompts";

export interface ContentScore {
  overall: number;
  dimensions: Record<string, number>;
  tip: string;
}

const DIMENSIONS: Partial<Record<ContentFormat, string[]>> = {
  blog:           ["hook", "clarity", "seo_ready", "depth"],
  twitter_thread: ["hook", "virality", "brevity"],
  linkedin:       ["hook", "authority", "engagement"],
  newsletter:     ["subject_line", "hook", "value", "cta"],
  email_sequence: ["subjects", "narrative", "cta"],
};

export async function scoreOutput(content: string, format: ContentFormat): Promise<ContentScore | null> {
  const dims = DIMENSIONS[format];
  if (!dims) return null;

  const dimList = dims.map((d) => `"${d}": <1-10>`).join(", ");
  const prompt = `Score this ${format.replace(/_/g, " ")} content on a 1-10 scale. Return ONLY valid JSON, no other text.

Schema: {"overall": <1-10>, "dimensions": {${dimList}}, "tip": "<one concrete improvement, max 80 chars>"}

Content:
${content.slice(0, 1500)}`;

  try {
    const res = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const text = res.choices[0].message.content ?? "{}";
    const data = JSON.parse(text) as Record<string, unknown>;

    const clamp = (v: unknown) =>
      typeof v === "number" ? Math.min(10, Math.max(1, Math.round(v))) : 5;

    const overall = clamp(data.overall);
    const dimensions: Record<string, number> = {};
    for (const d of dims) {
      dimensions[d] = clamp((data.dimensions as Record<string, unknown>)?.[d]);
    }
    const tip = typeof data.tip === "string" ? data.tip.slice(0, 100) : "";

    return { overall, dimensions, tip };
  } catch {
    return null;
  }
}

export async function scoreJobOutputs(jobId: string): Promise<void> {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: outputs } = await supabase
    .from("outputs")
    .select("id, type, content")
    .eq("job_id", jobId)
    .neq("type", "extras");

  if (!outputs?.length) return;

  await Promise.allSettled(
    (outputs as { id: string; type: string; content: string }[]).map(async (output) => {
      const score = await scoreOutput(output.content, output.type as ContentFormat);
      if (score) {
        await supabase.from("outputs").update({ score }).eq("id", output.id);
      }
    })
  );
}

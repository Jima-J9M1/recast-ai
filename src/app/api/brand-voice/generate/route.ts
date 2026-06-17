import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai";

const SYSTEM = `You are a brand voice strategist. Given a short description of a person or brand, generate a structured brand voice profile.

Respond ONLY with a valid JSON object — no markdown, no explanation, just JSON:
{
  "persona": "2-3 sentences describing who is writing: their role, personality, and authority",
  "audience": "1-2 sentences describing the target reader: who they are, their level, what they care about",
  "style_notes": "4-6 bullet points as a single string, each starting with a dash. Cover tone, sentence length, formatting preferences, what to avoid",
  "key_phrases": "8-12 comma-separated words or short phrases this brand naturally uses",
  "avoid_phrases": "8-12 comma-separated buzzwords or clichés this brand would never say"
}

Rules:
- Be specific and opinionated — generic advice is useless
- Persona should sound like a real person, not a corporate description
- Style notes should be actionable writing rules, not vague adjectives
- Key/avoid phrases should be realistic for this brand's space`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { description?: string };
  const description = (body.description ?? "").trim();
  if (!description || description.length < 10) {
    return Response.json({ error: "Description too short" }, { status: 400 });
  }
  if (description.length > 1000) {
    return Response.json({ error: "Description too long (max 1000 chars)" }, { status: 400 });
  }

  const response = await openai.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: `Generate a brand voice profile for:\n\n${description}` },
    ],
    max_tokens: 600,
    temperature: 0.8,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0].message.content ?? "{}";

  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(raw) as Record<string, string>;
  } catch {
    return Response.json({ error: "AI returned invalid JSON" }, { status: 500 });
  }

  const result = {
    persona:       String(parsed.persona       ?? "").trim(),
    audience:      String(parsed.audience      ?? "").trim(),
    style_notes:   String(parsed.style_notes   ?? "").trim(),
    key_phrases:   String(parsed.key_phrases   ?? "").trim(),
    avoid_phrases: String(parsed.avoid_phrases ?? "").trim(),
  };

  return Response.json({ brand_voice: result });
}

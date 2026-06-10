import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are a helpful content assistant. You have access to the full transcript of a video/audio that the user processed. Answer questions about the content, help brainstorm ideas, suggest improvements to the generated content, or discuss the topics covered.

Be concise and practical. When referencing specific parts of the transcript, quote briefly.

Transcript:
{transcript}`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { messages?: unknown };
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: "messages array required" }, { status: 400 });
  }

  const messages: Message[] = (body.messages as unknown[])
    .filter((m): m is Message =>
      typeof m === "object" && m !== null &&
      ((m as Message).role === "user" || (m as Message).role === "assistant") &&
      typeof (m as Message).content === "string"
    )
    .slice(-20); // keep last 20 turns to stay within token budget

  if (messages.length === 0) {
    return Response.json({ error: "No valid messages provided" }, { status: 400 });
  }

  // Load the job — must belong to this user
  const { data: job } = await supabase
    .from("jobs")
    .select("id, transcript, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });
  if (job.status !== "completed") {
    return Response.json({ error: "Job has no content yet" }, { status: 400 });
  }
  if (!job.transcript) {
    return Response.json({ error: "No transcript available for this job" }, { status: 400 });
  }

  const systemPrompt = SYSTEM_PROMPT.replace("{transcript}", job.transcript.slice(0, 6000));

  const response = await openai.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    max_tokens: 600,
    temperature: 0.7,
  });

  const reply = response.choices[0].message.content ?? "";
  return Response.json({ reply });
}

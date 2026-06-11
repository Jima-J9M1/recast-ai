import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scoreJobOutputs } from "@/lib/scorer";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: job } = await supabase
    .from("jobs")
    .select("id, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!job) return Response.json({ error: "Not found" }, { status: 404 });
  if (job.status !== "completed") return Response.json({ error: "Job not completed yet" }, { status: 400 });

  await scoreJobOutputs(id);

  const { data: outputs } = await supabase
    .from("outputs")
    .select("id, type, score")
    .eq("job_id", id);

  return Response.json({ outputs: outputs ?? [] });
}

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Verify the output belongs to this user (via job ownership)
  const { data: output } = await supabase
    .from("outputs")
    .select("id, starred, jobs!inner(user_id)")
    .eq("id", id)
    .eq("jobs.user_id", user.id)
    .single();

  if (!output) return Response.json({ error: "Not found" }, { status: 404 });

  const newStarred = !output.starred;
  await supabase.from("outputs").update({ starred: newStarred }).eq("id", id);

  return Response.json({ starred: newStarred });
}

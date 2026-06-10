import { createClient } from "@/lib/supabase/server";
import { createClient as svcClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const admin = svcClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await admin
    .from("outputs")
    .select("id, type, content, version, created_at, starred, job_id, jobs!inner(title, source_url, user_id)")
    .eq("starred", true)
    .eq("jobs.user_id", user.id)
    .order("created_at", { ascending: false });

  const outputs = (data ?? []).map((o: Record<string, unknown>) => {
    const job = o.jobs as { title?: string; source_url?: string } | null;
    return {
      id: o.id,
      type: o.type,
      content: o.content,
      version: o.version,
      created_at: o.created_at,
      starred: o.starred,
      job_id: o.job_id,
      job_title: job?.title ?? null,
      job_source_url: job?.source_url ?? null,
    };
  });

  return Response.json({ outputs });
}

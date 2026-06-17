import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWeeklyRecapEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET ?? ""}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: users } = await supabase
    .from("users")
    .select("id, email, full_name, email_notifications")
    .eq("email_notifications", true)
    .not("email", "is", null);

  if (!users?.length) return Response.json({ sent: 0 });

  let sent = 0;
  await Promise.allSettled(
    users.map(async (user: { id: string; email: string; full_name: string | null; email_notifications: boolean }) => {
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, title, status, created_at")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("created_at", weekAgo)
        .order("created_at", { ascending: false });

      if (!jobs?.length) return;

      await sendWeeklyRecapEmail(user.email, user.full_name ?? "there", jobs as { id: string; title: string | null }[]);
      sent++;
    })
  );

  return Response.json({ sent });
}

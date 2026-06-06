import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { full_name?: string };
  const name = body.full_name?.trim() ?? "";
  if (!name) return Response.json({ error: "Name is required" }, { status: 400 });

  const { error } = await supabase
    .from("users")
    .update({ full_name: name })
    .eq("id", user.id);

  if (error) return Response.json({ error: "Failed to update profile" }, { status: 500 });
  return Response.json({ success: true });
}

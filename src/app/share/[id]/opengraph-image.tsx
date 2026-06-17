import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: job } = await supabase
    .from("jobs")
    .select("title, source_url")
    .eq("id", id)
    .single();

  const title = job?.title ?? "Generated content";
  const source = job?.source_url ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0e0c0a",
          padding: "64px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Top badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "auto" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "#d97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            ⚡
          </div>
          <span style={{ color: "#f59e0b", fontSize: "16px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            RecastAI
          </span>
        </div>

        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <p
            style={{
              fontSize: title.length > 60 ? "40px" : "52px",
              fontWeight: 800,
              color: "#faf7f2",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              margin: 0,
              maxWidth: "900px",
            }}
          >
            {title}
          </p>

          {/* Format pills */}
          <div style={{ display: "flex", gap: "10px" }}>
            {["Blog Post", "Twitter Thread", "LinkedIn", "Newsletter"].map((f) => (
              <div
                key={f}
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  background: "rgba(245,158,11,0.12)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  color: "#fbbf24",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {f}
              </div>
            ))}
          </div>

          {/* Source */}
          {source && (
            <p style={{ color: "rgba(250,247,242,0.3)", fontSize: "15px", margin: 0, marginTop: "8px" }}>
              {source.length > 70 ? source.slice(0, 70) + "…" : source}
            </p>
          )}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "48px",
            paddingTop: "24px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span style={{ color: "rgba(250,247,242,0.4)", fontSize: "15px" }}>
            4 content formats · Generated in ~30s
          </span>
          <span style={{ color: "#f59e0b", fontSize: "15px", fontWeight: 600 }}>
            recastai.co →
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}

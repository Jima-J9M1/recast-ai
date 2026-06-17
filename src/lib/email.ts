import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = "RecastAI <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://recastai.co";

export async function sendJobCompletedEmail(
  to: string,
  jobTitle: string,
  jobId: string
): Promise<void> {
  if (!resend) return;

  const jobUrl = `${APP_URL}/jobs/${jobId}`;
  const displayTitle = jobTitle || "Your video";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your content is ready — ${displayTitle}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#0e0c0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0c0a;padding:48px 24px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#161310;border-radius:16px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.05);">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#d97706;border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;">
                  <span style="color:#fff;font-size:16px;font-weight:700;">⚡</span>
                </td>
                <td style="padding-left:10px;color:#faf7f2;font-size:16px;font-weight:700;letter-spacing:-0.01em;">RecastAI</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px 28px;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#faf7f2;letter-spacing:-0.02em;">Your content is ready ✓</p>
            <p style="margin:0 0 24px;font-size:15px;color:rgba(250,247,242,0.5);line-height:1.6;">
              We finished processing <strong style="color:rgba(250,247,242,0.8);">${displayTitle}</strong>. Your blog post, Twitter thread, LinkedIn post, and newsletter are waiting.
            </p>
            <a href="${jobUrl}" style="display:inline-block;background:#d97706;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;">
              View your content →
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 28px;border-top:1px solid rgba(255,255,255,0.05);">
            <p style="margin:0;font-size:12px;color:rgba(250,247,242,0.25);">
              You're receiving this because you have job notifications enabled.
              <a href="${APP_URL}/settings" style="color:rgba(245,158,11,0.7);text-decoration:none;">Manage preferences</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendWeeklyRecapEmail(
  to: string,
  name: string,
  jobs: { id: string; title: string | null }[]
): Promise<void> {
  if (!resend) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://recastai.co";

  const jobList = jobs
    .slice(0, 5)
    .map(
      (j) =>
        "<li style='margin:6px 0;color:rgba(250,247,242,0.7);font-size:14px;'>" +
        "<a href='" + appUrl + "/jobs/" + j.id + "' style='color:#f59e0b;text-decoration:none;'>" +
        (j.title ?? "Untitled") +
        "</a></li>"
    )
    .join("");

  const count = jobs.length;
  const plural = count === 1 ? "" : "s";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Your RecastAI week — ${count} piece${plural} created`,
    html:
      "<!DOCTYPE html><html><head><meta charset='utf-8'/></head>" +
      "<body style='margin:0;padding:0;background:#0e0c0a;font-family:-apple-system,BlinkMacSystemFont,sans-serif;'>" +
      "<table width='100%' cellpadding='0' cellspacing='0' style='background:#0e0c0a;padding:48px 24px;'>" +
      "<tr><td align='center'>" +
      "<table width='560' cellpadding='0' cellspacing='0' style='background:#161310;border-radius:16px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;'>" +
      "<tr><td style='padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.05);'>" +
      "<span style='color:#faf7f2;font-size:16px;font-weight:700;'>⚡ RecastAI</span>" +
      "</td></tr>" +
      "<tr><td style='padding:36px 40px 28px;'>" +
      "<p style='margin:0 0 8px;font-size:22px;font-weight:700;color:#faf7f2;letter-spacing:-0.02em;'>" +
      "Your week in content, " + name + " 👋" +
      "</p>" +
      "<p style='margin:0 0 24px;font-size:15px;color:rgba(250,247,242,0.5);line-height:1.6;'>" +
      "You created <strong style='color:#fbbf24;'>" + count + " piece" + plural + "</strong> of content this week. Here&apos;s a quick look:" +
      "</p>" +
      "<ul style='padding-left:20px;margin:0 0 28px;'>" + jobList + "</ul>" +
      "<a href='" + appUrl + "/new' style='display:inline-block;background:#d97706;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;'>" +
      "Create more content &rarr;" +
      "</a>" +
      "</td></tr>" +
      "<tr><td style='padding:20px 40px 28px;border-top:1px solid rgba(255,255,255,0.05);'>" +
      "<p style='margin:0;font-size:12px;color:rgba(250,247,242,0.25);'>" +
      "<a href='" + appUrl + "/settings' style='color:rgba(245,158,11,0.7);text-decoration:none;'>Manage notification preferences</a>" +
      "</p>" +
      "</td></tr>" +
      "</table></td></tr></table>" +
      "</body></html>",
  });
}

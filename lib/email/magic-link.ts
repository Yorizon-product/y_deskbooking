/**
 * Yorizon-branded magic-link email.
 * Light-mode palette only — many email clients ignore @media (prefers-color-scheme)
 * or inject their own styles, so committing to one palette is more predictable than
 * trying to match the app's runtime theme. Dark olive + lime still reads as Yorizon.
 */

type RenderArgs = { url: string; host: string; appUrl: string };

export function renderMagicLinkHtml({ url, host, appUrl }: RenderArgs): string {
  const preheader = `Your single-use sign-in link for y_deskbooking. Expires in 24 hours.`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sign in to y_deskbooking</title>
</head>
<body style="margin:0;padding:0;background:#fafaf5;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1c14;">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</span>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#fafaf5;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="520" style="width:520px;max-width:100%;background:#ffffff;border:1px solid #d8d9cc;border-radius:12px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #e8eadb;background:#f5f5ef;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="font-size:15px;font-weight:600;letter-spacing:-0.01em;color:#1a1c14;">
                    <span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#defe19;vertical-align:middle;margin-right:10px;border:1px solid #3e4227;"></span>
                    y_deskbooking
                  </td>
                  <td align="right" style="font-size:12px;color:#6b6e5a;">
                    Magic-link sign-in
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 32px 24px;">
              <p style="margin:0 0 12px;font-size:12px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:#6b6e5a;">
                Sign in request
              </p>
              <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:600;letter-spacing:-0.01em;color:#1a1c14;">
                Click below to sign in
              </h1>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.55;color:#3e4227;">
                Someone asked to sign in to <strong style="color:#1a1c14;">y_deskbooking</strong> using this email address. If that was you, use the button below. The link only works once and expires in 24 hours.
              </p>

              <!-- CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;">
                <tr>
                  <td align="center" bgcolor="#3e4227" style="border-radius:8px;">
                    <a href="${escapeAttr(url)}" target="_blank" rel="noopener" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;letter-spacing:-0.005em;color:#defe19;background:#3e4227;border-radius:8px;text-decoration:none;border:1px solid #3e4227;">
                      Sign in to y_deskbooking
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 10px;font-size:13px;color:#6b6e5a;">
                Or paste this URL into your browser:
              </p>
              <p style="margin:0 0 24px;font-size:12px;line-height:1.5;color:#6b6e5a;word-break:break-all;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">
                <a href="${escapeAttr(url)}" style="color:#3e4227;text-decoration:underline;">${escapeHtml(url)}</a>
              </p>

              <hr style="border:none;border-top:1px solid #e8eadb;margin:24px 0;">

              <p style="margin:0;font-size:13px;line-height:1.55;color:#6b6e5a;">
                Didn&rsquo;t request this? You can safely ignore this email &mdash; nothing will change on your account.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background:#f5f5ef;border-top:1px solid #e8eadb;font-size:12px;color:#6b6e5a;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    Sent by y_deskbooking &middot;
                    <a href="${escapeAttr(appUrl)}" style="color:#3e4227;text-decoration:underline;">${escapeHtml(host)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <p style="margin:20px 0 0;font-size:11px;color:#a3a88c;">
          Hot-desking, without the spreadsheet.
        </p>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderMagicLinkText({ url, host }: Pick<RenderArgs, "url" | "host">): string {
  return [
    `Sign in to y_deskbooking`,
    ``,
    `Someone asked to sign in to y_deskbooking (${host}) using this email address.`,
    `If that was you, open the link below. It only works once and expires in 24 hours.`,
    ``,
    url,
    ``,
    `Didn't request this? You can safely ignore this email.`,
  ].join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

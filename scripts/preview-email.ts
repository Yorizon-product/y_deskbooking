import { writeFileSync, mkdirSync } from "node:fs";
import { renderMagicLinkHtml, renderMagicLinkText } from "../lib/email/magic-link";

const url = "http://localhost:3000/api/auth/callback/resend?token=PREVIEW_TOKEN_123&email=you%40example.com";
const host = new URL(url).host;

mkdirSync("docs/screenshots", { recursive: true });
writeFileSync("docs/screenshots/magic-link-email.html", renderMagicLinkHtml({ url, host, appUrl: "http://localhost:3000" }));
writeFileSync("docs/screenshots/magic-link-email.txt", renderMagicLinkText({ url, host }));
console.log("wrote docs/screenshots/magic-link-email.{html,txt}");

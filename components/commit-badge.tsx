/**
 * Tiny commit badge, rendered on the sign-in page footer. The SHA is inlined
 * at build time via `next.config.ts`, sourced from Vercel's auto-populated
 * VERCEL_GIT_COMMIT_SHA (falling back to `git rev-parse HEAD` locally).
 * Every commit → new deploy → new SHA; no runtime work required.
 */

export function CommitBadge({ className }: { className?: string }) {
  const sha = process.env.NEXT_PUBLIC_COMMIT_SHA ?? "";
  if (!sha) return null;

  const owner = process.env.NEXT_PUBLIC_REPO_OWNER || "Yorizon-product";
  const repo = process.env.NEXT_PUBLIC_REPO_SLUG || "y_deskbooking";
  const ref = process.env.NEXT_PUBLIC_COMMIT_REF || "";
  const short = sha.slice(0, 7);
  const href = `https://github.com/${owner}/${repo}/commit/${sha}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[1px] text-muted-foreground hover:text-foreground ${className ?? ""}`}
      title={ref ? `${ref} · ${sha}` : sha}
    >
      <span aria-hidden className="h-1 w-1 rounded-full bg-muted-foreground/60" />
      <span>build {short}</span>
    </a>
  );
}

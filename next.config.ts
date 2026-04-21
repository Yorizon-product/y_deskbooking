import type { NextConfig } from "next";
import { execSync } from "node:child_process";

function resolveCommitSha(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA;
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

const commitSha = resolveCommitSha();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_COMMIT_SHA: commitSha,
    NEXT_PUBLIC_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF ?? "",
    NEXT_PUBLIC_REPO_OWNER: process.env.VERCEL_GIT_REPO_OWNER ?? "Yorizon-product",
    NEXT_PUBLIC_REPO_SLUG: process.env.VERCEL_GIT_REPO_SLUG ?? "y_deskbooking",
  },
};

export default nextConfig;

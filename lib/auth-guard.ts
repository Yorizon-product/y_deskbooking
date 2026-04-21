import { auth } from "@/auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  if (session.user.role !== "admin") throw new Error("Not authorised");
  return session.user;
}

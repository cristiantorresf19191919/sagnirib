import "server-only";

import type { Role } from "@/server/auth";
import type { AuthenticatedUser } from "./require-auth";

export async function requireRole(
  user: AuthenticatedUser,
  role: Role,
): Promise<void> {
  if (!user.roles.includes(role)) {
    throw new Error(`[security] user ${user.uid} missing role "${role}"`);
  }
}

import "server-only";

import type { AuthenticatedUser } from "./require-auth";

export async function requireRole(
  user: AuthenticatedUser,
  role: string,
): Promise<void> {
  if (!user.roles.includes(role)) {
    throw new Error(`[security] user ${user.uid} missing role "${role}"`);
  }
}

#!/usr/bin/env node
/**
 * Security audit gate.
 * Phase: documentary checklist (foundation).
 * TODO(F5): scan Server Actions for auth/authorization/schema patterns;
 * flag any mutation that skips validate-action-input or requireAuth.
 *
 * Reference: docs/security/server-actions-policy.md
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const policyPath = resolve("docs/security/server-actions-policy.md");

try {
  await readFile(policyPath, "utf8");
  console.log("[security:audit] policy present:", policyPath);
  console.log("[security:audit] manual review required.");
  process.exit(0);
} catch (err) {
  console.error("[security:audit] missing", policyPath, err);
  process.exit(1);
}

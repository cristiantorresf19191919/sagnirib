#!/usr/bin/env node
/**
 * Design audit gate.
 * Phase: documentary checklist (foundation).
 * TODO(F4): scan for hex colors / arbitrary spacing in src/** outside
 * design-system tokens; flag drift.
 *
 * Reference: docs/branding/design-governance.md
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const checklistPath = resolve("docs/branding/design-governance.md");

try {
  await readFile(checklistPath, "utf8");
  console.log("[design:audit] governance doc present:", checklistPath);
  console.log("[design:audit] manual review required.");
  process.exit(0);
} catch (err) {
  console.error("[design:audit] missing", checklistPath, err);
  process.exit(1);
}

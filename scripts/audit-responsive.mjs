#!/usr/bin/env node
/**
 * Responsive audit gate.
 * Phase: documentary checklist (foundation).
 * TODO(F4+): cross-check approved public routes against
 * docs/responsive/routes/<route>.md; fail if a public route has no
 * Responsive Route Contract.
 *
 * Reference: docs/release/responsive-checklist.md
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const checklistPath = resolve("docs/release/responsive-checklist.md");

try {
  await readFile(checklistPath, "utf8");
  console.log("[responsive:audit] checklist present:", checklistPath);
  console.log("[responsive:audit] manual review required.");
  process.exit(0);
} catch (err) {
  console.error("[responsive:audit] missing", checklistPath, err);
  process.exit(1);
}

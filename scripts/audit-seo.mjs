#!/usr/bin/env node
/**
 * SEO audit gate.
 * Phase: documentary checklist (foundation).
 * TODO(F4): replace with AST/route-scan validation that asserts every
 * indexable route has an approved SEO Route Contract under docs/seo/routes/.
 *
 * Reference: docs/seo/seo-release-checklist.md
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const checklistPath = resolve("docs/seo/seo-release-checklist.md");

try {
  const text = await readFile(checklistPath, "utf8");
  console.log("[seo:audit] checklist found:", checklistPath);
  console.log("[seo:audit] manual review required. See:");
  console.log(text.split("\n").slice(0, 10).join("\n"));
  process.exit(0);
} catch (err) {
  console.error("[seo:audit] missing checklist at", checklistPath, err);
  process.exit(1);
}

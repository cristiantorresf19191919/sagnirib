#!/usr/bin/env node
/**
 * Architecture-patterns audit gate.
 * Phase: documentary checklist (foundation).
 * TODO(F5+): inspect features/** for: lógica pesada en page/layout, SDKs
 * fuera de adapters, Client Components que deberían ser servidor.
 *
 * Reference: docs/architecture/patterns-governance.md
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const docPath = resolve("docs/architecture/patterns-governance.md");

try {
  await readFile(docPath, "utf8");
  console.log("[patterns:audit] governance doc present:", docPath);
  console.log("[patterns:audit] manual review required.");
  process.exit(0);
} catch (err) {
  console.error("[patterns:audit] missing", docPath, err);
  process.exit(1);
}

#!/usr/bin/env node
/**
 * Firebase data-ownership audit (ADR-010 enforcement).
 *
 * Mechanical checks for the boundaries laid out in:
 *   docs/adr/ADR-010-firebase-data-ownership.md
 *   .claude/rules/firebase-data-ownership.md
 *   docs/architecture/firebase-governance.md
 *
 * Run: pnpm firebase:audit
 *
 * Exit code: 0 = clean, 1 = at least one violation. The script prints every
 * violation with file path, line, and the rule that failed, so the fix is
 * obvious. There is no `--fix` mode — boundaries get fixed by humans.
 */

import { readFile } from "node:fs/promises";
import { resolve, sep, posix, relative } from "node:path";
import { readdirSync } from "node:fs";

const ROOT = resolve(process.cwd());

/**
 * Each rule is a structured assertion. Authors add a rule by appending here.
 *
 *   - id          : short kebab-case identifier shown in the output
 *   - description : one-line summary of what the rule enforces
 *   - reference   : pointer to the ADR / rule file
 *   - scan        : { include: glob[], exclude: glob[] } over the repo
 *   - flag        : RegExp matched per line — a hit is a violation
 *   - message     : explanation + the correct path to take
 */
const RULES = [
  {
    id: "admin-sdk-fence",
    description: "firebase-admin/* may only be imported from server adapters, mappers, and seed scripts",
    reference: "ADR-010 §1",
    scan: {
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: [
        "src/server/adapters/firebase/**",
        "src/server/mappers/firebase-*.ts",
      ],
    },
    flag: /from\s+["']firebase-admin(\/[^"']*)?["']/,
    message: "Move the call behind the appropriate adapter under src/server/adapters/firebase/<port>/, then expose it through the barrel.",
  },
  {
    id: "admin-storage-fence",
    description: "firebase-admin/storage may only be imported from the storage adapter subdir",
    reference: "ADR-012 § Bucket layout",
    scan: {
      include: ["src/server/adapters/firebase/**"],
      exclude: ["src/server/adapters/firebase/storage/**"],
    },
    flag: /from\s+["']firebase-admin\/storage["']/,
    message: "Cloud Storage access lives in src/server/adapters/firebase/storage/ exclusively. Expose what you need through @/server/storage.",
  },
  {
    id: "web-sdk-fence",
    description: "firebase/* (Web SDK) may only be imported from src/features/auth/lib/**",
    reference: "ADR-010 §1",
    scan: {
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/features/auth/lib/**"],
    },
    flag: /from\s+["']firebase\/(app|auth|firestore|storage|functions|messaging)["']/,
    message: "Use the useAuthSession() hook from src/features/auth/lib/. If you need a method it doesn't expose, extend the hook + Server Action.",
  },
  {
    id: "server-env-fence",
    description: "FIREBASE_* env vars are read only in the server config module and the seed script",
    reference: "ADR-010 §2",
    scan: {
      include: ["src/**/*.ts", "src/**/*.tsx", "scripts/**/*.ts", "scripts/**/*.mjs"],
      exclude: [
        "src/core/config/firebase.ts",
        "scripts/seed-firebase.ts",
      ],
    },
    flag: /process\.env\.FIREBASE_[A-Z_]+/,
    message: "Read via getFirebaseConfig() / requireFirebaseConfig() from @/core/config/firebase.",
  },
  {
    id: "client-env-fence",
    description: "NEXT_PUBLIC_FIREBASE_* env vars are read only in the client config module",
    reference: "ADR-010 §2",
    scan: {
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/core/config/firebase-client.ts"],
    },
    flag: /process\.env\.NEXT_PUBLIC_FIREBASE_[A-Z_]+/,
    message: "Read via getFirebaseClientConfig() / isFirebaseClientConfigured() from @/core/config/firebase-client.",
  },
  {
    id: "barrel-only-imports",
    description: "Features must import from @/server/<port>, never from adapters or mocks directly",
    reference: "ADR-010 §3",
    scan: {
      include: ["src/features/**/*.ts", "src/features/**/*.tsx", "src/app/**/*.ts", "src/app/**/*.tsx"],
      // Exception: the dev-only mock storage ingestion endpoints ARE the
      // mock's edge (see ADR-012 § "Out of scope", ADR-015 § Dev preview).
      // They must read from the in-memory store directly. The endpoints
      // themselves return 404 in configured environments
      // (`isFirebaseConfigured()` guard).
      exclude: [
        "src/app/api/_storage-mock/**",
        "src/app/api/_storage-mock-read/**",
      ],
    },
    flag: /from\s+["']@\/server\/(adapters|mocks)\//,
    message: "Import from the port barrel: @/server/biringas, @/server/auth, etc.",
  },
  {
    id: "raw-helper-fence",
    description: "*Raw helpers (e.g. getPrivateContactRaw) must not be imported by features or barrels' public surface",
    reference: "ADR-010 §4",
    scan: {
      include: ["src/features/**/*.ts", "src/features/**/*.tsx", "src/app/**/*.ts", "src/app/**/*.tsx"],
      exclude: [],
    },
    flag: /\b(get|list|find|fetch|read|load)\w*Raw\b/,
    message: "Use the auth-wrapped barrel function (e.g. getPrivateContact). Raw helpers are adapter-internal.",
  },
  {
    id: "session-cookie-fence",
    description: "__session cookie name is read or written only inside the auth adapter",
    reference: "ADR-010 §1, §4",
    scan: {
      include: ["src/**/*.ts", "src/**/*.tsx", "proxy.ts"],
      exclude: ["src/server/adapters/firebase/auth/**", "src/server/mocks/auth/**"],
    },
    flag: /["']__session["']/,
    message: "Use getSession() / createSession() / destroySession() from @/server/auth.",
  },
  {
    id: "collection-string-fence",
    description: "Hardcoded Firestore collection names live only in adapters and scripts",
    reference: "ADR-010 §3",
    scan: {
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/server/adapters/firebase/**"],
    },
    flag: /\.collection\(\s*["']\w+["']\s*\)/,
    message: "Collection access goes through the adapter. If you need a new query, extend the adapter and barrel.",
  },
  {
    id: "no-parallel-fake-data",
    description: "Demo / sample / fixture arrays of domain objects live only in src/server/mocks/",
    reference: "ADR-010, .claude/rules/firebase-data-ownership.md §9",
    scan: {
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/server/mocks/**"],
    },
    // Detect const declarations of likely-fake data arrays.
    flag: /(?:const|let|var|export\s+const)\s+(?:MOCK|DEMO|SAMPLE|FAKE|SEED|FIXTURE)_[A-Z_]+\s*[:=]/,
    message: "Reuse the canonical mock under src/server/mocks/<port>/. Do not fork fake data.",
  },
  // Note: a separate "no direct initializeApp" rule was considered and dropped
  // — admin-sdk-fence already prevents Admin SDK init outside client.ts, and
  // the Web SDK's initializeApp is a distinct function legitimately called in
  // src/features/auth/lib/firebase-client.ts.
];

// ---------- Glob helpers (no extra deps) ---------------------------------

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = `${dir}${sep}${entry.name}`;
    if (entry.isDirectory()) {
      // Skip node_modules and build outputs aggressively for speed.
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === ".turbo" ||
        entry.name === "out" ||
        entry.name === "build" ||
        entry.name === ".git" ||
        entry.name === "coverage"
      ) {
        continue;
      }
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

/**
 * Match a single posix path against an extremely small subset of glob:
 * - `*` matches one path segment (no `/`)
 * - `**` matches any number of segments
 * - other characters are literal
 *
 * Enough for the include/exclude patterns we actually use here.
 */
function globToRegex(glob) {
  let re = "^";
  let i = 0;
  while (i < glob.length) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        re += ".*";
        i += 2;
        if (glob[i] === "/") i += 1;
      } else {
        re += "[^/]*";
        i += 1;
      }
    } else if (".+^$()|\\".includes(c)) {
      re += "\\" + c;
      i += 1;
    } else {
      re += c;
      i += 1;
    }
  }
  re += "$";
  return new RegExp(re);
}

function fileMatches(relPosix, patterns) {
  return patterns.some((p) => globToRegex(p).test(relPosix));
}

function shouldScan(relPosix, scan) {
  if (scan.include.length > 0 && !fileMatches(relPosix, scan.include)) return false;
  if (scan.exclude.length > 0 && fileMatches(relPosix, scan.exclude)) return false;
  return true;
}

function toPosix(p) {
  return p.split(sep).join(posix.sep);
}

// ---------- Runner -------------------------------------------------------

async function loadCandidateFiles() {
  const files = new Map(); // relPosix -> contents
  for (const abs of walk(ROOT)) {
    if (!/\.(ts|tsx|mjs)$/.test(abs)) continue;
    const relPosix = toPosix(relative(ROOT, abs));
    // Cheap pre-filter: no rule scans outside src/, scripts/, or proxy.ts.
    if (
      !relPosix.startsWith("src/") &&
      !relPosix.startsWith("scripts/") &&
      relPosix !== "proxy.ts"
    ) {
      continue;
    }
    files.set(relPosix, await readFile(abs, "utf8"));
  }
  return files;
}

function stripComments(line) {
  return line
    .replaceAll(/\/\/.*$/g, "")
    .replaceAll(/\/\*[\s\S]*?\*\//g, "");
}

function findViolationsForRule(rule, files) {
  const out = [];
  for (const [relPosix, source] of files) {
    if (!shouldScan(relPosix, rule.scan)) continue;
    const lines = source.split("\n");
    for (let i = 0; i < lines.length; i++) {
      // Strip comments before flagging — comments may legitimately mention
      // forbidden tokens (e.g. ADR references).
      if (rule.flag.test(stripComments(lines[i]))) {
        out.push({
          rule: rule.id,
          reference: rule.reference,
          description: rule.description,
          file: relPosix,
          line: i + 1,
          text: lines[i].trim(),
          message: rule.message,
        });
      }
    }
  }
  return out;
}

function reportViolations(violations) {
  console.error(
    `[firebase:audit] ${violations.length} violation(s) across ${new Set(violations.map((v) => v.file)).size} file(s):\n`,
  );
  const byRule = new Map();
  for (const v of violations) {
    if (!byRule.has(v.rule)) byRule.set(v.rule, []);
    byRule.get(v.rule).push(v);
  }
  for (const [ruleId, vs] of byRule) {
    const first = vs[0];
    console.error(`▶ ${ruleId}  (${first.reference})`);
    console.error(`  ${first.description}`);
    console.error(`  → ${first.message}`);
    for (const v of vs) {
      console.error(`    ${v.file}:${v.line}  ${v.text}`);
    }
    console.error("");
  }
  console.error(
    "Refusing to pass. See docs/architecture/firebase-governance.md for the correct path per scenario.",
  );
}

const files = await loadCandidateFiles();
const violations = RULES.flatMap((rule) => findViolationsForRule(rule, files));

if (violations.length === 0) {
  console.log("[firebase:audit] clean — all", RULES.length, "rules satisfied.");
  process.exit(0);
}

reportViolations(violations);
process.exit(1);

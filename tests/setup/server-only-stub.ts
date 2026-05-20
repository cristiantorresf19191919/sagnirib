/**
 * Vitest stub for the `server-only` package.
 *
 * The real package throws at module-load time if imported outside a React
 * Server Components environment. Tests need to exercise pure helpers that
 * live under `src/server/...` (schemas, mappers) without the bundler
 * boundary the package was designed for. Replacing the import with this
 * empty module restores test access without weakening the rule in
 * production code — the Next.js compiler still applies the real package.
 */
export {};

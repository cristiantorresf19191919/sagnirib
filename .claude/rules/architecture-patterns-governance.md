# Rule: Architecture patterns governance

1. Choose patterns based on real problems, not aesthetics.
2. Adapter / Builder / Strategy / Observer (real bus) / Command / Mapper / State Machine require a Pattern Decision Record in `docs/architecture/patterns-governance.md`.
3. Heavy logic stays out of `page.tsx` / `layout.tsx`.
4. External SDKs live behind `src/server/adapters/<provider>/`.

Reference: ADR-006, Addendum 002.

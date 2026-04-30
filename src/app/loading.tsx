export default function Loading() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div
        className="h-8 w-8 animate-pulse rounded-full bg-[var(--color-brand-primary)]/40"
        aria-hidden
      />
      <span className="sr-only">Cargando…</span>
    </main>
  );
}

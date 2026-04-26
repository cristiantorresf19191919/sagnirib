export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold">404</h1>
      <p className="text-[var(--color-text-muted)]">
        La página que buscas no existe.
      </p>
    </main>
  );
}

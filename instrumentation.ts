/**
 * Next.js instrumentation entry — runs once when a server instance starts.
 * Per Next 16 docs (node_modules/next/dist/docs/01-app/02-guides/instrumentation.md),
 * this file lives at the project root.
 *
 * Concrete telemetry wiring (OpenTelemetry / vendor SDK) is deferred until
 * the intake locks an observability provider; for now we only signal boot.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { publishEvent } = await import("@/server/events/publish-event");
    await publishEvent({
      type: "system.boot",
      environment: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
    });
  }
}

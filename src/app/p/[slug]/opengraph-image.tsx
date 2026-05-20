import { ImageResponse } from "next/og";

import { findBySlug } from "@/server/biringas";

/**
 * Dynamic Open Graph image for `/p/[slug]`.
 *
 * Rendered on demand by Next 16's `ImageResponse`. Every share to
 * WhatsApp / Telegram / Twitter shows an editorial card with the
 * listing's hero photo, name, city, and rating — turning every shared
 * link into a tiny recruiting ad.
 *
 * Runs on the Node runtime (the default — explicitly NOT edge) because
 * `findBySlug` reaches into `@/server/biringas`, which transitively
 * pulls `firebase-admin`. Firebase Admin requires Node APIs (`process`,
 * Buffer, native TLS) that the edge runtime does not expose; setting
 * `runtime = "edge"` here crashes at build time with
 * "edge runtime does not support Node.js 'process' module".
 *
 * Fonts use system defaults so no extra ~300 KB font download is
 * incurred on every render. The hero image is fetched via the absolute
 * `mainImage` URL on the listing (we proxy through next/image elsewhere
 * but `ImageResponse` needs a direct fetchable URL — Firebase Storage
 * + Cloudinary etc. all qualify).
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Perfil de Biringas";

interface OgParams {
  params: Promise<{ slug: string }>;
}

const ACCENT = "#2F5D43"; // forest primary
const CREAM = "#F4EFE3";
const INK = "#1A1612";
const GOLD = "#C8A676";

export default async function ProfileOgImage({ params }: OgParams) {
  const { slug } = await params;
  const listing = await findBySlug(slug).catch(() => null);

  if (!listing) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: CREAM,
            fontFamily: "system-ui, sans-serif",
            fontSize: 56,
            color: INK,
          }}
        >
          Biringas
        </div>
      ),
      size,
    );
  }

  const rating = listing.reputation.score.toFixed(1);
  const reviewCount = listing.reputation.reviewCount;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: CREAM,
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Hero photo — left 55% of the canvas, full bleed */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={listing.mainImage}
          alt=""
          width={660}
          height={630}
          style={{
            width: 660,
            height: 630,
            objectFit: "cover",
            display: "block",
          }}
        />

        {/* Right column: gradient fade into cream + editorial copy */}
        <div
          style={{
            position: "absolute",
            left: 540,
            top: 0,
            bottom: 0,
            width: 200,
            background:
              "linear-gradient(90deg, rgba(244,239,227,0) 0%, rgba(244,239,227,1) 100%)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 64px 56px 40px",
            flex: 1,
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Top: brand + verification tag */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              style={{
                width: 12,
                height: 12,
                transform: "rotate(45deg)",
                background: GOLD,
                display: "block",
              }}
            />
            <span
              style={{
                fontSize: 18,
                letterSpacing: 6,
                color: ACCENT,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Biringas
            </span>
            {listing.verified && (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 14,
                  letterSpacing: 4,
                  padding: "6px 14px",
                  border: `1px solid ${ACCENT}`,
                  borderRadius: 999,
                  color: ACCENT,
                  textTransform: "uppercase",
                  fontWeight: 700,
                  display: "flex",
                }}
              >
                Verificada
              </span>
            )}
          </div>

          {/* Middle: name + city. Big serif-feel via font weight + size. */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span
              style={{
                fontSize: 84,
                lineHeight: 1.02,
                color: INK,
                fontWeight: 500,
                letterSpacing: -2,
                display: "flex",
              }}
            >
              {listing.name}
              <span
                style={{
                  fontSize: 56,
                  fontWeight: 300,
                  fontStyle: "italic",
                  color: ACCENT,
                  marginLeft: 16,
                  alignSelf: "flex-end",
                  paddingBottom: 12,
                  display: "flex",
                }}
              >
                , {listing.age}
              </span>
            </span>
            <span
              style={{
                fontSize: 28,
                color: "#6B6258",
                letterSpacing: -0.4,
                display: "flex",
              }}
            >
              {listing.neighborhood
                ? `${listing.neighborhood}, ${listing.city}`
                : listing.city}
            </span>
          </div>

          {/* Bottom: rating + review count + CTA hint */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 18,
            }}
          >
            {reviewCount > 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 20px",
                  background: "#FFFFFF",
                  borderRadius: 999,
                  border: `1px solid ${ACCENT}33`,
                }}
              >
                <span
                  style={{
                    fontSize: 24,
                    color: GOLD,
                    display: "flex",
                  }}
                >
                  ★
                </span>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: INK,
                    display: "flex",
                  }}
                >
                  {rating}
                </span>
                <span
                  style={{
                    fontSize: 18,
                    color: "#6B6258",
                    display: "flex",
                  }}
                >
                  · {reviewCount} reseña{reviewCount === 1 ? "" : "s"}
                </span>
              </div>
            ) : (
              <span style={{ display: "flex" }} />
            )}
            <span
              style={{
                fontSize: 16,
                letterSpacing: 3,
                color: "#6B6258",
                textTransform: "uppercase",
                fontWeight: 600,
                display: "flex",
              }}
            >
              biringas.netlify.app
            </span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}

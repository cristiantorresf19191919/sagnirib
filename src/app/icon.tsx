import { ImageResponse } from "next/og";

/**
 * Programmatic 512x512 PWA / favicon icon. Editorial mark — gold
 * diamond on a forest disc inside a cream square. No PNG file needed;
 * Next 16 generates this on demand and caches the result.
 */
export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

const FOREST = "#2F5D43";
const CREAM = "#F4EFE3";
const GOLD = "#C8A676";
const INK = "#1A1612";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: CREAM,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: INK,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: 360,
            height: 360,
            borderRadius: "9999px",
            background: FOREST,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 8px 32px ${FOREST}aa`,
          }}
        >
          {/* Gold diamond — the brand's signature editorial mark. */}
          <div
            style={{
              width: 132,
              height: 132,
              background: GOLD,
              transform: "rotate(45deg)",
              borderRadius: 18,
              boxShadow: `0 0 0 16px ${GOLD}33`,
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";

/**
 * 180x180 Apple touch icon — iOS quirks: no transparency, slight
 * inset (iOS rounds the corners itself), no alpha mask. Same
 * editorial mark as the PWA icon.
 */
export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const FOREST = "#2F5D43";
const CREAM = "#F4EFE3";
const GOLD = "#C8A676";

export default function AppleIcon() {
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
        }}
      >
        <div
          style={{
            width: 128,
            height: 128,
            borderRadius: "9999px",
            background: FOREST,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              background: GOLD,
              transform: "rotate(45deg)",
              borderRadius: 6,
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}

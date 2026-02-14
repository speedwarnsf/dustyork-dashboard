import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "D's Project Command Center";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#000",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            border: "1px solid #1a1a1a",
            padding: "60px 80px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#d2ff5a",
              marginBottom: 16,
            }}
          >
            D&apos;s Command Center
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#555",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Project Dashboard
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

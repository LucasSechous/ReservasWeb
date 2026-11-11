import { ImageResponse } from "next/og";

// Ícono para «Agregar a inicio» en iPhone. Mismo dibujo provisorio que icon.svg.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0c1626",
        }}
      >
        <svg width="132" height="132" viewBox="0 0 64 64">
          <path
            d="M27 14h8v10h10v8H35v12c0 3 1.5 4 4 4h6v8h-7c-7.5 0-11-3.5-11-11V32h-6v-8h6z"
            fill="#3ddc97"
          />
        </svg>
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";
import { TRAZO_CALENDARIO } from "@/components/logo";

// Ícono para «Agregar a inicio» en iPhone. Mismo calendario con tilde que icon.svg.
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
        <svg
          width="124"
          height="124"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3ddc97"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3.5" y="4.5" width="17" height="16.5" rx="3.5" />
          {TRAZO_CALENDARIO.map((d) => (
            <path key={d} d={d} />
          ))}
        </svg>
      </div>
    ),
    size,
  );
}

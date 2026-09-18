import { ImageResponse } from "next/og";
import { COLORS } from "@/lib/colors";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: COLORS.accent,
          borderRadius: "50%",
          color: "white",
          fontSize: 20,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        P
      </div>
    ),
    { ...size }
  );
}

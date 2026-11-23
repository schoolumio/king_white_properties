import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon (iOS / Android) — King White monogram. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#101D32", position: "relative" }}>
        <div style={{ position: "absolute", top: 22, left: 22, right: 22, bottom: 22, border: "3px solid rgba(184,154,98,0.55)" }} />
        <div style={{ color: "#FFFFFF", fontSize: 72, fontWeight: 700, letterSpacing: 4 }}>KW</div>
        <div style={{ position: "absolute", right: 22, bottom: 22, width: 20, height: 20, background: "#B89A62" }} />
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";

export const alt = "Prism — See every angle of the story";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// SPECTRUM from components/brand.ts, hardcoded — the og image renderer runs in
// its own edge bundle and shouldn't import client-adjacent modules. Keep in
// sync if the brand spectrum ever changes.
const SPECTRUM = [
  "#FF3B00",
  "#FF7A00",
  "#FFC400",
  "#3DDC84",
  "#00C2D1",
  "#4F7DFF",
  "#8B5CFF",
];

// Satori supports flexbox + inline styles only — no grid, no Tailwind. The
// wordmark uses satori's default sans at heavy weight; loading Inter here
// isn't worth a network fetch at build time.
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0A0A0A",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 148,
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: "-0.05em",
          }}
        >
          PRISM
        </div>
        <div style={{ display: "flex", width: 420, height: 6, marginTop: 30 }}>
          {SPECTRUM.map((c) => (
            <div
              key={c}
              style={{ display: "flex", flex: 1, backgroundColor: c }}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 30,
            fontSize: 30,
            color: "rgba(255,255,255,0.62)",
          }}
        >
          See every angle of the story.
        </div>
      </div>
    ),
    { ...size },
  );
}

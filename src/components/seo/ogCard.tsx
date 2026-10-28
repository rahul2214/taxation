import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Branded 1200x630 social card shared by the site and article Open Graph images. */
export function renderOgCard({ eyebrow, title, footer }: { eyebrow: string; title: string; footer: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F6F3EC",
          padding: "72px 80px",
          borderBottom: "18px solid #14202E",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 14, height: 14, background: "#A97C32", transform: "rotate(45deg)" }} />
          <div style={{ fontSize: 26, letterSpacing: 6, color: "#14202E", fontFamily: "sans-serif", fontWeight: 700 }}>
            POLARIS TAX SERVICES
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 24, letterSpacing: 4, color: "#86601F", fontFamily: "monospace", marginBottom: 24 }}>
            {eyebrow.toUpperCase()}
          </div>
          <div style={{ fontSize: title.length > 70 ? 56 : 68, lineHeight: 1.1, color: "#14202E", maxWidth: 1000 }}>
            {title}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#5E6773", fontFamily: "sans-serif" }}>
          <span>{footer}</span>
          <span>(212) 847-1920</span>
        </div>
      </div>
    ),
    OG_SIZE
  );
}

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt =
  "Two Element Labs — Website design and development for Cape Town businesses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), "public/logo-mark-alpha.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0b1220",
          color: "#fff",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 48,
            border: "1px solid rgba(255,255,255,0.16)",
            display: "flex",
            padding: 56,
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 22,
                letterSpacing: 8,
                textTransform: "uppercase",
                opacity: 0.7,
              }}
            >
              TWO ELEMENT LABS
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 60,
                lineHeight: 1.02,
                marginTop: 28,
                fontWeight: 600,
                letterSpacing: -2,
              }}
            >
              <div style={{ display: "flex" }}>Your website should</div>
              <div style={{ display: "flex" }}>be bringing you</div>
              <div style={{ display: "flex", color: "#de4625" }}>business.</div>
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 24,
                fontSize: 24,
                opacity: 0.72,
              }}
            >
              Website design · Development · Care Plans
            </div>
          </div>
          <img
            src={logoSrc}
            alt=""
            width={220}
            height={220}
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>
    ),
    size,
  );
}

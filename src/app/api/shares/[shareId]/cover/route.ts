import { getSharedProject } from "@/lib/stratmap/workspace";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;

  let projectName = "Shared Stratbook";
  let projectDescription = "";

  try {
    const { project } = await getSharedProject(shareId);
    projectName = project.name ?? projectName;
    projectDescription = project.description ?? "";
  } catch {
    // Use defaults — still render a valid image rather than a 404
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "#04060b",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "64px 72px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Teal glow blob — top-left */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -80,
            width: 560,
            height: 560,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(45,212,191,0.18) 0%, transparent 70%)",
          }}
        />
        {/* Subtle grid texture overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(rgba(94,234,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(94,234,212,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Brand tag */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#5eead4",
            }}
          />
          <span
            style={{
              color: "#5eead4",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            Stratbook
          </span>
        </div>

        {/* Project name */}
        <div
          style={{
            color: "#ffffff",
            fontSize: projectName.length > 36 ? 44 : 56,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: "-0.025em",
            maxWidth: 900,
            flex: 1,
            display: "flex",
            alignItems: "flex-start",
            paddingTop: 8,
          }}
        >
          {projectName}
        </div>

        {/* Description — show when present */}
        {projectDescription ? (
          <div
            style={{
              color: "rgba(255,255,255,0.48)",
              fontSize: 20,
              lineHeight: 1.5,
              maxWidth: 760,
              marginTop: 20,
              marginBottom: 8,
            }}
          >
            {projectDescription.length > 120
              ? `${projectDescription.slice(0, 120)}…`
              : projectDescription}
          </div>
        ) : null}

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 40,
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "rgba(255,255,255,0.28)",
              fontSize: 14,
            }}
          >
            <div
              style={{
                background: "rgba(94,234,212,0.12)",
                border: "1px solid rgba(94,234,212,0.22)",
                borderRadius: 20,
                padding: "4px 12px",
                color: "rgba(94,234,212,0.72)",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Public notebook
            </div>
          </div>
          <span style={{ color: "rgba(255,255,255,0.22)", fontSize: 14 }}>
            stratbook.world
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

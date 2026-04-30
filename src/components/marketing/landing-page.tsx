"use client";

import { useEffect, useState } from "react";
import { exampleStratbooks, getExampleVersion } from "@/lib/stratmap/example-stratbooks";
import Image from "next/image";

const accent = "#5eead4";
const ctaLabel = "Create your map";
const authHref = "/auth";
const dashboardHref = "/app";
const dashboardLabel = "Go to dashboard";

type AccentProps = { accent?: string };

type BtnProps = {
  accent?: string;
  children: React.ReactNode;
  href?: string;
  size?: "md" | "lg";
  variant?: "primary" | "ghost";
};

function useReveal() {
  useEffect(() => {
    const revealIfVisible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        element.classList.add("visible");
      }
    };
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".reveal").forEach((element) => {
      revealIfVisible(element);
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);
}

function Wordmark({ accent: brandAccent = accent, size = 20 }: AccentProps & { size?: number }) {
  return (
    <span
      style={{
        fontFamily: "'DM Sans',sans-serif",
        fontSize: size,
        fontWeight: 600,
        letterSpacing: "-0.02em",
        userSelect: "none",
      }}
    >
      <span style={{ color: brandAccent }}>Strat</span>
      <span style={{ color: "rgba(255,255,255,0.95)" }}>book</span>
    </span>
  );
}

function Btn({
  accent: buttonAccent = accent,
  children,
  href = "#",
  size = "md",
  variant = "primary",
}: BtnProps) {
  const [hovered, setHovered] = useState(false);
  const height = size === "lg" ? 50 : 42;
  const paddingX = size === "lg" ? 26 : 20;
  const fontSize = size === "lg" ? 14.5 : 13.5;
  const base: React.CSSProperties = {
    alignItems: "center",
    borderRadius: 7,
    display: "inline-flex",
    fontFamily: "'DM Sans',sans-serif",
    fontSize,
    fontWeight: 600,
    gap: 8,
    height,
    letterSpacing: "0.01em",
    padding: `0 ${paddingX}px`,
    transition: "all 0.15s",
  };

  if (variant === "primary") {
    return (
      <a
        href={href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          ...base,
          background: hovered ? "#99f6e4" : buttonAccent,
          boxShadow: hovered ? `0 10px 28px -8px ${buttonAccent}55` : "none",
          color: "#04060b",
          transform: hovered ? "translateY(-1px)" : "none",
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...base,
        background: hovered ? "rgba(255,255,255,0.055)" : "transparent",
        border: "1px solid rgba(255,255,255,0.13)",
        color: "rgba(255,255,255,0.65)",
        fontWeight: 500,
      }}
    >
      {children}
    </a>
  );
}

// Preserved while the hero uses video, so the previous map background can be restored quickly.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MapScene({ accent: sceneAccent = accent }: AccentProps) {
  const nodes = [
    { id: "A", l: "London", x: 175, y: 205 },
    { id: "B", l: "Berlin", x: 308, y: 185 },
    { id: "C", l: "Istanbul", x: 428, y: 255 },
    { id: "D", l: "Tehran", x: 520, y: 308 },
    { id: "E", l: "Cairo", x: 368, y: 348 },
    { id: "F", l: "Tripoli", x: 238, y: 338 },
    { id: "G", l: "Karachi", x: 608, y: 205 },
  ] as const;
  const arcs = [
    { a: "A", b: "B", cx: 242, cy: 172 },
    { a: "B", b: "C", cx: 368, cy: 190 },
    { a: "C", b: "D", cx: 476, cy: 265 },
    { a: "C", b: "E", cx: 453, cy: 320 },
    { a: "E", b: "F", cx: 298, cy: 368 },
    { a: "A", b: "F", cx: 192, cy: 285 },
    { a: "D", b: "G", cx: 570, cy: 240 },
  ] as const;
  const byId = Object.fromEntries(nodes.map((node) => [node.id, node])) as Record<
    (typeof nodes)[number]["id"],
    (typeof nodes)[number]
  >;

  return (
    <div style={{ inset: 0, position: "absolute" }}>
      <div
        style={{
          background: "linear-gradient(150deg,#020c13 0%,#031824 55%,#041c18 100%)",
          inset: 0,
          position: "absolute",
        }}
      />
      <div
        style={{
          backgroundImage: "radial-gradient(circle,rgba(94,234,212,0.16) 1px,transparent 1px)",
          backgroundSize: "44px 44px",
          inset: 0,
          opacity: 0.45,
          position: "absolute",
        }}
      />
      <svg
        preserveAspectRatio="xMidYMid meet"
        style={{ height: "100%", inset: 0, position: "absolute", width: "100%" }}
        viewBox="0 0 800 560"
      >
        <defs>
          <filter id="landing-node-glow">
            <feGaussianBlur in="SourceGraphic" result="b" stdDeviation="3" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {arcs.map((arc, index) => {
          const a = byId[arc.a];
          const b = byId[arc.b];
          return (
            <path
              d={`M${a.x} ${a.y}Q${arc.cx} ${arc.cy} ${b.x} ${b.y}`}
              fill="none"
              key={`${arc.a}-${arc.b}`}
              stroke={`${sceneAccent}30`}
              strokeDasharray="4 6"
              strokeWidth="1"
              style={{
                animation: `landing-shimmer ${3 + index * 0.5}s ease-in-out infinite`,
                animationDelay: `${index * 0.2}s`,
              }}
            />
          );
        })}
        {nodes.map((node, index) => (
          <g
            filter="url(#landing-node-glow)"
            key={node.id}
            style={{
              animation: `landing-shimmer ${2.8 + index * 0.35}s ease-in-out infinite`,
              animationDelay: `${index * 0.25}s`,
            }}
          >
            <circle cx={node.x} cy={node.y} fill="none" r="13" stroke={`${sceneAccent}15`} strokeWidth="0.8" />
            <circle cx={node.x} cy={node.y} fill={`${sceneAccent}0e`} r="6" stroke={`${sceneAccent}40`} strokeWidth="0.8" />
            <circle cx={node.x} cy={node.y} fill={sceneAccent} r="2.5" />
            <text
              fill="rgba(255,255,255,0.28)"
              fontFamily="'DM Sans',sans-serif"
              fontSize="9"
              letterSpacing="0.07em"
              textAnchor="middle"
              x={node.x}
              y={node.y - 20}
            >
              {node.l.toUpperCase()}
            </text>
          </g>
        ))}
      </svg>
      <div
        style={{
          animation: "landing-drift 16s ease-in-out infinite",
          background: `radial-gradient(circle,${sceneAccent}07 0%,transparent 65%)`,
          borderRadius: "50%",
          height: 320,
          left: "35%",
          pointerEvents: "none",
          position: "absolute",
          top: "20%",
          width: 320,
        }}
      />
      <div
        style={{
          background: "linear-gradient(to bottom,transparent,#04060b)",
          bottom: 0,
          height: "50%",
          left: 0,
          pointerEvents: "none",
          position: "absolute",
          right: 0,
        }}
      />
      <div
        style={{
          background: "radial-gradient(ellipse 110% 80% at 50% 40%,transparent 40%,rgba(4,6,11,0.6) 100%)",
          inset: 0,
          pointerEvents: "none",
          position: "absolute",
        }}
      />
    </div>
  );
}

function Nav({
  accent: navAccent,
  ctaLabel: navCtaLabel,
  isAuthenticated = false,
}: {
  accent: string;
  ctaLabel: string;
  isAuthenticated?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className="landing-nav"
      style={{
        alignItems: "center",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        background: scrolled ? "rgba(4,6,11,0.88)" : "transparent",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        display: "flex",
        height: 72,
        justifyContent: "space-between",
        left: 0,
        padding: "0 52px",
        position: "fixed",
        right: 0,
        top: 0,
        transition: "background 0.3s,border-color 0.3s",
        zIndex: 100,
      }}
    >
      <Wordmark accent={navAccent} />
      <div className="landing-nav-links" style={{ alignItems: "center", display: "flex", gap: 4 }}>
        {["Product", "Examples", "Pricing"].map((label) => (
          <a
            href={`#${label.toLowerCase()}`}
            key={label}
            onMouseEnter={(event) => {
              event.currentTarget.style.color = "rgba(255,255,255,0.85)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.color = "rgba(255,255,255,0.48)";
            }}
            style={{
              alignItems: "center",
              borderRadius: 6,
              color: "rgba(255,255,255,0.48)",
              display: "inline-flex",
              fontSize: 13,
              height: 36,
              padding: "0 14px",
              transition: "color 0.15s",
            }}
          >
            {label}
          </a>
        ))}
        <div style={{ background: "rgba(255,255,255,0.1)", height: 18, margin: "0 6px", width: 1 }} />
        {isAuthenticated ? (
          <Btn accent={navAccent} href={dashboardHref}>
            <span className="landing-nav-cta-full">{dashboardLabel} →</span>
            <span className="landing-nav-cta-short">Dashboard →</span>
          </Btn>
        ) : (
          <>
            <a
              href={authHref}
              onMouseEnter={(event) => {
                event.currentTarget.style.color = "rgba(255,255,255,0.85)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.color = "rgba(255,255,255,0.48)";
              }}
              style={{
                alignItems: "center",
                borderRadius: 6,
                color: "rgba(255,255,255,0.48)",
                display: "inline-flex",
                fontSize: 13,
                height: 36,
                padding: "0 14px",
                transition: "color 0.15s",
              }}
            >
              Sign in
            </a>
            <Btn accent={navAccent} href={authHref}>
              <span className="landing-nav-cta-full">{navCtaLabel} →</span>
              <span className="landing-nav-cta-short">Create →</span>
            </Btn>
          </>
        )}
      </div>
    </nav>
  );
}

function Hero({ accent: heroAccent, ctaLabel: heroCtaLabel }: { accent: string; ctaLabel: string }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: "100vh", position: "relative" }}>
      {/*
        Previous generated map background kept for quick rollback:
        <MapScene accent={heroAccent} />
      */}
      <video
        aria-hidden="true"
        autoPlay
        className="landing-hero-video"
        loop
        muted
        playsInline
        src="/videos/stratbook-hero.mp4"
        style={{
          height: "100%",
          inset: 0,
          objectFit: "cover",
          position: "absolute",
          width: "100%",
        }}
      />
      <div
        style={{
          background:
            "linear-gradient(90deg,rgba(4,6,11,0.92) 0%,rgba(4,6,11,0.68) 38%,rgba(4,6,11,0.34) 72%,rgba(4,6,11,0.74) 100%)",
          inset: 0,
          pointerEvents: "none",
          position: "absolute",
        }}
      />
      <div
        style={{
          background: "linear-gradient(to bottom,rgba(4,6,11,0.24),rgba(4,6,11,0.1) 38%,#04060b 100%)",
          inset: 0,
          pointerEvents: "none",
          position: "absolute",
        }}
      />
      <div className="landing-hero-content" style={{ maxWidth: 1100, padding: "0 52px 72px", position: "relative", width: "100%", zIndex: 2 }}>
        <div className="reveal visible" style={{ alignItems: "center", display: "flex", gap: 12, marginBottom: 24 }}>
          <span style={{ background: heroAccent, borderRadius: 1, flexShrink: 0, height: 1.5, width: 28 }} />
          <span style={{ color: `${heroAccent}cc`, fontFamily: "monospace", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase" }}>
            AI deep research, on the map
          </span>
        </div>
        <h1
          className="reveal visible d1"
          style={{
            color: "rgba(255,255,255,0.96)",
            fontFamily: "'EB Garamond',serif",
            fontSize: "clamp(44px,6.2vw,88px)",
            fontWeight: 400,
            letterSpacing: "-0.025em",
            lineHeight: 0.96,
            marginBottom: 28,
          }}
        >
          A map-first workspace
          <br />
          for <em style={{ color: `${heroAccent}f0` }}>strategic thinking.</em>
        </h1>
        <p className="reveal visible d2" style={{ color: "rgba(255,255,255,0.42)", fontSize: 16, lineHeight: 1.65, marginBottom: 32, maxWidth: 460 }}>
          Stratbook fuses agentic AI research with the map. Pin intelligence to places. Brief your team. Own your data.
        </p>
        <div className="reveal visible d3" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Btn accent={heroAccent} href={authHref} size="lg">
            {heroCtaLabel} →
          </Btn>
          <Btn accent={heroAccent} href="#examples" size="lg" variant="ghost">
            See an example
          </Btn>
        </div>
      </div>
    </section>
  );
}

function ProofStrip({ accent: stripAccent }: { accent: string }) {
  const items = [
    "OSINT desks",
    "Defense planners",
    "Foreign-desk reporters",
    "Conflict researchers",
    "Geo-aware investors",
    "Intelligence analysts",
    "Geopolitical writers",
    "Field researchers",
    "Think tanks",
  ];
  const doubled = [...items, ...items];

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", borderTop: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", padding: 0, position: "relative" }}>
      <div style={{ background: "linear-gradient(to right,#04060b,transparent)", bottom: 0, left: 0, pointerEvents: "none", position: "absolute", top: 0, width: 120, zIndex: 2 }} />
      <div style={{ background: "linear-gradient(to left,#04060b,transparent)", bottom: 0, pointerEvents: "none", position: "absolute", right: 0, top: 0, width: 120, zIndex: 2 }} />
      <div style={{ alignItems: "center", display: "flex", height: 52 }}>
        <div style={{ alignItems: "center", animation: "landing-marquee 28s linear infinite", display: "flex", gap: 0, whiteSpace: "nowrap", willChange: "transform" }}>
          {doubled.map((item, index) => (
            <span key={`${item}-${index}`} style={{ alignItems: "center", display: "inline-flex", gap: 0 }}>
              <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 500, letterSpacing: "0.03em", padding: "0 28px" }}>{item}</span>
              <span style={{ background: stripAccent, borderRadius: "50%", flexShrink: 0, height: 4, opacity: 0.5, width: 4 }} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Features({ accent: featureAccent }: { accent: string }) {
  const items = [
    { body: "Click anywhere on the globe. The pin becomes a markdown note that knows its coordinates.", n: "01", title: "Drop a pin" },
    { body: "The Strategist reads your stratbook, pulls fresh sources, and drafts cited briefs anchored to the right pin.", n: "02", title: "Research with AI" },
    { body: "Run a flythrough briefing, render a PDF, or export plain markdown to Obsidian, Notion, or anywhere else.", n: "03", title: "Brief & export" },
  ];

  return (
    <section className="landing-section" id="product" style={{ padding: "110px 52px" }}>
      <div style={{ margin: "0 auto", maxWidth: 1100 }}>
        <p className="reveal" style={{ color: `${featureAccent}88`, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.26em", marginBottom: 52, textTransform: "uppercase" }}>
          How it works
        </p>
        <div className="landing-feature-grid" style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, display: "grid", gap: 1, gridTemplateColumns: "repeat(3,1fr)", overflow: "hidden" }}>
          {items.map((feature, index) => (
            <FeatureCard accent={featureAccent} f={feature} i={index} key={feature.n} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ accent: cardAccent, f, i }: { accent: string; f: { body: string; n: string; title: string }; i: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`reveal d${i + 1}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.01)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        padding: "40px 34px",
        transition: "background 0.2s",
      }}
    >
      <p style={{ color: `${cardAccent}77`, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.2em", marginBottom: 18 }}>{f.n}</p>
      <h3 style={{ color: "rgba(255,255,255,0.9)", fontFamily: "'EB Garamond',serif", fontSize: 28, fontWeight: 400, lineHeight: 1.15, marginBottom: 12 }}>{f.title}</h3>
      <p style={{ color: "rgba(255,255,255,0.36)", fontSize: 13.5, lineHeight: 1.7 }}>{f.body}</p>
    </div>
  );
}

type ComparisonValue = boolean | "Partial";

function VsCompetitors({ accent: tableAccent }: { accent: string }) {
  const rows: { feature: string; notion: ComparisonValue; obsidian: ComparisonValue; stratbook: ComparisonValue }[] = [
    { feature: "Map-first workspace", notion: false, obsidian: false, stratbook: true },
    { feature: "Pin notes to coordinates", notion: false, obsidian: false, stratbook: true },
    { feature: "AI research with spatial context", notion: "Partial", obsidian: false, stratbook: true },
    { feature: "Geospatial layers & range rings", notion: false, obsidian: false, stratbook: true },
    { feature: "Plain markdown — you own your data", notion: false, obsidian: true, stratbook: true },
    { feature: "Deep research with citations", notion: "Partial", obsidian: false, stratbook: true },
    { feature: "Time-aware notes (scrub history)", notion: false, obsidian: false, stratbook: true },
  ];
  const Check = ({ value }: { value: ComparisonValue }) => {
    if (value === true) return <span style={{ color: tableAccent, fontSize: 16 }}>✓</span>;
    if (value === "Partial") return <span style={{ color: "rgba(251,191,36,0.7)", fontFamily: "monospace", fontSize: 11, letterSpacing: "0.06em" }}>Partial</span>;
    return <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 16 }}>—</span>;
  };

  return (
    <section className="landing-section landing-comparison-section" style={{ padding: "0 52px 110px" }}>
      <div style={{ margin: "0 auto", maxWidth: 1100 }}>
        <div className="reveal" style={{ marginBottom: 44 }}>
          <p style={{ color: `${tableAccent}88`, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.26em", marginBottom: 14, textTransform: "uppercase" }}>Why Stratbook</p>
          <h2 style={{ color: "rgba(255,255,255,0.92)", fontFamily: "'EB Garamond',serif", fontSize: "clamp(28px,3vw,44px)", fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.08, marginBottom: 14 }}>
            Notion and Obsidian are great
            <br />
            <em style={{ color: "rgba(255,255,255,0.92)" }}>for documents. </em>
            <em style={{ color: `${tableAccent}ee` }}>Not for places.</em>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.36)", fontSize: 14, lineHeight: 1.7, maxWidth: 520 }}>
            Every other note-taking tool treats location as metadata — an afterthought. Stratbook is map-first: your notes know where they are from the moment you write them.
          </p>
        </div>
        <div className="reveal d1 landing-comparison-table" style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ background: "rgba(255,255,255,0.025)", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "grid", gridTemplateColumns: "1fr repeat(3,156px)" }}>
            <div style={{ padding: "14px 24px" }} />
            {["Stratbook", "Notion", "Obsidian"].map((tool, index) => (
              <div key={tool} style={{ borderLeft: "1px solid rgba(255,255,255,0.07)", padding: "14px 0", textAlign: "center" }}>
                <span style={{ color: index === 0 ? tableAccent : "rgba(255,255,255,0.35)", fontSize: 12.5, fontWeight: 600, letterSpacing: "0.02em" }}>{tool}</span>
              </div>
            ))}
          </div>
          {rows.map((row, index) => (
            <div key={row.feature} style={{ background: index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.007)", borderBottom: index < rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", display: "grid", gridTemplateColumns: "1fr repeat(3,156px)" }}>
              <div style={{ padding: "15px 24px" }}>
                <span style={{ color: "rgba(255,255,255,0.58)", fontSize: 13.5 }}>{row.feature}</span>
              </div>
              {[row.stratbook, row.notion, row.obsidian].map((value, valueIndex) => (
                <div key={valueIndex} style={{ alignItems: "center", borderLeft: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "center" }}>
                  <Check value={value} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Spotlight({ accent: spotlightAccent }: { accent: string }) {
  const features = [
    {
      body: "Create a pin, name the place, and let the notebook inherit the location. The map stays the primary surface, not a decorative backdrop.",
      bullets: ["Instant place notes", "Spatial context on every source"],
      eyebrow: "01 · Map",
      title: "The map is the workspace.",
    },
    {
      body: "Open a pin and ask for the briefing. The strategist reads the surrounding notes, sources, and location context before answering.",
      bullets: ["Pinned-note conversations", "Cited strategic summaries"],
      eyebrow: "02 · AI strategist",
      title: "Click any pin. The brief writes itself.",
    },
    {
      body: "Folders, markdown files, public links, and forks stay tied to the geography they describe, so the archive keeps its shape.",
      bullets: ["Markdown file system", "Public links and safe forks"],
      eyebrow: "03 · Files",
      title: "A file system that knows where things happened.",
    },
  ];

  return (
    <section className="landing-section" style={{ padding: "0 52px 120px" }}>
      <div style={{ margin: "0 auto", maxWidth: 1120 }}>
        <div className="reveal" style={{ margin: "0 auto 44px", maxWidth: 700, textAlign: "center" }}>
          <p style={{ color: `${spotlightAccent}88`, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.26em", marginBottom: 16, textTransform: "uppercase" }}>Product system</p>
          <h2 style={{ color: "rgba(255,255,255,0.92)", fontFamily: "'EB Garamond',serif", fontSize: "clamp(32px,4vw,54px)", fontWeight: 400, letterSpacing: "-0.018em", lineHeight: 1.04, marginBottom: 16 }}>
            Map, notes, and AI
            <br />
            <em style={{ color: `${spotlightAccent}ee` }}>working as one desk.</em>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 14.5, lineHeight: 1.7, margin: "0 auto", maxWidth: 600 }}>
            Stratbook combines a live map, a spatial file system, and an analyst assistant so research stays anchored to the places it describes.
          </p>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <article
            className="reveal d1"
            style={{
              background: "rgba(255,255,255,0.018)",
              border: "1px solid rgba(255,255,255,0.075)",
              borderRadius: 14,
              boxShadow: "0 18px 58px -42px rgba(0,0,0,0.9)",
              margin: "0 auto",
              maxWidth: 991,
              overflow: "hidden",
              padding: 6,
              position: "relative",
              width: "100%",
            }}
          >
            <Image
              alt="Stratbook map workspace with pins and analysis"
              height={868}
              priority={false}
              sizes="(max-width: 768px) calc(100vw - 64px), 991px"
              src="/images/stratbook.png"
              style={{
                borderRadius: 9,
                display: "block",
                height: "auto",
                width: "100%",
              }}
              width={991}
            />
          </article>

          <div className="landing-feature-grid reveal d2" style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3,1fr)" }}>
            {features.map((feature) => (
              <article
                key={feature.eyebrow}
                style={{
                  background: "linear-gradient(180deg,rgba(255,255,255,0.026),rgba(255,255,255,0.01))",
                  border: "1px solid rgba(255,255,255,0.065)",
                  borderRadius: 12,
                  minHeight: 246,
                  overflow: "hidden",
                  padding: "23px 24px 24px",
                  position: "relative",
                }}
              >
                <div style={{ background: `linear-gradient(90deg,${spotlightAccent}88,transparent)`, height: 1, left: 0, position: "absolute", right: 0, top: 0 }} />
                <p style={{ color: `${spotlightAccent}aa`, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.22em", marginBottom: 30, textTransform: "uppercase" }}>{feature.eyebrow}</p>
                <h3 style={{ color: "rgba(255,255,255,0.9)", fontFamily: "'EB Garamond',serif", fontSize: 26, fontWeight: 400, letterSpacing: "-0.015em", lineHeight: 1.05, marginBottom: 14 }}>
                  {feature.title}
                </h3>
                <p style={{ color: "rgba(255,255,255,0.43)", fontSize: 13.5, lineHeight: 1.62, marginBottom: 22 }}>
                  {feature.body}
                </p>
                <ul style={{ borderTop: "1px solid rgba(255,255,255,0.055)", display: "grid", gap: 8, listStyle: "none", paddingTop: 15 }}>
                  {feature.bullets.map((bullet) => (
                    <li key={bullet} style={{ color: "rgba(255,255,255,0.48)", fontSize: 12.5, letterSpacing: "0.01em", lineHeight: 1.35 }}>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BuiltFor({ accent: personaAccent }: { accent: string }) {
  const personas = [
    { body: "Geotag findings, attach sources, hand the dossier to colleagues with everything anchored to the right place.", n: "01", title: "OSINT & analyst teams" },
    { body: "Map control zones, range rings, supply chains. Fork scenarios without touching the canonical baseline.", n: "02", title: "Defense planners" },
    { body: "Build a working brief on a region you've never visited. Export the map with the story.", n: "03", title: "Foreign-desk reporters" },
    { body: "Time-aware notes track how a place changes. Layers separate the variables.", n: "04", title: "Conflict researchers" },
    { body: "Pin every choke point, supplier, and competitor. AI briefings before the next earnings call.", n: "05", title: "Geo-aware investors" },
    { body: "Travel writers, historians, urbanists. If it has coordinates, it belongs in a stratbook.", n: "06", title: "Anyone writing about a place" },
  ];

  return (
    <section className="landing-section" id="built-for" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "110px 52px" }}>
      <div style={{ margin: "0 auto", maxWidth: 1100 }}>
        <div className="landing-builtfor-grid" style={{ alignItems: "start", display: "grid", gap: 80, gridTemplateColumns: "1fr 2fr" }}>
          <div className="reveal landing-builtfor-heading" style={{ position: "sticky", top: 100 }}>
            <p style={{ color: `${personaAccent}88`, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.26em", marginBottom: 18, textTransform: "uppercase" }}>Built for</p>
            <h2 style={{ color: "rgba(255,255,255,0.92)", fontFamily: "'EB Garamond',serif", fontSize: "clamp(28px,3vw,42px)", fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.1 }}>
              People who already think
              {/* <br /> */}
              <em style={{ color: `${personaAccent}ee`, marginLeft: '8px' }}>in maps.</em>
            </h2>
          </div>
          <div className="landing-persona-grid" style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, display: "grid", gap: 1, gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
            {personas.map((persona, index) => (
              <PersonaCard accent={personaAccent} i={index} key={persona.n} p={persona} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PersonaCard({ accent: cardAccent, i, p }: { accent: string; i: number; p: { body: string; n: string; title: string } }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`reveal d${(i % 2) + 1}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.01)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        padding: "28px 26px",
        transition: "background 0.2s",
      }}
    >
      <p style={{ color: `${cardAccent}66`, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.18em", marginBottom: 10 }}>{p.n}</p>
      <h3 style={{ color: "rgba(255,255,255,0.78)", fontSize: 14, fontWeight: 600, lineHeight: 1.3, marginBottom: 7 }}>{p.title}</h3>
      <p style={{ color: "rgba(255,255,255,0.32)", fontSize: 12.5, lineHeight: 1.6 }}>{p.body}</p>
    </div>
  );
}

function Testimonial({ accent: quoteAccent }: { accent: string }) {
  const smallerQuotes = [
    {
      body: "The map gives the research shape. You stop collecting loose notes and start seeing the actual operating picture.",
      label: "Field note",
      name: "Ayesha Khan",
      role: "OSINT researcher",
    },
    {
      body: "The killer feature is context. Every briefing knows which place, source, and prior note it is building from.",
      label: "Analyst desk",
      name: "Daniel Mercer",
      role: "Geopolitical analyst",
    },
    {
      body: "It feels like a field desk, a notebook, and an analyst assistant collapsed into one spatial workspace.",
      label: "Editorial desk",
      name: "Mira Stone",
      role: "Foreign desk editor",
    },
  ];

  return (
    <section className="landing-section" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "100px 52px" }}>
      <div style={{ margin: "0 auto", maxWidth: 1100 }}>
        <div className="reveal" style={{ margin: "0 auto 34px", maxWidth: 850, textAlign: "center" }}>
          <p style={{ color: `${quoteAccent}88`, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.26em", marginBottom: 22, textTransform: "uppercase" }}>What people say</p>
          <blockquote style={{ color: "rgba(255,255,255,0.86)", fontFamily: "'EB Garamond',serif", fontSize: "clamp(24px,2.8vw,38px)", fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.34, marginBottom: 30 }}>
            <span style={{ color: quoteAccent }}>&quot;</span>To understand the Middle East conflict, I needed a map. Stratbook is the first tool that lets me blend AI deep research with spatial reasoning in one place.<span style={{ color: quoteAccent }}>&quot;</span>
          </blockquote>
          <div style={{ alignItems: "center", display: "inline-flex", gap: 11 }}>
            <div style={{ alignItems: "center", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", color: quoteAccent, display: "flex", fontFamily: "monospace", fontSize: 10, fontWeight: 600, height: 36, justifyContent: "center", width: 36 }}>HR</div>
            <div style={{ textAlign: "left" }}>
              <p style={{ color: "rgba(255,255,255,0.62)", fontSize: 13, fontWeight: 500 }}>Haris Rashid</p>
              <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 11.5 }}>Founder of Morpha AI</p>
            </div>
          </div>
        </div>
        <div
          className="landing-testimonial-grid reveal d1"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "grid",
            gap: 0,
            gridTemplateColumns: "repeat(3,1fr)",
          }}
        >
          {smallerQuotes.map((quote, index) => (
            <figure
              key={quote.name}
              style={{
                background:
                  index === 1
                    ? `linear-gradient(180deg,${quoteAccent}08,rgba(255,255,255,0.008) 70%)`
                    : "transparent",
                borderLeft: index === 0 ? "none" : "1px solid rgba(255,255,255,0.07)",
                minHeight: 210,
                padding: "26px 28px 24px",
                position: "relative",
              }}
            >
              <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                <span style={{ color: `${quoteAccent}88`, fontFamily: "monospace", fontSize: 9.5, letterSpacing: "0.2em", textTransform: "uppercase" }}>
                  {quote.label}
                </span>
                <span style={{ color: "rgba(255,255,255,0.16)", fontFamily: "'EB Garamond',serif", fontSize: 34, fontStyle: "italic", lineHeight: 1 }}>
                  0{index + 1}
                </span>
              </div>
              <blockquote style={{ color: "rgba(255,255,255,0.72)", fontFamily: "'EB Garamond',serif", fontSize: "clamp(20px,1.85vw,25px)", fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.28, marginBottom: 28 }}>
                <span style={{ color: quoteAccent }}>“</span>
                {quote.body}
                <span style={{ color: quoteAccent }}>”</span>
              </blockquote>
              <figcaption style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14 }}>
                <p style={{ color: "rgba(255,255,255,0.74)", fontSize: 12.5, fontWeight: 600 }}>{quote.name}</p>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11.5, marginTop: 3 }}>{quote.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

const examples = exampleStratbooks;

function Examples({ accent: examplesAccent }: { accent: string }) {
  return (
    <section className="landing-section" id="examples" style={{ padding: "110px 52px" }}>
      <div style={{ margin: "0 auto", maxWidth: 1280 }}>
        <div style={{ alignItems: "flex-end", display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", marginBottom: 44 }}>
          <div className="reveal">
            <p style={{ color: `${examplesAccent}88`, fontFamily: "monospace", fontSize: 10, letterSpacing: "0.26em", marginBottom: 14, textTransform: "uppercase" }}>Example stratbooks</p>
            <h2 style={{ color: "rgba(255,255,255,0.92)", fontFamily: "'EB Garamond',serif", fontSize: "clamp(28px,3.5vw,46px)", fontWeight: 400, letterSpacing: "-0.015em", lineHeight: 1.05 }}>
              Three live notebooks,
              <br />
              <em style={{ color: `${examplesAccent}ee` }}>ready to open.</em>
            </h2>
          </div>
          <Btn accent={examplesAccent} href={authHref} variant="ghost">
            Browse all →
          </Btn>
        </div>
        <div className="landing-examples-grid" style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(3,1fr)" }}>
          {examples.map((example, index) => (
            <ExCard accent={examplesAccent} ex={example} i={index} key={example.index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ExCard({ accent: cardAccent, ex, i }: { accent: string; ex: (typeof examples)[number]; i: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      className={`reveal d${i + 1}`}
      href={`/s/${ex.shareId}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.01)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.11)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 10,
        display: "block",
        overflow: "hidden",
        // transform: hovered ? "translateY(-2px)" : "none",
        transition: "all 0.18s",
      }}
    >
      <div style={{ aspectRatio: "16/8.5", background: "rgba(255,255,255,0.035)", overflow: "hidden", position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- Public generated cover endpoint; plain img keeps landing component dependency-free. */}
        <img
          alt={`${ex.title} map cover`}
          src={`/api/shares/${ex.shareId}/cover?v=${getExampleVersion(ex)}`}
          style={{ height: "100%", objectFit: "cover", opacity: 0.92, width: "100%" }}
        />
        <div style={{ background: "linear-gradient(180deg,transparent 55%,rgba(4,6,11,0.72))", inset: 0, position: "absolute" }} />
      </div>
      <div style={{ padding: "20px 22px 18px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {ex.tags.map((tag) => (
            <span key={tag} style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 4, color: "rgba(255,255,255,0.35)", fontSize: 10, letterSpacing: "0.04em", padding: "2px 7px" }}>
              {tag}
            </span>
          ))}
        </div>
        <div style={{ alignItems: "center", display: "flex", gap: 8, marginBottom: 8 }}>
          <span style={{ background: ex.dot, borderRadius: "50%", boxShadow: `0 0 5px ${ex.dot}80`, flexShrink: 0, height: 5, width: 5 }} />
          <h3 style={{ color: "rgba(255,255,255,0.82)", fontSize: 14.5, fontWeight: 500 }}>{ex.title}</h3>
        </div>
        <p style={{ color: "rgba(255,255,255,0.32)", fontSize: 12.5, lineHeight: 1.55, marginBottom: 14 }}>{ex.blurb}</p>
        <div style={{ alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", paddingTop: 12 }}>
          <span style={{ color: "rgba(255,255,255,0.24)", fontFamily: "monospace", fontSize: 10 }}>{ex.pins} pins · markdown</span>
          <span style={{ color: `${cardAccent}cc`, fontSize: 12, fontWeight: 500 }}>Open →</span>
        </div>
      </div>
    </a>
  );
}

function Pricing({ accent: pricingAccent }: { accent: string; ctaLabel: string }) {
  const plans = [
    {
      cta: "Create your first stratbook",
      features: [
        "Unlimited pins and markdown notes",
        "Range rings, polygons, and lines",
        "Layered map workspace",
        "Public share links",
        "Fork example stratbooks",
      ],
      name: "Free",
      note: "Map-first notes for building and sharing your first spatial brief.",
      price: "$0",
      primary: false,
      tag: null,
    },
    {
      cta: "Upgrade to Pro",
      features: [
        "Everything in Free",
        "AI Strategist for notebook-aware Q&A",
        "AI deep research",
        "500 Strategist messages per month",
        "Markdown export",
        "Private workspace controls",
      ],
      name: "Pro",
      note: "For analysts who want the Strategist to research, reason, and draft alongside the map.",
      price: "$10",
      primary: true,
      tag: "Popular",
    },
  ];

  return (
    <section className="landing-section" id="pricing" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", padding: "118px 52px 126px", position: "relative" }}>
      <div style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.08) 1px,transparent 1px)", backgroundSize: "38px 38px", inset: 0, opacity: 0.18, pointerEvents: "none", position: "absolute" }} />
      <div style={{ background: "radial-gradient(ellipse 520px 250px at 50% 35%,rgba(255,255,255,0.13),rgba(255,255,255,0.035) 38%,transparent 72%)", height: 520, left: "50%", pointerEvents: "none", position: "absolute", top: 80, transform: "translateX(-50%)", width: 920 }} />
      <div style={{ margin: "0 auto", maxWidth: 1040, position: "relative", zIndex: 1 }}>
        <div className="reveal" style={{ margin: "0 auto 46px", maxWidth: 720, textAlign: "center" }}>
          <h2 style={{ color: "rgba(255,255,255,0.96)", fontFamily: "'DM Sans',sans-serif", fontSize: "clamp(40px,5vw,64px)", fontWeight: 650, letterSpacing: "-0.055em", lineHeight: 1.04, marginBottom: 16 }}>
            Simple and Affordable
            <br />
            Pricing Plans
          </h2>
          <p style={{ color: "rgba(255,255,255,0.58)", fontSize: 15, lineHeight: 1.6, margin: "0 auto", maxWidth: 540 }}>
            Start mapping for free. Upgrade when you want the Strategist to research, reason, and brief alongside you.
          </p>
        </div>
        <div className="landing-pricing-grid reveal d1" style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr", margin: "0 auto", maxWidth: 780 }}>
          {plans.map((plan, index) => (
            <PriceCard accent={pricingAccent} i={index} key={plan.name} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PriceCard({ accent: cardAccent, i, plan }: { accent: string; i: number; plan: { cta: string; features: string[]; name: string; note: string; price: string; primary: boolean; tag: string | null } }) {
  return (
    <div
      className={`reveal d${i + 1}`}
      style={{
        background: plan.primary
          ? "linear-gradient(180deg,rgba(255,255,255,0.105) 0%,rgba(255,255,255,0.052) 34%,rgba(10,12,16,0.94) 100%)"
          : "linear-gradient(180deg,rgba(255,255,255,0.078) 0%,rgba(255,255,255,0.035) 42%,rgba(10,11,15,0.92) 100%)",
        border: `1px solid ${plan.primary ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.14)"}`,
        borderRadius: 9,
        boxShadow: plan.primary
          ? `0 34px 95px -46px ${cardAccent}, 0 0 0 1px rgba(255,255,255,0.18), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 0 0 1px ${cardAccent}55`
          : "0 22px 70px -58px rgba(255,255,255,0.45), inset 0 1px 0 rgba(255,255,255,0.10)",
        minHeight: 345,
        overflow: "hidden",
        padding: "0",
        position: "relative",
      }}
    >
      {plan.primary ? (
        <>
          <div style={{ background: `linear-gradient(90deg,transparent,${cardAccent},transparent)`, height: 2, left: 18, opacity: 0.85, position: "absolute", right: 18, top: 0 }} />
          <div style={{ background: `linear-gradient(180deg,${cardAccent}30,transparent)`, bottom: 0, pointerEvents: "none", position: "absolute", right: 0, top: 0, width: 1 }} />
          <div style={{ background: `linear-gradient(180deg,${cardAccent}30,transparent)`, bottom: 0, left: 0, pointerEvents: "none", position: "absolute", top: 0, width: 1 }} />
        </>
      ) : null}
      <div style={{ background: plan.primary ? "radial-gradient(ellipse 260px 120px at 54% 0%,rgba(255,255,255,0.38),transparent 68%)" : "radial-gradient(ellipse 220px 95px at 50% 0%,rgba(255,255,255,0.22),transparent 68%)", height: 140, left: "50%", pointerEvents: "none", position: "absolute", top: -52, transform: "translateX(-50%)", width: "82%" }} />
      <div style={{ padding: "22px 20px 20px", position: "relative" }}>
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <p style={{ color: "rgba(255,255,255,0.86)", fontSize: 16, fontWeight: 500, letterSpacing: "-0.02em" }}>{plan.name}</p>
        {plan.tag ? (
          <span style={{ background: `linear-gradient(180deg,${cardAccent},${cardAccent}cc)`, border: `1px solid ${cardAccent}`, borderRadius: 999, boxShadow: `0 0 0 4px rgba(4,6,11,0.9), 0 0 26px -8px ${cardAccent}`, color: "#021312", fontSize: 10, fontWeight: 750, letterSpacing: "-0.02em", marginRight: -4, marginTop: -18, padding: "5px 10px", position: "relative" }}>
            {plan.tag}
          </span>
        ) : null}
      </div>
      <p style={{ color: "rgba(255,255,255,0.96)", fontFamily: "'DM Sans',sans-serif", fontSize: 34, fontWeight: 520, letterSpacing: "-0.055em", lineHeight: 1, marginBottom: 18 }}>
        {plan.price}
        {plan.name === "Pro" ? (
          <span style={{ color: "rgba(255,255,255,0.46)", fontSize: 12, fontWeight: 400, letterSpacing: "-0.02em", marginLeft: 4 }}>
            /mo
          </span>
        ) : null}
      </p>
      <p style={{ color: "rgba(255,255,255,0.52)", fontSize: 12.5, lineHeight: 1.35, marginBottom: 18, minHeight: 34 }}>{plan.note}</p>
      <a
        href={authHref}
        style={{
          alignItems: "center",
          background: plan.primary ? cardAccent : "linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.065))",
          border: `1px solid ${plan.primary ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.18)"}`,
          borderRadius: 5,
          boxShadow: plan.primary ? `0 12px 32px -16px ${cardAccent}` : "inset 0 1px 0 rgba(255,255,255,0.12)",
          color: plan.primary ? "#031312" : "rgba(255,255,255,0.88)",
          display: "flex",
          fontSize: 12.5,
          fontWeight: 700,
          height: 32,
          justifyContent: "center",
          marginBottom: 22,
          width: "100%",
        }}
      >
        {plan.cta}
      </a>
      <div style={{ alignItems: "center", display: "flex", gap: 10, marginBottom: 18, opacity: 0.72 }}>
        <span style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.2))", flex: 1, height: 1 }} />
        <span style={{ color: "rgba(255,255,255,0.32)", fontFamily: "monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase" }}>Features</span>
        <span style={{ background: "linear-gradient(90deg,rgba(255,255,255,0.2),transparent)", flex: 1, height: 1 }} />
      </div>
      <ul style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none" }}>
        {plan.features.map((feature) => (
          <li key={feature} style={{ alignItems: "center", display: "flex", gap: 10 }}>
            <span style={{ alignItems: "center", border: `1px solid ${plan.primary ? `${cardAccent}66` : "rgba(255,255,255,0.28)"}`, borderRadius: "50%", color: plan.primary ? cardAccent : "rgba(255,255,255,0.62)", display: "inline-flex", flexShrink: 0, fontSize: 10, height: 14, justifyContent: "center", width: 14 }}>
              ✓
            </span>
            <span style={{ color: "rgba(255,255,255,0.66)", fontSize: 12.5, lineHeight: 1.4 }}>{feature}</span>
          </li>
        ))}
      </ul>
      </div>
    </div>
  );
}

function FinalCTA({ accent: finalAccent, ctaLabel: finalCtaLabel }: { accent: string; ctaLabel: string }) {
  return (
    <section className="landing-section" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", padding: "130px 52px", position: "relative" }}>
      <div style={{ background: `radial-gradient(circle,${finalAccent}07 0%,transparent 65%)`, borderRadius: "50%", height: 700, left: "50%", pointerEvents: "none", position: "absolute", top: "50%", transform: "translate(-50%,-50%)", width: 700 }} />
      <div className="reveal" style={{ margin: "0 auto", maxWidth: 580, position: "relative", textAlign: "center", zIndex: 1 }}>
        <Wordmark accent={finalAccent} size={22} />
        <h2 style={{ color: "rgba(255,255,255,0.93)", fontFamily: "'EB Garamond',serif", fontSize: "clamp(32px,4vw,56px)", fontWeight: 400, letterSpacing: "-0.015em", lineHeight: 1.05, margin: "22px 0 14px" }}>
          The world keeps moving.
          <br />
          <em style={{ color: `${finalAccent}ee` }}>Start thinking spatially.</em>
        </h2>
        <p style={{ color: "rgba(255,255,255,0.36)", fontSize: 14.5, lineHeight: 1.65, marginBottom: 34 }}>
          AI deep research, three example stratbooks, and your notes anchored to every place that matters.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          <Btn accent={finalAccent} href={authHref} size="lg">
            {finalCtaLabel} →
          </Btn>
          <Btn accent={finalAccent} href="#examples" size="lg" variant="ghost">
            See an example
          </Btn>
        </div>
      </div>
    </section>
  );
}

function Footer({ accent: footerAccent }: { accent: string }) {
  const columns = [
    { h: "Product", links: ["Features", "Examples", "Changelog", "Roadmap"] },
    { h: "Use cases", links: ["OSINT", "Defense", "Journalism", "Investment"] },
    { h: "Resources", links: ["Docs", "Markdown spec", "API", "Templates"] },
    { h: "Company", links: ["About", "Privacy", "Terms", "Contact"] },
  ];

  return (
    <footer className="landing-footer" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "60px 52px 36px" }}>
      <div style={{ margin: "0 auto", maxWidth: 1100 }}>
        <div className="landing-footer-grid" style={{ display: "grid", gap: 36, gridTemplateColumns: "1.6fr repeat(4,1fr)", marginBottom: 44 }}>
          <div>
            <Wordmark accent={footerAccent} />
            <p style={{ color: "rgba(255,255,255,0.26)", fontSize: 12, lineHeight: 1.7, marginTop: 14, maxWidth: 200 }}>AI deep research, anchored to the world.</p>
          </div>
          {columns.map((column) => (
            <div key={column.h}>
              <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 9.5, letterSpacing: "0.24em", marginBottom: 16, textTransform: "uppercase" }}>{column.h}</p>
              <ul style={{ display: "flex", flexDirection: "column", gap: 9, listStyle: "none" }}>
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      onMouseEnter={(event) => {
                        event.currentTarget.style.color = "rgba(255,255,255,0.72)";
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.color = "rgba(255,255,255,0.38)";
                      }}
                      style={{ color: "rgba(255,255,255,0.38)", fontSize: 12.5, transition: "color 0.15s" }}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "space-between", paddingTop: 22 }}>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11.5 }}>© 2026 Stratbook</span>
          <span style={{ color: "rgba(255,255,255,0.16)", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.1em" }}>Made for people who think in maps.</span>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  useReveal();

  return (
    <main className="stratbook-landing" style={{ background: "#04060b", color: "rgba(255,255,255,0.85)", minHeight: "100vh", overflowX: "hidden" }}>
      <Nav accent={accent} ctaLabel={ctaLabel} isAuthenticated={isAuthenticated} />
      <Hero accent={accent} ctaLabel={ctaLabel} />
      <ProofStrip accent={accent} />
      <Features accent={accent} />
      <VsCompetitors accent={accent} />
      <Spotlight accent={accent} />
      <BuiltFor accent={accent} />
      <Testimonial accent={accent} />
      <Examples accent={accent} />
      <Pricing accent={accent} ctaLabel={ctaLabel} />
      <FinalCTA accent={accent} ctaLabel={ctaLabel} />
      <Footer accent={accent} />
    </main>
  );
}

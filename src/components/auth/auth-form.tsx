"use client";

import { Wordmark } from "@/components/brand/wordmark";
import { cn } from "@/lib/utils";
import {
  ArrowRightIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AuthMode = "sign-in" | "sign-up";
type FieldErrors = Partial<Record<"email" | "password" | "confirmPassword", string>>;

const accent = "#5eead4";

const slides = [
  {
    headline: ["Where every insight", "finds its place."],
    scene: SceneMap,
    sub: "Pin intelligence to the map. Reason across the globe.",
  },
  {
    headline: ["Fork the scenario.", "Keep the baseline."],
    scene: SceneTerrain,
    sub: "Model what-ifs without losing your working stratbook.",
  },
  {
    headline: ["The world keeps moving.", "Start thinking spatially."],
    scene: SceneHorizon,
    sub: "AI deep research, anchored to every place that matters.",
  },
];

async function postAuth(path: string, body: Record<string, string>) {
  const response = await fetch(path, {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const payload = (await response.json()) as { error?: string; needsConfirmation?: boolean };
  if (!response.ok) throw new Error(payload.error ?? "Authentication failed.");
  return payload;
}

function getSafeNextPath() {
  if (typeof window === "undefined") return "/app";
  const next = new URLSearchParams(window.location.search).get("next");
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/app";
}

function getPasswordStrength(password: string) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function validateEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

function SceneMap() {
  const nodes = [
    { id: "A", label: "London", x: 180, y: 210 },
    { id: "B", label: "Berlin", x: 310, y: 190 },
    { id: "C", label: "Istanbul", x: 430, y: 260 },
    { id: "D", label: "Tehran", x: 520, y: 310 },
    { id: "E", label: "Cairo", x: 370, y: 350 },
    { id: "F", label: "Tripoli", x: 240, y: 340 },
    { id: "G", label: "Karachi", x: 610, y: 210 },
  ] as const;
  const arcs = [
    { a: "A", b: "B", cx: 245, cy: 175 },
    { a: "B", b: "C", cx: 370, cy: 195 },
    { a: "C", b: "D", cx: 478, cy: 268 },
    { a: "C", b: "E", cx: 455, cy: 325 },
    { a: "E", b: "F", cx: 300, cy: 370 },
    { a: "A", b: "F", cx: 195, cy: 290 },
    { a: "D", b: "G", cx: 572, cy: 245 },
  ] as const;
  const byId = Object.fromEntries(nodes.map((node) => [node.id, node])) as Record<
    (typeof nodes)[number]["id"],
    (typeof nodes)[number]
  >;

  return (
    <div className="absolute inset-0 bg-[linear-gradient(150deg,#020c13_0%,#031824_50%,#041c18_100%)]">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(94,234,212,0.18) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_50%_50%,transparent_40%,rgba(2,10,18,0.75)_100%)]" />

      <svg
        aria-hidden="true"
        className="absolute inset-0 size-full"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 800 560"
      >
        <defs>
          <filter height="200%" id="auth-map-glow" width="200%" x="-50%" y="-50%">
            <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="3" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {arcs.map((arc, index) => {
          const a = byId[arc.a];
          const b = byId[arc.b];
          return (
            <path
              d={`M ${a.x} ${a.y} Q ${arc.cx} ${arc.cy} ${b.x} ${b.y}`}
              fill="none"
              key={`${arc.a}-${arc.b}`}
              stroke="rgba(94,234,212,0.22)"
              strokeDasharray="4 6"
              strokeWidth="1"
              style={{
                animation: `auth-shimmer ${3 + index * 0.5}s ease-in-out infinite`,
                animationDelay: `${index * 0.2}s`,
              }}
            />
          );
        })}

        {nodes.map((node, index) => (
          <g
            filter="url(#auth-map-glow)"
            key={node.id}
            style={{
              animation: `auth-shimmer ${2.8 + index * 0.35}s ease-in-out infinite`,
              animationDelay: `${index * 0.25}s`,
            }}
          >
            <circle
              cx={node.x}
              cy={node.y}
              fill="none"
              r="12"
              stroke="rgba(94,234,212,0.15)"
              strokeWidth="0.8"
            />
            <circle
              cx={node.x}
              cy={node.y}
              fill="rgba(94,234,212,0.08)"
              r="6"
              stroke="rgba(94,234,212,0.35)"
              strokeWidth="0.8"
            />
            <circle cx={node.x} cy={node.y} fill="#5eead4" r="2.5" />
            <text
              fill="rgba(255,255,255,0.35)"
              fontFamily="'DM Sans', sans-serif"
              fontSize="10"
              letterSpacing="0.06em"
              textAnchor="middle"
              x={node.x}
              y={node.y - 18}
            >
              {node.label.toUpperCase()}
            </text>
          </g>
        ))}
      </svg>

      <div className="pointer-events-none absolute top-[20%] left-[35%] size-[280px] rounded-full bg-[radial-gradient(circle,rgba(94,234,212,0.06)_0%,transparent_65%)] [animation:auth-drift_14s_ease-in-out_infinite]" />
    </div>
  );
}

function SceneTerrain() {
  const layers = [
    { opacity: 0.18, scale: 1, ty: 0, rx1: 260, ry1: 140, rx2: 190, ry2: 100, rx3: 120, ry3: 60 },
    { opacity: 0.13, scale: 1.15, ty: 18, rx1: 288, ry1: 158, rx2: 218, ry2: 118, rx3: 148, ry3: 78 },
    { opacity: 0.09, scale: 1.3, ty: 36, rx1: 316, ry1: 176, rx2: 246, ry2: 136, rx3: 176, ry3: 96 },
    { opacity: 0.06, scale: 1.45, ty: 54, rx1: 344, ry1: 194, rx2: 274, ry2: 154, rx3: 204, ry3: 114 },
    { opacity: 0.04, scale: 1.6, ty: 72, rx1: 372, ry1: 212, rx2: 302, ry2: 172, rx3: 232, ry3: 132 },
  ];

  return (
    <div className="absolute inset-0 bg-[linear-gradient(160deg,#06020f_0%,#0d0828_45%,#0a0520_100%)]">
      <svg
        aria-hidden="true"
        className="absolute inset-0 size-full overflow-visible"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 800 600"
      >
        {layers.map((layer, index) => (
          <g
            key={index}
            style={{
              opacity: layer.opacity,
              transform: `translateY(${layer.ty}px) scale(${layer.scale})`,
              transformOrigin: "400px 300px",
            }}
          >
            <ellipse
              cx="400"
              cy="300"
              fill="none"
              rx={layer.rx1}
              ry={layer.ry1}
              stroke="rgba(167,139,250,0.9)"
              strokeWidth="0.8"
            />
            <ellipse
              cx="400"
              cy="300"
              fill="none"
              rx={layer.rx2}
              ry={layer.ry2}
              stroke="rgba(167,139,250,0.9)"
              strokeWidth="0.8"
            />
            <ellipse
              cx="400"
              cy="300"
              fill="none"
              rx={layer.rx3}
              ry={layer.ry3}
              stroke="rgba(167,139,250,0.9)"
              strokeWidth="0.8"
            />
          </g>
        ))}
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,rgba(167,139,250,0.06)_0%,transparent_65%)]" />
      <div className="absolute top-[25%] right-[25%] size-[320px] rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.07)_0%,transparent_65%)] [animation:auth-drift_14s_ease-in-out_infinite]" />
    </div>
  );
}

function SceneHorizon() {
  const rays = [
    -1797.9819355636973, -553.402874075368, -160.16603056776773, 76.77901933187457,
    229.9547506639823, 344.05855044519166, 455.94144955480834, 570.0452493360177,
    723.2209806681254, 960.1660305677677, 1353.402874075368, 2597.9819355636973,
  ];
  const horizontalLines = [410, 440, 480, 530, 600];
  const verticalLines = [
    { x1: 160, x2: -320 },
    { x1: 240, x2: -80 },
    { x1: 320, x2: 160 },
    { x1: 400, x2: 400 },
    { x1: 480, x2: 640 },
    { x1: 560, x2: 880 },
    { x1: 640, x2: 1120 },
  ];

  return (
    <div className="absolute inset-0 bg-[linear-gradient(180deg,#030608_0%,#0a0c10_35%,#120d04_70%,#1a1003_100%)]">
      <svg
        aria-hidden="true"
        className="absolute inset-0 size-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 800 600"
      >
        <defs>
          <radialGradient cx="50%" cy="72%" id="auth-horizon-sun" r="28%">
            <stop offset="0%" stopColor="rgba(251,191,36,0.18)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <rect fill="url(#auth-horizon-sun)" height="600" width="800" x="0" y="0" />
        <line
          stroke="rgba(251,191,36,0.2)"
          strokeWidth="0.8"
          x1="0"
          x2="800"
          y1="390"
          y2="390"
        />
        {rays.map((x2, index) => (
          <line
            key={index}
            stroke="rgba(251,191,36,0.04)"
            strokeWidth="0.6"
            x1="400"
            x2={x2}
            y1="390"
            y2="-200"
          />
        ))}
        {horizontalLines.map((y) => (
          <line
            key={y}
            stroke="rgba(251,191,36,0.06)"
            strokeWidth="0.5"
            x1="0"
            x2="800"
            y1={y}
            y2={y}
          />
        ))}
        {verticalLines.map((line) => (
          <line
            key={`${line.x1}-${line.x2}`}
            stroke="rgba(251,191,36,0.04)"
            strokeWidth="0.5"
            x1={line.x1}
            x2={line.x2}
            y1="390"
            y2="600"
          />
        ))}
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_68%,rgba(251,191,36,0.08)_0%,transparent_70%)]" />
      <div className="absolute bottom-[20%] left-[30%] h-[280px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.05)_0%,transparent_65%)] [animation:auth-drift2_18s_ease-in-out_infinite]" />
    </div>
  );
}

function LeftPanel() {
  const [active, setActive] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const slide = slides[active];
  const Scene = slide.scene;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIsFading(true);
      window.setTimeout(() => {
        setActive((value) => (value + 1) % slides.length);
        setIsFading(false);
      }, 400);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  function goToSlide(index: number) {
    if (index === active) return;
    setIsFading(true);
    window.setTimeout(() => {
      setActive(index);
      setIsFading(false);
    }, 350);
  }

  return (
    <section className="relative hidden min-w-0 flex-1 overflow-hidden bg-[#05080f] lg:block">
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          isFading ? "opacity-0" : "opacity-100"
        )}
        key={active}
      >
        <Scene />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(4,6,11,0.55)_0%,transparent_30%,transparent_55%,rgba(4,6,11,0.88)_100%)]" />

      <Link className="absolute top-9 left-10 z-10" href="/">
        <Wordmark size="lg" />
      </Link>

      <div className="absolute right-10 bottom-9 left-10 z-10">
        <h1
          className={cn(
            "mb-2.5 font-serif text-[clamp(24px,2.6vw,38px)] leading-[1.1] font-normal tracking-tight text-white/95 transition duration-400",
            isFading ? "translate-y-1.5 opacity-0" : "translate-y-0 opacity-100"
          )}
        >
          {slide.headline[0]}
          <br />
          {slide.headline[1]}
        </h1>
        <p
          className={cn(
            "mb-5 text-[13px] leading-normal text-white/45 transition duration-400",
            isFading ? "opacity-0" : "opacity-100"
          )}
        >
          {slide.sub}
        </p>

        <div className="flex items-center gap-[7px]">
          {slides.map((item, index) => (
            <button
              aria-label={`Show ${item.headline[0]}`}
              className="h-1.5 rounded-[3px] border-0 p-0 transition-all duration-300"
              key={item.sub}
              onClick={() => goToSlide(index)}
              style={{
                background: active === index ? accent : "rgba(255,255,255,0.3)",
                width: active === index ? 22 : 6,
              }}
              type="button"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PasswordInput({
  autoComplete,
  error,
  label,
  onChange,
  placeholder,
  value,
}: {
  autoComplete: string;
  error?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="block space-y-1.5">
      <span
        className={cn(
          "text-[11px] font-medium tracking-[0.06em] uppercase",
          error ? "text-rose-300" : "text-white/35"
        )}
      >
        {label}
      </span>
      <span className="relative block">
        <input
          autoComplete={autoComplete}
          className={cn(
            "h-11 w-full rounded-md border bg-white/[0.04] px-3.5 pr-11 text-sm text-white/90 outline-none transition placeholder:text-white/22 focus:bg-teal-300/[0.03]",
            error
              ? "border-rose-400/45 focus:border-rose-300/70"
              : "border-white/[0.09] focus:border-teal-300/45"
          )}
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder={placeholder}
          required
          type={isVisible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={isVisible ? "Hide password" : "Show password"}
          className="absolute top-1/2 right-3 flex size-6 -translate-y-1/2 items-center justify-center text-white/25 transition hover:text-white/55"
          onClick={() => setIsVisible((shown) => !shown)}
          type="button"
        >
          {isVisible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </button>
      </span>
      {error ? <span className="text-[11.5px] text-rose-300">{error}</span> : null}
    </label>
  );
}

function TextField({
  autoComplete,
  error,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  autoComplete: string;
  error?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span
        className={cn(
          "text-[11px] font-medium tracking-[0.06em] uppercase",
          error ? "text-rose-300" : "text-white/35"
        )}
      >
        {label}
      </span>
      <input
        autoComplete={autoComplete}
        className={cn(
          "h-11 w-full rounded-md border bg-white/[0.04] px-3.5 text-sm text-white/90 outline-none transition placeholder:text-white/22 focus:bg-teal-300/[0.03]",
          error
            ? "border-rose-400/45 focus:border-rose-300/70"
            : "border-white/[0.09] focus:border-teal-300/45"
        )}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        required
        type={type}
        value={value}
      />
      {error ? <span className="text-[11.5px] text-rose-300">{error}</span> : null}
    </label>
  );
}

function StrengthMeter({ password }: { password: string }) {
  const score = getPasswordStrength(password);
  const label = ["", "Weak", "Fair", "Good", "Strong"][score];
  const color = ["", "#f87171", "#fb923c", "#facc15", accent][score];

  if (!password) return null;

  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ backgroundColor: color, width: `${score * 25}%` }}
        />
      </div>
      <span className="min-w-9 text-[11px]" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

function SuccessState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-teal-300/25 bg-teal-300/10">
        <CheckIcon className="size-5 text-teal-300" />
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === "sign-up";
  const heading = isSignUp ? "Create your map" : "Welcome back";
  const eyebrow = isSignUp ? "Early access" : "Secure workspace";
  const description = isSignUp
    ? "Free during early access. No credit card required."
    : "Sign in to continue to your stratbook.";

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setErrors({});
    setMessage(null);
    setServerError(null);
    setPassword("");
    setConfirmPassword("");
  }

  function validate() {
    const nextErrors: FieldErrors = {};
    if (!email.trim()) nextErrors.email = "Email is required";
    else if (!validateEmail(email)) nextErrors.email = "Enter a valid email";

    if (!password) nextErrors.password = "Password is required";
    else if (isSignUp && password.length < 8) nextErrors.password = "Use at least 8 characters";

    if (isSignUp && !confirmPassword) nextErrors.confirmPassword = "Please confirm your password";
    else if (isSignUp && confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);
    setMessage(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const payload = await postAuth(isSignUp ? "/api/auth/sign-up" : "/api/auth/sign-in", {
        displayName: email,
        email,
        password,
      });

      if (payload.needsConfirmation) {
        setMessage("Account created. Check your email to confirm your address.");
        setMode("sign-in");
        setPassword("");
        setConfirmPassword("");
        return;
      }

      setMessage(isSignUp ? "Account created. Redirecting..." : "Signed in. Redirecting...");
      router.replace(getSafeNextPath());
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#04060b] text-white">
      <div className="flex min-h-screen">
        <LeftPanel />

        <section className="flex min-h-screen w-full items-center justify-center overflow-y-auto border-white/[0.06] bg-[#070b11] px-6 py-10 lg:w-[420px] lg:min-w-[420px] lg:border-l lg:px-12 lg:py-[52px]">
          <div className="w-full max-w-[340px]">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link href="/">
                <Wordmark size="lg" />
              </Link>
            </div>

            <div className="mb-7 flex gap-0.5 rounded-lg bg-white/[0.05] p-[3px]">
              {(["sign-in", "sign-up"] as AuthMode[]).map((tab) => {
                const active = mode === tab;
                return (
                  <button
                    className={cn(
                      "h-[34px] flex-1 rounded-md text-[13px] transition",
                      active
                        ? "bg-white/10 font-semibold text-white shadow-[0_1px_4px_rgba(0,0,0,0.35)]"
                        : "text-white/35 hover:text-white/65"
                    )}
                    key={tab}
                    onClick={() => switchMode(tab)}
                    type="button"
                  >
                    {tab === "sign-in" ? "Sign in" : "Create account"}
                  </button>
                );
              })}
            </div>

            {message ? (
              <SuccessState>
                <p className="font-serif text-[26px] text-white/90">
                  {message.includes("Redirecting") ? "Signed in" : "Account created"}
                </p>
                <p className="text-[13px] text-white/38">{message}</p>
              </SuccessState>
            ) : (
              <form className="flex flex-col gap-5" noValidate onSubmit={handleSubmit}>
                <div>
                  <p className="mb-2 text-[11px] tracking-[0.16em] text-white/30 uppercase">
                    {eyebrow}
                  </p>
                  <h1 className="font-serif text-[30px] leading-[1.1] font-normal text-white/95">
                    {heading}
                  </h1>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/38">
                    {description}
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <TextField
                    autoComplete="email"
                    error={errors.email}
                    label="Email"
                    onChange={setEmail}
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                  />

                  <div>
                    <PasswordInput
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                      error={errors.password}
                      label="Password"
                      onChange={setPassword}
                      placeholder={isSignUp ? "Minimum 8 characters" : "Your password"}
                      value={password}
                    />
                    {isSignUp ? <StrengthMeter password={password} /> : null}
                  </div>

                  {isSignUp ? (
                    <PasswordInput
                      autoComplete="new-password"
                      error={errors.confirmPassword}
                      label="Confirm password"
                      onChange={setConfirmPassword}
                      placeholder="Repeat password"
                      value={confirmPassword}
                    />
                  ) : null}
                </div>

                {!isSignUp ? (
                  <div className="-mt-2 flex justify-end">
                    <button
                      className="text-[12.5px] text-teal-300/60 transition hover:text-teal-200"
                      type="button"
                    >
                      Forgot password?
                    </button>
                  </div>
                ) : null}

                {serverError ? (
                  <p className="rounded-md border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-[12.5px] leading-relaxed text-rose-100/85">
                    {serverError}
                  </p>
                ) : null}

                <button
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal-300 text-[13.5px] font-semibold text-[#04060b] transition hover:-translate-y-px hover:bg-teal-200 hover:shadow-[0_8px_24px_-8px_rgba(94,234,212,0.45)] disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <>
                      {isSignUp ? "Create account" : "Sign in"}
                      <ArrowRightIcon className="size-3.5" />
                    </>
                  )}
                </button>

                {isSignUp ? (
                  <p className="text-center text-[11px] leading-relaxed text-white/22">
                    By creating an account you agree to the{" "}
                    <span className="text-white/40 underline decoration-white/20">Terms</span>{" "}
                    and{" "}
                    <span className="text-white/40 underline decoration-white/20">
                      Privacy Policy
                    </span>
                    .
                  </p>
                ) : null}

                <p className="text-center text-[13px] text-white/30">
                  {isSignUp ? "Already have an account?" : "No account?"}{" "}
                  <button
                    className="font-medium text-teal-300/80 transition hover:text-teal-200"
                    onClick={() => switchMode(isSignUp ? "sign-in" : "sign-up")}
                    type="button"
                  >
                    {isSignUp ? "Sign in" : "Create one"}
                  </button>
                </p>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/stratmap/types";
import { cn } from "@/lib/utils";
import { CompassIcon, FolderIcon, MapPinIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";

type OnboardingProps = {
  onComplete: () => void;
  project: Project;
  projectId: string;
};

const steps = [
  {
    body: "Your stratbook is a strategic notebook anchored to the world. Drop pins, capture notes, and build up a living map of whatever you're tracking.",
    icon: CompassIcon,
    iconColor: "text-teal-300",
    iconBg: "border-teal-400/20 bg-teal-400/10",
    label: "Welcome",
  },
  {
    body: "The left panel is your stratbook library — a searchable tree of notes, scenario definitions, and data files. Click any entry to preview it in the panel below.",
    icon: FolderIcon,
    iconColor: "text-sky-300",
    iconBg: "border-sky-400/20 bg-sky-400/10",
    label: "Stratbook library",
  },
  {
    body: "Notes linked to a geographic feature appear as markers on the map. Click a marker or a file to jump between them. The map always reflects what's in the stratbook.",
    icon: MapPinIcon,
    iconColor: "text-amber-300",
    iconBg: "border-amber-400/20 bg-amber-400/10",
    label: "Map-linked notes",
  },
  {
    body: "The right panel is the Strategist — your on-call analyst. Ask it to summarize notes, update files, or search across your stratbook. It can read and write directly to your storage.",
    icon: SparklesIcon,
    iconColor: "text-violet-300",
    iconBg: "border-violet-400/20 bg-violet-400/10",
    label: "Meet the Strategist",
  },
];

export function Onboarding({ onComplete, project, projectId }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const Icon = current.icon;

  async function handleComplete() {
    setIsCompleting(true);
    try {
      await fetch(`/api/projects/${projectId}`, {
        body: JSON.stringify({ onboardingComplete: true }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
    } catch {
      // Non-fatal — the app still works without this flag.
    }
    onComplete();
  }

  function handleNext() {
    if (isLast) {
      void handleComplete();
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleSkip() {
    void handleComplete();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm">
      <div className="w-full max-w-lg space-y-8 rounded-[2rem] border border-white/15 bg-[linear-gradient(180deg,rgba(6,12,18,0.97),rgba(8,16,24,0.94))] p-8 shadow-2xl">
        {/* Progress */}
        <div className="flex gap-1.5">
          {steps.map((s, i) => (
            <div
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                i <= step ? "bg-teal-400" : "bg-white/15"
              )}
              key={s.label}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="space-y-5">
          <div
            className={cn(
              "flex size-14 items-center justify-center rounded-[1.25rem] border",
              current.iconBg
            )}
          >
            <Icon className={cn("size-7", current.iconColor)} />
          </div>

          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/38">
              {step + 1} of {steps.length}
            </p>
            <h2 className="text-2xl font-medium text-white">
              {step === 0 ? `Welcome to ${project.name}` : current.label}
            </h2>
            <p className="text-sm leading-relaxed text-white/62">{current.body}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            className="text-white/40 hover:text-white/70"
            disabled={isCompleting}
            onClick={handleSkip}
            type="button"
            variant="ghost"
          >
            Skip
          </Button>
          <Button
            className="rounded-2xl border border-teal-400/25 bg-teal-400/12 px-6 text-teal-200 hover:bg-teal-400/20 disabled:opacity-50"
            disabled={isCompleting}
            onClick={handleNext}
            type="button"
            variant="ghost"
          >
            {isLast ? (isCompleting ? "Starting…" : "Get started") : "Next →"}
          </Button>
        </div>
      </div>
    </div>
  );
}

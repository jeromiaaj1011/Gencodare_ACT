"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight, Sparkles, Split, HeartPulse, LineChart } from "lucide-react";

interface StepperProps {
  currentStep: 1 | 2 | 3 | 4;
  activeConceptName?: string;
  rootConceptName?: string;
  targetConceptId?: string;
  misconceptionId?: string;
}

export default function CognitivePipelineStepper({
  currentStep,
  activeConceptName,
  rootConceptName,
  targetConceptId,
  misconceptionId,
}: StepperProps) {
  const steps = [
    {
      step: 1,
      name: "1. Input & Misconception",
      shortName: "Detection",
      description: "Analyze learner model",
      icon: Sparkles,
      href: "/detector",
    },
    {
      step: 2,
      name: "2. Cognitive Bisect",
      shortName: "Bisect",
      description: "Isolate root learning gap",
      icon: Split,
      href: targetConceptId
        ? `/bisect?conceptId=${targetConceptId}${misconceptionId ? `&misconceptionId=${misconceptionId}` : ""}`
        : "/bisect",
    },
    {
      step: 3,
      name: "3. Targeted Recovery",
      shortName: "Recovery",
      description: "Restructure mental model",
      icon: HeartPulse,
      href: rootConceptName
        ? `/recovery?conceptId=${rootConceptName}`
        : "/recovery",
    },
    {
      step: 4,
      name: "4. Adaptive Roadmap",
      shortName: "Roadmap",
      description: "Recalibrate path & DAG",
      icon: LineChart,
      href: "/progress",
    },
  ];

  return (
    <div className="rounded-2xl bg-archaia-dark border border-archaia-border p-3 sm:p-4 shadow-md space-y-3">
      {/* Top status indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-archaia-border/60 pb-2.5">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-semibold text-white tracking-wide uppercase">
            Cognitive Diagnostic Pipeline
          </span>
          <span className="text-[11px] text-slate-400 font-sans">
            (Step {currentStep} of 4)
          </span>
        </div>

        {activeConceptName && (
          <div className="flex items-center space-x-2 text-xs font-sans">
            <span className="text-slate-400">Current Investigation:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-medium">
              {activeConceptName}
            </span>
            {rootConceptName && rootConceptName !== activeConceptName && (
              <>
                <span className="text-slate-500">→ Root Gap:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium">
                  {rootConceptName}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Stepper tracks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {steps.map((st) => {
          const Icon = st.icon;
          const isCurrent = currentStep === st.step;
          const isCompleted = currentStep > st.step;

          return (
            <Link
              key={st.step}
              href={st.href}
              className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                isCurrent
                  ? "bg-blue-600/15 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/30"
                  : isCompleted
                  ? "bg-archaia-card hover:bg-archaia-cardHover border-emerald-500/30 text-emerald-300"
                  : "bg-archaia-card/50 border-archaia-border text-slate-500 opacity-70 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isCurrent
                        ? "text-blue-400"
                        : isCompleted
                        ? "text-emerald-400"
                        : "text-slate-500"
                    }`}
                  />
                  <span className="text-xs font-semibold">
                    {st.shortName}
                  </span>
                </div>
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500 text-white uppercase">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">Step {st.step}</span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-sans mt-1 line-clamp-1">
                {st.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

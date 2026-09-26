"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Sparkles, Split, HeartPulse, LineChart } from "lucide-react";

interface StepperProps {
  currentStep: 1 | 2 | 3 | 4;
  activeConceptName?: string;
  rootConceptName?: string;
  targetConceptId?: string;
  misconceptionId?: string;
  sessionId?: string;
}

export default function CognitivePipelineStepper({
  currentStep,
  activeConceptName,
  rootConceptName,
  targetConceptId,
  misconceptionId,
  sessionId,
}: StepperProps) {
  const [resolvedSessionId, setResolvedSessionId] = useState<string | undefined>(sessionId);

  useEffect(() => {
    if (sessionId && sessionId.trim().length > 0) {
      setResolvedSessionId(sessionId.trim());
    } else if (typeof window !== "undefined") {
      const urlSession = new URLSearchParams(window.location.search).get("sessionId");
      const stored = sessionStorage.getItem("archaia_session_id");
      const effective =
        urlSession && urlSession.trim().length > 0
          ? urlSession.trim()
          : stored && stored.trim().length > 0
          ? stored.trim()
          : undefined;
      if (effective) setResolvedSessionId(effective);
    }
  }, [sessionId]);

  const bisectParams = new URLSearchParams();
  if (resolvedSessionId) bisectParams.set("sessionId", resolvedSessionId);
  if (targetConceptId) bisectParams.set("conceptId", targetConceptId);
  if (misconceptionId) bisectParams.set("misconceptionId", misconceptionId);
  const bisectHref = `/bisect${bisectParams.toString() ? `?${bisectParams.toString()}` : ""}`;

  const recoveryParams = new URLSearchParams();
  if (resolvedSessionId) recoveryParams.set("sessionId", resolvedSessionId);
  if (rootConceptName) recoveryParams.set("conceptId", rootConceptName);
  if (targetConceptId) recoveryParams.set("fromTarget", targetConceptId);
  const recoveryHref = `/recovery${recoveryParams.toString() ? `?${recoveryParams.toString()}` : ""}`;

  const progressParams = new URLSearchParams();
  if (resolvedSessionId) progressParams.set("sessionId", resolvedSessionId);
  if (rootConceptName) progressParams.set("recoveredConcept", rootConceptName);
  if (targetConceptId) progressParams.set("fromTarget", targetConceptId);
  const progressHref = `/progress${progressParams.toString() ? `?${progressParams.toString()}` : ""}`;

  const steps = [
    {
      step: 1,
      num: "01.",
      name: "01. Input & Misconception",
      shortName: "Detection",
      description: "Analyze learner model",
      icon: Sparkles,
      href: "/detector",
    },
    {
      step: 2,
      num: "02.",
      name: "02. Cognitive Bisect",
      shortName: "Bisect",
      description: "Isolate root learning gap",
      icon: Split,
      href: bisectHref,
    },
    {
      step: 3,
      num: "03.",
      name: "03. Targeted Recovery",
      shortName: "Recovery",
      description: "Restructure mental model",
      icon: HeartPulse,
      href: recoveryHref,
    },
    {
      step: 4,
      num: "04.",
      name: "04. Adaptive Roadmap",
      shortName: "Roadmap",
      description: "Recalibrate path & DAG",
      icon: LineChart,
      href: progressHref,
    },
  ];

  return (
    <div className="card-shades rounded-2xl p-4 sm:p-5 space-y-3.5 relative overflow-hidden">
      {/* Top status indicator matching presentation theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="font-editorial text-sm font-medium tracking-normal text-slate-900">
            Cognitive Diagnostic Pipeline
          </span>
          <span className="text-[11px] text-slate-500 font-sans tracking-wide">
            (Stage {currentStep} of 4)
          </span>
        </div>

        {activeConceptName && (
          <div className="flex items-center space-x-2 text-xs font-sans">
            <span className="text-slate-500">Current Node:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 font-medium">
              {activeConceptName}
            </span>
            {rootConceptName && rootConceptName !== activeConceptName && (
              <>
                <span className="text-slate-500">→ Root Gap:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 font-medium">
                  {rootConceptName}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Stepper tracks with 01., 02., 03., 04. presentation styling */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {steps.map((st) => {
          const Icon = st.icon;
          const isCurrent = currentStep === st.step;
          const isCompleted = currentStep > st.step;

          return (
            <Link
              key={st.step}
              href={st.href}
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between group ${
                isCurrent
                  ? "bg-rose-500/15 border-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.22)] ring-1 ring-rose-500/35"
                  : isCompleted
                  ? "bg-slate-100/90 hover:bg-slate-100 border-emerald-500/30 text-emerald-600"
                  : "bg-slate-50/70 border-slate-200 text-slate-500 opacity-70 hover:opacity-100 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border text-[11px] ${
                      isCurrent
                        ? "bg-rose-500 border-rose-400 text-white shadow-sm"
                        : isCompleted
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-600"
                        : "bg-white/[0.04] border-slate-200 text-slate-500"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span
                      className={`text-xs font-serif font-bold ${
                        isCurrent ? "text-rose-600" : isCompleted ? "text-emerald-600" : "text-slate-500"
                      }`}
                    >
                      {st.num}
                    </span>{" "}
                    <span className="text-xs font-semibold">{st.shortName}</span>
                  </div>
                </div>

                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : isCurrent ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500 text-white uppercase tracking-wider">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">Stage {st.step}</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-sans mt-2 line-clamp-1">
                {st.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

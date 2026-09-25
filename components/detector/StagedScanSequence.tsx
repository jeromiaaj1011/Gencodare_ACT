"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Sparkles, Cpu, Layers, GitBranch, ShieldCheck } from "lucide-react";

interface StagedScanProps {
  topic: string;
  onComplete: () => void;
  durationMs?: number;
}

export default function StagedScanSequence({
  topic,
  onComplete,
  durationMs = 1500,
}: StagedScanProps) {
  const [currentStage, setCurrentStage] = useState(0);

  const stages = [
    { label: "Scanning response syntax & reasoning structure...", icon: Cpu },
    { label: "Evaluating mental model indicators against formal computing invariants...", icon: ShieldCheck },
    { label: "Cross-referencing cognitive bug catalog & misconception patterns...", icon: Layers },
    { label: "Traversing Causal Knowledge Graph for prerequisite dependencies...", icon: GitBranch },
  ];

  useEffect(() => {
    const stageDuration = durationMs / stages.length;

    const interval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < stages.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 250);
          return prev;
        }
      });
    }, stageDuration);

    return () => clearInterval(interval);
  }, [durationMs, onComplete, stages.length]);

  const progressPercentage = Math.round(((currentStage + 1) / stages.length) * 100);

  return (
    <div className="p-6 rounded-2xl bg-[#0E1117] border border-blue-500/40 shadow-2xl space-y-5 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">
              SCAN → ANALYZE → IDENTIFY
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Diagnosing conceptual invariants for <strong>{topic}</strong>
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-blue-400">{progressPercentage}%</span>
      </div>

      {/* Animated Progress Bar */}
      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Sequential Stages List */}
      <div className="space-y-2.5 pt-1">
        {stages.map((stage, idx) => {
          const isDone = idx < currentStage;
          const isActive = idx === currentStage;
          const isPending = idx > currentStage;
          const Icon = stage.icon;

          return (
            <div
              key={stage.label}
              className={`flex items-center space-x-3 p-2.5 rounded-xl border text-xs font-sans transition-all duration-200 ${
                isDone
                  ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                  : isActive
                  ? "bg-blue-950/30 border-blue-500/50 text-white font-medium shadow-sm"
                  : "bg-transparent border-transparent text-slate-500 opacity-50"
              }`}
            >
              <div className="shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isActive ? (
                  <span className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin block" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-600 block" />
                )}
              </div>
              <span className="flex-1 leading-snug">{stage.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

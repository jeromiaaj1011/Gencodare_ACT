"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart,
  CheckCircle2,
  Lock,
  PlayCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldCheck,
  Milestone,
} from "lucide-react";
import { Concept, LearnerConceptState, LearningProgressMetrics } from "@/lib/types";

export default function ProgressPage() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [learnerStates, setLearnerStates] = useState<Record<string, LearnerConceptState>>({});
  const [adaptivePath, setAdaptivePath] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<LearningProgressMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/graph").then((r) => r.json()),
      fetch("/api/adaptive-path").then((r) => r.json()),
    ])
      .then(([graphData, pathData]) => {
        if (graphData.success) {
          setConcepts(graphData.concepts);
          setLearnerStates(graphData.learnerStates);
          setMetrics(graphData.metrics);
        }
        if (pathData.success) {
          setAdaptivePath(pathData.adaptivePath);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <LineChart className="w-5 h-5 text-cyan-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Learning Progress & Adaptive Path (Module 6)
            </h1>
          </div>
          <p className="text-xs text-archaia-muted mt-1">
            Longitudinal cognitive recovery analytics (Features 31–33 & 42). Recalibrates personalized sequences as prerequisite invariants are restored.
          </p>
        </div>

        <Link
          href="/graph"
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border text-white text-xs font-mono transition-colors"
        >
          <span>View Updated DAG Map →</span>
        </Link>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-archaia-dark border border-archaia-border space-y-1">
          <div className="text-archaia-muted text-xs font-mono">Total Concepts</div>
          <div className="text-2xl font-bold font-mono text-white">{concepts.length || 7}</div>
          <div className="text-[10px] text-archaia-muted">Data Structures & Algo</div>
        </div>

        <div className="p-4 rounded-2xl bg-archaia-dark border border-archaia-border space-y-1">
          <div className="text-archaia-muted text-xs font-mono">Mastered & Recovered</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {metrics?.masteredCount ?? 3}
          </div>
          <div className="text-[10px] text-emerald-500/80 font-mono">Verified Mental Models</div>
        </div>

        <div className="p-4 rounded-2xl bg-archaia-dark border border-archaia-border space-y-1">
          <div className="text-archaia-muted text-xs font-mono">Diagnosed & Investigated</div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {metrics?.diagnosedCount ?? 2}
          </div>
          <div className="text-[10px] text-archaia-muted">Via Cognitive Bisect</div>
        </div>

        <div className="p-4 rounded-2xl bg-archaia-dark border border-archaia-border space-y-1">
          <div className="text-archaia-muted text-xs font-mono">Recovery Success Rate</div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {metrics ? `${metrics.recoverySuccessRate}%` : "100%"}
          </div>
          <div className="text-[10px] text-archaia-muted">Post-Intervention Re-Tests</div>
        </div>
      </div>

      {/* Feature 33: Personalized Recovery Path Milestone Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-archaia-dark to-slate-900 border border-indigo-500/40 shadow-glow space-y-4">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold">
          <Milestone className="w-4 h-4" />
          <span>Feature 33: Personalized Recovery Progression Journey</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-archaia-card border border-emerald-500/50 space-y-1">
            <span className="text-emerald-400 font-bold">1. ROOT GAP REPAIR</span>
            <div className="text-white text-xs font-semibold">Call Stack LIFO</div>
            <p className="text-[10px] text-emerald-300">Re-Test Passed (92%) 🟢</p>
          </div>

          <div className="p-3 rounded-xl bg-archaia-card border border-emerald-500/50 space-y-1">
            <span className="text-emerald-400 font-bold">2. PREREQUISITE UNLOCKED</span>
            <div className="text-white text-xs font-semibold">Recursion Returns</div>
            <p className="text-[10px] text-emerald-300">Invariant Mastered 🟢</p>
          </div>

          <div className="p-3 rounded-xl bg-archaia-card border border-cyan-500/50 space-y-1">
            <span className="text-cyan-400 font-bold">3. DOWNSTREAM READY</span>
            <div className="text-white text-xs font-semibold">Tree Traversal</div>
            <p className="text-[10px] text-cyan-300">Unlocked & Ready 🔓</p>
          </div>

          <div className="p-3 rounded-xl bg-archaia-card border border-indigo-500/50 space-y-1">
            <span className="text-indigo-400 font-bold">4. TARGET RE-ENGAGE</span>
            <div className="text-white text-xs font-semibold">Graph Traversal (DFS)</div>
            <p className="text-[10px] text-indigo-300">Unlocked & Calibrated 🔓</p>
          </div>
        </div>
      </div>

      {/* Dynamic Adaptive Learning Path Timeline (Feature 32) */}
      <div className="p-6 rounded-3xl bg-archaia-dark border border-archaia-border space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-archaia-border pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Adaptive Progression Sequence (Feature 32)
            </h3>
          </div>
          <span className="text-xs font-mono text-archaia-muted">
            Dynamically Recalculated Based on Verified Mastery
          </span>
        </div>

        <div className="space-y-3">
          {adaptivePath.map((item, idx) => {
            const conceptInfo = concepts.find((c) => c.id === item.conceptId);
            const isMastered = item.status === "mastered";
            const isReady = item.status === "ready_to_learn";
            const isLocked = item.status === "locked";
            const needsRecovery = item.status === "needs_recovery";

            return (
              <div
                key={item.conceptId}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isMastered
                    ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                    : isReady
                    ? "bg-indigo-950/40 border-cyan-400 text-cyan-200 shadow-glow"
                    : needsRecovery
                    ? "bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-glowWarning"
                    : "bg-archaia-card/50 border-archaia-border text-archaia-muted opacity-60"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 bg-black/40 border border-white/10">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white">
                        {conceptInfo?.name || item.conceptId}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase border">
                        {item.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs opacity-75 mt-0.5">
                      {conceptInfo?.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0 text-xs font-mono">
                  {isMastered && (
                    <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verified</span>
                    </span>
                  )}
                  {isReady && (
                    <span className="flex items-center space-x-1 text-cyan-400 font-semibold animate-pulse">
                      <PlayCircle className="w-4 h-4" />
                      <span>Ready to Learn</span>
                    </span>
                  )}
                  {needsRecovery && (
                    <Link
                      href="/recovery"
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors"
                    >
                      <span>Repair Gap →</span>
                    </Link>
                  )}
                  {isLocked && (
                    <span className="flex items-center space-x-1 text-slate-500">
                      <Lock className="w-4 h-4" />
                      <span>Blocked by {item.blockingPrerequisite}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Concept Mastery Matrix (Feature 42) */}
      <div className="p-6 rounded-3xl bg-archaia-dark border border-archaia-border space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
          Concept Invariant Mastery Matrix
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {concepts.map((c) => {
            const state = learnerStates[c.id];
            const score = state?.masteryScore || 0;
            const status = state?.status || "untested";

            return (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-archaia-card border border-archaia-border space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white font-semibold">{c.name}</span>
                  <span className="text-cyan-400 font-bold">{score}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${score}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500"
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-archaia-muted pt-1">
                  <span>Status: {status}</span>
                  <span>{c.difficulty}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

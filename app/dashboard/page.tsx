"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Bug,
  Split,
  Network,
  HeartPulse,
  TrendingUp,
  AlertOctagon,
  CheckCircle,
  ArrowRight,
  ShieldAlert,
  PlayCircle,
} from "lucide-react";
import { LearningProgressMetrics, Misconception } from "@/lib/types";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<LearningProgressMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/graph")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMetrics(data.metrics);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/60 via-archaia-dark to-slate-900 border border-archaia-border p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cognitive Diagnostic Engine Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Learner Cognitive Diagnostic Hub
            </h1>
            <p className="text-archaia-muted text-sm leading-relaxed">
              ARCHAIA continuously models your conceptual invariants across the Causal Knowledge Graph. When advanced errors occur, we trace and isolate the foundational root gap rather than simply re-showing answers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/detector"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-glow transition-all hover:scale-105"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Launch Live Diagnostic</span>
            </Link>
            <Link
              href="/graph"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border text-white text-xs font-medium transition-all"
            >
              <Network className="w-4 h-4 text-cyan-400" />
              <span>Inspect DAG Map</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-archaia-dark border border-archaia-border space-y-2">
          <div className="flex items-center justify-between text-archaia-muted text-xs font-mono">
            <span>Overall Mastery</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
            {metrics ? `${metrics.overallMasteryPercentage}%` : "62%"}
          </div>
          <div className="text-[11px] text-archaia-muted">Across 7 core CS concepts</div>
        </div>

        <div className="p-5 rounded-2xl bg-archaia-dark border border-archaia-border space-y-2">
          <div className="flex items-center justify-between text-archaia-muted text-xs font-mono">
            <span>Active Cognitive Bugs</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-400">
            {metrics ? metrics.activeMisconceptions.length : 1}
          </div>
          <div className="text-[11px] text-archaia-muted">Isolated for Cognitive Bisect</div>
        </div>

        <div className="p-5 rounded-2xl bg-archaia-dark border border-archaia-border space-y-2">
          <div className="flex items-center justify-between text-archaia-muted text-xs font-mono">
            <span>Mastered Concepts</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
            {metrics ? metrics.masteredCount : 2}
          </div>
          <div className="text-[11px] text-archaia-muted">Solid mental models verified</div>
        </div>

        <div className="p-5 rounded-2xl bg-archaia-dark border border-archaia-border space-y-2">
          <div className="flex items-center justify-between text-archaia-muted text-xs font-mono">
            <span>Recovery Success</span>
            <HeartPulse className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">
            {metrics ? `${metrics.recoverySuccessRate}%` : "100%"}
          </div>
          <div className="text-[11px] text-archaia-muted">Post-intervention re-test rate</div>
        </div>
      </div>

      {/* Main Content Split: Active Misconceptions vs Recommended Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Cognitive Misconceptions (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bug className="w-4 h-4 text-rose-400" />
              <h2 className="text-base font-bold text-white">Active Cognitive Gaps Requiring Bisect</h2>
            </div>
            <Link href="/detector" className="text-xs text-archaia-accent hover:underline flex items-center">
              <span>Submit New Response</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          <div className="space-y-3">
            {metrics?.activeMisconceptions && metrics.activeMisconceptions.length > 0 ? (
              metrics.activeMisconceptions.map((misc) => (
                <div
                  key={misc.id}
                  className="p-5 rounded-2xl bg-archaia-card border border-rose-500/30 hover:border-rose-500/50 transition-all space-y-3 shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          DETECTED MISCONCEPTION
                        </span>
                        <span className="text-xs font-mono text-archaia-muted">
                          Concept: {misc.conceptId}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-white mt-1">{misc.name}</h3>
                    </div>

                    <Link
                      href="/bisect"
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow flex items-center space-x-1 shrink-0"
                    >
                      <Split className="w-3.5 h-3.5" />
                      <span>Run Bisect →</span>
                    </Link>
                  </div>

                  <p className="text-xs text-archaia-muted leading-relaxed">
                    {misc.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50">
                      <div className="text-[10px] font-mono text-rose-400 font-semibold mb-1 uppercase tracking-wider">
                        Learner's Flawed Assumption
                      </div>
                      <div className="text-rose-200 text-[11px]">{misc.studentAssumption}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/50">
                      <div className="text-[10px] font-mono text-emerald-400 font-semibold mb-1 uppercase tracking-wider">
                        Formal Computing Reality
                      </div>
                      <div className="text-emerald-200 text-[11px]">{misc.formalReality}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 rounded-2xl bg-archaia-card border border-archaia-border text-center space-y-2">
                <ShieldAlert className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-semibold text-white">No Unresolved Misconceptions</h4>
                <p className="text-xs text-archaia-muted max-w-sm mx-auto">
                  All active learning paths have verified mental model invariants. Submit a response to stress-test your understanding!
                </p>
                <Link
                  href="/detector"
                  className="inline-block px-4 py-2 mt-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
                >
                  Take Diagnostic Probe
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right: Recommended Learning Actions (1 col) */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Recommended Recovery Path</span>
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-archaia-card border border-archaia-border space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-amber-400 font-semibold">STEP 1: Root Prerequisite</span>
                <span className="text-archaia-muted">Estimated: 10m</span>
              </div>
              <h4 className="text-sm font-bold text-white">Rebuild Call Stack LIFO Invariants</h4>
              <p className="text-xs text-archaia-muted">
                Interactive stack frame visualizer and micro-puzzle to disconfirm the recursive replacement fallacy.
              </p>
              <Link
                href="/recovery"
                className="block text-center py-2 rounded-lg bg-archaia-primary/20 hover:bg-archaia-primary/30 text-archaia-accent border border-archaia-primary/40 text-xs font-medium transition-colors"
              >
                Launch Recovery Lab →
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-archaia-dark border border-archaia-border space-y-2 opacity-80">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">STEP 2: Upstream Concept</span>
                <span className="text-archaia-muted">Estimated: 15m</span>
              </div>
              <h4 className="text-sm font-semibold text-white">Recursion Base Cases & Returns</h4>
              <p className="text-xs text-archaia-muted">
                Will automatically unlock once Call Stack recovery re-test is passed.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-archaia-dark border border-archaia-border space-y-2 opacity-60">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">STEP 3: Advanced Concept</span>
                <span className="text-archaia-muted">Locked</span>
              </div>
              <h4 className="text-sm font-semibold text-white">Graph Traversal (DFS Backtracking)</h4>
              <p className="text-xs text-archaia-muted">
                Final target concept assessment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

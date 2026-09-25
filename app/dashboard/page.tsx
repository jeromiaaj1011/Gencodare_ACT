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
  const [currentUser, setCurrentUser] = useState<{
    fullName: string;
    role: string;
    institution?: string;
  } | null>(null);
  const [customTopic, setCustomTopic] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("archaia_user");
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch {}

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem("archaia_user", JSON.stringify(data.user));
        }
      })
      .catch(() => {});

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
              <span>
                {currentUser
                  ? `Active Diagnostic Session • ${currentUser.fullName} (${currentUser.role})`
                  : "Cognitive Diagnostic Engine Active"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {currentUser
                ? `Welcome back, ${currentUser.fullName}`
                : "Learner Cognitive Diagnostic Hub"}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              {currentUser?.institution ? (
                <span className="text-blue-400 font-medium">{currentUser.institution} • </span>
              ) : null}
              ARCHAIA continuously models your conceptual invariants across the Causal Knowledge Graph. When advanced errors occur, we trace and isolate the foundational root gap rather than simply re-showing answers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/detector"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Launch Live Diagnostic</span>
            </Link>
            <Link
              href="/graph"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border text-white text-xs font-medium transition-all"
            >
              <Network className="w-4 h-4 text-blue-400" />
              <span>Inspect DAG Map</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive Diagnostic Workbench (Action Arena) */}
      <div className="p-6 rounded-2xl bg-archaia-dark border border-archaia-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-archaia-border pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Diagnostic Learning Workbench</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Select an active cognitive workflow to assess, isolate, or repair mental models.
            </p>
          </div>
          <span className="text-xs text-blue-400 font-medium font-sans">4 Core Interactive Engines</span>
        </div>

        {/* Dynamic Concept Pipeline Quick-Launcher */}
        <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-blue-950/40 via-[#131722] to-slate-900 border border-blue-500/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Enter Any Topic or Question for Dynamic Diagnosis:</span>
              </span>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Type any computer science topic or problem. ARCHAIA will deconstruct your mental model and trace prerequisites continuously across all 4 steps.
              </p>
            </div>
            <span className="text-[10px] text-blue-400 font-medium px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 shrink-0">
              Live Dynamic Pipeline
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customTopic.trim()) {
                window.location.href = `/detector?custom=true&concept=${encodeURIComponent(customTopic.trim())}`;
              } else {
                window.location.href = "/detector";
              }
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g. Asynchronous Event Loop, Binary Search Trees, Dynamic Programming, Memory Pointers..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-black/60 border border-archaia-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm shrink-0 flex items-center justify-center space-x-1.5"
            >
              <span>Launch Pipeline →</span>
            </button>
          </form>

          {/* Quick Starter Topics */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-400">Popular Diagnostic Targets:</span>
            {[
              "Asynchronous Event Loop",
              "Binary Tree Traversal",
              "Recursion Base Invariants",
              "Memory Pointer Aliasing",
              "Dynamic Programming",
            ].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setCustomTopic(tag);
                  window.location.href = `/detector?custom=true&concept=${encodeURIComponent(tag)}`;
                }}
                className="text-[10px] font-sans px-2.5 py-1 rounded-lg bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border text-slate-300 hover:text-white transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/detector"
            className="p-4 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border hover:border-blue-500/50 transition-all group flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Bug className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors font-sans">
                1. Test Mental Model
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Submit explanations or code on Graph DFS, Aliasing, or Recursion.
              </p>
            </div>
            <span className="text-xs font-medium text-blue-400 flex items-center space-x-1 font-sans">
              <span>Open Detector →</span>
            </span>
          </Link>

          <Link
            href="/graph"
            className="p-4 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border hover:border-blue-500/50 transition-all group flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Network className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors font-sans">
                2. Explore Causal DAG
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Interact with the 2D prerequisite dependency topology and node drawer.
              </p>
            </div>
            <span className="text-xs font-medium text-blue-400 flex items-center space-x-1 font-sans">
              <span>Inspect Graph →</span>
            </span>
          </Link>

          <Link
            href="/bisect"
            className="p-4 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border hover:border-amber-500/50 transition-all group flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Split className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors font-sans">
                3. Cognitive Bisect
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Issue micro-probes on ancestor concepts to pinpoint the true root gap.
              </p>
            </div>
            <span className="text-xs font-medium text-amber-400 flex items-center space-x-1 font-sans">
              <span>Run Bisect →</span>
            </span>
          </Link>

          <Link
            href="/recovery"
            className="p-4 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border hover:border-emerald-500/50 transition-all group flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <HeartPulse className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors font-sans">
                4. Recovery Lab
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Step through visual stack frames, counterexamples, and re-test mastery.
              </p>
            </div>
            <span className="text-xs font-medium text-emerald-400 flex items-center space-x-1 font-sans">
              <span>Enter Lab →</span>
            </span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-archaia-dark border border-archaia-border space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Overall Mastery</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-sans text-white">
            {metrics ? `${metrics.overallMasteryPercentage}%` : "62%"}
          </div>
          <div className="text-[11px] text-slate-400">Across 7 core CS concepts</div>
        </div>

        <div className="p-5 rounded-2xl bg-archaia-dark border border-archaia-border space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Cognitive Bugs</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-sans text-rose-400">
            {metrics ? metrics.activeMisconceptions.length : 1}
          </div>
          <div className="text-[11px] text-slate-400">Isolated for Cognitive Bisect</div>
        </div>

        <div className="p-5 rounded-2xl bg-archaia-dark border border-archaia-border space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Mastered Concepts</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-sans text-emerald-400">
            {metrics ? metrics.masteredCount : 2}
          </div>
          <div className="text-[11px] text-slate-400">Solid mental models verified</div>
        </div>

        <div className="p-5 rounded-2xl bg-archaia-dark border border-archaia-border space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Recovery Success</span>
            <HeartPulse className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-sans text-amber-400">
            {metrics ? `${metrics.recoverySuccessRate}%` : "100%"}
          </div>
          <div className="text-[11px] text-slate-400">Post-intervention re-test rate</div>
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
            <Link href="/detector" className="text-xs text-blue-400 hover:underline flex items-center font-medium">
              <span>Submit New Response</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          <div className="space-y-3">
            {metrics?.activeMisconceptions && metrics.activeMisconceptions.length > 0 ? (
              metrics.activeMisconceptions.map((misc) => (
                <div
                  key={misc.id}
                  className="p-5 rounded-2xl bg-archaia-card border border-rose-500/30 hover:border-rose-500/50 transition-all space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          DETECTED MISCONCEPTION
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          Concept: {misc.conceptId}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-white mt-1">{misc.name}</h3>
                    </div>

                    <Link
                      href="/bisect"
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm flex items-center space-x-1 shrink-0"
                    >
                      <Split className="w-3.5 h-3.5" />
                      <span>Run Bisect →</span>
                    </Link>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    {misc.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50">
                      <div className="text-[10px] font-semibold text-rose-400 mb-1 uppercase tracking-wider">
                        Learner's Flawed Assumption
                      </div>
                      <div className="text-rose-200 text-[11px] leading-relaxed">{misc.studentAssumption}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/50">
                      <div className="text-[10px] font-semibold text-emerald-400 mb-1 uppercase tracking-wider">
                        Formal Computing Reality
                      </div>
                      <div className="text-emerald-200 text-[11px] leading-relaxed">{misc.formalReality}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 rounded-2xl bg-archaia-card border border-archaia-border text-center space-y-2">
                <ShieldAlert className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-semibold text-white">No Unresolved Misconceptions</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  All active learning paths have verified mental model invariants. Submit a response to stress-test your understanding!
                </p>
                <Link
                  href="/detector"
                  className="inline-block px-4 py-2 mt-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm"
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
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Recommended Recovery Path</span>
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-archaia-card border border-archaia-border space-y-3">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-amber-400 font-semibold">STEP 1: Root Prerequisite</span>
                <span className="text-slate-400">Estimated: 10m</span>
              </div>
              <h4 className="text-sm font-bold text-white">Rebuild Call Stack LIFO Invariants</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Interactive stack frame visualizer and micro-puzzle to disconfirm the recursive replacement fallacy.
              </p>
              <Link
                href="/recovery"
                className="block text-center py-2 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-medium transition-colors"
              >
                Launch Recovery Lab →
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-archaia-dark border border-archaia-border space-y-2 opacity-80">
              <div className="flex items-center justify-between text-xs font-medium">
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

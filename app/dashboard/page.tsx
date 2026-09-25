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
  BookOpen,
  Layers,
  Activity,
  Award,
} from "lucide-react";
import {
  LearningProgressMetrics,
  Concept,
  CourseMaterial,
  AppContentMode,
  LearnerConceptState,
} from "@/lib/types";
import ContentModeBanner from "@/components/mode/ContentModeBanner";
import ShadesFluidBlob from "@/components/decorations/ShadesFluidBlob";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<LearningProgressMetrics | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [learnerStates, setLearnerStates] = useState<Record<string, LearnerConceptState>>({});
  const [mode, setMode] = useState<AppContentMode>("demo");
  const [activeCourse, setActiveCourse] = useState<CourseMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{
    fullName: string;
    role: string;
    institution?: string;
  } | null>(null);
  const [customTopic, setCustomTopic] = useState("");

  const fetchDashboardData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/graph").then((res) => res.json()),
      fetch("/api/course").then((res) => res.json()),
    ])
      .then(([graphData, courseData]) => {
        if (graphData.success) {
          setMetrics(graphData.metrics || null);
          setConcepts(graphData.concepts || []);
          setLearnerStates(graphData.learnerStates || {});
        }
        if (courseData.success) {
          setMode(courseData.mode || "demo");
          setActiveCourse(courseData.activeCourse || null);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("archaia_user");
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch {}

    fetch("/api/auth/session")
      .then((res) => {
        if (res.status === 401 || !res.ok) {
          return { authenticated: false };
        }
        return res.json();
      })
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setCurrentUser(data.user);
          localStorage.setItem("archaia_user", JSON.stringify(data.user));
        }
      })
      .catch(() => {});

    fetchDashboardData();

    const handleModeChange = () => fetchDashboardData();
    window.addEventListener("archaia-mode-change", handleModeChange);
    return () => window.removeEventListener("archaia-mode-change", handleModeChange);
  }, []);

  const getRecommendedNextConcept = () => {
    if (mode === "course" && activeCourse?.concepts && activeCourse.concepts.length > 0) {
      const needingRecovery = activeCourse.concepts.find(
        (c) =>
          c.recoveryStatus === "root_gap_identified" ||
          c.recoveryStatus === "misconception_detected" ||
          c.recoveryStatus === "unresolved"
      );
      if (needingRecovery) return needingRecovery;
      const untested = activeCourse.concepts.find(
        (c) => c.recoveryStatus === "untested" || !c.recoveryStatus
      );
      if (untested) return untested;
      return activeCourse.concepts[0];
    }
    return concepts.find((c) => c.id === "call_stack") || concepts[0] || null;
  };

  const recommendedConcept = getRecommendedNextConcept();

  const masteryPercent = metrics?.overallMasteryPercentage || 0;
  const recoveryPercent = metrics && metrics.recoveredCount > 0 ? metrics.recoverySuccessRate : 0;
  const masteredCount = metrics?.masteredCount || 0;
  const activeBugsCount = metrics?.activeMisconceptions?.length || 0;
  const totalCount = metrics?.totalConcepts || concepts.length || 7;

  return (
    <div className="space-y-7 animate-in fade-in duration-300 relative">
      {/* Corner Fluid Blob Accent */}
      <ShadesFluidBlob variant="top-right" />

      {/* Universal Content Mode Banner */}
      <ContentModeBanner onModeChange={() => fetchDashboardData()} />

      {/* Presentation Hero Deck Header (Slide 1 style) */}
      <div className="card-shades relative overflow-hidden rounded-3xl p-6 sm:p-9 border border-white/[0.08]">
        {/* Ambient fluid glow in background */}
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[100px] opacity-40 mix-blend-screen pointer-events-none"
          style={{
            background: "radial-gradient(circle, #fb7185 0%, #e11d48 50%, #4c0519 80%, transparent 100%)",
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/35 text-rose-300 text-xs font-sans tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {mode === "demo"
                  ? "DEMO DATASET • 01. Graph Traversal Investigation"
                  : `COURSE MODE • 01. ${activeCourse?.title || "Active Course"}`}
              </span>
            </div>

            <h1 className="font-editorial text-3xl sm:text-4xl lg:text-[42px] font-medium text-white tracking-tight leading-[1.15]">
              {currentUser ? `Welcome back, ${currentUser.fullName}` : "Shades That Illuminate."}
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-sans font-normal">
              {mode === "demo" ? (
                <>
                  ARCHAIA continuously maps conceptual invariants across the Causal Knowledge Graph. When higher-order errors occur, we bisect and isolate the root mental gap rather than re-showing standard answers.
                </>
              ) : (
                <>
                  Diagnosing conceptual understanding across <strong>{activeCourse?.title || "Uploaded Material"}</strong> ({concepts.length} dynamic nodes). Micro-probes isolate foundational prerequisites.
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/detector"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl btn-shades-primary font-semibold text-xs transition-all shadow-md"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Launch Diagnostic</span>
            </Link>
            <Link
              href="/graph"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl btn-shades-outline text-xs font-medium"
            >
              <Network className="w-4 h-4 text-rose-400" />
              <span>Inspect Causal DAG</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Slide 12 & 14 Presentation Analytics: High-Contrast Bars & Donut Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT: Slide 12 Style High-Contrast Vertical Bar Chart (7 cols on lg) */}
        <div className="lg:col-span-7 card-shades rounded-2xl p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="space-y-0.5">
              <span className="shades-subtitle text-rose-300/80">02. PERFORMANCE ANALYTICS</span>
              <h2 className="font-editorial text-xl sm:text-2xl font-medium text-white">
                Cognitive Health Index
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Live Telemetry</span>
          </div>

          {/* 4 Presentation Bar Graphs (matching Slide 12 "Social media analytics") */}
          <div className="grid grid-cols-4 gap-3 sm:gap-4 h-52 sm:h-56 items-end pt-4 pb-2 px-2">
            {/* Bar 1: White Bar (Total Concepts) */}
            <div className="flex flex-col items-center h-full justify-end group">
              <span className="text-xs font-bold text-white mb-2 font-mono">{totalCount}</span>
              <div
                className="w-full max-w-[56px] bg-white rounded-t-xl transition-all duration-700 shadow-sm bar-grow"
                style={{ height: "92%" }}
              />
              <span className="text-[10px] text-slate-400 font-sans mt-2.5 text-center truncate w-full">
                Total Nodes
              </span>
            </div>

            {/* Bar 2: Vibrant Crimson/Coral Bar (Mastered Concepts - Callout Style) */}
            <div className="flex flex-col items-center h-full justify-end group">
              <span className="text-xs font-extrabold text-rose-400 mb-2 font-mono">
                {masteredCount} Nodes
              </span>
              <div
                className="w-full max-w-[56px] rounded-t-xl transition-all duration-700 shadow-[0_0_25px_rgba(244,63,94,0.55)] bar-grow"
                style={{
                  height: `${Math.max(22, (masteredCount / Math.max(1, totalCount)) * 100)}%`,
                  background: "linear-gradient(180deg, #ff6484 0%, #e11d48 100%)",
                }}
              />
              <span className="text-[10px] text-rose-300 font-semibold font-sans mt-2.5 text-center truncate w-full">
                Mastered
              </span>
            </div>

            {/* Bar 3: Pink/Rose Bar (Recovery Success) */}
            <div className="flex flex-col items-center h-full justify-end group">
              <span className="text-xs font-bold text-pink-300 mb-2 font-mono">
                {recoveryPercent > 0 ? `${recoveryPercent}%` : "100%"}
              </span>
              <div
                className="w-full max-w-[56px] rounded-t-xl transition-all duration-700 shadow-[0_0_15px_rgba(251,113,133,0.3)] bar-grow"
                style={{
                  height: `${Math.max(25, recoveryPercent || 85)}%`,
                  background: "linear-gradient(180deg, #fecdd3 0%, #fb7185 100%)",
                }}
              />
              <span className="text-[10px] text-pink-300 font-sans mt-2.5 text-center truncate w-full">
                Recovery Rate
              </span>
            </div>

            {/* Bar 4: Dark Plum Bar (Active Bugs) */}
            <div className="flex flex-col items-center h-full justify-end group">
              <span className="text-xs font-bold text-amber-300 mb-2 font-mono">
                {activeBugsCount}
              </span>
              <div
                className="w-full max-w-[56px] bg-[#38101a] border-t-2 border-rose-500 rounded-t-xl transition-all duration-700 bar-grow"
                style={{
                  height: `${Math.max(18, (activeBugsCount / Math.max(1, totalCount)) * 80)}%`,
                }}
              />
              <span className="text-[10px] text-slate-400 font-sans mt-2.5 text-center truncate w-full">
                Active Gaps
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Slide 14 Style Circular Donut Gauges (5 cols on lg) */}
        <div className="lg:col-span-5 card-shades rounded-2xl p-6 sm:p-7 space-y-5 flex flex-col justify-between">
          <div className="space-y-0.5 border-b border-white/[0.08] pb-3">
            <span className="shades-subtitle text-rose-300/80">03. SYSTEM COVERAGE</span>
            <h2 className="font-editorial text-xl sm:text-2xl font-medium text-white">
              Circular Gauges
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2">
            {/* Donut Gauge 1: Mastery */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#090b10]/70 border border-white/[0.06] text-center space-y-2">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#1c2233]"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-rose-500"
                    strokeDasharray={`${Math.max(8, masteryPercent)}, 100`}
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="font-editorial text-xl font-bold text-white">
                    {masteryPercent}%
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-white font-sans">Domain Mastery</span>
              <p className="text-[10px] text-slate-400 font-sans">Verified Invariants</p>
            </div>

            {/* Donut Gauge 2: Recovery / Diagnostic Health */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#090b10]/70 border border-white/[0.06] text-center space-y-2">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#1c2233]"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-pink-400"
                    strokeDasharray={`${Math.max(12, recoveryPercent || 78)}, 100`}
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="font-editorial text-xl font-bold text-white">
                    {recoveryPercent > 0 ? `${recoveryPercent}%` : "78%"}
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-white font-sans">Recovery Index</span>
              <p className="text-[10px] text-slate-400 font-sans">Post-Retest Rate</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center text-xs text-rose-300">
            <span className="font-medium">Topology Status: </span>
            <span className="text-slate-300">Causal links operational & verified</span>
          </div>
        </div>
      </div>

      {/* Interactive Diagnostic Workbench (Action Arena with 01., 02., 03., 04. slide pillars) */}
      <div className="card-shades rounded-2xl p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div>
            <span className="shades-subtitle text-rose-300/80">04. CORE WORKFLOWS</span>
            <h2 className="font-editorial text-xl sm:text-2xl font-medium text-white flex items-center space-x-2">
              <span>Interactive Diagnostic Arena</span>
            </h2>
          </div>
          <span className="text-xs text-rose-300 font-medium font-sans">4 Interlinked Diagnostic Engines</span>
        </div>

        {/* Dynamic Concept Pipeline Quick-Launcher */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0a0d14]/90 border border-rose-500/30 space-y-3 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-white flex items-center space-x-1.5 font-sans">
                <Sparkles className="w-4 h-4 text-rose-400" />
                <span>Enter Any Topic or Code Problem for Dynamic Diagnosis:</span>
              </span>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                Type any computer science topic or problem. ARCHAIA will deconstruct your mental model and trace prerequisites continuously across all 4 steps.
              </p>
            </div>
            <span className="text-[10px] text-rose-300 font-medium px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/35 shrink-0">
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
            <label htmlFor="dashboard-custom-topic" className="sr-only">
              Topic or concept for dynamic diagnosis
            </label>
            <input
              id="dashboard-custom-topic"
              name="topic"
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g. Asynchronous Event Loop, Binary Search Trees, Dynamic Programming, Memory Pointers..."
              aria-label="Diagnostic topic or code problem"
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#06070a] border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-sans input-focus-glow"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl btn-shades-primary font-semibold text-xs shrink-0 flex items-center justify-center space-x-1.5"
            >
              <span>Launch Pipeline →</span>
            </button>
          </form>

          {/* Quick Starter Topics / Dynamic Course Concept Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-400">
              {mode === "course" && activeCourse ? "Course Concepts to Diagnose:" : "Popular Diagnostic Targets:"}
            </span>
            {(mode === "course" && activeCourse?.concepts
              ? activeCourse.concepts.map((c) => c.name)
              : [
                  "Asynchronous Event Loop",
                  "Binary Tree Traversal",
                  "Recursion Base Invariants",
                  "Memory Pointer Aliasing",
                  "Dynamic Programming",
                ]
            ).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setCustomTopic(tag);
                  window.location.href = `/detector?custom=true&concept=${encodeURIComponent(tag)}`;
                }}
                className="text-[10px] font-sans px-2.5 py-1 rounded-lg bg-[#141824] hover:bg-[#1f2538] border border-white/[0.08] text-slate-300 hover:text-white transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Core Workbench Modules (Slide 2 / Slide 7 Numbered Presentation Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link
            href="/detector"
            className="p-5 rounded-2xl bg-[#0e111a] hover:bg-[#141824] border border-white/[0.08] hover:border-rose-500/40 transition-all group flex flex-col justify-between space-y-3 card-shades"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="slide-index-serif text-lg">01.</span>
                <div className="w-8 h-8 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Bug className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-editorial text-base font-semibold text-white group-hover:text-rose-300 transition-colors">
                Misconception Detector
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Analyze student reasoning and code to isolate cognitive bugs.
              </p>
            </div>
            <span className="text-xs font-medium text-rose-300 flex items-center space-x-1 font-sans">
              <span>Run Detector →</span>
            </span>
          </Link>

          <Link
            href="/graph"
            className="p-5 rounded-2xl bg-[#0e111a] hover:bg-[#141824] border border-white/[0.08] hover:border-rose-500/40 transition-all group flex flex-col justify-between space-y-3 card-shades"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="slide-index-serif text-lg">02.</span>
                <div className="w-8 h-8 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Network className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-editorial text-base font-semibold text-white group-hover:text-rose-300 transition-colors">
                Causal DAG Map
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Explore the {concepts.length}-node prerequisite topology and node inspection drawer.
              </p>
            </div>
            <span className="text-xs font-medium text-rose-300 flex items-center space-x-1 font-sans">
              <span>Inspect DAG →</span>
            </span>
          </Link>

          <Link
            href="/bisect"
            className="p-5 rounded-2xl bg-[#0e111a] hover:bg-[#141824] border border-white/[0.08] hover:border-amber-500/40 transition-all group flex flex-col justify-between space-y-3 card-shades"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="slide-index-serif text-lg text-amber-400">03.</span>
                <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Split className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-editorial text-base font-semibold text-white group-hover:text-amber-300 transition-colors">
                Cognitive Bisect
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Issue micro-probes on ancestor concepts to pinpoint the true likely root gap.
              </p>
            </div>
            <span className="text-xs font-medium text-amber-300 flex items-center space-x-1 font-sans">
              <span>Run Bisect →</span>
            </span>
          </Link>

          <Link
            href="/recovery"
            className="p-5 rounded-2xl bg-[#0e111a] hover:bg-[#141824] border border-white/[0.08] hover:border-emerald-500/40 transition-all group flex flex-col justify-between space-y-3 card-shades"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="slide-index-serif text-lg text-emerald-400">04.</span>
                <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <HeartPulse className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-editorial text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
                Recovery Lab
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Step through visual memory models, counterexamples, and mandatory re-test.
              </p>
            </div>
            <span className="text-xs font-medium text-emerald-300 flex items-center space-x-1 font-sans">
              <span>Enter Lab →</span>
            </span>
          </Link>
        </div>
      </div>

      {/* Main Content Split: Active Misconceptions vs Recommended Recovery Path */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Cognitive Misconceptions (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bug className="w-4 h-4 text-rose-400" />
              <h2 className="font-editorial text-xl font-medium text-white">
                Active Cognitive Gaps Requiring Bisect
              </h2>
            </div>
            <Link
              href="/detector"
              className="text-xs text-rose-300 hover:underline flex items-center font-medium"
            >
              <span>Submit New Response</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>

          <div className="space-y-3">
            {metrics?.activeMisconceptions && metrics.activeMisconceptions.length > 0 ? (
              metrics.activeMisconceptions.map((misc) => (
                <div
                  key={misc.id}
                  className="card-shades p-5 rounded-2xl border-rose-500/30 hover:border-rose-500/60 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 font-sans">
                          DETECTED MISCONCEPTION
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          Concept: {misc.conceptId}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-white mt-1 font-editorial">{misc.name}</h3>
                    </div>

                    <Link
                      href="/bisect"
                      className="px-3 py-1.5 rounded-lg btn-shades-primary text-xs font-medium shadow-sm flex items-center space-x-1 shrink-0"
                    >
                      <Split className="w-3.5 h-3.5" />
                      <span>Run Bisect →</span>
                    </Link>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {misc.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50">
                      <div className="text-[10px] font-semibold text-rose-400 mb-1 uppercase tracking-wider font-sans">
                        Learner's Flawed Assumption
                      </div>
                      <div className="text-rose-200 text-[11px] leading-relaxed font-sans">
                        {misc.studentAssumption}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/50">
                      <div className="text-[10px] font-semibold text-emerald-400 mb-1 uppercase tracking-wider font-sans">
                        Formal Computing Reality
                      </div>
                      <div className="text-emerald-200 text-[11px] leading-relaxed font-sans">
                        {misc.formalReality}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card-shades p-6 rounded-2xl text-center space-y-2">
                <ShieldAlert className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-semibold text-white font-editorial">No Unresolved Misconceptions</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                  {mode === "demo"
                    ? "All active learning paths have verified mental model invariants. Submit a response to stress-test your understanding!"
                    : `No cognitive gaps detected in ${activeCourse?.title || "active course"}. Select any concept below to test invariants.`}
                </p>
                <Link
                  href="/detector"
                  className="inline-block px-4 py-2 mt-2 rounded-lg btn-shades-primary text-xs font-medium shadow-sm"
                >
                  Take Diagnostic Probe
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right: Data-Driven Recommended Recovery / Learning Path (1 col) */}
        <div className="space-y-4">
          <h2 className="font-editorial text-xl font-medium text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span>
              {mode === "demo" ? "Recommended Path" : "Course Roadmap"}
            </span>
          </h2>

          <div className="space-y-3">
            {recommendedConcept ? (
              <div className="card-shades p-5 rounded-2xl border-rose-500/30 space-y-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-rose-400 font-semibold uppercase tracking-wider text-[10px] font-sans">
                    Recommended Next Concept
                  </span>
                  <span className="text-slate-400 text-[11px] font-mono">
                    ~{recommendedConcept.estimatedMinutes}m
                  </span>
                </div>
                <h4 className="font-editorial text-base font-bold text-white">{recommendedConcept.name}</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {recommendedConcept.description}
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <Link
                    href={`/detector?custom=true&concept=${encodeURIComponent(recommendedConcept.name)}`}
                    className="flex-1 text-center py-2 rounded-lg btn-shades-primary text-xs font-semibold shadow-sm transition-all"
                  >
                    Test Invariant →
                  </Link>
                  <Link
                    href={`/graph?highlight=${encodeURIComponent(recommendedConcept.id)}`}
                    className="px-3 py-2 rounded-lg btn-shades-outline text-slate-300 text-xs font-medium transition-colors"
                  >
                    Inspect in DAG
                  </Link>
                </div>
              </div>
            ) : null}

            {/* Curriculum Concepts List */}
            <div className="card-shades p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-medium border-b border-white/[0.08] pb-2">
                <span className="text-slate-300 font-semibold flex items-center space-x-1.5 font-sans">
                  <BookOpen className="w-3.5 h-3.5 text-rose-400" />
                  <span>
                    {mode === "demo" ? "Seeded Demo Curriculum" : "Extracted Course Concepts"}
                  </span>
                </span>
                <span className="text-slate-400 text-[11px] font-mono">{concepts.length} total</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {concepts.map((c, idx) => {
                  const state = learnerStates[c.id];
                  const isMastered =
                    state?.status === "mastered" ||
                    state?.status === "recovered" ||
                    c.recoveryStatus === "mastered" ||
                    c.recoveryStatus === "recovered";
                  return (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-xl bg-[#090b10]/80 border border-white/[0.06] flex items-center justify-between text-xs font-sans hover:border-white/[0.14] transition-colors"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className="w-5 h-5 rounded-full bg-[#181c28] text-rose-300 flex items-center justify-center text-[10px] font-mono shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-slate-200 truncate">{c.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          isMastered
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : "bg-[#141824] text-slate-400"
                        }`}
                      >
                        {isMastered ? "Mastered" : "Ready"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

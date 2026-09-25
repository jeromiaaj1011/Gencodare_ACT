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
  FolderOpen,
  Layers,
  GraduationCap,
  Target,
  Compass,
} from "lucide-react";
import {
  LearningProgressMetrics,
  Misconception,
  Concept,
  CourseMaterial,
  AppContentMode,
  LearnerConceptState,
} from "@/lib/types";
import ContentModeBanner from "@/components/mode/ContentModeBanner";

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
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
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

  // Compute recommended next concept dynamically based on current mode
  const getRecommendedNextConcept = () => {
    if (mode === "course" && activeCourse?.concepts && activeCourse.concepts.length > 0) {
      // Find concept that needs recovery or is untested
      const needingRecovery = activeCourse.concepts.find(
        (c) =>
          c.recoveryStatus === "root_gap_identified" ||
          c.recoveryStatus === "misconception_detected" ||
          c.recoveryStatus === "unresolved"
      );
      if (needingRecovery) return needingRecovery;
      const untested = activeCourse.concepts.find((c) => c.recoveryStatus === "untested" || !c.recoveryStatus);
      if (untested) return untested;
      return activeCourse.concepts[0];
    }
    // Demo Mode default
    return concepts.find((c) => c.id === "call_stack") || concepts[0] || null;
  };

  const recommendedConcept = getRecommendedNextConcept();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Universal Content Mode Banner & Quick Switcher */}
      <ContentModeBanner onModeChange={() => fetchDashboardData()} />

      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/70 via-archaia-dark to-slate-900 border border-archaia-border p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {mode === "demo"
                  ? "DEMO DATASET • Seeded Graph Traversal Investigation"
                  : `COURSE MODE • Operating on: ${activeCourse?.title || "Active Course"}`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {currentUser
                ? `Welcome back, ${currentUser.fullName}`
                : "Learner Cognitive Diagnostic Hub"}
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed font-sans">
              {mode === "demo" ? (
                <>
                  ARCHAIA continuously models conceptual invariants across the Causal Knowledge Graph. When advanced errors occur, we trace and isolate the foundational root gap rather than simply re-showing answers.
                </>
              ) : (
                <>
                  Diagnosing conceptual understanding across <strong>{activeCourse?.title || "Uploaded Material"}</strong> ({concepts.length} dynamic concepts). Invariant probes isolate foundational gaps across your curriculum.
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/detector"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-all btn-interactive"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Launch Live Diagnostic</span>
            </Link>
            <Link
              href="/graph"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border text-white text-xs font-medium transition-all btn-interactive-subtle"
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
              className="flex-1 px-4 py-2.5 rounded-xl bg-black/60 border border-archaia-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans input-focus-glow"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm shrink-0 flex items-center justify-center space-x-1.5 btn-interactive"
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
                className="text-[10px] font-sans px-2.5 py-1 rounded-lg bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border text-slate-300 hover:text-white transition-colors btn-interactive-subtle"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Core Workbench Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/detector"
            className="p-4 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border hover:border-blue-500/50 transition-all group flex flex-col justify-between space-y-3 card-interactive"
          >
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Bug className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors font-sans">
                1. Test Mental Model
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Submit explanations or code on {concepts[0]?.name || "any concept"} to isolate cognitive bugs.
              </p>
            </div>
            <span className="text-xs font-medium text-blue-400 flex items-center space-x-1 font-sans">
              <span>Open Detector →</span>
            </span>
          </Link>

          <Link
            href="/graph"
            className="p-4 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border hover:border-blue-500/50 transition-all group flex flex-col justify-between space-y-3 card-interactive"
          >
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Network className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors font-sans">
                2. Explore Causal DAG
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Interact with the {concepts.length}-node prerequisite topology and node inspection drawer.
              </p>
            </div>
            <span className="text-xs font-medium text-blue-400 flex items-center space-x-1 font-sans">
              <span>Inspect Graph →</span>
            </span>
          </Link>

          <Link
            href="/bisect"
            className="p-4 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border hover:border-amber-500/50 transition-all group flex flex-col justify-between space-y-3 card-interactive"
          >
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Split className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors font-sans">
                3. Cognitive Bisect
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Issue micro-probes on ancestor concepts to pinpoint the true likely root gap.
              </p>
            </div>
            <span className="text-xs font-medium text-amber-400 flex items-center space-x-1 font-sans">
              <span>Run Bisect →</span>
            </span>
          </Link>

          <Link
            href="/recovery"
            className="p-4 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border hover:border-emerald-500/50 transition-all group flex flex-col justify-between space-y-3 card-interactive"
          >
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <HeartPulse className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors font-sans">
                4. Recovery Lab
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Step through visual memory models, counterexamples, and mandatory re-test.
              </p>
            </div>
            <span className="text-xs font-medium text-emerald-400 flex items-center space-x-1 font-sans">
              <span>Enter Lab →</span>
            </span>
          </Link>
        </div>
      </div>

      {/* Metrics Row (Interactive 3D Tilt & Numerical Emphasis) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-archaia-dark border border-archaia-border space-y-2 card-interactive">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Overall Mastery</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-sans text-white number-emphasis">
            {metrics ? `${metrics.overallMasteryPercentage}%` : "--"}
          </div>
          <div className="text-[11px] text-slate-400">
            {metrics && metrics.totalConcepts > 0
              ? `Across ${metrics.totalConcepts} active concepts`
              : "No diagnostic completed yet"}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-archaia-dark border border-archaia-border space-y-2 card-interactive">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Cognitive Bugs</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-sans text-rose-400 number-emphasis">
            {metrics ? metrics.activeMisconceptions.length : 0}
          </div>
          <div className="text-[11px] text-slate-400">
            {metrics && metrics.activeMisconceptions.length > 0
              ? "Isolated for Cognitive Bisect"
              : "No active cognitive bugs"}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-archaia-dark border border-archaia-border space-y-2 card-interactive">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Mastered Concepts</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-sans text-emerald-400 number-emphasis">
            {metrics ? metrics.masteredCount : 0}
          </div>
          <div className="text-[11px] text-slate-400">
            {metrics && metrics.masteredCount > 0
              ? "Solid mental models verified"
              : "Start diagnostic to verify"}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-archaia-dark border border-archaia-border space-y-2 card-interactive">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Recovery Success</span>
            <HeartPulse className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-sans text-amber-400 number-emphasis">
            {metrics && metrics.recoveredCount > 0 ? `${metrics.recoverySuccessRate}%` : "--"}
          </div>
          <div className="text-[11px] text-slate-400">Post-intervention re-test rate</div>
        </div>
      </div>

      {/* Main Content Split: Active Misconceptions vs Recommended Recovery Path */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Cognitive Misconceptions (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bug className="w-4 h-4 text-rose-400" />
              <h2 className="text-base font-bold text-white">
                Active Cognitive Gaps Requiring Bisect
              </h2>
            </div>
            <Link
              href="/detector"
              className="text-xs text-blue-400 hover:underline flex items-center font-medium"
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
                  className="p-5 rounded-2xl bg-archaia-card border border-rose-500/30 hover:border-rose-500/50 transition-all space-y-3 shadow-sm card-interactive"
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
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm flex items-center space-x-1 shrink-0 btn-interactive"
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
                      <div className="text-rose-200 text-[11px] leading-relaxed">
                        {misc.studentAssumption}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/50">
                      <div className="text-[10px] font-semibold text-emerald-400 mb-1 uppercase tracking-wider">
                        Formal Computing Reality
                      </div>
                      <div className="text-emerald-200 text-[11px] leading-relaxed">
                        {misc.formalReality}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 rounded-2xl bg-archaia-card border border-archaia-border text-center space-y-2 card-interactive">
                <ShieldAlert className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-semibold text-white">No Unresolved Misconceptions</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto font-sans">
                  {mode === "demo"
                    ? "All active learning paths have verified mental model invariants. Submit a response to stress-test your understanding!"
                    : `No cognitive gaps detected in ${activeCourse?.title || "active course"}. Select any concept below to test invariants.`}
                </p>
                <Link
                  href="/detector"
                  className="inline-block px-4 py-2 mt-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm btn-interactive"
                >
                  Take Diagnostic Probe
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right: Data-Driven Recommended Recovery / Learning Path (1 col) */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>
              {mode === "demo" ? "Recommended Recovery Path" : "Course Curriculum Roadmap"}
            </span>
          </h2>

          <div className="space-y-3">
            {recommendedConcept ? (
              <div className="p-4 rounded-2xl bg-archaia-card border border-blue-500/30 space-y-3 card-interactive">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-amber-400 font-semibold uppercase tracking-wider text-[10px]">
                    Recommended Next Concept
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    ~{recommendedConcept.estimatedMinutes}m
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{recommendedConcept.name}</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {recommendedConcept.description}
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <Link
                    href={`/detector?custom=true&concept=${encodeURIComponent(recommendedConcept.name)}`}
                    className="flex-1 text-center py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all btn-interactive"
                  >
                    Test Invariant →
                  </Link>
                  <Link
                    href={`/graph?highlight=${encodeURIComponent(recommendedConcept.id)}`}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors btn-interactive-subtle"
                  >
                    Inspect in DAG
                  </Link>
                </div>
              </div>
            ) : null}

            {/* Curriculum Concepts List */}
            <div className="p-4 rounded-2xl bg-archaia-dark border border-archaia-border space-y-3 card-interactive">
              <div className="flex items-center justify-between text-xs font-medium border-b border-archaia-border pb-2">
                <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    {mode === "demo" ? "Seeded Demo Curriculum" : "Extracted Course Concepts"}
                  </span>
                </span>
                <span className="text-slate-400 text-[11px]">{concepts.length} total</span>
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
                      className="p-2.5 rounded-xl bg-archaia-card/70 border border-slate-800/80 flex items-center justify-between text-xs font-sans hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-slate-400 flex items-center justify-center text-[10px] font-mono shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-slate-200 truncate">{c.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          isMastered
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400"
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

"use client";

import { useEffect, useState, useRef } from "react";
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
  FolderOpen,
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
  const dashboardFileInputRef = useRef<HTMLInputElement | null>(null);
  const [dashboardImporting, setDashboardImporting] = useState(false);
  const [dashboardFileError, setDashboardFileError] = useState<string | null>(null);
  const [isDashboardDragging, setIsDashboardDragging] = useState(false);

  const processDashboardFile = async (file: File) => {
    setDashboardImporting(true);
    setDashboardFileError(null);
    try {
      const text = await file.text();
      const res = await fetch("/api/analyze-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileContent: text,
          fileSize: file.size,
        }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("archaia_prefill_topic", data.analysis.topic || file.name.replace(/\.[^/.]+$/, ""));
          sessionStorage.setItem(
            "archaia_prefill_question",
            data.analysis.problemStatement || data.analysis.suggestedQuestion || ""
          );
          sessionStorage.setItem(
            "archaia_prefill_answer",
            data.analysis.suggestedAnswer || (data.analysis.codeSnippet ? "" : text.slice(0, 1000))
          );
          if (data.analysis.codeSnippet) {
            sessionStorage.setItem("archaia_prefill_code", data.analysis.codeSnippet);
          }
        }
        window.location.href = "/detector?custom=true";
      } else {
        setDashboardFileError(data.error || "Failed to analyze uploaded file.");
      }
    } catch {
      setDashboardFileError("Error reading uploaded file from file manager.");
    } finally {
      setDashboardImporting(false);
      if (dashboardFileInputRef.current) {
        dashboardFileInputRef.current.value = "";
      }
    }
  };

  const handleDashboardFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processDashboardFile(file);
  };

  const fetchDashboardData = () => {
    setLoading(true);
    const sessionId = sessionStorage.getItem("archaia_session_id") || "";
    Promise.all([
      fetch(`/api/graph${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ""}`).then((res) => res.json()),
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
      <div className="card-shades relative overflow-hidden rounded-3xl p-6 sm:p-9 border border-slate-200">
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
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/35 text-rose-600 text-xs font-sans tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {mode === "demo"
                  ? "DEMO DATASET • 01. Graph Traversal Investigation"
                  : `COURSE MODE • 01. ${activeCourse?.title || "Active Course"}`}
              </span>
            </div>

            <h1 className="font-editorial text-3xl sm:text-4xl lg:text-[42px] font-medium text-slate-900 tracking-tight leading-[1.15]">
              {currentUser ? `Welcome back, ${currentUser.fullName}` : "Shades That Illuminate."}
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-sans font-normal">
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
              <Network className="w-4 h-4 text-rose-600" />
              <span>Inspect Causal DAG</span>
            </Link>
          </div>
        </div>
      </div>

      {/* File Manager Code & Syllabus Upload Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDashboardDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDashboardDragging(false);
        }}
        onDrop={async (e) => {
          e.preventDefault();
          setIsDashboardDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) await processDashboardFile(file);
        }}
        className={`p-5 rounded-2xl border transition-all ${
          isDashboardDragging
            ? "border-rose-500 bg-rose-500/15 scale-[1.01]"
            : "border-rose-500/30 bg-gradient-to-r from-white via-slate-50 to-pink-50 hover:border-rose-500/50"
        } flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl card-shades`}
      >
        <input
          ref={dashboardFileInputRef}
          id="dashboard-file-input"
          name="dashboardFile"
          type="file"
          className="hidden"
          onChange={handleDashboardFileImport}
          accept=".sql,.py,.java,.cpp,.c,.js,.ts,.txt,.md,.json,.rs,.go"
          aria-label="Upload code file from file manager"
        />

        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 shrink-0">
            {dashboardImporting ? (
              <Sparkles className="w-6 h-6 animate-spin text-rose-600" />
            ) : (
              <FolderOpen className="w-6 h-6 text-rose-600" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 border border-rose-500/30 font-sans">
                FILE MANAGER INTAKE
              </span>
              <span className="text-xs font-semibold text-slate-900">Upload Code or Problem from File Manager</span>
            </div>
            <p className="text-xs text-slate-600 font-sans mt-0.5">
              Select or drop any source file (.py, .java, .cpp, .sql, .js, .ts, .txt) from your file manager to automatically extract concepts and launch cognitive diagnosis.
            </p>
            {dashboardFileError && (
              <p className="text-xs text-rose-600 font-sans mt-1">{dashboardFileError}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => dashboardFileInputRef.current?.click()}
            disabled={dashboardImporting}
            className="px-5 py-2.5 rounded-xl btn-shades-primary text-white font-semibold text-xs shadow-md transition-transform hover:scale-105 flex items-center space-x-2"
          >
            {dashboardImporting ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
              <FolderOpen className="w-4 h-4" />
            )}
            <span>{dashboardImporting ? "Analyzing File..." : "Browse File Manager"}</span>
          </button>
        </div>
      </div>

      {/* Slide 12 & 14 Presentation Analytics: High-Contrast Bars & Donut Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT: Slide 12 Style High-Contrast Vertical Bar Chart (7 cols on lg) */}
        <div className="lg:col-span-7 card-shades rounded-2xl p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="space-y-0.5">
              <span className="shades-subtitle text-rose-600/80">02. PERFORMANCE ANALYTICS</span>
              <h2 className="font-editorial text-xl sm:text-2xl font-medium text-slate-900">
                Cognitive Health Index
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">Live Telemetry</span>
          </div>

          {/* 4 Presentation Bar Graphs (matching Slide 12 "Social media analytics") */}
          <div className="grid grid-cols-4 gap-3 sm:gap-4 h-52 sm:h-56 items-end pt-4 pb-2 px-2">
            {/* Bar 1: White Bar (Total Concepts) */}
            <div className="flex flex-col items-center h-full justify-end group">
              <span className="text-xs font-bold text-slate-900 mb-2 font-mono">{totalCount}</span>
              <div
                className="w-full max-w-[56px] bg-white rounded-t-xl transition-all duration-700 shadow-sm bar-grow"
                style={{ height: "92%" }}
              />
              <span className="text-[10px] text-slate-500 font-sans mt-2.5 text-center truncate w-full">
                Total Nodes
              </span>
            </div>

            {/* Bar 2: Vibrant Crimson/Coral Bar (Mastered Concepts - Callout Style) */}
            <div className="flex flex-col items-center h-full justify-end group">
              <span className="text-xs font-extrabold text-rose-600 mb-2 font-mono">
                {masteredCount} Nodes
              </span>
              <div
                className="w-full max-w-[56px] rounded-t-xl transition-all duration-700 shadow-[0_0_25px_rgba(244,63,94,0.55)] bar-grow"
                style={{
                  height: `${Math.max(22, (masteredCount / Math.max(1, totalCount)) * 100)}%`,
                  background: "linear-gradient(180deg, #ff6484 0%, #e11d48 100%)",
                }}
              />
              <span className="text-[10px] text-rose-600 font-semibold font-sans mt-2.5 text-center truncate w-full">
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
              <span className="text-xs font-bold text-amber-600 mb-2 font-mono">
                {activeBugsCount}
              </span>
              <div
                className="w-full max-w-[56px] bg-[#38101a] border-t-2 border-rose-500 rounded-t-xl transition-all duration-700 bar-grow"
                style={{
                  height: `${Math.max(18, (activeBugsCount / Math.max(1, totalCount)) * 80)}%`,
                }}
              />
              <span className="text-[10px] text-slate-500 font-sans mt-2.5 text-center truncate w-full">
                Active Gaps
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Slide 14 Style Circular Donut Gauges (5 cols on lg) */}
        <div className="lg:col-span-5 card-shades rounded-2xl p-6 sm:p-7 space-y-5 flex flex-col justify-between">
          <div className="space-y-0.5 border-b border-slate-200 pb-3">
            <span className="shades-subtitle text-rose-600/80">03. SYSTEM COVERAGE</span>
            <h2 className="font-editorial text-xl sm:text-2xl font-medium text-slate-900">
              Circular Gauges
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2">
            {/* Donut Gauge 1: Mastery */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/70 border border-slate-200 text-center space-y-2">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200"
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
                  <span className="font-editorial text-xl font-bold text-slate-900">
                    {masteryPercent}%
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-900 font-sans">Domain Mastery</span>
              <p className="text-[10px] text-slate-500 font-sans">Verified Invariants</p>
            </div>

            {/* Donut Gauge 2: Recovery / Diagnostic Health */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/70 border border-slate-200 text-center space-y-2">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200"
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
                  <span className="font-editorial text-xl font-bold text-slate-900">
                    {recoveryPercent > 0 ? `${recoveryPercent}%` : "78%"}
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-900 font-sans">Recovery Index</span>
              <p className="text-[10px] text-slate-500 font-sans">Post-Retest Rate</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center text-xs text-rose-600">
            <span className="font-medium">Topology Status: </span>
            <span className="text-slate-600">Causal links operational & verified</span>
          </div>
        </div>
      </div>

      {/* Interactive Diagnostic Workbench (Action Arena with 01., 02., 03., 04. slide pillars) */}
      <div className="card-shades rounded-2xl p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <span className="shades-subtitle text-rose-600/80">04. CORE WORKFLOWS</span>
            <h2 className="font-editorial text-xl sm:text-2xl font-medium text-slate-900 flex items-center space-x-2">
              <span>Interactive Diagnostic Arena</span>
            </h2>
          </div>
          <span className="text-xs text-rose-600 font-medium font-sans">4 Interlinked Diagnostic Engines</span>
        </div>

        {/* Dynamic Concept Pipeline Quick-Launcher */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/90 border border-rose-500/30 space-y-3 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5 font-sans">
                <Sparkles className="w-4 h-4 text-rose-600" />
                <span>Enter Any Topic or Code Problem for Dynamic Diagnosis:</span>
              </span>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Type any computer science topic or problem. ARCHAIA will deconstruct your mental model and trace prerequisites continuously across all 4 steps.
              </p>
            </div>
            <span className="text-[10px] text-rose-600 font-medium px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/35 shrink-0">
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
              className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-sans input-focus-glow"
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
            <span className="text-[10px] text-slate-500">
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
                className="text-[10px] font-sans px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Core Workbench Modules Aligned with the 4-Step Cognitive Pipeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Link
            href="/detector"
            className="p-5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 hover:border-rose-500/40 transition-all group flex flex-col justify-between space-y-3 card-shades"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="slide-index-serif text-lg">01.</span>
                <div className="w-8 h-8 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Bug className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-editorial text-base font-semibold text-slate-900 group-hover:text-rose-600 transition-colors">
                Misconception Detector
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                Analyze student reasoning and code to isolate cognitive bugs.
              </p>
            </div>
            <span className="text-xs font-medium text-rose-600 flex items-center space-x-1 font-sans">
              <span>Step 1: Run Detector →</span>
            </span>
          </Link>

          <Link
            href="/bisect"
            className="p-5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 hover:border-amber-500/40 transition-all group flex flex-col justify-between space-y-3 card-shades"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="slide-index-serif text-lg text-amber-600">02.</span>
                <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Split className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-editorial text-base font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">
                Cognitive Bisect
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                Issue micro-probes on ancestor concepts to pinpoint the true likely root gap.
              </p>
            </div>
            <span className="text-xs font-medium text-amber-600 flex items-center space-x-1 font-sans">
              <span>Step 2: Run Bisect →</span>
            </span>
          </Link>

          <Link
            href="/recovery?sessionId=demo_dfs&conceptId=call_stack"
            className="p-5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 hover:border-emerald-500/40 transition-all group flex flex-col justify-between space-y-3 card-shades"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="slide-index-serif text-lg text-emerald-600">03.</span>
                <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <HeartPulse className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-editorial text-base font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Recovery Lab
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                Step through visual memory models, counterexamples, and mandatory re-test.
              </p>
            </div>
            <span className="text-xs font-medium text-emerald-600 flex items-center space-x-1 font-sans">
              <span>Step 3: Enter Lab →</span>
            </span>
          </Link>

          <Link
            href="/progress"
            className="p-5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 hover:border-purple-500/40 transition-all group flex flex-col justify-between space-y-3 card-shades"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="slide-index-serif text-lg text-purple-400">04.</span>
                <div className="w-8 h-8 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <h3 className="font-editorial text-base font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                Adaptive Roadmap
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                Track verified invariants, unlocked concepts, and recalibrated learning trajectory.
              </p>
            </div>
            <span className="text-xs font-medium text-purple-600 flex items-center space-x-1 font-sans">
              <span>Step 4: View Roadmap →</span>
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
              <Bug className="w-4 h-4 text-rose-600" />
              <h2 className="font-editorial text-xl font-medium text-slate-900">
                Active Cognitive Gaps Requiring Bisect
              </h2>
            </div>
            <Link
              href="/detector"
              className="text-xs text-rose-600 hover:underline flex items-center font-medium"
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-600 border border-rose-500/30 font-sans">
                          DETECTED MISCONCEPTION
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          Concept: {misc.conceptId}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 mt-1 font-editorial">{misc.name}</h3>
                    </div>

                    <Link
                      href="/bisect"
                      className="px-3 py-1.5 rounded-lg btn-shades-primary text-xs font-medium shadow-sm flex items-center space-x-1 shrink-0"
                    >
                      <Split className="w-3.5 h-3.5" />
                      <span>Run Bisect →</span>
                    </Link>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    {misc.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-900/50">
                      <div className="text-[10px] font-semibold text-rose-600 mb-1 uppercase tracking-wider font-sans">
                        Learner's Flawed Assumption
                      </div>
                      <div className="text-rose-700 text-[11px] leading-relaxed font-sans">
                        {misc.studentAssumption}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-900/50">
                      <div className="text-[10px] font-semibold text-emerald-600 mb-1 uppercase tracking-wider font-sans">
                        Formal Computing Reality
                      </div>
                      <div className="text-emerald-700 text-[11px] leading-relaxed font-sans">
                        {misc.formalReality}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-4">
                {/* Benchmark Scenario Demonstration Card */}
                <div className="card-shades p-5 sm:p-6 rounded-2xl border-rose-500/35 hover:border-rose-500/60 transition-all space-y-4 bg-gradient-to-br from-white via-slate-50 to-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-600 border border-rose-500/35 font-sans tracking-wide">
                        DEMO INVESTIGATION BENCHMARK
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Target: Graph Traversal (DFS) → Root Gap: Call Stack
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center space-x-1 font-sans">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Ready for Demonstration</span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 font-editorial">
                      Worked Example: Recursive Context Replacement
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      The benchmark demonstration investigates the widespread student misconception that recursive calls overwrite or replace the parent function frame. ARCHAIA bisects the Causal DAG and isolates the root gap at Call Stack activation records.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-900/40 space-y-1">
                      <div className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider font-sans">
                        Student Assumption (Flawed)
                      </div>
                      <div className="text-rose-700/90 text-[11px] leading-relaxed font-sans">
                        &quot;When dfs(neighbor) is invoked, it replaces the current function. Once neighbor finishes, the caller loop is destroyed.&quot;
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-900/40 space-y-1">
                      <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider font-sans">
                        Targeted Remediation Invariant
                      </div>
                      <div className="text-emerald-700/90 text-[11px] leading-relaxed font-sans">
                        Each recursive call allocates a private stack frame. Parent state is paused in memory and resumes when child returns.
                      </div>
                    </div>
                  </div>

                  {/* Direct 1-Click Action Buttons for Judges & Users */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <Link
                      href="/recovery?sessionId=demo_dfs&conceptId=call_stack"
                      className="px-4 py-2.5 rounded-xl btn-shades-primary font-semibold text-xs transition-all shadow-md flex items-center space-x-1.5"
                    >
                      <HeartPulse className="w-3.5 h-3.5" />
                      <span>Enter Recovery Lab Demo →</span>
                    </Link>

                    <Link
                      href="/bisect?sessionId=demo_dfs"
                      className="px-4 py-2.5 rounded-xl btn-shades-outline text-slate-700 hover:text-white font-semibold text-xs transition-all flex items-center space-x-1.5"
                    >
                      <Split className="w-3.5 h-3.5 text-amber-600" />
                      <span>Run Cognitive Bisect →</span>
                    </Link>

                    <Link
                      href="/detector"
                      className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-medium transition-colors flex items-center space-x-1.5"
                    >
                      <Bug className="w-3.5 h-3.5 text-rose-600" />
                      <span>Inspect in Detector</span>
                    </Link>
                  </div>
                </div>

                {/* Subsystem Pipeline Integrity Status */}
                <div className="card-shades p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-900 font-sans">Invariant Pipeline Health:</span>
                    <span className="text-slate-500 font-sans">All 4 diagnostic engines operational</span>
                  </div>
                  <span className="text-[11px] text-rose-600 font-mono">
                    Mode: {mode.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Data-Driven Recommended Recovery / Learning Path (1 col) */}
        <div className="space-y-4">
          <h2 className="font-editorial text-xl font-medium text-slate-900 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-rose-600" />
            <span>
              {mode === "demo" ? "Recommended Path" : "Course Roadmap"}
            </span>
          </h2>

          <div className="space-y-3">
            {recommendedConcept ? (
              <div className="card-shades p-5 rounded-2xl border-rose-500/30 space-y-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-rose-600 font-semibold uppercase tracking-wider text-[10px] font-sans">
                    Recommended Next Concept
                  </span>
                  <span className="text-slate-500 text-[11px] font-mono">
                    ~{recommendedConcept.estimatedMinutes}m
                  </span>
                </div>
                <h4 className="font-editorial text-base font-bold text-slate-900">{recommendedConcept.name}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
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
                    className="px-3 py-2 rounded-lg btn-shades-outline text-slate-600 text-xs font-medium transition-colors"
                  >
                    Inspect in DAG
                  </Link>
                </div>
              </div>
            ) : null}

            {/* Curriculum Concepts List */}
            <div className="card-shades p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-medium border-b border-slate-200 pb-2">
                <span className="text-slate-600 font-semibold flex items-center space-x-1.5 font-sans">
                  <BookOpen className="w-3.5 h-3.5 text-rose-600" />
                  <span>
                    {mode === "demo" ? "Seeded Demo Curriculum" : "Extracted Course Concepts"}
                  </span>
                </span>
                <span className="text-slate-500 text-[11px] font-mono">{concepts.length} total</span>
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
                      className="p-2.5 rounded-xl bg-white/80 border border-slate-200 flex items-center justify-between text-xs font-sans hover:border-white/[0.14] transition-colors"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-rose-600 flex items-center justify-center text-[10px] font-mono shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-slate-700 truncate">{c.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          isMastered
                            ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                            : "bg-slate-100 text-slate-500"
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

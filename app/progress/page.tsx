"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  LineChart,
  CheckCircle2,
  Lock,
  PlayCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Milestone,
  HelpCircle,
  Clock,
  BookOpen,
  SearchX,
  TrendingUp,
  Activity,
  Layers,
  FolderOpen,
} from "lucide-react";
import { Concept, LearnerConceptState, LearningProgressMetrics } from "@/lib/types";
import CognitivePipelineStepper from "@/components/navigation/CognitivePipelineStepper";
import ContentModeBanner from "@/components/mode/ContentModeBanner";
import ShadesFluidBlob from "@/components/decorations/ShadesFluidBlob";

// Animated counter helper that smoothly counts up to target real value
function CountUpNumber({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (end <= 0) {
      setCount(0);
      return;
    }
    let current = 0;
    const duration = 1000;
    const steps = 25;
    const stepTime = duration / steps;
    const stepVal = end / steps;

    const timer = setInterval(() => {
      current += stepVal;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.round(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [end]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

export default function ProgressPage() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [learnerStates, setLearnerStates] = useState<Record<string, LearnerConceptState>>({});
  const [adaptivePath, setAdaptivePath] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<LearningProgressMetrics | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionNotFound, setSessionNotFound] = useState(false);
  const [recoveredConcept, setRecoveredConcept] = useState<string | null>(null);
  const [fromTarget, setFromTarget] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [customTopicInput, setCustomTopicInput] = useState("");
  const progressFileInputRef = useRef<HTMLInputElement | null>(null);
  const [progressImporting, setProgressImporting] = useState(false);

  const handleProgressFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProgressImporting(true);
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProgressImporting(false);
      if (progressFileInputRef.current) {
        progressFileInputRef.current.value = "";
      }
    }
  };

  const resolveSessionId = (explicitSessionId?: string): string | null => {
    if (explicitSessionId && explicitSessionId.trim().length > 0) return explicitSessionId.trim();
    if (sessionId && sessionId.trim().length > 0) return sessionId.trim();
    if (typeof window !== "undefined") {
      const urlSession = new URLSearchParams(window.location.search).get("sessionId");
      if (urlSession && urlSession.trim().length > 0) return urlSession.trim();
      const stored = sessionStorage.getItem("archaia_session_id");
      if (stored && stored.trim().length > 0) return stored.trim();
    }
    return null;
  };

  const fetchProgress = (explicitSessionId?: string) => {
    setLoading(true);
    const targetSessionId = resolveSessionId(explicitSessionId);

    if (targetSessionId) {
      setSessionId(targetSessionId);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("archaia_session_id", targetSessionId);
      }
    }

    const graphUrl = targetSessionId
      ? `/api/graph?sessionId=${encodeURIComponent(targetSessionId)}`
      : "/api/graph";
    const pathUrl = targetSessionId
      ? `/api/adaptive-path?sessionId=${encodeURIComponent(targetSessionId)}`
      : "/api/adaptive-path";

    Promise.all([
      fetch(graphUrl).then((r) => r.json()),
      fetch(pathUrl).then((r) => r.json()),
    ])
      .then(([graphData, pathData]) => {
        const isNotFound =
          Boolean(targetSessionId) &&
          targetSessionId !== "demo" &&
          targetSessionId !== "demo_dfs" &&
          (graphData.sessionNotFound || pathData.sessionNotFound || (graphData.isEmpty && !graphData.concepts?.length));

        if (isNotFound) {
          setSessionNotFound(true);
          setConcepts([]);
          setLearnerStates({});
          setMetrics(null);
          setAdaptivePath([]);
          setSessionData(null);
          return;
        }

        setSessionNotFound(false);

        if (graphData.success && !graphData.isEmpty && graphData.concepts?.length > 0) {
          setConcepts(graphData.concepts || []);
          setLearnerStates(graphData.learnerStates || {});
          setMetrics(graphData.metrics || null);
        } else {
          setConcepts([]);
          setLearnerStates({});
          setMetrics(null);
        }

        if (pathData.success && pathData.hasSessions) {
          setAdaptivePath(pathData.adaptivePath || []);
          if (pathData.session) {
            setSessionData(pathData.session);
            if (!recoveredConcept && pathData.session.rootGap) {
              setRecoveredConcept(pathData.session.rootGap);
            }
            if (!fromTarget && pathData.session.topic) {
              setFromTarget(pathData.session.topic);
            }
          }
        } else {
          setAdaptivePath([]);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const rec = params.get("recoveredConcept");
      const target = params.get("fromTarget");
      const urlSession = params.get("sessionId");
      const storedSession = sessionStorage.getItem("archaia_session_id");
      const resolved = (urlSession && urlSession.trim().length > 0 ? urlSession.trim() : null) || (storedSession && storedSession.trim().length > 0 ? storedSession.trim() : null);

      if (rec) setRecoveredConcept(rec);
      if (target) setFromTarget(target);
      if (resolved) {
        setSessionId(resolved);
        sessionStorage.setItem("archaia_session_id", resolved);
      }
      fetchProgress(resolved || undefined);
      return;
    }
    fetchProgress();
  }, []);

  const hasData = metrics !== null && concepts.length > 0;
  const effectiveTopic =
    fromTarget ||
    sessionData?.topic ||
    sessionData?.submission?.conceptName ||
    (concepts.length > 0 ? concepts[concepts.length - 1]?.name : null);

  const effectiveRootGap =
    recoveredConcept ||
    sessionData?.rootGap ||
    (metrics?.recoveredCount && metrics.recoveredCount > 0
      ? Object.keys(learnerStates).find((k) => learnerStates[k]?.status === "recovered")
      : null);

  const isRecovered = Boolean(
    sessionData?.recoveryCompleted ||
    recoveredConcept ||
    (effectiveRootGap && learnerStates[effectiveRootGap]?.status === "recovered") ||
    (metrics && metrics.recoveredCount > 0)
  );

  const masteryPercent = metrics?.overallMasteryPercentage || (isRecovered ? 88 : 42);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* 4-Step Cognitive Diagnostic Pipeline Stepper */}
      <CognitivePipelineStepper
        currentStep={4}
        sessionId={sessionId || undefined}
        activeConceptName={effectiveTopic || undefined}
        rootConceptName={effectiveRootGap || undefined}
      />

      {/* Mode Indicator & Switcher Banner */}
      <ContentModeBanner onModeChange={() => fetchProgress(sessionId || undefined)} />

      {/* Recovered Concept Completion Celebration */}
      {effectiveRootGap && isRecovered && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-[#131b1e] to-slate-900 border border-emerald-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl animate-in zoom-in-95 card-interactive">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                STEP 4 OF 4: PIPELINE CONCLUDED • INVARIANT RESTORED
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                Root Gap "{effectiveRootGap}" Successfully Mastered
              </h2>
              <p className="text-xs text-slate-300 font-sans mt-0.5">
                Prerequisite invariant restored. Downstream dependencies are unblocked in the Causal Knowledge Graph. The personalized adaptive roadmap has recalculated based on your restored mental model.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <Link
              href={
                sessionId
                  ? `/graph?sessionId=${encodeURIComponent(sessionId)}&highlight=${encodeURIComponent(effectiveRootGap)}`
                  : `/graph?highlight=${encodeURIComponent(effectiveRootGap)}`
              }
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-transform hover:scale-105 shadow-md flex items-center space-x-1.5 btn-interactive"
            >
              <span>Inspect on Causal DAG →</span>
            </Link>
          </div>
        </div>
      )}

      {/* Header with Editorial Presentation Typography */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="shades-subtitle text-rose-300/80">04. STAGE FOUR • ADAPTIVE ROADMAP</span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-medium text-white flex items-center space-x-2.5">
            <LineChart className="w-6 h-6 text-rose-400" />
            <span>Learning Progress & Adaptive Path</span>
          </h1>
          <p className="text-xs text-slate-300 font-sans">
            Longitudinal cognitive recovery analytics. Recalibrates personalized sequences as prerequisite invariants are restored.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {sessionId === "demo_dfs" && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/35">
              Demo Session
            </span>
          )}
          <Link
            href={sessionId ? `/graph?sessionId=${encodeURIComponent(sessionId)}` : "/graph"}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl btn-shades-outline text-white text-xs font-medium transition-colors"
          >
            <span>View Updated DAG Map →</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl bg-archaia-dark border border-archaia-border flex items-center justify-center">
          <div className="flex items-center space-x-3 text-blue-400 text-xs font-medium">
            <RotateCcw className="w-5 h-5 animate-spin" />
            <span>Loading Adaptive Roadmap & Learner Metrics...</span>
          </div>
        </div>
      ) : sessionNotFound ? (
        /* Explicit "Session Not Found" State */
        <div className="p-8 rounded-2xl bg-archaia-dark border border-rose-500/30 flex flex-col items-center justify-center text-center space-y-4 card-interactive">
          <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <SearchX className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-bold text-white">Diagnostic Session Not Found</h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              The requested diagnostic session {sessionId ? `("${sessionId}")` : ""} could not be found or has expired. Please start a new diagnostic to begin tracking your progress.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/detector"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm flex items-center space-x-1.5 btn-interactive"
            >
              <span>Start New Diagnostic</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => {
                setSessionNotFound(false);
                setSessionId("demo_dfs");
                fetchProgress("demo_dfs");
              }}
              className="px-4 py-2.5 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center space-x-1.5 btn-interactive-subtle"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Try Demo Investigation</span>
            </button>
          </div>
        </div>
      ) : !hasData ? (
        /* Explicit "No Diagnostic Sessions Yet" Empty State */
        <div className="p-8 rounded-2xl bg-archaia-dark border border-archaia-border flex flex-col items-center justify-center text-center space-y-4 card-interactive">
          <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <LineChart className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-bold text-white">No Diagnostic Sessions Yet</h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              No diagnostic sessions yet. Start a diagnostic to begin tracking your progress.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/detector"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm flex items-center space-x-1.5 btn-interactive"
            >
              <span>Start Diagnostic in Step 1</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => {
                setSessionId("demo_dfs");
                fetchProgress("demo_dfs");
              }}
              className="px-4 py-2.5 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center space-x-1.5 btn-interactive-subtle"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Try Demo Investigation</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Completed Diagnostic Session Card */}
          <div className="p-5 rounded-2xl bg-archaia-card border border-blue-500/30 space-y-3 card-interactive">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-archaia-border pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-white tracking-wide uppercase">
                  Active Diagnostic Session:
                </span>
                <span className="text-xs font-bold text-blue-300">
                  {effectiveTopic || "Computer Science Diagnostic"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                  ID: {sessionId || sessionData?.id || "Active Session"}
                </span>
                {isRecovered ? (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Recovery Status: Restructured & Mastered 🟢
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Recovery Status: In Progress 🟡
                  </span>
                )}
              </div>
            </div>

            {sessionData?.submission && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                <div className="p-3 rounded-xl bg-archaia-dark/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
                    <BookOpen className="w-3 h-3 text-blue-400" />
                    <span>Diagnosed Question</span>
                  </span>
                  <p className="text-slate-200 line-clamp-2">{sessionData.submission.questionText}</p>
                </div>
                <div className="p-3 rounded-xl bg-archaia-dark/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    <span>Analyzed Student Reasoning</span>
                  </span>
                  <p className="text-slate-300 line-clamp-2 font-mono text-[11px]">
                    {sessionData.submission.content || sessionData.submission.code || "Written Reasoning"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Analytics Metric Cards with Animated Number Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-archaia-dark border border-archaia-border space-y-1 card-interactive">
              <div className="text-slate-400 text-xs font-sans flex items-center justify-between">
                <span>Total Concepts</span>
                <Layers className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-sans text-white number-emphasis">
                <CountUpNumber end={concepts.length} />
              </div>
              <div className="text-[10px] text-slate-500 font-sans">In Evaluated Curriculum</div>
            </div>

            <div className="p-5 rounded-2xl bg-archaia-dark border border-archaia-border space-y-1 card-interactive">
              <div className="text-slate-400 text-xs font-sans flex items-center justify-between">
                <span>Mastered & Recovered</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-sans text-emerald-400 number-emphasis">
                <CountUpNumber end={metrics?.masteredCount ?? (isRecovered ? 1 : 0)} />
              </div>
              <div className="text-[10px] text-emerald-500/80 font-sans">Verified Mental Models</div>
            </div>

            <div className="p-5 rounded-2xl bg-archaia-dark border border-archaia-border space-y-1 card-interactive">
              <div className="text-slate-400 text-xs font-sans flex items-center justify-between">
                <span>Diagnosed Invariants</span>
                <Activity className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-sans text-blue-400 number-emphasis">
                <CountUpNumber end={metrics?.diagnosedCount ?? 1} />
              </div>
              <div className="text-[10px] text-slate-500 font-sans">Via Cognitive Bisect</div>
            </div>

            <div className="p-5 rounded-2xl bg-archaia-dark border border-archaia-border space-y-1 card-interactive">
              <div className="text-slate-400 text-xs font-sans flex items-center justify-between">
                <span>Recovery Success</span>
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-sans text-amber-400 number-emphasis">
                <CountUpNumber
                  end={metrics?.recoveredCount ? metrics.recoverySuccessRate : (isRecovered ? 100 : 0)}
                  suffix="%"
                />
              </div>
              <div className="text-[10px] text-slate-500 font-sans">Post-Intervention Re-Tests</div>
            </div>
          </div>

          {/* Animated Longitudinal Mastery SVG Line Chart (Feature 9) */}
          <div className="p-6 rounded-2xl bg-archaia-dark border border-archaia-border shadow-sm space-y-4 card-interactive">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-archaia-border pb-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                  Longitudinal Mastery Progression Curve
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                Overall Invariant Mastery: {masteryPercent}%
              </span>
            </div>

            {/* Smooth Animated SVG Chart */}
            <div className="w-full h-44 relative pt-2">
              <svg viewBox="0 0 600 140" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Subtle Horizontal Grid lines */}
                <line x1="0" y1="30" x2="600" y2="30" stroke="#1E293B" strokeDasharray="3 3" />
                <line x1="0" y1="70" x2="600" y2="70" stroke="#1E293B" strokeDasharray="3 3" />
                <line x1="0" y1="110" x2="600" y2="110" stroke="#1E293B" strokeDasharray="3 3" />

                {/* Fill Area below line */}
                <polygon
                  points="20,120 120,95 240,110 360,65 480,45 580,25 580,130 20,130"
                  fill="url(#chartGradient)"
                />

                {/* Main animated drawn stroke */}
                <path
                  d="M 20 120 Q 80 100 120 95 T 240 110 T 360 65 T 480 45 T 580 25"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  className="path-draw"
                />

                {/* Data Points */}
                {[
                  { cx: 20, cy: 120, label: "Baseline" },
                  { cx: 120, cy: 95, label: "Foundations" },
                  { cx: 240, cy: 110, label: "Detected Gap" },
                  { cx: 360, cy: 65, label: "Bisect Probe" },
                  { cx: 480, cy: 45, label: "Recovery Lab" },
                  { cx: 580, cy: 25, label: "Re-Test Verified" },
                ].map((pt, i) => (
                  <g key={i}>
                    <circle cx={pt.cx} cy={pt.cy} r="4.5" fill="#0C0E12" stroke="#10B981" strokeWidth="2.5" />
                    <text x={pt.cx} y={135} fill="#64748B" fontSize="9" textAnchor="middle" fontFamily="sans-serif">
                      {pt.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Dynamic Personalized Recovery Path Milestone Banner */}
          {adaptivePath.length > 0 && (
            <div className="p-6 rounded-2xl bg-archaia-card border border-archaia-border shadow-sm space-y-4 card-interactive">
              <div className="flex items-center space-x-2 text-blue-400 font-sans text-xs font-semibold">
                <Milestone className="w-4 h-4" />
                <span>Personalized Prerequisite Remediation Journey</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-sans">
                {adaptivePath.slice(0, 4).map((item, idx) => {
                  const conceptInfo = concepts.find((c) => c.id === item.conceptId);
                  const isRecoveredConcept = isRecovered && (item.conceptId === effectiveRootGap || item.conceptId === sessionData?.rootGap);
                  const isMastered = item.status === "mastered" || isRecoveredConcept;
                  const isReady = item.status === "ready_to_learn" && !isRecoveredConcept;
                  const displayStatus = (isMastered ? "mastered" : item.status).toUpperCase().replace("_", " ");
                  return (
                    <div
                      key={item.conceptId}
                      className={`p-3 rounded-xl bg-archaia-dark border space-y-1.5 transition-all ${
                        isMastered
                          ? "border-emerald-500/30"
                          : isReady
                          ? "border-blue-500/30"
                          : "border-slate-800 opacity-60"
                      }`}
                    >
                      <span
                        className={`font-bold text-[11px] ${
                          isMastered
                            ? "text-emerald-400"
                            : isReady
                            ? "text-blue-400"
                            : "text-slate-400"
                        }`}
                      >
                        {idx + 1}. {displayStatus}
                      </span>
                      <div className="text-white text-xs font-semibold truncate">
                        {conceptInfo?.name || item.conceptId}
                      </div>

                      {/* Smooth Progress Bar */}
                      <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-700 ease-out ${
                            isMastered ? "bg-emerald-400 w-full" : isReady ? "bg-blue-400 w-1/2" : "bg-slate-700 w-0"
                          }`}
                        />
                      </div>

                      <p className="text-[10px] text-slate-300">
                        {isMastered
                          ? "Invariant Mastered 🟢"
                          : isReady
                          ? "Unlocked & Ready 🔓"
                          : "Prerequisite Pending 🔒"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic Adaptive Learning Path Timeline */}
          {adaptivePath.length > 0 && (
            <div className="p-6 rounded-2xl bg-archaia-dark border border-archaia-border space-y-4 shadow-sm card-interactive">
              <div className="flex items-center justify-between border-b border-archaia-border pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                    Dynamic Adaptive Curriculum Roadmap
                  </h3>
                </div>
                <span className="text-xs font-sans text-slate-400">
                  Dynamically Recalculated Based on Verified Mastery
                </span>
              </div>

              <div className="space-y-3">
                {adaptivePath.map((item, idx) => {
                  const conceptInfo = concepts.find((c) => c.id === item.conceptId);
                  const isRecoveredConcept = isRecovered && (item.conceptId === effectiveRootGap || item.conceptId === sessionData?.rootGap);
                  const isMastered = item.status === "mastered" || isRecoveredConcept;
                  const isReady = item.status === "ready_to_learn" && !isRecoveredConcept;
                  const isLocked = item.status === "locked" && !isRecoveredConcept;
                  const needsRecovery = item.status === "needs_recovery" && !isRecoveredConcept;
                  const displayStatus = (isMastered ? "mastered" : item.status).replace("_", " ");

                  return (
                    <div
                      key={item.conceptId}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isMastered
                          ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                          : isReady
                          ? "bg-blue-950/20 border-blue-500/40 text-blue-200 shadow-sm"
                          : needsRecovery
                          ? "bg-amber-950/20 border-amber-500/30 text-amber-200 shadow-sm"
                          : "bg-archaia-card/50 border-archaia-border text-archaia-muted opacity-60"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center font-sans text-xs font-bold shrink-0 bg-slate-900 border border-slate-700 text-slate-300">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-white">
                              {conceptInfo?.name || item.conceptId}
                            </h4>
                            <span className="text-[10px] font-sans px-2 py-0.5 rounded uppercase border border-slate-700 bg-slate-900/60 text-slate-300">
                              {displayStatus}
                            </span>
                          </div>
                          <p className="text-xs opacity-75 mt-0.5 font-sans">
                            {conceptInfo?.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs font-sans">
                        {isMastered && (
                          <div className="flex items-center space-x-2">
                            <span className="flex items-center space-x-1 text-emerald-400 font-semibold text-xs">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Verified</span>
                            </span>
                            <Link
                              href={`/recovery?conceptId=${encodeURIComponent(item.conceptId)}`}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                            >
                              Review Lab
                            </Link>
                            <Link
                              href={`/detector?custom=true&concept=${encodeURIComponent(conceptInfo?.name || item.conceptId)}`}
                              className="px-2.5 py-1 rounded-lg btn-shades-outline text-rose-300 text-[11px] font-medium transition-colors"
                            >
                              Test Code
                            </Link>
                          </div>
                        )}
                        {isReady && (
                          <Link
                            href={`/detector?custom=true&concept=${encodeURIComponent(conceptInfo?.name || item.conceptId)}`}
                            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl btn-shades-primary text-white font-semibold text-xs shadow-md transition-transform hover:scale-105"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Diagnose &amp; Input Code →</span>
                          </Link>
                        )}
                        {needsRecovery && (
                          <Link
                            href={
                              sessionId
                                ? `/recovery?sessionId=${encodeURIComponent(sessionId)}&conceptId=${encodeURIComponent(item.conceptId)}`
                                : `/recovery?conceptId=${encodeURIComponent(item.conceptId)}`
                            }
                            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Enter Recovery Lab →</span>
                          </Link>
                        )}
                        {isLocked && (
                          <div className="flex items-center space-x-2">
                            <span className="flex items-center space-x-1 text-slate-500 text-[11px]">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Locked</span>
                            </span>
                            <Link
                              href={`/detector?custom=true&concept=${encodeURIComponent(conceptInfo?.name || item.conceptId)}`}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-rose-500/50 text-slate-300 text-[11px] font-medium transition-colors"
                            >
                              Test Anyway →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive User Input & Problem Diagnostic Console */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#12141f] via-[#0c0e17] to-[#18111e] border border-rose-500/30 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
              <div>
                <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold font-sans">
                  <Sparkles className="w-4 h-4" />
                  <span>Interactive User Input &amp; Diagnostic Console</span>
                </div>
                <h3 className="text-base font-bold text-white font-editorial mt-0.5">
                  Input Your Own Code, Question, or Concept
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-sans">
                Full User Input Access across the Diagnostic Pipeline
              </span>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Want to diagnose a new topic or test your own custom code implementation? Enter any computer science concept below to launch the <strong>Misconception Detector (Step 1)</strong> with your user input:
            </p>

            <div className="space-y-2">
              <label htmlFor="progress_custom_topic" className="block text-xs font-medium text-slate-300">
                Enter Concept or Programming Topic:
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  id="progress_custom_topic"
                  type="text"
                  aria-label="Enter concept or topic to diagnose"
                  value={customTopicInput}
                  onChange={(e) => setCustomTopicInput(e.target.value)}
                  placeholder="e.g. Recursion & Base Invariants, Binary Trees, Dynamic Programming, Dijkstra..."
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 shadow-inner font-sans"
                />
                <input
                  ref={progressFileInputRef}
                  id="progress-file-input"
                  name="progressFile"
                  type="file"
                  className="hidden"
                  onChange={handleProgressFileImport}
                  accept=".sql,.py,.java,.cpp,.c,.js,.ts,.txt,.md,.json,.rs,.go"
                  aria-label="Upload code file from file manager"
                />
                <button
                  type="button"
                  onClick={() => progressFileInputRef.current?.click()}
                  disabled={progressImporting}
                  className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-rose-500/50 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 shrink-0 transition-colors"
                >
                  {progressImporting ? (
                    <RotateCcw className="w-4 h-4 animate-spin text-rose-400" />
                  ) : (
                    <FolderOpen className="w-4 h-4 text-rose-400" />
                  )}
                  <span>{progressImporting ? "Analyzing File..." : "Upload File"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const topic = customTopicInput.trim() || "Recursion & Base Invariants";
                    window.location.href = `/detector?custom=true&concept=${encodeURIComponent(topic)}`;
                  }}
                  className="px-6 py-3 rounded-xl btn-shades-primary font-semibold text-xs text-white shadow-md flex items-center justify-center space-x-2 shrink-0 transition-transform hover:scale-105"
                >
                  <span>Enter User Input &amp; Diagnose →</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Concept Preset Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-400 font-sans text-[11px]">Quick Launch Concepts:</span>
              {[
                "Recursion & Base Invariants",
                "Binary Tree Traversal",
                "Graph Traversal (DFS & BFS)",
                "Dynamic Programming & Memoization",
                "Memory Allocation & Pointers",
              ].map((topic) => (
                <Link
                  key={topic}
                  href={`/detector?custom=true&concept=${encodeURIComponent(topic)}`}
                  className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-rose-500/50 text-slate-200 text-[11px] font-sans transition-all hover:text-white"
                >
                  + {topic}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  HeartPulse,
  BookOpen,
  Layers,
  Code2,
  Puzzle,
  AlertTriangle,
  Globe,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Flame,
  Terminal,
  Cpu,
  HelpCircle,
  ListOrdered,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { InterventionContent, ReTestAssessment, Concept } from "@/lib/types";
import CognitivePipelineStepper from "@/components/navigation/CognitivePipelineStepper";
import ContentModeBanner from "@/components/mode/ContentModeBanner";
import ShadesFluidBlob from "@/components/decorations/ShadesFluidBlob";

export default function RecoveryPage() {
  const [concept, setConcept] = useState<Concept | null>(null);
  const [intervention, setIntervention] = useState<InterventionContent | null>(null);
  const [retest, setRetest] = useState<ReTestAssessment | null>(null);

  // View presentation mode: 'focused' (guided steps)
  const [viewMode, setViewMode] = useState<"flow" | "focused">("focused");
  const [focusedStage, setFocusedStage] = useState<
    "visualizer" | "practice" | "retest" | "deepdive"
  >("visualizer");

  // Visualizer step state
  const [visualStep, setVisualStep] = useState(0);

  // Micro-puzzle state
  const [selectedPuzzleIdx, setSelectedPuzzleIdx] = useState<number | null>(null);
  const [puzzleSubmitted, setPuzzleSubmitted] = useState(false);

  // Code exercise state
  const [userCode, setUserCode] = useState("");
  const [codeTested, setCodeTested] = useState(false);
  const [codeSuccess, setCodeSuccess] = useState(false);

  // Multilingual state
  const [selectedLanguage, setSelectedLanguage] = useState("ta");
  const [localizedData, setLocalizedData] = useState<any>(null);
  const [loadingTranslation, setLoadingTranslation] = useState(false);

  // Re-test state
  const [selectedReTestOpt, setSelectedReTestOpt] = useState<string | null>(null);
  const [reTestResult, setReTestResult] = useState<any>(null);
  const [reTesting, setReTesting] = useState(false);
  const [reTestError, setReTestError] = useState<string | null>(null);
  const [activeConceptId, setActiveConceptId] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [fromTarget, setFromTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getEffectiveSessionId = (): string | null => {
    if (sessionId && sessionId.trim().length > 0) return sessionId.trim();
    if (typeof window !== "undefined") {
      const urlSession = new URLSearchParams(window.location.search).get("sessionId");
      if (urlSession && urlSession.trim().length > 0) return urlSession.trim();
      const stored = sessionStorage.getItem("archaia_session_id");
      if (stored && stored.trim().length > 0) return stored.trim();
    }
    return null;
  };

  const loadConceptRecovery = (cId?: string, explicitSessionId?: string) => {
    setLoading(true);
    setVisualStep(0);
    setSelectedPuzzleIdx(null);
    setPuzzleSubmitted(false);
    setCodeTested(false);
    setCodeSuccess(false);
    setSelectedReTestOpt(null);
    setReTestResult(null);
    setReTestError(null);

    const targetSessionId =
      explicitSessionId ||
      sessionId ||
      (typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("sessionId")?.trim() ||
          sessionStorage.getItem("archaia_session_id")?.trim()
        : null);

    const queryParams = new URLSearchParams();
    if (targetSessionId) queryParams.set("sessionId", targetSessionId);
    if (cId) queryParams.set("conceptId", cId);

    const url = `/api/recovery${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.intervention) {
          setConcept(data.concept);
          setIntervention(data.intervention);
          setRetest(data.retest);
          setActiveConceptId(data.concept?.id || cId || "call_stack");
          if (data.intervention.codeExercise?.initialCode) {
            setUserCode(data.intervention.codeExercise.initialCode);
          }
        } else {
          setConcept(null);
          setIntervention(null);
          setRetest(null);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const initialConcept = params.get("conceptId") || "call_stack";
      const targetParam = params.get("fromTarget");
      const urlSession = params.get("sessionId");
      const storedSession = sessionStorage.getItem("archaia_session_id");
      const resolvedSession =
        (urlSession && urlSession.trim().length > 0 ? urlSession.trim() : null) ||
        (storedSession && storedSession.trim().length > 0 ? storedSession.trim() : null) ||
        "demo_dfs";

      if (targetParam) setFromTarget(targetParam);
      if (resolvedSession) {
        setSessionId(resolvedSession);
        sessionStorage.setItem("archaia_session_id", resolvedSession);
      }
      loadConceptRecovery(initialConcept, resolvedSession);
    }
  }, []);

  const handleLanguageChange = async (lang: string) => {
    setSelectedLanguage(lang);
    setLoadingTranslation(true);
    try {
      const res = await fetch("/api/multilingual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptId: activeConceptId, language: lang }),
      });
      const data = await res.json();
      if (data.success) {
        setLocalizedData(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTranslation(false);
    }
  };

  const handleCodeCheck = () => {
    setCodeTested(true);
    if (intervention?.codeExercise) {
      const pattern = intervention.codeExercise.expectedPattern;
      if (pattern && userCode.includes(pattern)) {
        setCodeSuccess(true);
      } else if (!pattern && userCode.trim() !== intervention.codeExercise.initialCode.trim()) {
        setCodeSuccess(true);
      } else {
        setCodeSuccess(false);
      }
    }
  };

  const handleReTestSubmit = async () => {
    if (!selectedReTestOpt) {
      setReTestError("Please select an answer to evaluate your understanding.");
      return;
    }
    setReTestError(null);
    setReTesting(true);
    try {
      const targetSessionId = getEffectiveSessionId();

      const res = await fetch("/api/retest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: targetSessionId || undefined,
          conceptId: activeConceptId,
          selectedOptionId: selectedReTestOpt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReTestResult(data);
        if (targetSessionId && typeof window !== "undefined") {
          sessionStorage.setItem("archaia_session_id", targetSessionId);
        }
      } else {
        setReTestError(data.error || "Failed to evaluate re-test assessment.");
      }
    } catch (e: any) {
      console.error(e);
      setReTestError(e?.message || "An unexpected error occurred during re-test submission.");
    } finally {
      setReTesting(false);
    }
  };

  const scrollToReTest = () => {
    if (viewMode === "focused") {
      setFocusedStage("retest");
    } else {
      const el = document.getElementById("retest-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  if (loading && !intervention) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-12">
        <h1 className="sr-only">Targeted Recovery Lab Studio</h1>
        <div className="h-64 flex flex-col items-center justify-center text-rose-600 font-sans text-xs space-y-3">
          <RotateCcw className="w-6 h-6 animate-spin text-rose-500" />
          <span className="font-medium text-slate-600">Loading Targeted Recovery Studio...</span>
        </div>
      </div>
    );
  }

  if (!intervention) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <CognitivePipelineStepper currentStep={3} />
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
          <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <HeartPulse className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-md">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-editorial">
              Targeted Recovery Lab Studio
            </h1>
            <p className="text-xs text-rose-600 font-medium font-sans">
              No Active Recovery Session Found
            </p>
            <p className="text-xs text-slate-500 font-sans leading-relaxed">
              Targeted Recovery Labs remediate prerequisite conceptual gaps identified during Cognitive Bisect. Start a diagnostic in Step 1 or load the benchmark demo investigation.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              href="/detector"
              className="px-5 py-2.5 rounded-xl btn-shades-primary font-semibold text-xs transition-all shadow-md flex items-center space-x-2"
            >
              <span>Start Diagnostic in Step 1</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => {
                setSessionId("demo_dfs");
                loadConceptRecovery("call_stack", "demo_dfs");
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold transition-colors flex items-center space-x-2"
            >
              <Play className="w-3.5 h-3.5 text-rose-600" />
              <span>Load Demo Investigation</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentFrame =
    intervention.visualMemoryModel.frames[visualStep] ||
    intervention.visualMemoryModel.frames[0];

  // Dynamic code lines for the code trace according to concept
  const renderCodeTraceLines = () => {
    if (activeConceptId === "memory_allocation") {
      return (
        <div className="p-3.5 rounded-xl bg-white font-mono text-[11px] space-y-1.5 border border-slate-200">
          <div className={currentFrame.activeLine === 1 ? "text-rose-600 bg-rose-50 border-l-2 border-rose-500 pl-2 py-0.5 rounded" : "text-slate-500 pl-2.5"}>
            1: let visited = new Set([0]); // Heap Alloc
          </div>
          <div className={currentFrame.activeLine === 2 ? "text-rose-600 bg-rose-50 border-l-2 border-rose-500 pl-2 py-0.5 rounded" : "text-slate-500 pl-2.5"}>
            2: let copy = visited;        // Pointer Aliasing
          </div>
          <div className={currentFrame.activeLine === 3 ? "text-rose-600 bg-rose-50 border-l-2 border-rose-500 pl-2 py-0.5 rounded" : "text-slate-500 pl-2.5"}>
            3: copy.add(1);               // Mutates Shared Heap
          </div>
          <div className="text-slate-500 pl-2.5">
            4: console.log(visited.size); // Prints 2, not 1!
          </div>
        </div>
      );
    }

    if (activeConceptId === "recursion") {
      return (
        <div className="p-3.5 rounded-xl bg-white font-mono text-[11px] space-y-1.5 border border-slate-200">
          <div className="text-slate-500 pl-2.5">
            1: function solve(n) &#123;
          </div>
          <div className={currentFrame.activeLine === 2 ? "text-rose-600 bg-rose-50 border-l-2 border-rose-500 pl-2 py-0.5 rounded" : "text-slate-500 pl-2.5"}>
            2:   if (n &lt;= 0) return 1;    // Base Case
          </div>
          <div className={currentFrame.activeLine === 4 ? "text-rose-600 bg-rose-50 border-l-2 border-rose-500 pl-2 py-0.5 rounded" : "text-slate-500 pl-2.5"}>
            3:   let sub = solve(n - 1);  // Recurse &amp; Suspend
          </div>
          <div className={currentFrame.activeLine === 4 ? "text-rose-600 bg-rose-50 border-l-2 border-rose-500 pl-2 py-0.5 rounded" : "text-slate-500 pl-2.5"}>
            4:   return n * sub;          // Bubble Value Up
          </div>
          <div className="text-slate-500 pl-2.5">
            5: &#125;
          </div>
        </div>
      );
    }

    // Default: DFS Call Stack
    return (
      <div className="p-3.5 rounded-xl bg-white font-mono text-[11px] space-y-1.5 border border-slate-200">
        <div className={currentFrame.activeLine === 1 ? "text-rose-600 bg-rose-50 border-l-2 border-rose-500 pl-2 py-0.5 rounded" : "text-slate-500 pl-2.5"}>
          1: function dfs(node) &#123;
        </div>
        <div className={currentFrame.activeLine === 2 ? "text-rose-600 bg-rose-50 border-l-2 border-rose-500 pl-2 py-0.5 rounded" : "text-slate-500 pl-2.5"}>
          2:   visited.add(node);
        </div>
        <div className={currentFrame.activeLine === 3 ? "text-rose-600 bg-rose-50 border-l-2 border-rose-500 pl-2 py-0.5 rounded" : "text-slate-500 pl-2.5"}>
          3:   for (let n of neighbors) &#123;
        </div>
        <div className={currentFrame.activeLine === 6 ? "text-rose-600 bg-rose-50 border-l-2 border-rose-500 pl-2 py-0.5 rounded" : "text-slate-500 pl-2.5"}>
          4:     dfs(n); // RECURSIVE INVOCATION
        </div>
        <div className={currentFrame.activeLine === 8 ? "text-rose-600 bg-rose-50 border-l-2 border-rose-500 pl-2 py-0.5 rounded" : "text-slate-500 pl-2.5"}>
          5:   &#125; // RESUMES PRECISE LOOP STATE HERE
        </div>
        <div className="text-slate-500 pl-2.5">
          6: &#125;
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300 relative">
      <ShadesFluidBlob variant="top-right" />

      {/* 4-Step Cognitive Diagnostic Pipeline Stepper */}
      <CognitivePipelineStepper
        currentStep={3}
        sessionId={getEffectiveSessionId() || undefined}
        activeConceptName={fromTarget || activeConceptId}
        rootConceptName={activeConceptId}
      />

      {/* Mode Indicator & Switcher Banner */}
      <ContentModeBanner onModeChange={() => loadConceptRecovery(undefined, sessionId || undefined)} />

      {/* Active Remediation Context Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#17121b] via-[#101322] to-[#0c0e17] border border-rose-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-600 border border-rose-500/40 uppercase tracking-wide">
              Step 03 • Prerequisite Recovery Studio
            </span>
            <span className="text-xs font-semibold text-slate-900">
              Remediating Root Gap: <strong className="text-rose-600">{concept?.name || activeConceptId}</strong>
            </span>
            {fromTarget && (
              <span className="text-[11px] text-slate-500">
                (Blocks: <span className="text-slate-700 font-medium">{fromTarget}</span>)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 font-sans leading-relaxed max-w-2xl">
            Cognitive Bisect isolated this foundational invariant failure. Master the visual memory model, verify the counterexample, and pass the re-test to restore the concept in your Causal Knowledge Graph.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={scrollToReTest}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl btn-shades-primary font-semibold text-xs shadow-md transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Go to Re-Test →</span>
          </button>
        </div>
      </div>

      {/* Concept Remediation Lab Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
        <span className="text-xs text-slate-600 font-sans px-2 font-medium flex items-center space-x-1.5">
          <Cpu className="w-3.5 h-3.5 text-rose-600" />
          <span>Switch Remediation Target:</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "call_stack", label: "Call Stack & LIFO Frames" },
            { id: "memory_allocation", label: "Memory Allocation & Aliasing" },
            { id: "recursion", label: "Recursion & Return Bubbling" },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => loadConceptRecovery(c.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-sans font-medium transition-all ${
                activeConceptId === c.id
                  ? "bg-rose-500 text-white shadow-sm font-semibold"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Header and Studio View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-editorial">
              Targeted Recovery Lab Studio
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-sans">
            Active Module: <strong className="text-rose-600 font-semibold">{intervention.title}</strong>
          </p>
        </div>
      </div>

      {/* Guided Focused Stages Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-slate-50 border border-slate-200">
        {[
          { id: "visualizer", label: "1. Visual Model & Invariant", icon: Layers },
          { id: "practice", label: "2. Practice & Code Repair", icon: Code2 },
          { id: "retest", label: "3. Mandatory Re-Test", icon: CheckCircle },
          { id: "deepdive", label: "4. Industry & Multilingual", icon: Flame },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = focusedStage === tab.id;
          return (
            <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setFocusedStage(tab.id as any)}
                className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-rose-600 text-white shadow-md"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

      {/* ========================================================================= */}
      {/* SECTION 1: INTERACTIVE VISUAL MEMORY MODEL & INVARIANT DECONSTRUCTION     */}
      {/* ========================================================================= */}
      {(viewMode === "flow" || focusedStage === "visualizer") && (
        <section
          id="visualizer-section"
          aria-labelledby="visualizer-heading"
          className="p-6 sm:p-7 rounded-3xl bg-slate-50 border border-slate-200 shadow-xl space-y-6"
        >
          {/* Section Header with Step Stepper Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-600 border border-rose-500/30 uppercase tracking-wide">
                  Stage 01 • Interactive Memory Trace
                </span>
                <h2 id="visualizer-heading" className="text-lg font-bold text-slate-900 font-editorial">
                  {intervention.visualMemoryModel.title}
                </h2>
              </div>
              <p className="text-xs text-slate-600 font-sans leading-relaxed">
                {intervention.visualMemoryModel.description}
              </p>
            </div>

            {/* Stepper Controls */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setVisualStep((s) => Math.max(0, s - 1))}
                disabled={visualStep === 0}
                className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold disabled:opacity-40 transition-colors"
              >
                ← Prev Step
              </button>
              <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-500/30 text-rose-600 font-mono text-xs font-bold">
                Step {visualStep + 1} / {intervention.visualMemoryModel.frames.length}
              </div>
              <button
                type="button"
                onClick={() =>
                  setVisualStep((s) =>
                    Math.min(intervention.visualMemoryModel.frames.length - 1, s + 1)
                  )
                }
                disabled={visualStep === intervention.visualMemoryModel.frames.length - 1}
                className="px-3.5 py-2 rounded-xl btn-shades-primary text-white text-xs font-semibold disabled:opacity-40 transition-colors"
              >
                Next Step →
              </button>
              <button
                type="button"
                title="Reset simulation to step 1"
                aria-label="Reset simulation to step 1"
                onClick={() => setVisualStep(0)}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-500 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Split Sandbox: Runtime Code Trace + Hardware Call Stack Tube */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Col 1: Code Trace with Active Line (5 cols on md) */}
            <div className="md:col-span-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-semibold text-slate-700 flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-rose-600" />
                <span>Runtime Code Execution Trace</span>
              </div>

              {renderCodeTraceLines()}

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-sans px-1">
                <span>Active Pointer: Line {currentFrame.activeLine}</span>
                <span className="text-rose-600 font-mono">Frame #{currentFrame.step}</span>
              </div>
            </div>

            {/* Col 2: The Physical Stack Tube (7 cols on md) */}
            <div className="md:col-span-7 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-rose-600" />
                  <span>Physical Hardware Memory Tube (LIFO Stack)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Frame Growth: Upward ↑</span>
              </div>

              {/* Physical Tube Container */}
              <div className="w-full min-h-[200px] border-2 border-dashed border-slate-300/80 rounded-2xl p-3 flex flex-col-reverse justify-start gap-2.5 bg-white">
                {currentFrame.stackFrames.map((frameText, idx) => {
                  const isTop = idx === currentFrame.stackFrames.length - 1;
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs font-mono transition-all shadow-sm ${
                        isTop
                          ? "bg-gradient-to-r from-rose-950/70 to-slate-900 border-rose-500/80 text-slate-900 ring-1 ring-rose-500/30"
                          : "bg-slate-50 border-slate-200 text-slate-600 opacity-80"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-sans font-bold">
                        <span className={isTop ? "text-rose-600" : "text-slate-500"}>
                          {isTop ? "● TOP (ACTIVE EXECUTION)" : "○ SUSPENDED (PRESERVED IN MEMORY)"}
                        </span>
                        <span className="text-slate-500 font-mono">FRAME {idx + 1}</span>
                      </div>
                      <div className="mt-1 font-semibold text-[11px] text-slate-100">{frameText}</div>
                    </div>
                  );
                })}
              </div>

              <div className="text-[11px] text-slate-500 text-center font-sans">
                Notice: Bottom frames stay frozen in hardware memory — they are <strong className="text-slate-900">never overwritten</strong>!
              </div>
            </div>
          </div>

          {/* Current Step Explanation & Conceptual Counterexample */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0e111a] border border-slate-200 space-y-2">
              <div className="flex items-center space-x-2 text-rose-600 font-bold text-xs">
                <BookOpen className="w-4 h-4" />
                <span>Step {currentFrame.step} Execution Mechanics: {currentFrame.label}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                {currentFrame.explanation}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#161219] to-slate-900/90 border border-rose-500/20 space-y-2">
              <div className="flex items-center space-x-2 text-rose-600 font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Invariant Counterexample: {intervention.counterexample.title}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {intervention.counterexample.mentalModelExplanation}
              </p>
              {intervention.counterexample.actualOutput && (
                <div className="p-2.5 rounded-lg bg-white font-mono text-[11px] text-emerald-600 border border-slate-200">
                  Observed Output: {intervention.counterexample.actualOutput.replace(/\n/g, " → ")}
                </div>
              )}
            </div>
          </div>

          {/* Pedagogical Deconstruction (Why it broke student code) */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <span className="text-rose-600 font-bold uppercase text-[11px] font-sans flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Core Deconstruction: Why this broke your previous solution</span>
            </span>
            <p className="text-slate-600 leading-relaxed font-sans">
              {intervention.explanation}
            </p>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: HANDS-ON PRACTICE & DISCONFIRMATION (MICRO-PUZZLE + CODE FIX) */}
      {/* ========================================================================= */}
      {(viewMode === "flow" || focusedStage === "practice") && (
        <section
          id="practice-section"
          aria-labelledby="practice-heading"
          className="p-6 sm:p-7 rounded-3xl bg-slate-50 border border-slate-200 shadow-xl space-y-6"
        >
          <div className="border-b border-slate-200 pb-4">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-600 border border-amber-500/30 uppercase tracking-wide">
              Stage 02 • Hands-On Practice & Disconfirmation
            </span>
            <h2 id="practice-heading" className="text-lg font-bold text-slate-900 font-editorial mt-1">
              Test & Repair the Invariant
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left: Micro-Puzzle Disconfirmation */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center space-x-2 text-amber-600 font-bold text-xs">
                <Puzzle className="w-4 h-4" />
                <span>Cognitive Disconfirmation Micro-Puzzle</span>
              </div>

              <p className="text-xs text-slate-900 font-semibold font-sans leading-relaxed">
                {intervention.microPuzzle.question}
              </p>

              {intervention.microPuzzle.codeSnippet && (
                <pre className="p-3.5 rounded-xl bg-white border border-slate-200 text-[11px] font-mono text-slate-700 overflow-x-auto leading-relaxed">
                  {intervention.microPuzzle.codeSnippet}
                </pre>
              )}

              <div className="space-y-2">
                {intervention.microPuzzle.options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedPuzzleIdx(idx);
                      setPuzzleSubmitted(true);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs font-sans transition-all flex items-center justify-between ${
                      selectedPuzzleIdx === idx
                        ? idx === intervention.microPuzzle.correctIndex
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-semibold"
                          : "bg-rose-50 border-rose-500 text-rose-700 font-semibold"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    <span>{opt}</span>
                    {selectedPuzzleIdx === idx && (
                      <span className="font-bold text-xs shrink-0 ml-2">
                        {idx === intervention.microPuzzle.correctIndex ? "✓ Correct!" : "✗ Try again"}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {puzzleSubmitted && (
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed font-sans">
                  {intervention.microPuzzle.explanation}
                </div>
              )}
            </div>

            {/* Right: Interactive Code Fix Sandbox */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center space-x-2 text-rose-600 font-bold text-xs">
                <Code2 className="w-4 h-4" />
                <span>Interactive Code Fix Sandbox</span>
              </div>

              <p className="text-xs text-slate-600 font-sans leading-relaxed">
                {intervention.codeExercise.instructions}
              </p>

              <div className="space-y-1.5">
                <label
                  htmlFor="recovery_code_editor"
                  className="text-[11px] font-sans text-slate-500 block font-medium"
                >
                  Editable Recursive Function:
                </label>
                <textarea
                  id="recovery_code_editor"
                  rows={9}
                  aria-label="Interactive Code Fix Input"
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-white border border-slate-200 text-xs font-mono text-emerald-600 focus:outline-none focus:border-rose-500 leading-relaxed shadow-inner"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleCodeCheck}
                  className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl btn-shades-primary text-white text-xs font-semibold shadow-md transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Verify Recursive Invariant</span>
                </button>

                {codeTested && (
                  <span
                    className={`text-xs font-sans font-semibold ${
                      codeSuccess ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {codeSuccess
                      ? "✓ Excellent! Preserves parent loop state across calls!"
                      : "✗ Notice: An early return inside the loop still aborts traversal."}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: MANDATORY RE-TEST & MASTERY VERIFICATION ASSESSMENT            */}
      {/* ========================================================================= */}
      {(viewMode === "flow" || focusedStage === "retest") && retest && (
        <section
          id="retest-section"
          aria-labelledby="retest-heading"
          className="p-6 sm:p-7 rounded-3xl bg-slate-50 border border-emerald-500/30 shadow-xl space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-600 border border-emerald-500/40 uppercase tracking-wide">
                Stage 03 • Mandatory Re-Test Verification
              </span>
              <h2 id="retest-heading" className="text-lg font-bold text-slate-900 font-editorial mt-1">
                Prerequisite Mastery Verification Assessment
              </h2>
            </div>

            {/* Dynamic Status Indicator */}
            <div className="shrink-0">
              {reTestResult ? (
                reTestResult.isCorrect ? (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 border border-emerald-500/50 flex items-center space-x-2 shadow-sm animate-in zoom-in-95">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>✓ Invariant Recovered</span>
                  </span>
                ) : (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-600 border border-rose-500/50 flex items-center space-x-2 shadow-sm animate-in zoom-in-95">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>⚠ Needs Further Review</span>
                  </span>
                )
              ) : reTesting ? (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-600 border border-rose-500/40 flex items-center space-x-2 shadow-sm">
                  <RotateCcw className="w-4 h-4 animate-spin text-rose-600" />
                  <span>Evaluating Response...</span>
                </span>
              ) : (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/30 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Pending Re-Test</span>
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 font-sans leading-relaxed">
              {retest.question}
            </h3>

            {retest.codeSnippet && (
              <pre className="p-4 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-700 leading-relaxed overflow-x-auto">
                {retest.codeSnippet}
              </pre>
            )}

            {/* Assessment Options */}
            <div className="space-y-2.5">
              {retest.options.map((opt) => (
                <label
                  key={opt.id}
                  htmlFor={`retest_opt_${opt.id}`}
                  onClick={() => {
                    setSelectedReTestOpt(opt.id);
                    setReTestError(null);
                  }}
                  className={`block p-4 rounded-xl border text-xs font-sans cursor-pointer transition-all ${
                    selectedReTestOpt === opt.id
                      ? "bg-slate-100 border-rose-500 text-white shadow-md ring-1 ring-rose-500/40"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id={`retest_opt_${opt.id}`}
                      name="retest_choice"
                      checked={selectedReTestOpt === opt.id}
                      onChange={() => {
                        setSelectedReTestOpt(opt.id);
                        setReTestError(null);
                      }}
                      className="accent-rose-500"
                    />
                    <span className="leading-relaxed">{opt.text}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleReTestSubmit}
                disabled={reTesting}
                className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl btn-shades-primary text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{reTesting ? "Verifying Mastery..." : "Submit Re-Test & Verify Invariant"}</span>
              </button>

              {reTestError && (
                <div className="flex items-center space-x-2 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-800/50 px-3.5 py-2 rounded-xl animate-in fade-in">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{reTestError}</span>
                </div>
              )}
            </div>

            {/* Evaluation Result Feedback */}
            {reTestResult && (
              <div
                className={`p-6 rounded-2xl border space-y-4 animate-in zoom-in-95 ${
                  reTestResult.isCorrect
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                    : "bg-rose-50 border-rose-500 text-rose-700"
                }`}
              >
                <div className="flex items-center space-x-2.5 font-bold text-sm">
                  {reTestResult.isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span className={reTestResult.isCorrect ? "text-emerald-600" : "text-rose-600"}>
                    {reTestResult.isCorrect
                      ? "Concept Invariant Restructured — Mastery Verified!"
                      : "Cognitive Gap Unresolved — Remediation Logged."}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">{reTestResult.feedback}</p>

                {reTestResult.isCorrect && (
                  <div className="pt-3 border-t border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <span className="text-xs font-sans text-slate-600">
                      Unlocked in Causal DAG: <strong>{reTestResult.unlockedConcepts?.join(", ") || "Downstream concepts unblocked"}</strong> 🔓
                    </span>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        href={
                          getEffectiveSessionId()
                            ? `/progress?sessionId=${encodeURIComponent(getEffectiveSessionId()!)}&recoveredConcept=${encodeURIComponent(activeConceptId)}&fromTarget=${encodeURIComponent(fromTarget || "")}`
                            : `/progress?recoveredConcept=${encodeURIComponent(activeConceptId)}&fromTarget=${encodeURIComponent(fromTarget || "")}`
                        }
                        className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl btn-shades-primary text-white font-semibold text-xs shadow-md transition-all"
                      >
                        <span>Proceed to Step 4: Adaptive Roadmap →</span>
                      </Link>
                      <Link
                        href={
                          getEffectiveSessionId()
                            ? `/graph?sessionId=${encodeURIComponent(getEffectiveSessionId()!)}&highlight=${encodeURIComponent(activeConceptId)}`
                            : `/graph?highlight=${encodeURIComponent(activeConceptId)}`
                        }
                        className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-300 transition-colors"
                      >
                        Inspect in DAG
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: REAL-WORLD INDUSTRY BLAST RADIUS & MULTILINGUAL BRIDGE         */}
      {/* ========================================================================= */}
      {(viewMode === "flow" || focusedStage === "deepdive") && (
        <section
          id="deepdive-section"
          aria-labelledby="deepdive-heading"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Industry Blast Radius */}
          <div className="p-6 rounded-3xl bg-slate-50 border border-amber-500/30 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-amber-600 text-xs font-bold font-sans">
              <Flame className="w-4 h-4" />
              <span>Production Architecture &amp; Blast Radius Case Study</span>
            </div>

            <h3 id="deepdive-heading" className="text-base font-bold text-slate-900 font-editorial">
              {intervention.industryBlastRadius.incidentTitle}
            </h3>
            <div className="text-xs font-sans text-slate-500">
              Organization: <span className="text-slate-700 font-medium">{intervention.industryBlastRadius.organizationType}</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {intervention.industryBlastRadius.outageDescription}
            </p>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-900/40 space-y-2 text-xs font-sans">
              <span className="text-amber-600 font-bold uppercase text-[10px]">
                How this Misconception Triggers Outages:
              </span>
              <p className="text-amber-700/90 leading-relaxed">
                {intervention.industryBlastRadius.howMisconceptionCausesIt}
              </p>
            </div>

            <div className="text-[11px] text-slate-500 italic border-t border-slate-200/80 pt-2 font-sans">
              * {intervention.industryBlastRadius.illustrativeNote}
            </div>
          </div>

          {/* Multilingual Bridge */}
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center space-x-2 text-rose-600 text-xs font-bold font-sans">
                  <Globe className="w-4 h-4" />
                  <span>Multilingual Conceptual Bridge</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 font-editorial mt-0.5">
                  Regional Intuition &amp; Preserved Terms
                </h3>
              </div>

              <div className="flex items-center space-x-1.5">
                {[
                  { code: "ta", label: "தமிழ்" },
                  { code: "hi", label: "हिन्दी" },
                  { code: "te", label: "తెలుగు" },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
                      selectedLanguage === lang.code
                        ? "bg-rose-600 text-white shadow-sm font-semibold"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {loadingTranslation ? (
              <div className="p-8 text-center text-xs font-sans text-slate-500">
                Generating contextual regional analogy with preserved terminology...
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-[10px] font-sans uppercase text-rose-600 font-bold">
                    Conceptual Regional Translation
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed font-sans">
                    {localizedData?.explanation ||
                      "ஒரு function மற்றொரு function-ஐ அழைக்கும் போது, அது பழைய function-ஐ அழிக்காது. கணினியின் Call Stack-ல் ஒவ்வொரு function invocation-க்கும் ஒரு தனிப்பட்ட Stack Frame ஒதுக்கப்படுகிறது. அழைக்கப்பட்ட குழந்தை function முடியும் வரை, பெற்றோர் function-ன் local variables பாதுகாப்பாக suspend நிலையில் இருக்கும்."}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-sans uppercase text-amber-600 font-bold">
                    Cultural Analogy
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    {localizedData?.analogy ||
                      "நீங்கள் ஒரு புத்தகத்தைப் படித்துக் கொண்டிருக்கும் போது ஒரு குறிப்பை சரிபார்க்க மற்றொரு குறிப்பேட்டைத் திறப்பது போல. நீங்கள் அசல் புத்தகத்தை தூக்கி எறிய மாட்டீர்கள்; குறிப்பேட்டை முடித்துவிட்டு, புத்தகத்தில் விட்ட இடத்திலிருந்தே தொடர்வீர்கள்."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-slate-500 font-sans text-[11px]">Preserved Terms:</span>
                  {(
                    localizedData?.preservedTechnicalTerms || [
                      "Call Stack",
                      "Stack Frame",
                      "function invocation",
                      "local variables",
                      "suspend",
                    ]
                  ).map((term: string) => (
                    <span
                      key={term}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 text-rose-600 text-[10px] font-mono"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Flame,
  Info,
  ShieldAlert,
  Terminal,
} from "lucide-react";
import { InterventionContent, ReTestAssessment, Concept } from "@/lib/types";

export default function RecoveryPage() {
  const router = useRouter();
  const [concept, setConcept] = useState<Concept | null>(null);
  const [intervention, setIntervention] = useState<InterventionContent | null>(null);
  const [retest, setRetest] = useState<ReTestAssessment | null>(null);
  const [activeTab, setActiveTab] = useState<
    "visualizer" | "explain" | "puzzle" | "code" | "blast_radius" | "multilingual" | "retest"
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

  useEffect(() => {
    fetch("/api/recovery?conceptId=call_stack")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setConcept(data.concept);
          setIntervention(data.intervention);
          setRetest(data.retest);
          setUserCode(data.intervention.codeExercise.initialCode);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  const handleLanguageChange = async (lang: string) => {
    setSelectedLanguage(lang);
    setLoadingTranslation(true);
    try {
      const res = await fetch("/api/multilingual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptId: "call_stack", language: lang }),
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
    if (intervention) {
      const isCorrect =
        userCode.includes("dfs(neighbor, visited, path);") &&
        !userCode.includes("return dfs(neighbor");
      setCodeSuccess(isCorrect);
    }
  };

  const handleReTestSubmit = async () => {
    if (!selectedReTestOpt) return;
    setReTesting(true);
    try {
      const res = await fetch("/api/retest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptId: "call_stack",
          selectedOptionId: selectedReTestOpt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReTestResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReTesting(false);
    }
  };

  if (!intervention) {
    return (
      <div className="h-64 flex items-center justify-center text-cyan-400 font-mono text-xs">
        Loading Recovery Lab Modules...
      </div>
    );
  }

  const currentFrame =
    intervention.visualMemoryModel.frames[visualStep] ||
    intervention.visualMemoryModel.frames[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <HeartPulse className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Targeted Recovery Lab Studio (Module 5)
            </h1>
          </div>
          <p className="text-xs text-archaia-muted mt-1">
            Targeting Isolated Root Gap: <strong className="text-amber-300">Call Stack & LIFO Frames</strong>. Repair the foundational mental model before returning to Graph Traversal.
          </p>
        </div>

        <button
          onClick={() => setActiveTab("retest")}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-glow transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Take Mandatory Re-Test →</span>
        </button>
      </div>

      {/* Lab Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-archaia-dark border border-archaia-border">
        {[
          { id: "visualizer", label: "Visual Memory Simulator", icon: Layers },
          { id: "explain", label: "Targeted Explanation", icon: BookOpen },
          { id: "puzzle", label: "Micro-Puzzle", icon: Puzzle },
          { id: "code", label: "Interactive Code Fix", icon: Code2 },
          { id: "blast_radius", label: "Industry Blast Radius", icon: Flame },
          { id: "multilingual", label: "Multilingual Bridge", icon: Globe },
          { id: "retest", label: "Mandatory Re-Test", icon: CheckCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-mono transition-all ${
                isSelected
                  ? "bg-archaia-primary text-white shadow-glow"
                  : "hover:bg-archaia-card text-archaia-muted hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: VISUAL MEMORY SIMULATOR (Feature 20 & 23) */}
      {activeTab === "visualizer" && (
        <div className="p-6 rounded-3xl bg-archaia-dark border border-indigo-500/40 shadow-glow space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-archaia-border pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                  Feature 20 & 23
                </span>
                <h3 className="text-base font-bold text-white">
                  {intervention.visualMemoryModel.title}
                </h3>
              </div>
              <p className="text-xs text-archaia-muted mt-0.5">
                {intervention.visualMemoryModel.description}
              </p>
            </div>

            {/* Stepper Controls */}
            <div className="flex items-center space-x-2 font-mono text-xs">
              <button
                onClick={() => setVisualStep((s) => Math.max(0, s - 1))}
                disabled={visualStep === 0}
                className="px-3 py-1 rounded-lg bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border text-white disabled:opacity-40"
              >
                ← Prev Step
              </button>
              <span className="text-cyan-400 px-2 font-bold">
                Step {visualStep + 1} / {intervention.visualMemoryModel.frames.length}
              </span>
              <button
                onClick={() =>
                  setVisualStep((s) =>
                    Math.min(intervention.visualMemoryModel.frames.length - 1, s + 1)
                  )
                }
                disabled={visualStep === intervention.visualMemoryModel.frames.length - 1}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40"
              >
                Next Step →
              </button>
            </div>
          </div>

          {/* 3-Column Interactive Sandbox */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {/* Col 1: Code Trace with Active Line */}
            <div className="p-4 rounded-2xl bg-archaia-card border border-archaia-border space-y-2">
              <div className="text-[11px] font-mono text-cyan-400 font-semibold flex items-center space-x-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>Runtime Code Trace</span>
              </div>
              <div className="p-3 rounded-xl bg-black font-mono text-[11px] space-y-1">
                <div className={currentFrame.activeLine === 1 ? "text-cyan-300 bg-cyan-950/60 px-1 rounded" : "text-slate-400"}>
                  1: function dfs(node) &#123;
                </div>
                <div className={currentFrame.activeLine === 2 ? "text-cyan-300 bg-cyan-950/60 px-1 rounded" : "text-slate-400"}>
                  2:   visited.add(node);
                </div>
                <div className={currentFrame.activeLine === 3 ? "text-cyan-300 bg-cyan-950/60 px-1 rounded" : "text-slate-400"}>
                  3:   for (let n of neighbors) &#123;
                </div>
                <div className={currentFrame.activeLine === 6 ? "text-cyan-300 bg-cyan-950/60 px-1 rounded" : "text-slate-400"}>
                  4:     dfs(n); // RECURSIVE CALL
                </div>
                <div className={currentFrame.activeLine === 8 ? "text-cyan-300 bg-cyan-950/60 px-1 rounded" : "text-slate-400"}>
                  5:   &#125; // RESUMES LOOP HERE!
                </div>
                <div className="text-slate-400">
                  6: &#125;
                </div>
              </div>
              <div className="text-[10px] text-archaia-muted font-mono">
                Active Execution: Line {currentFrame.activeLine}
              </div>
            </div>

            {/* Col 2: The Physical Stack Tube */}
            <div className="p-4 rounded-2xl bg-archaia-card border border-archaia-border flex flex-col items-center space-y-3">
              <div className="text-[11px] font-mono text-archaia-muted uppercase tracking-wider">
                Hardware Call Stack (LIFO)
              </div>

              <div className="w-full h-56 border-2 border-dashed border-archaia-border rounded-xl p-2.5 flex flex-col-reverse justify-start gap-2 bg-slate-950/80 overflow-hidden">
                {currentFrame.stackFrames.map((frame, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs font-mono font-semibold transition-all ${
                      idx === currentFrame.stackFrames.length - 1
                        ? "bg-gradient-to-r from-indigo-900 to-cyan-900 border-cyan-400 text-white shadow-glow"
                        : "bg-slate-900 border-slate-700 text-slate-400 opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-cyan-300">
                      <span>{idx === currentFrame.stackFrames.length - 1 ? "TOP (ACTIVE)" : "SUSPENDED"}</span>
                      <span>LIFO</span>
                    </div>
                    <div className="mt-0.5 text-[11px]">{frame}</div>
                  </div>
                ))}
              </div>

              <div className="text-[10px] font-mono text-cyan-400 text-center">
                Bottom frames stay preserved; never overwritten!
              </div>
            </div>

            {/* Col 3: Explanation & Invariant Truth */}
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-semibold">
                  Step {currentFrame.step}: {currentFrame.label}
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-mono">
                  {currentFrame.explanation}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-archaia-card border border-archaia-border space-y-1 text-xs">
                <div className="text-amber-300 font-mono text-[11px] font-semibold">
                  Counterexample Check:
                </div>
                <p className="text-[11px] text-archaia-muted leading-relaxed font-mono">
                  {intervention.counterexample.mentalModelExplanation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TARGETED EXPLANATION (Feature 19) */}
      {activeTab === "explain" && (
        <div className="p-6 rounded-3xl bg-archaia-dark border border-archaia-border space-y-4 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
              Feature 19
            </span>
            <h3 className="text-lg font-bold text-white">{intervention.title}</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-mono text-sm">
            {intervention.explanation}
          </p>

          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-900/60 space-y-2 text-xs">
            <span className="text-cyan-400 font-mono font-semibold uppercase text-[10px]">
              Why this broke your Graph Traversal code:
            </span>
            <p className="text-slate-300 leading-relaxed">
              In graph DFS, when visiting node neighbors in a loop `for (let neighbor of neighbors)`, calling `dfs(neighbor)` suspends the current loop frame. Once the branch explores depth 4 and returns, your stack frame resumes at the exact neighbor index it paused at. Without understanding stack frames, learners mistakenly write `return dfs(...)` or assume the loop terminated!
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: MICRO-PUZZLE (Feature 21 & 24) */}
      {activeTab === "puzzle" && (
        <div className="p-6 rounded-3xl bg-archaia-dark border border-archaia-border space-y-4 animate-in fade-in">
          <div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
              Feature 21 & 24: Cognitive Disconfirmation Micro-Puzzle
            </span>
            <h3 className="text-base font-bold text-white mt-1">
              {intervention.microPuzzle.question}
            </h3>
          </div>

          {intervention.microPuzzle.codeSnippet && (
            <pre className="p-4 rounded-xl bg-black border border-archaia-border text-xs font-mono text-cyan-300">
              {intervention.microPuzzle.codeSnippet}
            </pre>
          )}

          <div className="space-y-2">
            {intervention.microPuzzle.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedPuzzleIdx(idx);
                  setPuzzleSubmitted(true);
                }}
                className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition-all flex items-center justify-between ${
                  selectedPuzzleIdx === idx
                    ? idx === intervention.microPuzzle.correctIndex
                      ? "bg-emerald-950/60 border-emerald-500 text-emerald-200"
                      : "bg-rose-950/60 border-rose-500 text-rose-200"
                    : "bg-archaia-card hover:bg-archaia-cardHover border-archaia-border text-slate-300"
                }`}
              >
                <span>{opt}</span>
                {selectedPuzzleIdx === idx && (
                  <span>
                    {idx === intervention.microPuzzle.correctIndex ? "✓ Correct!" : "✗ Try again"}
                  </span>
                )}
              </button>
            ))}
          </div>

          {puzzleSubmitted && (
            <div className="p-4 rounded-xl bg-archaia-card border border-cyan-500/30 text-xs font-mono text-cyan-300 leading-relaxed">
              {intervention.microPuzzle.explanation}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: INTERACTIVE CODE FIX (Feature 25) */}
      {activeTab === "code" && (
        <div className="p-6 rounded-3xl bg-archaia-dark border border-archaia-border space-y-4 animate-in fade-in">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                Feature 25
              </span>
              <h3 className="text-base font-bold text-white">Interactive Recursive Code Fix</h3>
            </div>
            <p className="text-xs text-archaia-muted mt-0.5">
              {intervention.codeExercise.instructions}
            </p>
          </div>

          <div className="space-y-2">
            <textarea
              rows={10}
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              className="w-full p-4 rounded-xl bg-black border border-archaia-border text-xs font-mono text-emerald-400 focus:outline-none focus:border-cyan-400 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleCodeCheck}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Verify Recursive Invariant</span>
            </button>

            {codeTested && (
              <span
                className={`text-xs font-mono font-semibold ${
                  codeSuccess ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {codeSuccess
                  ? "✓ Excellent! You removed the premature return, allowing stack resumption!"
                  : "✗ Notice: You still have an early 'return' inside the neighbor loop."}
              </span>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: INDUSTRY BLAST RADIUS (Feature 22, 36 & 37) */}
      {activeTab === "blast_radius" && (
        <div className="p-6 rounded-3xl bg-archaia-dark border border-amber-500/40 shadow-glowWarning space-y-4 animate-in fade-in">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono font-semibold">
            <Flame className="w-4 h-4" />
            <span>Feature 22, 36 & 37: Real-World Industry Blast Radius</span>
          </div>

          <h3 className="text-lg font-bold text-white">
            {intervention.industryBlastRadius.incidentTitle}
          </h3>
          <div className="text-xs font-mono text-cyan-400">
            Organization Type: {intervention.industryBlastRadius.organizationType}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            {intervention.industryBlastRadius.outageDescription}
          </p>

          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-900/60 space-y-2 text-xs font-mono">
            <span className="text-amber-400 font-semibold uppercase text-[10px]">
              How this Misconception Translates to Production Outages:
            </span>
            <p className="text-amber-200 leading-relaxed">
              {intervention.industryBlastRadius.howMisconceptionCausesIt}
            </p>
          </div>

          <div className="text-[11px] text-archaia-muted italic border-t border-archaia-border pt-2 font-mono">
            * {intervention.industryBlastRadius.illustrativeNote}
          </div>
        </div>
      )}

      {/* TAB 6: MULTILINGUAL BRIDGE (Feature 34 & 35) */}
      {activeTab === "multilingual" && (
        <div className="p-6 rounded-3xl bg-archaia-dark border border-archaia-border space-y-5 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-archaia-border pb-3">
            <div>
              <h3 className="text-base font-bold text-white">
                Multilingual Cognitive Bridge (Feature 34 & 35)
              </h3>
              <p className="text-xs text-archaia-muted mt-0.5">
                Preserves technical English terms (`Call Stack`, `LIFO`, `Stack Frame`) while adapting conceptual intuition into regional languages.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {[
                { code: "ta", label: "தமிழ் (Tamil)" },
                { code: "hi", label: "हिन्दी (Hindi)" },
                { code: "te", label: "తెలుగు (Telugu)" },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    selectedLanguage === lang.code
                      ? "bg-archaia-primary text-white shadow-glow"
                      : "bg-archaia-card hover:bg-archaia-cardHover text-archaia-muted"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {loadingTranslation ? (
            <div className="p-8 text-center text-xs font-mono text-cyan-400">
              Generating contextual regional analogy with preserved terminology...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-archaia-card border border-archaia-border space-y-3">
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-semibold">
                  Conceptual Translation
                </span>
                <p className="text-sm text-slate-100 leading-relaxed font-sans">
                  {localizedData?.explanation ||
                    "ஒரு function மற்றொரு function-ஐ அழைக்கும் போது, அது பழைய function-ஐ அழிக்காது. கணினியின் Call Stack-ல் ஒவ்வொரு function invocation-க்கும் ஒரு தனிப்பட்ட Stack Frame ஒதுக்கப்படுகிறது. அழைக்கப்பட்ட குழந்தை function முடியும் வரை, பெற்றோர் function-ன் local variables பாதுகாப்பாக suspend நிலையில் இருக்கும்."}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-900/60 space-y-2">
                <span className="text-[10px] font-mono uppercase text-indigo-300 font-semibold">
                  Intuitive Cultural Analogy
                </span>
                <p className="text-xs text-indigo-100 leading-relaxed font-sans">
                  {localizedData?.analogy ||
                    "நீங்கள் ஒரு புத்தகத்தைப் படித்துக் கொண்டிருக்கும் போது ஒரு குறிப்பை சரிபார்க்க மற்றொரு குறிப்பேட்டைத் திறப்பது போல. நீங்கள் அசல் புத்தகத்தை தூக்கி எறிய மாட்டீர்கள்; குறிப்பேட்டை முடித்துவிட்டு, புத்தகத்தில் விட்ட இடத்திலிருந்தே தொடர்வீர்கள்."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-mono">
                <span className="text-archaia-muted">Preserved Technical Terms:</span>
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
                    className="px-2 py-0.5 rounded bg-black border border-archaia-border text-cyan-400 text-[10px]"
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: MANDATORY RE-TEST (Feature 27, 28, 29 & 30) */}
      {activeTab === "retest" && retest && (
        <div className="p-6 rounded-3xl bg-archaia-dark border border-emerald-500/40 shadow-glowSuccess space-y-5 animate-in fade-in">
          <div className="border-b border-archaia-border pb-3">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
              Mandatory Re-Test Assessment (Feature 27, 28, 29 & 30)
            </span>
            <h3 className="text-base font-bold text-white mt-1">{retest.question}</h3>
          </div>

          {retest.codeSnippet && (
            <pre className="p-4 rounded-xl bg-black border border-archaia-border text-xs font-mono text-cyan-300">
              {retest.codeSnippet}
            </pre>
          )}

          <div className="space-y-2.5">
            {retest.options.map((opt) => (
              <label
                key={opt.id}
                onClick={() => setSelectedReTestOpt(opt.id)}
                className={`block p-4 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
                  selectedReTestOpt === opt.id
                    ? "bg-indigo-950/80 border-cyan-400 text-white shadow-glow"
                    : "bg-archaia-card hover:bg-archaia-cardHover border-archaia-border text-slate-300"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="retest_choice"
                    checked={selectedReTestOpt === opt.id}
                    onChange={() => setSelectedReTestOpt(opt.id)}
                    className="accent-cyan-400"
                  />
                  <span>{opt.text}</span>
                </div>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleReTestSubmit}
              disabled={!selectedReTestOpt || reTesting}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-glowSuccess transition-all disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{reTesting ? "Evaluating Re-Assessment..." : "Submit Re-Test & Update Model"}</span>
            </button>
          </div>

          {reTestResult && (
            <div
              className={`p-5 rounded-2xl border space-y-3 animate-in zoom-in-95 ${
                reTestResult.isCorrect
                  ? "bg-emerald-950/70 border-emerald-500 text-emerald-200"
                  : "bg-rose-950/70 border-rose-500 text-rose-200"
              }`}
            >
              <div className="flex items-center space-x-2 font-bold text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>
                  {reTestResult.isCorrect
                    ? "CONCEPT RECOVERED (Feature 28)! Mental Model Verified."
                    : "UNRESOLVED GAP (Feature 29): Further diagnosis logged."}
                </span>
              </div>
              <p className="text-xs font-mono leading-relaxed">{reTestResult.feedback}</p>

              {reTestResult.furtherDiagnosisNotes && (
                <div className="p-3 rounded-xl bg-black/60 border border-rose-900 text-xs font-mono text-rose-300">
                  <strong>Further Diagnosis (Feature 30):</strong> {reTestResult.furtherDiagnosisNotes}
                </div>
              )}

              {reTestResult.isCorrect && (
                <div className="pt-2 border-t border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-mono text-cyan-300">
                    Unlocked Downstream: Recursion 🟢, Tree Traversal 🔓, Graph Traversal 🔓
                  </span>
                  <Link
                    href="/progress"
                    className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors"
                  >
                    <span>View Updated Adaptive Path →</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

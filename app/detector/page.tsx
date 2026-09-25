"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bug,
  FileCode,
  ListOrdered,
  CheckSquare,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Lightbulb,
  Split,
  HelpCircle,
  Plus,
  Trash2,
  FileCheck2,
} from "lucide-react";
import { ResponseType, Misconception } from "@/lib/types";

export default function DetectorPage() {
  const router = useRouter();
  const [responseType, setResponseType] = useState<ResponseType>("written");
  const [conceptId, setConceptId] = useState("graph_traversal");
  const [questionText, setQuestionText] = useState(
    "In recursive Depth-First Search (DFS) on a graph, what happens to the execution state of the current node when dfs() is called on an unvisited neighbor?"
  );

  // Written Text input state
  const [writtenInput, setWrittenInput] = useState(
    "When dfs(neighbor) is invoked, it replaces the current function. Because the child executes, the parent function is overwritten, so after visiting node 2 it forgets where it was and exits without exploring node 3."
  );

  // Code input state
  const [codeInput, setCodeInput] = useState(
    `function dfs(node, visited) {
  visited.add(node);
  for (let neighbor of node.neighbors) {
    if (!visited.has(neighbor)) {
      // Student assumed child call completes the procedure
      return dfs(neighbor, visited);
    }
  }
}`
  );

  // MCQ state
  const [mcqSelected, setMcqSelected] = useState<string>("opt_replace");
  const mcqOptions = [
    {
      id: "opt_replace",
      text: "The current function context is replaced and overwritten by the child invocation, terminating parent loops.",
      isDistractor: true,
      misconception: "Recursive Context Replacement",
    },
    {
      id: "opt_correct",
      text: "The current function is paused on the Call Stack in its own frame and resumes loop execution once the child returns.",
      isDistractor: false,
    },
    {
      id: "opt_clone",
      text: "The entire program clones its memory space into an isolated process thread.",
      isDistractor: true,
      misconception: "Process Virtualization Fallacy",
    },
  ];

  // Problem Steps state
  const [steps, setSteps] = useState<string[]>([
    "1. dfs(Node 0) is called and visits Node 0.",
    "2. It loops to neighbor Node 1 and calls dfs(Node 1).",
    "3. dfs(Node 1) replaces dfs(Node 0) in memory.",
    "4. When Node 1 finishes, execution ends because Node 0's loop was overwritten.",
  ]);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({
    q1: "replaces",
    q2: "destroys",
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [detectedMisconception, setDetectedMisconception] = useState<Misconception | null>(null);
  const [normalizedReasoning, setNormalizedReasoning] = useState<string | null>(null);

  // Presets
  const loadPreset = (type: "dfs_replacement" | "reference_aliasing") => {
    if (type === "dfs_replacement") {
      setConceptId("graph_traversal");
      setResponseType("written");
      setQuestionText(
        "In recursive Depth-First Search (DFS) on a graph, what happens to the execution state of the current node when dfs() is called on an unvisited neighbor?"
      );
      setWrittenInput(
        "When dfs(neighbor) is invoked, it replaces the current function. Because the child executes, the parent function is overwritten, so after visiting node 2 it forgets where it was and exits without exploring node 3."
      );
    } else {
      setConceptId("memory_allocation");
      setResponseType("written");
      setQuestionText(
        "In Graph BFS/DFS, if you assign `let copy_visited = visited;`, what happens if you mutate `copy_visited`?"
      );
      setWrittenInput(
        "Writing `copy_visited = visited` clones the set into a new memory location. Modifying `copy_visited` will never mutate the original `visited` set."
      );
    }
  };

  const getPayloadContent = () => {
    switch (responseType) {
      case "written":
        return writtenInput;
      case "code":
        return codeInput;
      case "mcq":
        return mcqOptions.find((o) => o.id === mcqSelected)?.text || mcqSelected;
      case "steps":
        return steps.join("\n");
      case "quiz":
        return `Q1: Recursive state ${quizAnswers.q1}. Q2: Frame lifetime ${quizAnswers.q2}.`;
      default:
        return writtenInput;
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzing(true);
    try {
      const content = getPayloadContent();
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptId,
          questionId: "q_" + responseType + "_" + Date.now(),
          questionText,
          responseType,
          content,
        }),
      });

      const data = await res.json();
      if (data.success && data.misconception) {
        setDetectedMisconception(data.misconception);
        setNormalizedReasoning(data.normalizedReasoning);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Bug className="w-5 h-5 text-rose-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Cognitive Bug Detector
            </h1>
          </div>
          <p className="text-xs text-archaia-muted mt-1">
            Multi-modal submission analyzer. Deconstructs mental models across written text, code, MCQs, problem steps, and quizzes.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => loadPreset("dfs_replacement")}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-mono transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Preset 1: DFS Replacement</span>
          </button>
          <button
            onClick={() => loadPreset("reference_aliasing")}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border text-slate-300 text-xs font-mono transition-colors"
          >
            <span>Preset 2: Reference Aliasing</span>
          </button>
        </div>
      </div>

      {/* Input Modality Form */}
      <div className="p-6 rounded-2xl bg-archaia-dark border border-archaia-border space-y-4 shadow-xl">
        {/* Modality Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-archaia-border pb-3">
          <span className="text-xs font-mono text-archaia-muted">Input Modality:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "written", label: "Written Text", icon: HelpCircle },
              { id: "code", label: "Code Snippet", icon: FileCode },
              { id: "mcq", label: "Multiple Choice", icon: CheckSquare },
              { id: "steps", label: "Problem Steps", icon: ListOrdered },
              { id: "quiz", label: "Quiz Response", icon: FileCheck2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = responseType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setResponseType(tab.id as ResponseType)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    isSelected
                      ? "bg-archaia-primary text-white shadow-glow"
                      : "bg-archaia-card hover:bg-archaia-cardHover text-archaia-muted"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-archaia-muted mb-1">
                Target Subject Concept:
              </label>
              <select
                value={conceptId}
                onChange={(e) => setConceptId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-archaia-card border border-archaia-border text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              >
                <option value="graph_traversal">Graph Traversal (DFS & BFS)</option>
                <option value="tree_traversal">Binary Tree Traversal</option>
                <option value="recursion">Recursion & Base Invariants</option>
                <option value="call_stack">Call Stack & LIFO Frames</option>
                <option value="memory_allocation">Memory & Pointers</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-archaia-muted mb-1">
                Diagnostic Strictness:
              </label>
              <div className="px-3 py-2 rounded-lg bg-archaia-card border border-archaia-border text-xs text-cyan-400 font-mono">
                Invariant Root-Trace (Active)
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-archaia-muted mb-1">
              Assessment Prompt / Question:
            </label>
            <input
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-archaia-card border border-archaia-border text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* DYNAMIC MODALITY INPUT FIELDS */}

          {/* 1. Written Explanation */}
          {responseType === "written" && (
            <div>
              <label className="block text-xs font-mono text-archaia-muted mb-1">
                Student Written Reasoning:
              </label>
              <textarea
                rows={4}
                value={writtenInput}
                onChange={(e) => setWrittenInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-archaia-card border border-archaia-border text-xs text-white focus:outline-none focus:border-cyan-400 font-mono leading-relaxed"
              />
            </div>
          )}

          {/* 2. Code Snippet */}
          {responseType === "code" && (
            <div>
              <label className="block text-xs font-mono text-archaia-muted mb-1">
                Student Code Implementation:
              </label>
              <textarea
                rows={8}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                className="w-full p-4 rounded-xl bg-black border border-archaia-border text-xs font-mono text-emerald-400 focus:outline-none focus:border-cyan-400 leading-relaxed"
              />
            </div>
          )}

          {/* 3. Multiple Choice */}
          {responseType === "mcq" && (
            <div className="space-y-2">
              <label className="block text-xs font-mono text-archaia-muted mb-1">
                Select Student Choice (Distractor vs Invariant):
              </label>
              {mcqOptions.map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => setMcqSelected(opt.id)}
                  className={`block p-3 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
                    mcqSelected === opt.id
                      ? "bg-indigo-950/80 border-cyan-400 text-white shadow-glow"
                      : "bg-archaia-card hover:bg-archaia-cardHover border-archaia-border text-slate-300"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="mcq_choice"
                      checked={mcqSelected === opt.id}
                      onChange={() => setMcqSelected(opt.id)}
                      className="mt-0.5 accent-cyan-400"
                    />
                    <div>
                      <span>{opt.text}</span>
                      {opt.isDistractor && (
                        <span className="block text-[10px] text-rose-400 mt-0.5">
                          [Cognitive Trap: {opt.misconception}]
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* 4. Problem-Solving Steps */}
          {responseType === "steps" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono text-archaia-muted">
                  Step-by-Step Execution Sequence:
                </label>
                <button
                  type="button"
                  onClick={() => setSteps([...steps, `${steps.length + 1}. Next action`])}
                  className="flex items-center space-x-1 text-xs text-cyan-400 hover:underline font-mono"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Step</span>
                </button>
              </div>

              {steps.map((st, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={st}
                    onChange={(e) => {
                      const updated = [...steps];
                      updated[idx] = e.target.value;
                      setSteps(updated);
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-archaia-card border border-archaia-border text-xs text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setSteps(steps.filter((_, i) => i !== idx))}
                    className="p-1.5 text-archaia-muted hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 5. Quiz Response */}
          {responseType === "quiz" && (
            <div className="space-y-3 p-4 rounded-xl bg-archaia-card border border-archaia-border text-xs font-mono">
              <div>
                <p className="text-white mb-1">
                  1. What does a recursive call do to the caller's stack frame?
                </p>
                <select
                  value={quizAnswers.q1}
                  onChange={(e) => setQuizAnswers({ ...quizAnswers, q1: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-archaia-dark border border-archaia-border text-cyan-300"
                >
                  <option value="replaces">Replaces and overwrites caller frame</option>
                  <option value="pushes">Pushes new frame and pauses caller</option>
                </select>
              </div>

              <div>
                <p className="text-white mb-1">
                  2. What happens to local loop variables when child functions return?
                </p>
                <select
                  value={quizAnswers.q2}
                  onChange={(e) => setQuizAnswers({ ...quizAnswers, q2: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-archaia-dark border border-archaia-border text-cyan-300"
                >
                  <option value="destroys">Destroyed / Loop terminates</option>
                  <option value="restores">Safely preserved and loop resumes</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={analyzing}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-indigo-600 to-cyan-500 hover:from-rose-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-glow transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span>{analyzing ? "Deconstructing Mental Model..." : "Analyze Learner Reasoning"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Misconception Detection Card Output */}
      {detectedMisconception && (
        <div className="p-6 rounded-3xl bg-archaia-dark border border-rose-500/40 shadow-glowDanger space-y-5 animate-in slide-in-from-bottom-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-archaia-border pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                    Misconception Isolated
                  </span>
                  <span className="text-xs font-mono text-cyan-400">
                    Confidence: {detectedMisconception.confidence}%
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {detectedMisconception.name}
                </h3>
              </div>
            </div>

            <button
              onClick={() => router.push("/bisect")}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-glowWarning transition-transform hover:scale-105"
            >
              <Split className="w-4 h-4" />
              <span>Execute Cognitive Bisect on DAG →</span>
            </button>
          </div>

          <p className="text-xs text-archaia-muted leading-relaxed">
            {detectedMisconception.description}
          </p>

          {/* Student Assumption vs Formal Reality Side-by-Side (Feature 11) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/60 space-y-2">
              <div className="flex items-center space-x-2 text-rose-400 text-xs font-mono font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Student's Flawed Assumption</span>
              </div>
              <p className="text-xs text-rose-200 leading-relaxed font-mono">
                "{detectedMisconception.studentAssumption}"
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-900/60 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-mono font-semibold">
                <Lightbulb className="w-4 h-4" />
                <span>Formal Computing Reality</span>
              </div>
              <p className="text-xs text-emerald-200 leading-relaxed font-mono">
                {detectedMisconception.formalReality}
              </p>
            </div>
          </div>

          {/* Affected Concepts Identification (Feature 12) */}
          <div className="pt-2 border-t border-archaia-border flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 font-mono">
              <span className="text-archaia-muted">Affected Downstream Concepts:</span>
              <div className="flex flex-wrap gap-1.5">
                {detectedMisconception.affectedConcepts.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded bg-archaia-card border border-archaia-border text-cyan-300 text-[11px]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-cyan-400 font-mono text-[11px]">
              Ready for Cognitive Bisect Backtracking
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

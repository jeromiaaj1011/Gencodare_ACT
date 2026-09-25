"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  CheckCircle2,
  Edit3,
  BookOpen,
} from "lucide-react";
import { ResponseType, Misconception } from "@/lib/types";
import CognitivePipelineStepper from "@/components/navigation/CognitivePipelineStepper";

export default function DetectorPage() {
  const router = useRouter();
  const [responseType, setResponseType] = useState<ResponseType>("written");

  // Mode: Curated benchmarks vs Custom user input
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customConceptName, setCustomConceptName] = useState("Asynchronous Event Loop");

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
  const [verifiedResult, setVerifiedResult] = useState<{
    message: string;
    masteryScore?: number;
    conceptId?: string;
    normalizedReasoning?: string;
  } | null>(null);

  // Read URL query params if user jumped from Dashboard launcher
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlCustom = params.get("custom");
      const urlConcept = params.get("concept");
      const urlPrompt = params.get("prompt");
      const urlCode = params.get("code");

      if (urlCustom === "true" || urlConcept || urlPrompt || urlCode) {
        setIsCustomMode(true);
        if (urlConcept) setCustomConceptName(urlConcept);
        if (urlPrompt) setQuestionText(urlPrompt);
        if (urlCode) {
          setResponseType("code");
          setCodeInput(urlCode);
        } else if (urlPrompt) {
          setWrittenInput(urlPrompt);
        }
      }
    }
  }, []);

  // Curated Diagnostic Problem Suite
  const PRACTICE_PROBLEMS = [
    {
      id: "dfs_replacement",
      conceptId: "graph_traversal",
      title: "Graph DFS: Loop Resumption & State",
      question:
        "In recursive Depth-First Search (DFS) on a graph, what happens to the execution state of the current node when dfs() is called on an unvisited neighbor?",
      flawed:
        "When dfs(neighbor) is invoked, it replaces the current function. Because the child executes, the parent function is overwritten, so after visiting node 2 it forgets where it was and exits without exploring node 3.",
      sound:
        "Each recursive call pushes an activation record onto the Call Stack. The parent function pauses at its loop index, and when the child completes, the stack unwinds and the parent resumes seamlessly with the next neighbor.",
    },
    {
      id: "reference_aliasing",
      conceptId: "memory_allocation",
      title: "Memory: Reference Aliasing vs Array Cloning",
      question:
        "In Graph BFS/DFS, if you assign `let copy_visited = visited;`, what happens if you mutate `copy_visited`?",
      flawed:
        "Writing `copy_visited = visited` clones the set into a new memory location. Modifying `copy_visited` will never mutate the original `visited` set.",
      sound:
        "Assigning `copy_visited = visited` copies only the memory reference address pointing to the same heap block. Mutating `copy_visited` modifies the exact same underlying object as `visited`.",
    },
    {
      id: "recursion_returns",
      conceptId: "recursion",
      title: "Recursion: Return Value Bubbling",
      question:
        "In a recursive search, what happens if the base case returns true, but intermediate recursive calls omit the return statement?",
      flawed:
        "Once any recursive call hits return true, the entire program automatically terminates and delivers true to the top caller without needing return statements in parent frames.",
      sound:
        "Stack unwinding passes returns sequentially up the activation chain. If an intermediate parent frame does not return the result of its child call, the return value is dropped and the parent evaluates to undefined.",
    },
  ];

  const loadProblem = (probId: string) => {
    setIsCustomMode(false);
    const prob = PRACTICE_PROBLEMS.find((p) => p.id === probId);
    if (!prob) return;
    setConceptId(prob.conceptId);
    setResponseType("written");
    setQuestionText(prob.question);
    setWrittenInput(prob.flawed);
    setDetectedMisconception(null);
    setVerifiedResult(null);
  };

  const handleCustomModeToggle = () => {
    setIsCustomMode(true);
    setDetectedMisconception(null);
    setVerifiedResult(null);
    setWrittenInput("");
    setQuestionText("Explain the runtime execution and memory behavior of this concept:");
  };

  const fillReasoning = (type: "flawed" | "sound") => {
    const currentProb = PRACTICE_PROBLEMS.find((p) => p.conceptId === conceptId) || PRACTICE_PROBLEMS[0];
    setWrittenInput(type === "flawed" ? currentProb.flawed : currentProb.sound);
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
    setDetectedMisconception(null);
    setVerifiedResult(null);
    try {
      const activeId = isCustomMode && customConceptName.trim()
        ? customConceptName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")
        : conceptId;

      const activeName = isCustomMode && customConceptName.trim()
        ? customConceptName.trim()
        : undefined;

      const content = getPayloadContent();
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptId: activeId,
          conceptName: activeName,
          questionId: "q_" + responseType + "_" + Date.now(),
          questionText,
          responseType,
          content,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.misconception) {
          setDetectedMisconception(data.misconception);
          setNormalizedReasoning(data.normalizedReasoning);
        } else {
          setVerifiedResult({
            message: data.message,
            masteryScore: data.masteryScore,
            conceptId: data.conceptId,
            normalizedReasoning: data.normalizedReasoning,
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* 4-Step Cognitive Diagnostic Pipeline Stepper */}
      <CognitivePipelineStepper
        currentStep={1}
        activeConceptName={isCustomMode ? customConceptName : conceptId}
        targetConceptId={detectedMisconception?.conceptId}
        misconceptionId={detectedMisconception?.id}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Bug className="w-5 h-5 text-rose-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Cognitive Bug Detector (Step 1)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Input any computer science concept, code snippet, or student explanation. The engine deconstructs mental model invariants against formal computing reality.
          </p>
        </div>

        {/* Input Mode Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCustomModeToggle}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isCustomMode
                ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                : "bg-archaia-card hover:bg-archaia-cardHover border-archaia-border text-slate-300"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Enter Custom Input</span>
          </button>

          {PRACTICE_PROBLEMS.map((prob) => (
            <button
              key={prob.id}
              onClick={() => loadProblem(prob.id)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                !isCustomMode && conceptId === prob.conceptId
                  ? "bg-slate-700 border-slate-500 text-white"
                  : "bg-archaia-card hover:bg-archaia-cardHover border-archaia-border text-slate-300"
              }`}
            >
              <span>{prob.title.split(":")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Modality Form */}
      <div className="p-6 rounded-2xl bg-archaia-dark border border-archaia-border space-y-4 shadow-xl">
        {/* Modality Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-archaia-border pb-3">
          <span className="text-xs font-medium text-slate-400">Input Modality:</span>
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
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-archaia-card hover:bg-archaia-cardHover text-slate-400"
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
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isCustomMode ? "Custom Subject / Concept Name:" : "Target Subject Concept:"}
              </label>
              {isCustomMode ? (
                <div className="relative">
                  <input
                    type="text"
                    value={customConceptName}
                    onChange={(e) => setCustomConceptName(e.target.value)}
                    placeholder="e.g., Asynchronous Event Loop, Binary Search, SQL Locks"
                    className="w-full px-3 py-2 rounded-lg bg-archaia-card border border-blue-500/50 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] text-blue-400 font-medium">
                    Custom Concept
                  </span>
                </div>
              ) : (
                <select
                  value={conceptId}
                  onChange={(e) => setConceptId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-archaia-card border border-archaia-border text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                >
                  <option value="graph_traversal">Graph Traversal (DFS & BFS)</option>
                  <option value="tree_traversal">Binary Tree Traversal</option>
                  <option value="recursion">Recursion & Base Invariants</option>
                  <option value="call_stack">Call Stack & LIFO Frames</option>
                  <option value="memory_allocation">Memory & Pointers</option>
                  <option value="dynamic_programming">Dynamic Programming & Memoization</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Diagnostic Pipeline Mode:
              </label>
              <div className="px-3 py-2 rounded-lg bg-archaia-card border border-archaia-border text-xs text-blue-400 font-medium">
                End-to-End Dynamic Continuation
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Assessment Prompt / Question:
            </label>
            <input
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter the problem statement or question under test..."
              className="w-full px-3 py-2 rounded-lg bg-archaia-card border border-archaia-border text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          {/* DYNAMIC MODALITY INPUT FIELDS */}

          {/* 1. Written Explanation */}
          {responseType === "written" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-300">
                  {isCustomMode ? "Your Reasoning / Explanation to Diagnose:" : "Student Written Reasoning:"}
                </label>
                {!isCustomMode && (
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] text-slate-400 font-sans hidden sm:inline">Quick Test:</span>
                    <button
                      type="button"
                      onClick={() => fillReasoning("flawed")}
                      className="px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-medium transition-colors"
                    >
                      Sample Flawed Model
                    </button>
                    <button
                      type="button"
                      onClick={() => fillReasoning("sound")}
                      className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-medium transition-colors"
                    >
                      Sample Sound Model
                    </button>
                  </div>
                )}
              </div>
              <textarea
                rows={4}
                value={writtenInput}
                onChange={(e) => setWrittenInput(e.target.value)}
                placeholder="Type or paste your mental model explanation or reasoning here..."
                className="w-full px-3 py-2 rounded-lg bg-archaia-card border border-archaia-border text-xs text-white focus:outline-none focus:border-blue-500 font-sans leading-relaxed"
              />
            </div>
          )}

          {/* 2. Code Snippet */}
          {responseType === "code" && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isCustomMode ? "Your Custom Code Snippet:" : "Student Code Implementation:"}
              </label>
              <textarea
                rows={8}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="// Paste custom function implementation or test snippet..."
                className="w-full p-4 rounded-xl bg-black border border-archaia-border text-xs font-mono text-emerald-400 focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>
          )}

          {/* 3. Multiple Choice */}
          {responseType === "mcq" && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Select Student Choice (Distractor vs Invariant):
              </label>
              {mcqOptions.map((opt) => (
                <label
                  key={opt.id}
                  onClick={() => setMcqSelected(opt.id)}
                  className={`block p-3 rounded-xl border text-xs font-sans cursor-pointer transition-all ${
                    mcqSelected === opt.id
                      ? "bg-blue-600/15 border-blue-500 text-white shadow-sm"
                      : "bg-archaia-card hover:bg-archaia-cardHover border-archaia-border text-slate-300"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="mcq_choice"
                      checked={mcqSelected === opt.id}
                      onChange={() => setMcqSelected(opt.id)}
                      className="mt-0.5 accent-blue-500"
                    />
                    <div>
                      <span>{opt.text}</span>
                      {opt.isDistractor && (
                        <span className="block text-[10px] text-rose-400 mt-0.5 font-medium">
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
                  className="flex items-center space-x-1 text-xs text-blue-400 hover:underline font-medium"
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
                    className="flex-1 px-3 py-1.5 rounded-lg bg-archaia-card border border-archaia-border text-xs text-white font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setSteps(steps.filter((_, i) => i !== idx))}
                    className="p-1.5 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 5. Quiz Response */}
          {responseType === "quiz" && (
            <div className="space-y-3 p-4 rounded-xl bg-archaia-card border border-archaia-border text-xs font-sans">
              <div>
                <p className="text-white mb-1 font-medium">
                  1. What does an invocation do to the caller's stack frame?
                </p>
                <select
                  value={quizAnswers.q1}
                  onChange={(e) => setQuizAnswers({ ...quizAnswers, q1: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-archaia-dark border border-archaia-border text-blue-300 font-sans"
                >
                  <option value="replaces">Replaces and overwrites caller frame</option>
                  <option value="pushes">Pushes new frame and pauses caller</option>
                </select>
              </div>

              <div>
                <p className="text-white mb-1 font-medium">
                  2. What happens to local variables when child procedures return?
                </p>
                <select
                  value={quizAnswers.q2}
                  onChange={(e) => setQuizAnswers({ ...quizAnswers, q2: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-archaia-dark border border-archaia-border text-blue-300 font-sans"
                >
                  <option value="destroys">Destroyed / Loop terminates</option>
                  <option value="restores">Safely preserved and loop resumes</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400 font-sans">
              {isCustomMode
                ? `Custom concept "${customConceptName}" will be dynamically mapped to Causal DAG.`
                : "Continuous pipeline will forward active misconception directly into Cognitive Bisect."}
            </span>
            <button
              type="submit"
              disabled={analyzing}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{analyzing ? "Deconstructing Mental Model..." : "Analyze & Begin Investigation"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Misconception Detection Card Output */}
      {detectedMisconception && (
        <div className="p-6 rounded-2xl bg-archaia-dark border border-rose-500/40 shadow-sm space-y-5 animate-in slide-in-from-bottom-4">
          {/* STEP 1 CONTINUATION BANNER */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-[#181a24] to-slate-900 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                  Step 1 of 4 Completed
                </span>
                <span className="text-xs font-semibold text-white">
                  Mental Model Deconstructed
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans">
                A cognitive bug was isolated in <strong>{detectedMisconception.conceptId}</strong>. We must now trace the prerequisite ancestor chain on the Causal DAG to identify the root cause.
              </p>
            </div>

            <button
              onClick={() =>
                router.push(
                  `/bisect?conceptId=${detectedMisconception.conceptId}&misconceptionId=${detectedMisconception.id}`
                )
              }
              className="shrink-0 flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-transform hover:scale-105"
            >
              <Split className="w-4 h-4" />
              <span>Proceed to Step 2: Cognitive Bisect →</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-archaia-border pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                    Misconception Isolated
                  </span>
                  <span className="text-xs font-semibold text-blue-400">
                    Confidence: {detectedMisconception.confidence}%
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {detectedMisconception.name}
                </h3>
              </div>
            </div>

            <Link
              href={`/graph?highlight=${detectedMisconception.conceptId}`}
              className="text-xs text-blue-400 hover:underline font-sans font-medium flex items-center space-x-1"
            >
              <span>View Target on Causal DAG →</span>
            </Link>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            {detectedMisconception.description}
          </p>

          {/* Student Assumption vs Formal Reality Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/60 space-y-2">
              <div className="flex items-center space-x-2 text-rose-400 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Student's Flawed Assumption</span>
              </div>
              <p className="text-xs text-rose-200 leading-relaxed font-sans">
                "{detectedMisconception.studentAssumption}"
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/60 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold">
                <Lightbulb className="w-4 h-4" />
                <span>Formal Computing Reality</span>
              </div>
              <p className="text-xs text-emerald-200 leading-relaxed font-sans">
                {detectedMisconception.formalReality}
              </p>
            </div>
          </div>

          {/* Affected Concepts Identification */}
          <div className="pt-2 border-t border-archaia-border flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 font-sans">
              <span className="text-slate-400">Affected Downstream Concepts:</span>
              <div className="flex flex-wrap gap-1.5">
                {detectedMisconception.affectedConcepts.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded bg-archaia-card border border-archaia-border text-blue-300 text-[11px] font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() =>
                router.push(
                  `/bisect?conceptId=${detectedMisconception.conceptId}&misconceptionId=${detectedMisconception.id}`
                )
              }
              className="text-amber-400 hover:text-amber-300 font-semibold text-xs flex items-center space-x-1"
            >
              <span>Launch Prerequisite Bisect Traversal →</span>
            </button>
          </div>
        </div>
      )}

      {/* Verified Sound Model Output Card */}
      {verifiedResult && (
        <div className="p-6 rounded-2xl bg-archaia-dark border border-emerald-500/40 shadow-sm space-y-5 animate-in slide-in-from-bottom-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-archaia-border pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-sans">
                    Mental Model Invariant Verified
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 font-sans">
                    Mastery: {verifiedResult.masteryScore}%
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5 font-sans">
                  No Cognitive Misconception Detected
                </h3>
              </div>
            </div>

            <Link
              href="/graph"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-transform hover:scale-105"
            >
              <span>View Verified Node on DAG →</span>
            </Link>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {verifiedResult.message}
          </p>

          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs font-sans text-emerald-200">
            <strong>Normalized Formal Reasoning:</strong> {verifiedResult.normalizedReasoning}
          </div>
        </div>
      )}
    </div>
  );
}

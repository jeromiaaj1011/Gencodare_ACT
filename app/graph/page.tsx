"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import KnowledgeGraphCanvas from "@/components/graph/KnowledgeGraphCanvas";
import { Concept, ConceptEdge, LearnerConceptState } from "@/lib/types";
import { Network, Upload, FileText, CheckCircle, RefreshCw, PlayCircle, ArrowRight } from "lucide-react";
import ContentModeBanner from "@/components/mode/ContentModeBanner";

export default function GraphPage() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [edges, setEdges] = useState<ConceptEdge[]>([]);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number; layer: number }>>({});
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 550 });
  const [learnerStates, setLearnerStates] = useState<Record<string, LearnerConceptState>>({});
  const [activeBisect, setActiveBisect] = useState<any>(null);
  const [analyzingDemo, setAnalyzingDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"graph" | "list">("graph");

  // Concept Extraction Form state
  const [showExtractor, setShowExtractor] = useState(false);
  const [syllabusTitle, setSyllabusTitle] = useState("CS 305: Advanced Distributed Algorithms");
  const [syllabusContent, setSyllabusContent] = useState(
    "Module: Graph Algorithms & Memoization\nGraph DFS requires understanding memory allocation and nested call stack activation records. Dynamic programming optimizes recursive tree traversals by storing subproblem states."
  );
  const [extracting, setExtracting] = useState(false);
  const [extractMsg, setExtractMsg] = useState<string | null>(null);

  const fetchGraph = (explicitSessionId?: string) => {
    setLoading(true);
    const targetSessionId =
      explicitSessionId ||
      sessionId ||
      (typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("sessionId") ||
          sessionStorage.getItem("archaia_session_id")
        : null);

    const queryUrl = targetSessionId
      ? `/api/graph?sessionId=${encodeURIComponent(targetSessionId)}`
      : "/api/graph";

    fetch(queryUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setConcepts(data.concepts || []);
          setEdges(data.edges || []);
          setPositions(data.positions || {});
          if (data.canvasSize) setCanvasSize(data.canvasSize);
          setLearnerStates(data.learnerStates || {});
          setActiveBisect(data.activeBisect || null);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  const handleTriggerDemoAnalysis = async () => {
    setAnalyzingDemo(true);
    try {
      setSessionId("demo_dfs");
      fetchGraph("demo_dfs");
    } catch (e) {
      console.error("Demo analysis trigger error:", e);
    } finally {
      setAnalyzingDemo(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlSession = params.get("sessionId");
      if (urlSession) {
        setSessionId(urlSession);
        fetchGraph(urlSession);
        return;
      }
    }
    fetchGraph();
  }, []);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    setExtracting(true);
    try {
      const res = await fetch("/api/extract-concepts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: syllabusTitle,
          content: syllabusContent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setExtractMsg(data.message);
        setTimeout(() => setExtractMsg(null), 4000);
        fetchGraph();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Mode Indicator & Switcher Banner */}
      <ContentModeBanner onModeChange={() => fetchGraph()} />
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Network className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Causal Knowledge Dependency Graph
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            A map of prerequisite skills (DAG). Concepts must be mastered from left to right. When a learner makes a high-level error, we trace backward along the arrows to find the underlying foundational gap.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sessionId === "demo_dfs" && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-600 border border-amber-500/30">
              Demo Investigation DAG
            </span>
          )}

          <button
            onClick={() => setShowExtractor(!showExtractor)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border text-slate-900 text-xs font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>{showExtractor ? "Hide Material Extractor" : "Extract From Material"}</span>
          </button>

          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("graph")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === "graph"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>Canvas View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === "list"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>Accessible List View</span>
            </button>
          </div>

          <button
            onClick={() => fetchGraph()}
            className="p-1.5 rounded-lg bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border text-slate-500 hover:text-slate-900"
            title="Refresh graph"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Course Material Extraction Ingestion Form */}
      {showExtractor && (
        <div className="p-5 rounded-2xl bg-archaia-card border border-archaia-border shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-semibold">
            <FileText className="w-4 h-4" />
            <span>Course Material & Prerequisite Extraction Engine</span>
          </div>
          <p className="text-xs text-slate-500">
            Paste lecture notes, syllabus modules, or textbook excerpts. ARCHAIA extracts key computing concepts, creates prerequisite relationships, and binds them to the DAG.
          </p>

          <form onSubmit={handleExtract} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Syllabus / Course Unit Title:
              </label>
              <input
                type="text"
                value={syllabusTitle}
                onChange={(e) => setSyllabusTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0D1017] border border-archaia-border text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Instructional Text / Material Content:
              </label>
              <textarea
                rows={3}
                value={syllabusContent}
                onChange={(e) => setSyllabusContent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0D1017] border border-archaia-border text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-sans"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={extracting}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm flex items-center space-x-2"
              >
                <span>{extracting ? "Extracting Concepts..." : "Run Concept Extraction & Link DAG"}</span>
              </button>

              {extractMsg && (
                <div className="flex items-center space-x-1.5 text-xs text-emerald-600 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  <span>{extractMsg}</span>
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Main Interactive Graph Canvas or Clean Empty State */}
      {loading ? (
        <div className="h-[480px] rounded-2xl bg-archaia-dark border border-archaia-border flex items-center justify-center">
          <div className="flex items-center space-x-3 text-blue-600 text-xs font-medium">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Computing Hierarchical DAG Layout & Learner Invariants...</span>
          </div>
        </div>
      ) : concepts.length === 0 ? (
        <div className="h-[440px] rounded-2xl bg-archaia-dark border border-archaia-border flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <Network className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-bold text-slate-900">No Active Diagnostic Graph</h3>
            <p className="text-xs text-slate-500 font-sans leading-relaxed">
              Enter any topic in the Cognitive Bug Detector to synthesize a custom concept graph, or launch the benchmark demo investigation.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/detector"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <span>Start New Diagnostic</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => {
                setSessionId("demo_dfs");
                fetchGraph("demo_dfs");
              }}
              className="px-4 py-2.5 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-slate-300 text-slate-600 text-xs font-semibold transition-colors flex items-center space-x-1.5"
            >
              <PlayCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Try Demo Investigation</span>
            </button>
          </div>
        </div>
      ) : viewMode === "list" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm min-h-[440px]">
          <h2 className="font-semibold text-lg text-slate-900 mb-4">Accessible Graph Concepts</h2>
          <div className="space-y-4">
            {concepts.map(concept => {
              const state = learnerStates[concept.id];
              const isMastered = state?.status === "mastered" || state?.status === "recovered";
              const isGap = state?.status === "misconception_detected" || state?.status === "root_gap_identified";
              return (
                <div key={concept.id} className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 flex items-center space-x-2">
                      <span>{concept.title}</span>
                      {isMastered && <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Mastered</span>}
                      {isGap && <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">Gap Detected</span>}
                    </h3>
                    <p className="text-xs text-slate-600 font-sans max-w-2xl">{concept.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <KnowledgeGraphCanvas
          concepts={concepts}
          edges={edges}
          positions={positions}
          canvasSize={canvasSize}
          learnerStates={learnerStates}
          activeBisect={activeBisect}
          onTriggerDemoAnalysis={handleTriggerDemoAnalysis}
          analyzingDemo={analyzingDemo}
        />
      )}
    </div>
  );
}

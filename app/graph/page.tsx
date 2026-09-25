"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import KnowledgeGraphCanvas from "@/components/graph/KnowledgeGraphCanvas";
import { Concept, ConceptEdge, LearnerConceptState } from "@/lib/types";
import { Network, Upload, FileText, CheckCircle, RefreshCw, PlayCircle, ArrowRight } from "lucide-react";

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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Network className="w-5 h-5 text-blue-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Causal Knowledge Dependency Graph
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ontological Directed Acyclic Graph (DAG) modeling prerequisite causality. Nodes represent concepts; edges represent invariant dependency chains.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sessionId === "demo_dfs" && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Demo Investigation DAG
            </span>
          )}

          <button
            onClick={() => setShowExtractor(!showExtractor)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border text-white text-xs font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>{showExtractor ? "Hide Material Extractor" : "Extract From Material"}</span>
          </button>

          <button
            onClick={() => fetchGraph()}
            className="p-1.5 rounded-lg bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border text-slate-400 hover:text-white"
            title="Refresh graph"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Course Material Extraction Ingestion Form */}
      {showExtractor && (
        <div className="p-5 rounded-2xl bg-archaia-card border border-archaia-border shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold">
            <FileText className="w-4 h-4" />
            <span>Course Material & Prerequisite Extraction Engine</span>
          </div>
          <p className="text-xs text-slate-400">
            Paste lecture notes, syllabus modules, or textbook excerpts. ARCHAIA extracts key computing concepts, creates prerequisite relationships, and binds them to the DAG.
          </p>

          <form onSubmit={handleExtract} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Syllabus / Course Unit Title:
              </label>
              <input
                type="text"
                value={syllabusTitle}
                onChange={(e) => setSyllabusTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0D1017] border border-archaia-border text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Instructional Text / Material Content:
              </label>
              <textarea
                rows={3}
                value={syllabusContent}
                onChange={(e) => setSyllabusContent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0D1017] border border-archaia-border text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
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
                <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium">
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
          <div className="flex items-center space-x-3 text-blue-400 text-xs font-medium">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Computing Hierarchical DAG Layout & Learner Invariants...</span>
          </div>
        </div>
      ) : concepts.length === 0 ? (
        <div className="h-[440px] rounded-2xl bg-archaia-dark border border-archaia-border flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Network className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-bold text-white">No Active Diagnostic Graph</h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
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
              className="px-4 py-2.5 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center space-x-1.5"
            >
              <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Try Demo Investigation</span>
            </button>
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

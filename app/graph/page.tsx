"use client";

import { useEffect, useState } from "react";
import KnowledgeGraphCanvas from "@/components/graph/KnowledgeGraphCanvas";
import { Concept, ConceptEdge, LearnerConceptState } from "@/lib/types";
import { Network, Upload, FileText, CheckCircle, RefreshCw } from "lucide-react";

export default function GraphPage() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [edges, setEdges] = useState<ConceptEdge[]>([]);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number; layer: number }>>({});
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 550 });
  const [learnerStates, setLearnerStates] = useState<Record<string, LearnerConceptState>>({});
  const [loading, setLoading] = useState(true);

  // Concept Extraction Form state
  const [showExtractor, setShowExtractor] = useState(false);
  const [syllabusTitle, setSyllabusTitle] = useState("CS 305: Advanced Distributed Algorithms");
  const [syllabusContent, setSyllabusContent] = useState(
    "Module: Graph Algorithms & Memoization\nGraph DFS requires understanding memory allocation and nested call stack activation records. Dynamic programming optimizes recursive tree traversals by storing subproblem states."
  );
  const [extracting, setExtracting] = useState(false);
  const [extractMsg, setExtractMsg] = useState<string | null>(null);

  const fetchGraph = () => {
    setLoading(true);
    fetch("/api/graph")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setConcepts(data.concepts);
          setEdges(data.edges);
          setPositions(data.positions);
          setCanvasSize(data.canvasSize);
          setLearnerStates(data.learnerStates);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
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
            <Network className="w-5 h-5 text-cyan-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Causal Knowledge Dependency Graph
            </h1>
          </div>
          <p className="text-xs text-archaia-muted mt-1">
            Ontological Directed Acyclic Graph (DAG) modeling prerequisite causality. Nodes represent concepts; edges represent invariant dependency chains.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowExtractor(!showExtractor)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border text-white text-xs font-mono transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showExtractor ? "Hide Material Extractor" : "Extract From Course Material"}</span>
          </button>

          <button
            onClick={fetchGraph}
            className="p-1.5 rounded-lg bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border text-archaia-muted hover:text-white"
            title="Refresh graph"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Course Material Extraction Ingestion Form */}
      {showExtractor && (
        <div className="p-5 rounded-2xl bg-archaia-card border border-indigo-500/40 shadow-glow space-y-4 animate-in fade-in">
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-mono font-semibold">
            <FileText className="w-4 h-4" />
            <span>Course Material & Concept Extraction Pipeline (Feature 1 & 9)</span>
          </div>
          <p className="text-xs text-archaia-muted">
            Paste lecture notes, syllabus modules, or textbook excerpts. ARCHAIA extracts key computing concepts, creates prerequisite relationships, and binds them to the DAG.
          </p>

          <form onSubmit={handleExtract} className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-archaia-muted mb-1">
                Syllabus / Course Unit Title:
              </label>
              <input
                type="text"
                value={syllabusTitle}
                onChange={(e) => setSyllabusTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-archaia-dark border border-archaia-border text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-archaia-muted mb-1">
                Instructional Text / Material Content:
              </label>
              <textarea
                rows={3}
                value={syllabusContent}
                onChange={(e) => setSyllabusContent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-archaia-dark border border-archaia-border text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={extracting}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow flex items-center space-x-2"
              >
                <span>{extracting ? "Extracting Concepts..." : "Run Concept Extraction & Link DAG"}</span>
              </button>

              {extractMsg && (
                <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-mono">
                  <CheckCircle className="w-4 h-4" />
                  <span>{extractMsg}</span>
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Main Interactive Graph Canvas */}
      {loading ? (
        <div className="h-[480px] rounded-2xl bg-archaia-dark border border-archaia-border flex items-center justify-center">
          <div className="flex items-center space-x-3 text-cyan-400 font-mono text-xs">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Computing Hierarchical DAG Layout & Learner Invariants...</span>
          </div>
        </div>
      ) : (
        <KnowledgeGraphCanvas
          concepts={concepts}
          edges={edges}
          positions={positions}
          canvasSize={canvasSize}
          learnerStates={learnerStates}
        />
      )}
    </div>
  );
}

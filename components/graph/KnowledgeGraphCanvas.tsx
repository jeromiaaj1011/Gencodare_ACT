"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Concept, ConceptEdge, LearnerConceptState } from "@/lib/types";
import {
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Layers,
  Cpu,
  GitBranch,
  Network,
  Split,
  HeartPulse,
  Play,
  HelpCircle,
  Eye,
  Activity,
  X,
  Compass,
} from "lucide-react";

interface CanvasProps {
  concepts: Concept[];
  edges: ConceptEdge[];
  positions: Record<string, { x: number; y: number; layer: number }>;
  canvasSize: { width: number; height: number };
  learnerStates: Record<string, LearnerConceptState>;
  activeBisect?: any;
  onSelectConcept?: (concept: Concept) => void;
  onTriggerDemoAnalysis?: () => void;
  analyzingDemo?: boolean;
}

export default function KnowledgeGraphCanvas({
  concepts,
  edges,
  positions: initialPositions,
  canvasSize,
  learnerStates,
  activeBisect,
  onSelectConcept,
  onTriggerDemoAnalysis,
  analyzingDemo = false,
}: CanvasProps) {
  const router = useRouter();
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number; layer: number }>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("graph_traversal");
  const [hoveredEdge, setHoveredEdge] = useState<ConceptEdge | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [viewFilter, setViewFilter] = useState<"all" | "causal_trace" | "mastery">("all");

  // Dragging state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Initialize node positions
  useEffect(() => {
    if (initialPositions && Object.keys(initialPositions).length > 0) {
      setNodePositions(initialPositions);
    }
  }, [initialPositions]);

  const selectedConcept = concepts.find((c) => c.id === selectedNodeId);

  // Determine analysis-based statuses
  const observedErrorNodeId = activeBisect?.targetConceptId || "graph_traversal";
  const likelyRootGapId = activeBisect?.likelyRootGapId || "call_stack";
  const ancestorChain: string[] = activeBisect?.ancestorChain || [
    "memory_allocation",
    "functions_context",
    "call_stack",
    "recursion",
    "tree_traversal",
    "graph_traversal",
  ];

  const getNodeStatus = (conceptId: string) => {
    // 1. Direct state from learnerStates
    const state = learnerStates[conceptId];
    if (state?.status === "recovered" || state?.status === "mastered") return "mastered";
    if (state?.status === "root_gap_identified") return "root_gap_identified";
    if (state?.status === "misconception_detected") return "misconception_detected";

    // 2. Active bisect state
    if (conceptId === likelyRootGapId && (activeBisect?.status === "concluded" || activeBisect?.likelyRootGapId === conceptId)) {
      return "root_gap_identified";
    }
    if (conceptId === observedErrorNodeId && activeBisect) {
      return "misconception_detected";
    }
    if (ancestorChain.includes(conceptId)) {
      if (conceptId === "memory_allocation" || conceptId === "functions_context") return "mastered";
      return "in_causal_path";
    }

    return "untested";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "mastered":
        return {
          bg: "bg-[#06261E]/95",
          border: "border-emerald-500/70",
          glow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
          text: "text-emerald-300",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          halo: "#10B981",
          label: "Mastered Invariant",
        };
      case "misconception_detected":
        return {
          bg: "bg-[#2A0812]/95",
          border: "border-rose-500",
          glow: "shadow-[0_0_25px_rgba(244,63,94,0.55)]",
          text: "text-rose-300",
          badge: "bg-rose-500/25 text-rose-300 border-rose-500/50",
          halo: "#F43F5E",
          label: "Observed Bug",
        };
      case "root_gap_identified":
        return {
          bg: "bg-[#2A1805]/95",
          border: "border-amber-400",
          glow: "shadow-[0_0_30px_rgba(245,158,11,0.6)]",
          text: "text-amber-200",
          badge: "bg-amber-500/25 text-amber-200 border-amber-400/60",
          halo: "#F59E0B",
          label: "Likely Root Gap",
        };
      case "in_causal_path":
        return {
          bg: "bg-[#111C3D]/95",
          border: "border-indigo-400/80",
          glow: "shadow-[0_0_20px_rgba(99,102,241,0.35)]",
          text: "text-indigo-300",
          badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
          halo: "#6366F1",
          label: "Causal Pre-req",
        };
      default:
        return {
          bg: "bg-[#091124]/90",
          border: "border-slate-700/80",
          glow: "",
          text: "text-slate-300",
          badge: "bg-slate-800/80 text-slate-400 border-slate-700",
          halo: "#64748B",
          label: "Untested",
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Foundations":
        return Cpu;
      case "Architecture":
        return Layers;
      case "Data Structures":
        return GitBranch;
      case "Algorithms":
        return Network;
      case "Advanced Algorithms":
        return Sparkles;
      default:
        return Compass;
    }
  };

  // Node Dragging Handlers
  const handleMouseDownNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (!svgRef.current) return;
    const currentPos = nodePositions[nodeId] || initialPositions[nodeId];
    if (!currentPos) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - svgRect.left) / scale;
    const mouseY = (e.clientY - svgRect.top) / scale;

    setDraggingNodeId(nodeId);
    setDragOffset({
      x: mouseX - currentPos.x,
      y: mouseY - currentPos.y,
    });
    setSelectedNodeId(nodeId);
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (!draggingNodeId || !svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - svgRect.left) / scale;
    const mouseY = (e.clientY - svgRect.top) / scale;

    const newX = Math.max(80, Math.min(canvasSize.width - 80, mouseX - dragOffset.x));
    const newY = Math.max(60, Math.min(canvasSize.height - 60, mouseY - dragOffset.y));

    setNodePositions((prev) => ({
      ...prev,
      [draggingNodeId]: {
        ...prev[draggingNodeId],
        x: newX,
        y: newY,
      },
    }));
  };

  const handleMouseUpCanvas = () => {
    setDraggingNodeId(null);
  };

  // Check if an edge is part of the active cognitive bisect causal path
  const isCausalTraceEdge = (edge: ConceptEdge) => {
    // Ancestor causal path: memory -> functions -> call_stack -> recursion -> tree -> graph
    const traceEdges = [
      ["memory_allocation", "functions_context"],
      ["functions_context", "call_stack"],
      ["call_stack", "recursion"],
      ["recursion", "tree_traversal"],
      ["tree_traversal", "graph_traversal"],
    ];
    return traceEdges.some(([from, to]) => edge.from === from && edge.to === to);
  };

  const isEdgeHighlighted = (edge: ConceptEdge) => {
    if (viewFilter === "causal_trace") {
      return isCausalTraceEdge(edge);
    }
    return (
      isCausalTraceEdge(edge) ||
      (selectedNodeId && (edge.from === selectedNodeId || edge.to === selectedNodeId))
    );
  };

  // Node dimensions for crisp card drawing
  const nodeWidth = 195;
  const nodeHeight = 84;

  return (
    <div className="relative w-full rounded-3xl bg-[#050B18] border border-archaia-border overflow-hidden shadow-2xl space-y-0">
      {/* 1. TOP DIAGNOSTIC ANALYSIS COCKPIT RIBBON */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#070D1C] via-[#0B1530] to-[#070D1C] border-b border-archaia-border/90 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Active Analysis Summary */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Live Diagnostic Analysis Active</span>
            </span>
            <span className="text-xs font-mono text-cyan-300">
              Causal Fault Isolation: <strong className="text-white">DFS Context Replacement</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
            <span className="text-slate-400">Analysis Breakdown:</span>
            <span className="px-2 py-0.5 rounded bg-rose-950/70 border border-rose-800 text-rose-200 text-[11px] font-mono">
              Observed: Graph Traversal
            </span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span className="px-2 py-0.5 rounded bg-indigo-950/70 border border-indigo-800 text-indigo-200 text-[11px] font-mono">
              Trace: 4 Ancestor Hops
            </span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600 text-amber-200 text-[11px] font-mono font-bold flex items-center space-x-1">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Root Gap: Call Stack & LIFO (95% Evidence)</span>
            </span>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {onTriggerDemoAnalysis && (
            <button
              onClick={onTriggerDemoAnalysis}
              disabled={analyzingDemo}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-semibold transition-all shadow-glow"
              title="Re-run student DFS analysis on graph"
            >
              <Play className="w-3 h-3" />
              <span>{analyzingDemo ? "Analyzing..." : "Re-Run Analysis"}</span>
            </button>
          )}

          <Link
            href="/bisect"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-slate-700 text-amber-300 transition-colors"
          >
            <Split className="w-3.5 h-3.5" />
            <span>Open Bisect</span>
          </Link>

          <Link
            href="/recovery"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-slate-700 text-emerald-300 transition-colors"
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Recovery Lab</span>
          </Link>
        </div>
      </div>

      {/* 2. SUB-BAR: FILTERS, ZOOM & LEGEND */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 border-b border-archaia-border/70 bg-[#070D1C]/60 text-xs font-mono gap-3">
        {/* View Mode Filters */}
        <div className="flex items-center space-x-1">
          <span className="text-slate-400 mr-2 text-[11px]">View Mode:</span>
          {[
            { id: "all", label: "Full Graph" },
            { id: "causal_trace", label: "Causal Analysis Trace" },
            { id: "mastery", label: "Mastery Heatmap" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewFilter(tab.id as any)}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                viewFilter === tab.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Legend Pills */}
        <div className="hidden md:flex items-center space-x-3 text-[11px]">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-slate-300">Observed Bug</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-slate-300">Root Learning Gap</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
            <span className="text-slate-300">Causal Pre-req</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Mastered</span>
          </div>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setScale((s) => Math.max(0.65, s - 0.1))}
            className="p-1 rounded bg-archaia-card hover:bg-archaia-cardHover text-slate-300 hover:text-white"
            title="Zoom out"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] text-slate-400 px-1">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(1.4, s + 0.1))}
            className="p-1 rounded bg-archaia-card hover:bg-archaia-cardHover text-slate-300 hover:text-white"
            title="Zoom in"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setScale(1);
              setNodePositions(initialPositions);
            }}
            className="p-1 rounded bg-archaia-card hover:bg-archaia-cardHover text-slate-300 hover:text-white ml-1"
            title="Reset zoom & layout"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. MAIN SVG GRAPH CANVAS */}
      <div
        className="relative w-full overflow-hidden min-h-[580px] select-none bg-[radial-gradient(#152243_1px,transparent_1px)] [background-size:24px_24px] cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMoveCanvas}
        onMouseUp={handleMouseUpCanvas}
      >
        {/* Watermark Helper Text */}
        <div className="absolute bottom-3 left-4 pointer-events-none text-[11px] font-mono text-slate-500/80 z-0">
          Tip: Click any concept to inspect diagnostic telemetry • Drag nodes freely to customize topology
        </div>

        {/* Hovered Edge Rationale Glass Badge */}
        {hoveredEdge && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-xl p-3.5 rounded-2xl bg-[#091124]/95 border border-cyan-500/50 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-md text-xs font-sans animate-in fade-in">
            <div className="flex items-center space-x-2 text-cyan-400 font-mono font-semibold text-[11px] uppercase mb-1">
              <span>Causal Dependency Rationale:</span>
              <span className="text-white">
                {hoveredEdge.from} ➔ {hoveredEdge.to}
              </span>
            </div>
            <p className="text-slate-200 text-xs leading-relaxed font-mono">
              "{hoveredEdge.rationale}"
            </p>
          </div>
        )}

        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            transition: draggingNodeId ? "none" : "transform 0.2s ease",
          }}
          className="w-full h-full flex items-center justify-center p-6"
        >
          <svg
            ref={svgRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="overflow-visible"
          >
            <defs>
              {/* Laser Trace Gradient for Active Causal Analysis */}
              <linearGradient id="activeLaserGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="50%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>

              {/* Standard Prerequisite Gradient */}
              <linearGradient id="standardEdgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.7" />
              </linearGradient>

              {/* Arrowheads */}
              <marker id="arrowStandard" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
                <polygon points="0 0.5, 8 3.5, 0 6.5" fill="#38BDF8" opacity="0.8" />
              </marker>

              <marker id="arrowActiveCausal" markerWidth="11" markerHeight="9" refX="9" refY="4.5" orient="auto">
                <polygon points="0 0.5, 10 4.5, 0 8.5" fill="#F59E0B" />
              </marker>

              {/* Drop Shadow Filter for Rich Glass Node Cards */}
              <filter id="nodeCardShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000000" floodOpacity="0.7" />
              </filter>
            </defs>

            {/* EDGES LAYER */}
            {edges.map((edge) => {
              const start = nodePositions[edge.from] || initialPositions[edge.from];
              const end = nodePositions[edge.to] || initialPositions[edge.to];
              if (!start || !end) return null;

              const isCausal = isCausalTraceEdge(edge);
              const isDimmed = viewFilter === "causal_trace" && !isCausal;

              // Cubic Bézier calculation
              const dx = end.x - start.x;
              const dy = end.y - start.y;
              const cx1 = start.x + dx * 0.45;
              const cy1 = start.y + dy * 0.05;
              const cx2 = start.x + dx * 0.55;
              const cy2 = end.y - dy * 0.05;

              const pathData = `M ${start.x} ${start.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${end.x} ${end.y}`;

              return (
                <g
                  key={`${edge.from}->${edge.to}`}
                  className={`cursor-pointer transition-opacity duration-300 ${isDimmed ? "opacity-15" : "opacity-100"}`}
                  onMouseEnter={() => setHoveredEdge(edge)}
                  onMouseLeave={() => setHoveredEdge(null)}
                >
                  {/* Invisible wide hover target */}
                  <path d={pathData} fill="none" stroke="transparent" strokeWidth="26" />

                  {/* Outer Glow Path for Causal Trace */}
                  {isCausal && (
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="6"
                      strokeOpacity="0.3"
                      className="animate-pulse"
                    />
                  )}

                  {/* Main Visible Path */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={isCausal ? "url(#activeLaserGradient)" : "url(#standardEdgeGradient)"}
                    strokeWidth={isCausal ? "3.2" : "1.8"}
                    strokeDasharray={isCausal ? "8 4" : undefined}
                    className={isCausal ? "animate-[dash_1.2s_linear_infinite]" : "hover:stroke-cyan-300 transition-colors"}
                    markerEnd={isCausal ? "url(#arrowActiveCausal)" : "url(#arrowStandard)"}
                  />

                  {/* Active Laser Flow Particle on Causal Trace */}
                  {isCausal && (
                    <circle r="4.5" fill="#F59E0B">
                      <animateMotion dur="2.4s" repeatCount="indefinite" path={pathData} />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* NODES LAYER */}
            {concepts.map((concept) => {
              const pos = nodePositions[concept.id] || initialPositions[concept.id];
              if (!pos) return null;

              const status = getNodeStatus(concept.id);
              const colorInfo = getStatusColor(status);
              const isSelected = selectedNodeId === concept.id;
              const isHovered = hoveredNodeId === concept.id;
              const CategoryIcon = getCategoryIcon(concept.category);
              const mastery = learnerStates[concept.id]?.masteryScore || 0;
              const isDimmed = viewFilter === "causal_trace" && status === "untested";

              const isRootGap = status === "root_gap_identified";
              const isObservedError = status === "misconception_detected";

              return (
                <g
                  key={concept.id}
                  transform={`translate(${pos.x - nodeWidth / 2}, ${pos.y - nodeHeight / 2})`}
                  className={`cursor-pointer transition-opacity duration-300 ${isDimmed ? "opacity-25" : "opacity-100"}`}
                  onMouseDown={(e) => handleMouseDownNode(e, concept.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(concept.id);
                    if (onSelectConcept) onSelectConcept(concept);
                  }}
                  onMouseEnter={() => setHoveredNodeId(concept.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  {/* Outer Pulsing Radiation Halo for Observed Error */}
                  {isObservedError && (
                    <rect
                      x="-8"
                      y="-8"
                      width={nodeWidth + 16}
                      height={nodeHeight + 16}
                      rx="22"
                      fill="none"
                      stroke="#F43F5E"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className="animate-ping opacity-75"
                    />
                  )}

                  {/* Outer Rotating Target Halo for Root Gap */}
                  {isRootGap && (
                    <rect
                      x="-7"
                      y="-7"
                      width={nodeWidth + 14}
                      height={nodeHeight + 14}
                      rx="20"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      className="animate-[spin_10s_linear_infinite]"
                      style={{ transformOrigin: `${nodeWidth / 2}px ${nodeHeight / 2}px` }}
                    />
                  )}

                  {/* Main Node Glass Card */}
                  <rect
                    width={nodeWidth}
                    height={nodeHeight}
                    rx="16"
                    fill={
                      isObservedError
                        ? "#230810"
                        : isRootGap
                        ? "#221304"
                        : status === "mastered"
                        ? "#051C15"
                        : status === "in_causal_path"
                        ? "#0C1733"
                        : "#081022"
                    }
                    stroke={
                      isSelected
                        ? "#38BDF8"
                        : isObservedError
                        ? "#F43F5E"
                        : isRootGap
                        ? "#F59E0B"
                        : status === "mastered"
                        ? "#10B981"
                        : status === "in_causal_path"
                        ? "#6366F1"
                        : "#334155"
                    }
                    strokeWidth={isSelected ? "2.5" : isObservedError || isRootGap ? "2" : "1.2"}
                    filter="url(#nodeCardShadow)"
                    className="transition-all duration-200"
                  />

                  {/* Top Status Banner Ribbon */}
                  <rect
                    x="0"
                    y="0"
                    width={nodeWidth}
                    height="22"
                    rx="16"
                    fill={
                      isObservedError
                        ? "rgba(244,63,94,0.25)"
                        : isRootGap
                        ? "rgba(245,158,11,0.25)"
                        : status === "mastered"
                        ? "rgba(16,185,129,0.2)"
                        : status === "in_causal_path"
                        ? "rgba(99,102,241,0.2)"
                        : "rgba(30,41,59,0.5)"
                    }
                  />

                  {/* Category Chip & Status Badge */}
                  <text
                    x="12"
                    y="15"
                    fill={
                      isObservedError
                        ? "#FDA4AF"
                        : isRootGap
                        ? "#FDE68A"
                        : status === "mastered"
                        ? "#A7F3D0"
                        : status === "in_causal_path"
                        ? "#C7D2FE"
                        : "#94A3B8"
                    }
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="700"
                    letterSpacing="0.05em"
                  >
                    {isObservedError
                      ? "● OBSERVED ERROR"
                      : isRootGap
                      ? "★ LIKELY ROOT GAP"
                      : status === "mastered"
                      ? "✓ MASTERED"
                      : status === "in_causal_path"
                      ? "▲ CAUSAL PATH"
                      : concept.category.toUpperCase()}
                  </text>

                  {/* Mastery Score Badge on Card Header */}
                  <text
                    x={nodeWidth - 12}
                    y="15"
                    textAnchor="end"
                    fill={mastery >= 80 ? "#34D399" : mastery >= 50 ? "#FBBF24" : "#94A3B8"}
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {mastery}%
                  </text>

                  {/* Concept Name */}
                  <text
                    x="12"
                    y="45"
                    fill="#FFFFFF"
                    fontSize="12.5"
                    fontFamily="sans-serif"
                    fontWeight="600"
                  >
                    {concept.name.length > 22 ? concept.name.substring(0, 20) + "…" : concept.name}
                  </text>

                  {/* Difficulty & Estimated Time Sub-label */}
                  <text
                    x="12"
                    y="63"
                    fill="#94A3B8"
                    fontSize="10"
                    fontFamily="sans-serif"
                  >
                    {concept.difficulty.toUpperCase()} • ~{concept.estimatedMinutes}m
                  </text>

                  {/* Mini Mastery Meter Bar at Card Bottom */}
                  <rect
                    x="12"
                    y="72"
                    width={nodeWidth - 24}
                    height="3.5"
                    rx="1.75"
                    fill="#1E293B"
                  />
                  <rect
                    x="12"
                    y="72"
                    width={((nodeWidth - 24) * mastery) / 100}
                    height="3.5"
                    rx="1.75"
                    fill={
                      status === "mastered"
                        ? "#10B981"
                        : isObservedError
                        ? "#F43F5E"
                        : isRootGap
                        ? "#F59E0B"
                        : "#38BDF8"
                    }
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 4. BOTTOM INTERACTIVE CONCEPT INSPECTION DRAWER */}
      {selectedConcept && (
        <div className="p-5 sm:p-6 bg-gradient-to-b from-[#081022] to-[#050A17] border-t border-archaia-border animate-in slide-in-from-bottom-2">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            {/* Concept Overview */}
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {selectedConcept.category}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
                  {selectedConcept.difficulty.toUpperCase()}
                </span>
                <span className="text-xs font-mono text-cyan-400">
                  Est. Study: ~{selectedConcept.estimatedMinutes} min
                </span>

                {selectedConcept.id === likelyRootGapId && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Likely Root Learning Gap</span>
                  </span>
                )}

                {selectedConcept.id === observedErrorNodeId && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Observed Misconception Symptom</span>
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {selectedConcept.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  {selectedConcept.description}
                </p>
              </div>

              {/* Diagnostic Invariant Assessment Details */}
              {selectedConcept.id === observedErrorNodeId && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs font-sans space-y-1">
                  <div className="text-rose-300 font-semibold font-mono flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Observed Misconception on this Concept:</span>
                  </div>
                  <p className="text-rose-200/90 leading-relaxed font-mono">
                    Learner believed calling recursive child functions destroys or overwrites the current invocation frame in memory.
                  </p>
                </div>
              )}

              {selectedConcept.id === likelyRootGapId && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-900/60 text-xs font-sans space-y-1">
                  <div className="text-amber-300 font-semibold font-mono flex items-center space-x-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Why this is the Foundational Root Gap:</span>
                  </div>
                  <p className="text-amber-200/90 leading-relaxed font-mono">
                    Cognitive Bisect isolated that the student never internalized that Call Stack frames exist independently in LIFO memory. Without this physical invariant, recursive algorithms appear to overwrite parent scope.
                  </p>
                </div>
              )}
            </div>

            {/* Diagnostic Actions & Prerequisite Inspector */}
            <div className="space-y-4 shrink-0 lg:w-80">
              <div className="p-4 rounded-2xl bg-[#091124] border border-slate-800 space-y-2.5 text-xs font-mono">
                <span className="text-slate-400 block font-semibold text-[11px] uppercase tracking-wider">
                  Causal Relational Mapping
                </span>
                <div>
                  <span className="text-slate-500 block text-[10px]">Prerequisite Concepts:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedConcept.prerequisites.length > 0 ? (
                      selectedConcept.prerequisites.map((p) => (
                        <button
                          key={p}
                          onClick={() => setSelectedNodeId(p)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] border border-slate-700"
                        >
                          {p}
                        </button>
                      ))
                    ) : (
                      <span className="text-slate-500 text-[11px]">None (Foundational Root)</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Current Learner Mastery:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${learnerStates[selectedConcept.id]?.masteryScore || 0}%` }}
                        className="h-full bg-cyan-400 rounded-full"
                      />
                    </div>
                    <span className="text-white font-bold text-xs">
                      {learnerStates[selectedConcept.id]?.masteryScore || 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Link
                  href="/bisect"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs transition-all flex items-center justify-center space-x-1.5 shadow-glowWarning"
                >
                  <Split className="w-3.5 h-3.5" />
                  <span>Execute Cognitive Bisect on this Node</span>
                </Link>

                <Link
                  href={`/recovery?conceptId=${selectedConcept.id}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-slate-700 text-white font-semibold text-xs transition-all flex items-center justify-center space-x-1.5"
                >
                  <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Open Targeted Recovery Lab</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

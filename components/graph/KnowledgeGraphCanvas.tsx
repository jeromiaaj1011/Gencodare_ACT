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
          bg: "bg-[#0E1F18]/95",
          border: "border-emerald-600/70",
          text: "text-emerald-300",
          badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
          halo: "#10B981",
          label: "Mastered Invariant",
        };
      case "misconception_detected":
        return {
          bg: "bg-[#201216]/95",
          border: "border-rose-600/80",
          text: "text-rose-300",
          badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
          halo: "#E11D48",
          label: "Observed Bug",
        };
      case "root_gap_identified":
        return {
          bg: "bg-[#22180E]/95",
          border: "border-amber-500/80",
          text: "text-amber-200",
          badge: "bg-amber-500/15 text-amber-200 border-amber-500/30",
          halo: "#F59E0B",
          label: "Likely Root Gap",
        };
      case "in_causal_path":
        return {
          bg: "bg-[#121828]/95",
          border: "border-blue-500/60",
          text: "text-blue-300",
          badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
          halo: "#3B82F6",
          label: "Causal Pre-req",
        };
      default:
        return {
          bg: "bg-[#181C26]/95",
          border: "border-[#282E3D]",
          text: "text-slate-300",
          badge: "bg-slate-800 text-slate-400 border-slate-700",
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
    <div className="relative w-full rounded-2xl bg-[#0E1117] border border-[#282E3D] overflow-hidden shadow-xl space-y-0">
      {/* 1. TOP DIAGNOSTIC ANALYSIS COCKPIT RIBBON */}
      <div className="p-4 sm:p-5 bg-[#141722] border-b border-[#282E3D] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Active Analysis Summary */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Live Diagnostic Analysis Active</span>
            </span>
            <span className="text-xs text-blue-400 font-medium">
              Causal Fault Isolation: <strong className="text-white">DFS Context Replacement</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
            <span className="text-slate-400 font-medium">Analysis Breakdown:</span>
            <span className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800 text-rose-200 text-[11px] font-medium">
              Observed: Graph Traversal
            </span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-200 text-[11px] font-medium">
              Trace: 4 Ancestor Hops
            </span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span className="px-2 py-0.5 rounded bg-amber-950/70 border border-amber-600/70 text-amber-200 text-[11px] font-semibold flex items-center space-x-1">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Root Gap: Call Stack & LIFO (95% Evidence)</span>
            </span>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
          {onTriggerDemoAnalysis && (
            <button
              onClick={onTriggerDemoAnalysis}
              disabled={analyzingDemo}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium transition-all shadow-sm"
              title="Re-run student DFS analysis on graph"
            >
              <Play className="w-3 h-3" />
              <span>{analyzingDemo ? "Analyzing..." : "Re-Run Analysis"}</span>
            </button>
          )}

          <Link
            href="/bisect"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#181C26] hover:bg-[#202533] border border-[#282E3D] text-amber-300 font-medium transition-colors"
          >
            <Split className="w-3.5 h-3.5" />
            <span>Open Bisect</span>
          </Link>

          <Link
            href="/recovery"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#181C26] hover:bg-[#202533] border border-[#282E3D] text-emerald-300 font-medium transition-colors"
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Recovery Lab</span>
          </Link>
        </div>
      </div>

      {/* 2. SUB-BAR: FILTERS, ZOOM & LEGEND */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-[#282E3D] bg-[#12151C] text-xs font-sans gap-3">
        {/* View Mode Filters */}
        <div className="flex items-center space-x-1">
          <span className="text-slate-400 mr-2 text-[11px] font-medium">View Mode:</span>
          {[
            { id: "all", label: "Full Graph" },
            { id: "causal_trace", label: "Causal Analysis Trace" },
            { id: "mastery", label: "Mastery Heatmap" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewFilter(tab.id as any)}
              className={`px-2.5 py-1 rounded-md text-[11px] transition-all font-medium ${
                viewFilter === tab.id
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Legend Pills */}
        <div className="hidden md:flex items-center space-x-3 text-[11px] font-medium">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-300">Observed Bug</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-300">Root Learning Gap</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-300">Causal Pre-req</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Mastered</span>
          </div>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setScale((s) => Math.max(0.65, s - 0.1))}
            className="p-1 rounded bg-[#181C26] hover:bg-[#202533] border border-[#282E3D] text-slate-300 hover:text-white"
            title="Zoom out"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] text-slate-400 px-1 font-medium">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(1.4, s + 0.1))}
            className="p-1 rounded bg-[#181C26] hover:bg-[#202533] border border-[#282E3D] text-slate-300 hover:text-white"
            title="Zoom in"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setScale(1);
              setNodePositions(initialPositions);
            }}
            className="p-1 rounded bg-[#181C26] hover:bg-[#202533] border border-[#282E3D] text-slate-300 hover:text-white ml-1"
            title="Reset zoom & layout"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. MAIN SVG GRAPH CANVAS */}
      <div
        className="relative w-full overflow-hidden min-h-[580px] select-none bg-[radial-gradient(#282E3D_1px,transparent_1px)] [background-size:24px_24px] cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMoveCanvas}
        onMouseUp={handleMouseUpCanvas}
      >
        {/* Watermark Helper Text */}
        <div className="absolute bottom-3 left-4 pointer-events-none text-[11px] font-sans text-slate-500 z-0">
          Tip: Click any concept to inspect diagnostic analysis • Drag nodes freely to customize layout
        </div>

        {/* Hovered Edge Rationale Card */}
        {hoveredEdge && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-xl p-3.5 rounded-xl bg-[#141722]/98 border border-[#282E3D] shadow-xl backdrop-blur-md text-xs font-sans animate-in fade-in">
            <div className="flex items-center space-x-2 text-blue-400 font-semibold text-[11px] uppercase mb-1">
              <span>Causal Dependency Rationale:</span>
              <span className="text-white">
                {hoveredEdge.from} ➔ {hoveredEdge.to}
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed font-sans">
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
              {/* Arrowheads */}
              <marker id="arrowStandard" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0.5, 7 3, 0 5.5" fill="#475569" opacity="0.9" />
              </marker>

              <marker id="arrowActiveCausal" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
                <polygon points="0 0.5, 8 3.5, 0 6.5" fill="#3B82F6" />
              </marker>
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
                  <path d={pathData} fill="none" stroke="transparent" strokeWidth="24" />

                  {/* Main Visible Path */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={isCausal ? "#3B82F6" : "#334155"}
                    strokeWidth={isCausal ? "2.5" : "1.6"}
                    strokeDasharray={isCausal ? "6 3" : undefined}
                    markerEnd={isCausal ? "url(#arrowActiveCausal)" : "url(#arrowStandard)"}
                  />

                  {/* Smooth particle indicator along causal trace */}
                  {isCausal && (
                    <circle r="3.5" fill="#F59E0B">
                      <animateMotion dur="2.8s" repeatCount="indefinite" path={pathData} />
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
                  {/* Subtle Accent Outline for Key Nodes */}
                  {isObservedError && (
                    <rect
                      x="-4"
                      y="-4"
                      width={nodeWidth + 8}
                      height={nodeHeight + 8}
                      rx="18"
                      fill="none"
                      stroke="#E11D48"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      className="opacity-75"
                    />
                  )}

                  {isRootGap && (
                    <rect
                      x="-4"
                      y="-4"
                      width={nodeWidth + 8}
                      height={nodeHeight + 8}
                      rx="18"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="1.8"
                    />
                  )}

                  {/* Main Node Card */}
                  <rect
                    width={nodeWidth}
                    height={nodeHeight}
                    rx="14"
                    fill={
                      isObservedError
                        ? "#201216"
                        : isRootGap
                        ? "#22180E"
                        : status === "mastered"
                        ? "#0E1F18"
                        : status === "in_causal_path"
                        ? "#121828"
                        : "#181C26"
                    }
                    stroke={
                      isSelected
                        ? "#FFFFFF"
                        : isHovered
                        ? "#3B82F6"
                        : isObservedError
                        ? "#E11D48"
                        : isRootGap
                        ? "#F59E0B"
                        : status === "mastered"
                        ? "#10B981"
                        : status === "in_causal_path"
                        ? "#3B82F6"
                        : "#282E3D"
                    }
                    strokeWidth={isSelected ? "2" : "1.2"}
                  />

                  {/* Top Status Header inside Card */}
                  <g transform="translate(12, 18)">
                    {/* Status Pill */}
                    <rect
                      x="0"
                      y="-12"
                      width={
                        isRootGap
                          ? 110
                          : isObservedError
                          ? 100
                          : status === "mastered"
                          ? 82
                          : status === "in_causal_path"
                          ? 86
                          : 65
                      }
                      height="18"
                      rx="9"
                      fill={
                        isRootGap
                          ? "rgba(245, 158, 11, 0.15)"
                          : isObservedError
                          ? "rgba(225, 29, 72, 0.15)"
                          : status === "mastered"
                          ? "rgba(16, 185, 129, 0.15)"
                          : status === "in_causal_path"
                          ? "rgba(59, 130, 246, 0.15)"
                          : "rgba(100, 116, 139, 0.15)"
                      }
                    />

                    {/* Status Dot */}
                    <circle
                      cx="8"
                      cy="-3"
                      r="3"
                      fill={
                        isRootGap
                          ? "#F59E0B"
                          : isObservedError
                          ? "#E11D48"
                          : status === "mastered"
                          ? "#10B981"
                          : status === "in_causal_path"
                          ? "#3B82F6"
                          : "#94A3B8"
                      }
                    />

                    {/* Status Label */}
                    <text
                      x="16"
                      y="1"
                      fill={
                        isRootGap
                          ? "#FDE68A"
                          : isObservedError
                          ? "#FECDD3"
                          : status === "mastered"
                          ? "#A7F3D0"
                          : status === "in_causal_path"
                          ? "#BFDBFE"
                          : "#CBD5E1"
                      }
                      fontSize="9.5"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                      fontWeight="600"
                    >
                      {colorInfo.label}
                    </text>
                  </g>

                  {/* Concept Name */}
                  <text
                    x="14"
                    y="44"
                    fill="#F1F5F9"
                    fontSize="13"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    fontWeight="700"
                  >
                    {concept.name.length > 20 ? concept.name.substring(0, 19) + "…" : concept.name}
                  </text>

                  {/* Category Chip */}
                  <text
                    x="14"
                    y="60"
                    fill="#94A3B8"
                    fontSize="10"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    fontWeight="500"
                  >
                    {concept.category}
                  </text>

                  {/* Mastery Score Badge */}
                  <text
                    x={nodeWidth - 14}
                    y="60"
                    textAnchor="end"
                    fill={mastery >= 80 ? "#10B981" : mastery > 40 ? "#F59E0B" : "#94A3B8"}
                    fontSize="10.5"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    fontWeight="600"
                  >
                    {mastery}%
                  </text>

                  {/* Mastery Mini Bar */}
                  <rect
                    x="12"
                    y="72"
                    width={nodeWidth - 24}
                    height="3"
                    rx="1.5"
                    fill="#282E3D"
                  />
                  <rect
                    x="12"
                    y="72"
                    width={((nodeWidth - 24) * mastery) / 100}
                    height="3"
                    rx="1.5"
                    fill={
                      status === "mastered"
                        ? "#10B981"
                        : isObservedError
                        ? "#E11D48"
                        : isRootGap
                        ? "#F59E0B"
                        : "#3B82F6"
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
        <div className="p-5 sm:p-6 bg-[#141722] border-t border-[#282E3D] animate-in slide-in-from-bottom-2">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            {/* Concept Overview */}
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600/15 text-blue-400 border border-blue-500/30">
                  {selectedConcept.category}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300">
                  {selectedConcept.difficulty.toUpperCase()}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Est. Study: ~{selectedConcept.estimatedMinutes} min
                </span>

                {selectedConcept.id === likelyRootGapId && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Likely Root Learning Gap</span>
                  </span>
                )}

                {selectedConcept.id === observedErrorNodeId && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center space-x-1">
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
                  <div className="text-rose-300 font-semibold flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Observed Misconception on this Concept:</span>
                  </div>
                  <p className="text-rose-200/90 leading-relaxed font-sans">
                    Learner believed calling recursive child functions destroys or overwrites the current invocation frame in memory.
                  </p>
                </div>
              )}

              {selectedConcept.id === likelyRootGapId && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-900/60 text-xs font-sans space-y-1">
                  <div className="text-amber-300 font-semibold flex items-center space-x-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Why this is the Foundational Root Gap:</span>
                  </div>
                  <p className="text-amber-200/90 leading-relaxed font-sans">
                    Cognitive Bisect isolated that the student never internalized that Call Stack frames exist independently in LIFO memory. Without this physical invariant, recursive algorithms appear to overwrite parent scope.
                  </p>
                </div>
              )}
            </div>

            {/* Diagnostic Actions & Prerequisite Inspector */}
            <div className="space-y-4 shrink-0 lg:w-80">
              <div className="p-4 rounded-xl bg-[#181C26] border border-[#282E3D] space-y-2.5 text-xs font-sans">
                <span className="text-slate-400 block font-semibold text-[11px] uppercase tracking-wider">
                  Causal Relational Mapping
                </span>
                <div>
                  <span className="text-slate-400 block text-[11px]">Prerequisite Concepts:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedConcept.prerequisites.length > 0 ? (
                      selectedConcept.prerequisites.map((p) => (
                        <button
                          key={p}
                          onClick={() => setSelectedNodeId(p)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 text-[11px] border border-slate-700 font-medium"
                        >
                          {p}
                        </button>
                      ))
                    ) : (
                      <span className="text-slate-500 text-[11px]">None (Foundational Root)</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#282E3D]">
                  <span className="text-slate-400 block text-[11px]">Current Learner Mastery:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${learnerStates[selectedConcept.id]?.masteryScore || 0}%` }}
                        className="h-full bg-blue-500 rounded-full"
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
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <Split className="w-3.5 h-3.5" />
                  <span>Execute Cognitive Bisect on this Node</span>
                </Link>

                <Link
                  href={`/recovery?conceptId=${selectedConcept.id}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#181C26] hover:bg-[#202533] border border-[#282E3D] text-white font-medium text-xs transition-all flex items-center justify-center space-x-1.5"
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

"use client";

import React, { useState } from "react";
import { Concept, ConceptEdge, LearnerConceptState } from "@/lib/types";
import {
  CheckCircle2,
  AlertTriangle,
  Flame,
  Lock,
  ArrowRight,
  Info,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface CanvasProps {
  concepts: Concept[];
  edges: ConceptEdge[];
  positions: Record<string, { x: number; y: number; layer: number }>;
  canvasSize: { width: number; height: number };
  learnerStates: Record<string, LearnerConceptState>;
  activeBisect?: any;
  onSelectConcept?: (concept: Concept) => void;
}

export default function KnowledgeGraphCanvas({
  concepts,
  edges,
  positions,
  canvasSize,
  learnerStates,
  activeBisect,
  onSelectConcept,
}: CanvasProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("graph_traversal");
  const [hoveredEdge, setHoveredEdge] = useState<ConceptEdge | null>(null);
  const [scale, setScale] = useState(1);

  const selectedConcept = concepts.find((c) => c.id === selectedNodeId);

  const getNodeStatus = (conceptId: string) => {
    return learnerStates[conceptId]?.status || "untested";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "mastered":
      case "recovered":
        return {
          bg: "bg-emerald-950/80",
          border: "border-emerald-500",
          glow: "shadow-[0_0_15px_rgba(16,185,129,0.35)]",
          text: "text-emerald-300",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        };
      case "misconception_detected":
        return {
          bg: "bg-rose-950/80",
          border: "border-rose-500 animate-pulse",
          glow: "shadow-[0_0_20px_rgba(244,63,94,0.45)]",
          text: "text-rose-300",
          badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        };
      case "root_gap_identified":
        return {
          bg: "bg-amber-950/80",
          border: "border-amber-500 animate-pulse",
          glow: "shadow-[0_0_20px_rgba(245,158,11,0.5)]",
          text: "text-amber-300",
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        };
      case "diagnosing":
        return {
          bg: "bg-indigo-950/80",
          border: "border-indigo-500",
          glow: "shadow-[0_0_15px_rgba(99,102,241,0.4)]",
          text: "text-indigo-300",
          badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
        };
      default:
        return {
          bg: "bg-slate-900/80",
          border: "border-slate-700",
          glow: "",
          text: "text-slate-300",
          badge: "bg-slate-800 text-slate-400 border-slate-700",
        };
    }
  };

  return (
    <div className="relative w-full rounded-2xl bg-archaia-dark border border-archaia-border overflow-hidden shadow-2xl">
      {/* Canvas Header & Legend */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-archaia-border/80 bg-archaia-darker/60 backdrop-blur-sm gap-3">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <h3 className="text-sm font-semibold tracking-wide text-white">
            Causal Knowledge Dependency Graph (DAG)
          </h3>
          <span className="text-xs font-mono text-archaia-muted px-2 py-0.5 rounded bg-archaia-card border border-archaia-border">
            Ontological Prerequisite Topology
          </span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-archaia-muted">Mastered / Recovered</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-archaia-muted">Misconception Observed</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-archaia-muted">Likely Root Gap</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
            <span className="text-archaia-muted">Untested</span>
          </div>

          <div className="flex items-center space-x-1 pl-2 border-l border-archaia-border">
            <button
              onClick={() => setScale((s) => Math.max(0.7, s - 0.1))}
              className="p-1 rounded bg-archaia-card hover:bg-archaia-cardHover text-archaia-muted hover:text-white"
              title="Zoom out"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-archaia-muted px-1">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale((s) => Math.min(1.4, s + 0.1))}
              className="p-1 rounded bg-archaia-card hover:bg-archaia-cardHover text-archaia-muted hover:text-white"
              title="Zoom in"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative overflow-x-auto overflow-y-hidden p-4 min-h-[460px] flex items-center justify-center">
        <div
          style={{ transform: `scale(${scale})`, transformOrigin: "center center", transition: "transform 0.2s ease" }}
          className="relative"
        >
          <svg
            width={canvasSize.width}
            height={canvasSize.height}
            className="overflow-visible"
          >
            <defs>
              <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.8" />
              </linearGradient>

              <linearGradient id="activeTraceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>

              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#64748B" />
              </marker>

              <marker
                id="arrowheadActive"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#F59E0B" />
              </marker>
            </defs>

            {/* Dependency Edges */}
            {edges.map((edge) => {
              const startPos = positions[edge.from];
              const endPos = positions[edge.to];
              if (!startPos || !endPos) return null;

              const isBackwardCausalPath =
                (edge.from === "call_stack" && edge.to === "recursion") ||
                (edge.from === "recursion" && edge.to === "tree_traversal") ||
                (edge.from === "tree_traversal" && edge.to === "graph_traversal");

              const dx = endPos.x - startPos.x;
              const controlX1 = startPos.x + dx * 0.5;
              const controlY1 = startPos.y;
              const controlX2 = startPos.x + dx * 0.5;
              const controlY2 = endPos.y;

              const pathData = `M ${startPos.x} ${startPos.y} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endPos.x} ${endPos.y}`;

              return (
                <g key={`${edge.from}->${edge.to}`} className="cursor-pointer group">
                  {/* Invisible wide line for hover hit area */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="18"
                    onMouseEnter={() => setHoveredEdge(edge)}
                    onMouseLeave={() => setHoveredEdge(null)}
                  />

                  {/* Visible path */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={isBackwardCausalPath ? "url(#activeTraceGradient)" : "url(#edgeGradient)"}
                    strokeWidth={isBackwardCausalPath ? "3" : "1.8"}
                    strokeDasharray={isBackwardCausalPath ? "6 3" : undefined}
                    className={isBackwardCausalPath ? "animate-[dash_1.5s_linear_infinite]" : "opacity-60 group-hover:opacity-100 transition-opacity"}
                    markerEnd={isBackwardCausalPath ? "url(#arrowheadActive)" : "url(#arrowhead)"}
                  />

                  {/* Flow Pulse Circle on Active Causal Path */}
                  {isBackwardCausalPath && (
                    <circle r="4" fill="#F59E0B">
                      <animateMotion dur="2.5s" repeatCount="indefinite" path={pathData} />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Concept Nodes */}
            {concepts.map((concept) => {
              const pos = positions[concept.id];
              if (!pos) return null;

              const status = getNodeStatus(concept.id);
              const color = getStatusColor(status);
              const isSelected = selectedNodeId === concept.id;
              const mastery = learnerStates[concept.id]?.masteryScore || 0;

              return (
                <g
                  key={concept.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer select-none"
                  onClick={() => {
                    setSelectedNodeId(concept.id);
                    onSelectConcept?.(concept);
                  }}
                >
                  {/* Node Background Halo */}
                  <circle
                    r={isSelected ? "44" : "36"}
                    className={`${color.bg} transition-all duration-300`}
                  />

                  {/* Border ring */}
                  <circle
                    r={isSelected ? "44" : "36"}
                    fill="none"
                    strokeWidth={isSelected ? "3" : "2"}
                    className={`${color.border} ${color.glow} transition-all duration-300`}
                  />

                  {/* Inner Content: Category Icon / Status */}
                  <text
                    textAnchor="middle"
                    dy="-8"
                    className="text-[11px] font-bold font-mono fill-white"
                  >
                    {concept.name.split(" ")[0]}
                  </text>
                  <text
                    textAnchor="middle"
                    dy="8"
                    className="text-[9px] font-mono fill-archaia-muted"
                  >
                    {concept.name.split(" ").slice(1).join(" ")}
                  </text>

                  {/* Mastery Badge underneath */}
                  <rect
                    x="-24"
                    y="16"
                    width="48"
                    height="14"
                    rx="7"
                    className="fill-archaia-card/90 stroke-archaia-border"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="27"
                    textAnchor="middle"
                    className="text-[9px] font-mono font-semibold fill-cyan-300"
                  >
                    {status === "misconception_detected" ? "BUG" : status === "root_gap_identified" ? "ROOT GAP" : `${mastery}%`}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Floating Edge Rationale Banner (Hovered) */}
      {hoveredEdge && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md p-3 rounded-xl bg-archaia-card/95 border border-cyan-500/40 shadow-glow backdrop-blur-md text-xs animate-in fade-in">
          <div className="flex items-center space-x-2 text-cyan-400 font-semibold mb-1">
            <Info className="w-3.5 h-3.5" />
            <span>Prerequisite Rationale Link</span>
          </div>
          <div className="text-white font-mono text-[11px] mb-1">
            {concepts.find((c) => c.id === hoveredEdge.from)?.name} <ArrowRight className="inline w-3 h-3 mx-1" />{" "}
            {concepts.find((c) => c.id === hoveredEdge.to)?.name}
          </div>
          <p className="text-archaia-muted text-[11px] leading-relaxed">
            {hoveredEdge.rationale}
          </p>
        </div>
      )}

      {/* Selected Node Details Drawer */}
      {selectedConcept && (
        <div className="border-t border-archaia-border/80 bg-archaia-card/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-archaia-dark border border-archaia-border">
                {getNodeStatus(selectedConcept.id) === "root_gap_identified" ? (
                  <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                ) : getNodeStatus(selectedConcept.id) === "misconception_detected" ? (
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-white">{selectedConcept.name}</h4>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getStatusColor(getNodeStatus(selectedConcept.id)).badge}`}>
                    {getNodeStatus(selectedConcept.id).toUpperCase().replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-archaia-muted mt-0.5">{selectedConcept.description}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono">
              <div className="text-right">
                <div className="text-archaia-muted text-[10px]">Prerequisites</div>
                <div className="text-white">
                  {selectedConcept.prerequisites.length > 0
                    ? selectedConcept.prerequisites.map((p) => concepts.find((c) => c.id === p)?.name).join(", ")
                    : "None (Foundational)"}
                </div>
              </div>

              {getNodeStatus(selectedConcept.id) === "root_gap_identified" && (
                <a
                  href="/recovery"
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs transition-all shadow-glowWarning"
                >
                  Enter Recovery Lab →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

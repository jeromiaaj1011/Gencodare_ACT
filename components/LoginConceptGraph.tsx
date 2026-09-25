import React from "react";

export default function LoginConceptGraph() {
  return (
    <div className="relative w-full max-w-lg mx-auto select-none">
      <svg
        viewBox="0 0 460 380"
        className="w-full h-auto overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Clean Arrowhead markers */}
          <marker
            id="arrowBlue"
            markerWidth="7"
            markerHeight="7"
            refX="6"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 1, 6 3.5, 0 6" fill="#3B82F6" />
          </marker>

          <marker
            id="arrowAmber"
            markerWidth="7"
            markerHeight="7"
            refX="6"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 1, 6 3.5, 0 6" fill="#F59E0B" />
          </marker>

          <marker
            id="arrowSlate"
            markerWidth="7"
            markerHeight="7"
            refX="6"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 1, 6 3.5, 0 6" fill="#64748B" />
          </marker>
        </defs>

        {/* CONNECTING EDGES */}
        {/* Edge 1: Functions -> Recursion (Top to Center) */}
        <line
          x1="230"
          y1="90"
          x2="230"
          y2="135"
          stroke="#3B82F6"
          strokeWidth="1.8"
          markerEnd="url(#arrowBlue)"
          opacity="0.85"
        />

        {/* Edge 2: Recursion -> Call Stack (Center to Bottom-Left) */}
        <line
          x1="220"
          y1="175"
          x2="185"
          y2="215"
          stroke="#F59E0B"
          strokeWidth="1.8"
          markerEnd="url(#arrowAmber)"
          opacity="0.85"
        />

        {/* Edge 3: Recursion -> Tree Traversal (Center to Bottom-Right) */}
        <line
          x1="240"
          y1="175"
          x2="275"
          y2="215"
          stroke="#3B82F6"
          strokeWidth="1.8"
          markerEnd="url(#arrowBlue)"
          opacity="0.85"
        />

        {/* Edge 4: Call Stack -> Graph Traversal (Bottom-Left to Bottom-Center) */}
        <line
          x1="180"
          y1="260"
          x2="210"
          y2="300"
          stroke="#64748B"
          strokeWidth="1.8"
          markerEnd="url(#arrowSlate)"
          opacity="0.75"
        />

        {/* NODE 1: Functions (Top) - Recovered */}
        <g transform="translate(230, 65)">
          <circle r="22" fill="#064E3B" stroke="#10B981" strokeWidth="1.8" />
          <circle r="18" fill="#047857" opacity="0.3" />
          {/* Checkmark icon */}
          <path
            d="M -6 -1 L -2 3 L 6 -5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Label on right */}
          <text x="34" y="-3" fill="#FFFFFF" fontSize="13" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
            Functions
          </text>
          <text x="34" y="14" fill="#34D399" fontSize="11" fontWeight="500" fontFamily="Plus Jakarta Sans, sans-serif">
            Mastered
          </text>
        </g>

        {/* NODE 2: Recursion (Center) - Needs Attention */}
        <g transform="translate(230, 155)">
          <circle r="22" fill="#451A03" stroke="#F59E0B" strokeWidth="1.8" />
          <circle r="18" fill="#78350F" opacity="0.3" />
          <circle r="6" fill="#FDE68A" />
          {/* Label on right */}
          <text x="34" y="-3" fill="#FFFFFF" fontSize="13" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
            Recursion
          </text>
          <text x="34" y="14" fill="#FBBF24" fontSize="11" fontWeight="500" fontFamily="Plus Jakarta Sans, sans-serif">
            Needs Review
          </text>
        </g>

        {/* NODE 3: Call Stack (Left) - In Progress */}
        <g transform="translate(170, 235)">
          <circle r="22" fill="#4C0519" stroke="#E11D48" strokeWidth="1.8" />
          <circle r="18" fill="#881337" opacity="0.3" />
          <circle r="6" fill="#FDA4AF" />
          {/* Label on right */}
          <text x="34" y="-3" fill="#FFFFFF" fontSize="13" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
            Call Stack
          </text>
          <text x="34" y="14" fill="#FB7185" fontSize="11" fontWeight="500" fontFamily="Plus Jakarta Sans, sans-serif">
            Root Gap Identified
          </text>
        </g>

        {/* NODE 4: Tree Traversal (Right) - Recovered */}
        <g transform="translate(290, 235)">
          <circle r="22" fill="#064E3B" stroke="#10B981" strokeWidth="1.8" />
          <circle r="18" fill="#047857" opacity="0.3" />
          <path
            d="M -6 -1 L -2 3 L 6 -5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Label on right */}
          <text x="34" y="-3" fill="#FFFFFF" fontSize="13" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
            Tree Traversal
          </text>
          <text x="34" y="14" fill="#34D399" fontSize="11" fontWeight="500" fontFamily="Plus Jakarta Sans, sans-serif">
            Mastered
          </text>
        </g>

        {/* NODE 5: Graph Traversal (Bottom) - Not Started */}
        <g transform="translate(220, 320)">
          <circle r="22" fill="#181C26" stroke="#475569" strokeWidth="1.8" />
          <circle r="18" fill="#334155" opacity="0.25" />
          <circle r="6" fill="#94A3B8" />
          {/* Label on right */}
          <text x="34" y="-3" fill="#FFFFFF" fontSize="13" fontWeight="600" fontFamily="Plus Jakarta Sans, sans-serif">
            Graph Traversal
          </text>
          <text x="34" y="14" fill="#94A3B8" fontSize="11" fontWeight="500" fontFamily="Plus Jakarta Sans, sans-serif">
            Pending Remediation
          </text>
        </g>

        {/* ELEGANT EDITORIAL CALLOUT */}
        <g transform="translate(10, 280)">
          {/* Curved Callout Arrow */}
          <path
            d="M 60 5 C 60 30, 95 38, 125 45"
            fill="none"
            stroke="#64748B"
            strokeWidth="1.2"
            strokeDasharray="2 3"
            opacity="0.8"
          />
          <polygon points="125 41, 131 46, 124 49" fill="#64748B" />

          <text
            x="85"
            y="5"
            fill="#CBD5E1"
            fontSize="12"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontWeight="500"
            opacity="0.9"
          >
            Trace causal dependencies.
          </text>
          <text
            x="88"
            y="23"
            fill="#94A3B8"
            fontSize="12"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontWeight="500"
            opacity="0.9"
          >
            Fix the root misconception.
          </text>
        </g>
      </svg>
    </div>
  );
}

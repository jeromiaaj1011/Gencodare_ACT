import React from "react";
import { Check } from "lucide-react";

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
          {/* Arrowhead markers */}
          <marker
            id="arrowCyan"
            markerWidth="7"
            markerHeight="7"
            refX="6"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 1, 6 3.5, 0 6" fill="#2DD4BF" />
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
            id="arrowBlue"
            markerWidth="7"
            markerHeight="7"
            refX="6"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 1, 6 3.5, 0 6" fill="#38BDF8" />
          </marker>

          <filter id="emeraldGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="amberGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="roseGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="blueGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* CONNECTING EDGES */}
        {/* Edge 1: Functions -> Recursion (Top to Center) */}
        <line
          x1="230"
          y1="90"
          x2="230"
          y2="135"
          stroke="#2DD4BF"
          strokeWidth="1.8"
          markerEnd="url(#arrowCyan)"
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
          stroke="#2DD4BF"
          strokeWidth="1.8"
          markerEnd="url(#arrowCyan)"
          opacity="0.85"
        />

        {/* Edge 4: Call Stack -> Graph Traversal (Bottom-Left to Bottom-Center) */}
        <line
          x1="180"
          y1="260"
          x2="210"
          y2="300"
          stroke="#38BDF8"
          strokeWidth="1.8"
          markerEnd="url(#arrowBlue)"
          opacity="0.75"
        />

        {/* NODE 1: Functions (Top) - Recovered */}
        <g transform="translate(230, 65)">
          <circle r="22" fill="#064E3B" stroke="#10B981" strokeWidth="1.8" filter="url(#emeraldGlow)" />
          <circle r="20" fill="#047857" opacity="0.4" />
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
          <text x="34" y="-3" fill="#FFFFFF" fontSize="13" fontWeight="600" fontFamily="sans-serif">
            Functions
          </text>
          <text x="34" y="14" fill="#34D399" fontSize="11" fontWeight="500" fontFamily="sans-serif">
            Recovered
          </text>
        </g>

        {/* NODE 2: Recursion (Center) - Needs Attention */}
        <g transform="translate(230, 155)">
          <circle r="22" fill="#451A03" stroke="#F59E0B" strokeWidth="1.8" filter="url(#amberGlow)" />
          <circle r="18" fill="#78350F" opacity="0.3" />
          <circle r="7" fill="#FDE68A" />
          {/* Label on right */}
          <text x="34" y="-3" fill="#FFFFFF" fontSize="13" fontWeight="600" fontFamily="sans-serif">
            Recursion
          </text>
          <text x="34" y="14" fill="#FBBF24" fontSize="11" fontWeight="500" fontFamily="sans-serif">
            Needs Attention
          </text>
        </g>

        {/* NODE 3: Call Stack (Left) - In Progress */}
        <g transform="translate(170, 235)">
          <circle r="22" fill="#4C0519" stroke="#F43F5E" strokeWidth="1.8" filter="url(#roseGlow)" />
          <circle r="18" fill="#881337" opacity="0.3" />
          <circle r="7" fill="#FDA4AF" className="animate-pulse" />
          {/* Label on right */}
          <text x="34" y="-3" fill="#FFFFFF" fontSize="13" fontWeight="600" fontFamily="sans-serif">
            Call Stack
          </text>
          <text x="34" y="14" fill="#FB7185" fontSize="11" fontWeight="500" fontFamily="sans-serif">
            In Progress
          </text>
        </g>

        {/* NODE 4: Tree Traversal (Right) - Recovered */}
        <g transform="translate(290, 235)">
          <circle r="22" fill="#064E3B" stroke="#10B981" strokeWidth="1.8" filter="url(#emeraldGlow)" />
          <circle r="20" fill="#047857" opacity="0.4" />
          <path
            d="M -6 -1 L -2 3 L 6 -5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Label on right */}
          <text x="34" y="-3" fill="#FFFFFF" fontSize="13" fontWeight="600" fontFamily="sans-serif">
            Tree Traversal
          </text>
          <text x="34" y="14" fill="#34D399" fontSize="11" fontWeight="500" fontFamily="sans-serif">
            Recovered
          </text>
        </g>

        {/* NODE 5: Graph Traversal (Bottom) - Not Started */}
        <g transform="translate(220, 320)">
          <circle r="22" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.8" filter="url(#blueGlow)" />
          <circle r="18" fill="#0284C7" opacity="0.25" />
          <circle r="7" fill="#BAE6FD" />
          {/* Label on right */}
          <text x="34" y="-3" fill="#FFFFFF" fontSize="13" fontWeight="600" fontFamily="sans-serif">
            Graph Traversal
          </text>
          <text x="34" y="14" fill="#94A3B8" fontSize="11" fontWeight="500" fontFamily="sans-serif">
            Not Started
          </text>
        </g>

        {/* PLAYFUL HANDWRITTEN / CURSIVE CALLOUT */}
        <g transform="translate(10, 280)">
          {/* Curved Callout Arrow */}
          <path
            d="M 60 5 C 60 30, 95 38, 125 45"
            fill="none"
            stroke="#94A3B8"
            strokeWidth="1.2"
            strokeDasharray="2 3"
            opacity="0.8"
          />
          <polygon points="125 41, 131 46, 124 49" fill="#94A3B8" />

          {/* Italic / Calligraphic Text */}
          <text
            x="85"
            y="5"
            fill="#CBD5E1"
            fontSize="13"
            fontStyle="italic"
            fontFamily="Georgia, serif"
            opacity="0.9"
          >
            Trace understanding.
          </text>
          <text
            x="88"
            y="23"
            fill="#CBD5E1"
            fontSize="13"
            fontStyle="italic"
            fontFamily="Georgia, serif"
            opacity="0.9"
          >
            Find the gap.
          </text>
        </g>
      </svg>
    </div>
  );
}

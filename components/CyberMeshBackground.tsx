import React from "react";

export default function CyberMeshBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Deep Space Radial Atmosphere */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-cyan-900/15 rounded-full blur-[140px]" />
      <div className="absolute bottom-0 left-1/3 w-[800px] h-[500px] bg-blue-950/30 rounded-full blur-[160px]" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-indigo-900/15 rounded-full blur-[120px]" />

      {/* Top Right Digital Wireframe Sphere */}
      <div className="absolute -top-12 -right-16 w-80 h-80 sm:w-96 sm:h-96 opacity-60">
        <svg viewBox="0 0 400 400" className="w-full h-full overflow-visible">
          <defs>
            <radialGradient id="sphereGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#0284C7" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Core sphere glow */}
          <circle cx="200" cy="200" r="170" fill="url(#sphereGlow)" />

          {/* Latitude Rings */}
          <ellipse cx="200" cy="200" rx="170" ry="170" fill="none" stroke="#0284C7" strokeWidth="0.75" strokeDasharray="3 4" opacity="0.5" />
          <ellipse cx="200" cy="200" rx="170" ry="120" fill="none" stroke="#38BDF8" strokeWidth="0.6" opacity="0.6" />
          <ellipse cx="200" cy="200" rx="170" ry="60" fill="none" stroke="#38BDF8" strokeWidth="0.6" opacity="0.5" />
          <ellipse cx="200" cy="200" rx="170" ry="20" fill="none" stroke="#0284C7" strokeWidth="0.5" opacity="0.4" />

          {/* Longitude Rings */}
          <ellipse cx="200" cy="200" rx="120" ry="170" fill="none" stroke="#38BDF8" strokeWidth="0.6" opacity="0.5" />
          <ellipse cx="200" cy="200" rx="60" ry="170" fill="none" stroke="#38BDF8" strokeWidth="0.6" opacity="0.5" />
          <line x1="200" y1="30" x2="200" y2="370" stroke="#38BDF8" strokeWidth="0.6" opacity="0.4" />
          <line x1="30" y1="200" x2="370" y2="200" stroke="#38BDF8" strokeWidth="0.6" opacity="0.4" />

          {/* Constellation Nodes on Sphere */}
          {[
            { cx: 280, cy: 120 },
            { cx: 330, cy: 190 },
            { cx: 250, cy: 260 },
            { cx: 160, cy: 300 },
            { cx: 110, cy: 230 },
            { cx: 140, cy: 130 },
            { cx: 210, cy: 80 },
            { cx: 290, cy: 220 },
            { cx: 220, cy: 170 },
          ].map((pt, i) => (
            <g key={i}>
              <circle cx={pt.cx} cy={pt.cy} r="2.5" fill="#38BDF8" />
              <circle cx={pt.cx} cy={pt.cy} r="6" fill="#38BDF8" opacity="0.25" />
            </g>
          ))}

          {/* Great Circle Triangulations */}
          <line x1="280" y1="120" x2="330" y2="190" stroke="#38BDF8" strokeWidth="0.6" opacity="0.4" />
          <line x1="330" y1="190" x2="290" y2="220" stroke="#38BDF8" strokeWidth="0.6" opacity="0.4" />
          <line x1="290" y1="220" x2="250" y2="260" stroke="#38BDF8" strokeWidth="0.6" opacity="0.4" />
          <line x1="250" y1="260" x2="160" y2="300" stroke="#38BDF8" strokeWidth="0.6" opacity="0.4" />
          <line x1="140" y1="130" x2="220" y2="170" stroke="#38BDF8" strokeWidth="0.6" opacity="0.4" />
          <line x1="220" y1="170" x2="280" y2="120" stroke="#38BDF8" strokeWidth="0.6" opacity="0.4" />
        </svg>
      </div>

      {/* Bottom Undulating Cyber-Terrain Mesh */}
      <div className="absolute bottom-0 left-0 right-0 h-64 sm:h-80 opacity-70">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="meshLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0369A1" stopOpacity="0.3" />
              <stop offset="35%" stopColor="#0284C7" stopOpacity="0.6" />
              <stop offset="65%" stopColor="#0D9488" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0369A1" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="meshFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0369A1" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Undulating Mesh Polygons */}
          <polygon
            points="
              0,250 80,240 160,255 240,230 320,245 400,210 480,230 560,200 640,225 720,195 800,230 880,215 960,240 1040,210 1120,235 1200,220 1280,250 1360,230 1440,260
              1440,320 0,320
            "
            fill="url(#meshFillGrad)"
          />

          {/* Horizontal Wave Iso-Lines */}
          {[
            "M 0,250 Q 360,210 720,195 T 1440,260",
            "M 0,265 Q 360,225 720,210 T 1440,275",
            "M 0,280 Q 360,245 720,230 T 1440,290",
            "M 0,295 Q 360,265 720,255 T 1440,305",
          ].map((d, i) => (
            <path key={i} d={d} fill="none" stroke="url(#meshLineGrad)" strokeWidth="0.8" opacity={0.5 + i * 0.1} />
          ))}

          {/* Vertical/Diagonal Grid Intersections */}
          {Array.from({ length: 36 }).map((_, i) => {
            const x = i * 40;
            const topY = 190 + Math.sin(i * 0.4) * 35;
            return (
              <line
                key={i}
                x1={x}
                y1={topY}
                x2={x + (i % 2 === 0 ? 15 : -15)}
                y2="320"
                stroke="#0284C7"
                strokeWidth="0.4"
                opacity="0.35"
              />
            );
          })}

          {/* Illuminated Gold/Cyan Vertices */}
          {[
            { cx: 160, cy: 255 },
            { cx: 320, cy: 245 },
            { cx: 480, cy: 230 },
            { cx: 640, cy: 225 },
            { cx: 720, cy: 195, gold: true },
            { cx: 800, cy: 230 },
            { cx: 960, cy: 240, gold: true },
            { cx: 1120, cy: 235 },
            { cx: 1280, cy: 250 },
            { cx: 240, cy: 230, gold: true },
            { cx: 400, cy: 210 },
            { cx: 560, cy: 200, gold: true },
            { cx: 880, cy: 215 },
            { cx: 1040, cy: 210, gold: true },
          ].map((pt, i) => (
            <g key={i}>
              <circle cx={pt.cx} cy={pt.cy} r={pt.gold ? "3" : "2"} fill={pt.gold ? "#F59E0B" : "#38BDF8"} />
              <circle
                cx={pt.cx}
                cy={pt.cy}
                r={pt.gold ? "7" : "5"}
                fill={pt.gold ? "#F59E0B" : "#38BDF8"}
                opacity="0.3"
              />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

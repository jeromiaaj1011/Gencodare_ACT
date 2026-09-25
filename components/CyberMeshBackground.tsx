import React from "react";

export default function CyberMeshBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Warm Ambient Architectural Vignette */}
      <div className="absolute top-[-10%] right-[-5%] w-[650px] h-[650px] bg-blue-900/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[700px] h-[600px] bg-slate-800/15 rounded-full blur-[160px]" />
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[450px] bg-amber-900/5 rounded-full blur-[130px]" />

      {/* Subtle Precision Engineering Dot Grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #94A3B8 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Soft Vignette Border Falloff */}
      <div className="absolute inset-0 bg-radial-vignette opacity-80" />
    </div>
  );
}

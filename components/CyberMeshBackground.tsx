import React from "react";

export default function CyberMeshBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Shades That Inspire: Coral & Rose Ambient Diffuse Fields */}
      <div
        className="absolute top-[-15%] right-[-10%] w-[680px] h-[680px] rounded-full blur-[140px] opacity-45 mix-blend-screen"
        style={{
          background: "radial-gradient(circle, #fb7185 0%, #e11d48 45%, #4c0519 80%, transparent 100%)",
        }}
      />
      <div
        className="absolute bottom-[-15%] left-[-10%] w-[700px] h-[700px] rounded-full blur-[150px] opacity-40 mix-blend-screen"
        style={{
          background: "radial-gradient(circle, #fecdd3 0%, #f43f5e 40%, #881337 75%, transparent 100%)",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[450px] rounded-[50%] blur-[160px] opacity-25 mix-blend-screen"
        style={{
          background: "radial-gradient(ellipse, #ff6484 0%, #9f1239 60%, transparent 100%)",
        }}
      />

      {/* Subtle Precision Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.028]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Velvet Obsidian Vignette falloff */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, transparent 40%, #06070a 90%)",
        }}
      />
    </div>
  );
}

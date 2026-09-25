"use client";

import React from "react";

interface ShadesFluidBlobProps {
  variant?: "hero" | "top-right" | "bottom-left" | "bottom-right" | "center-subtle";
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
}

export default function ShadesFluidBlob({
  variant = "hero",
  className = "",
  size = "md",
  animated = true,
}: ShadesFluidBlobProps) {
  if (variant === "top-right") {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -top-16 -right-16 z-0 overflow-hidden ${className}`}
      >
        <div
          className={`w-[360px] h-[360px] sm:w-[520px] sm:h-[520px] rounded-full blur-[80px] sm:blur-[100px] opacity-75 sm:opacity-85 mix-blend-screen ${
            animated ? "shades-blob-pulse" : ""
          }`}
          style={{
            background:
              "radial-gradient(circle at 40% 40%, #fecdd3 0%, #fb7185 28%, #e11d48 55%, #881337 75%, transparent 95%)",
          }}
        />
        {/* Crisp organic fluid curved path overlay for defined silhouette */}
        <svg
          className="absolute -top-10 -right-10 w-[300px] h-[300px] sm:w-[440px] sm:h-[440px] opacity-60 mix-blend-screen"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M340,60 C400,120 420,240 360,310 C300,380 180,390 110,340 C40,290 60,180 120,110 C180,40 280,0 340,60 Z"
            fill="url(#coralGradCornerTR)"
            filter="blur(36px)"
          />
          <defs>
            <radialGradient id="coralGradCornerTR" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffe4e6" />
              <stop offset="35%" stopColor="#fb7185" />
              <stop offset="70%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#4c0519" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (variant === "bottom-left") {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-20 -left-20 z-0 overflow-hidden ${className}`}
      >
        <div
          className={`w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] rounded-full blur-[75px] sm:blur-[95px] opacity-70 mix-blend-screen ${
            animated ? "shades-blob-pulse" : ""
          }`}
          style={{
            background:
              "radial-gradient(circle at 60% 60%, #fecdd3 0%, #f43f5e 30%, #be123c 60%, #4c0519 80%, transparent 95%)",
          }}
        />
        <svg
          className="absolute -bottom-10 -left-10 w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] opacity-50 mix-blend-screen"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M80,320 C30,260 20,150 70,80 C120,10 240,20 310,80 C380,140 370,260 300,320 C230,380 130,380 80,320 Z"
            fill="url(#coralGradCornerBL)"
            filter="blur(32px)"
          />
          <defs>
            <radialGradient id="coralGradCornerBL" cx="60%" cy="60%" r="65%">
              <stop offset="0%" stopColor="#fecdd3" />
              <stop offset="40%" stopColor="#fb7185" />
              <stop offset="75%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#300311" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (variant === "bottom-right") {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-16 -right-16 z-0 overflow-hidden ${className}`}
      >
        <div
          className={`w-[320px] h-[320px] sm:w-[460px] sm:h-[460px] rounded-full blur-[75px] sm:blur-[90px] opacity-65 mix-blend-screen ${
            animated ? "shades-blob-pulse" : ""
          }`}
          style={{
            background:
              "radial-gradient(circle at 45% 45%, #ffe4e6 0%, #fb7185 32%, #e11d48 62%, #881337 82%, transparent 95%)",
          }}
        />
      </div>
    );
  }

  if (variant === "center-subtle") {
    return (
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 flex items-center justify-center z-0 overflow-hidden ${className}`}
      >
        <div
          className={`w-[500px] h-[360px] sm:w-[750px] sm:h-[480px] rounded-[50%] blur-[110px] opacity-40 mix-blend-screen ${
            animated ? "shades-blob-pulse" : ""
          }`}
          style={{
            background:
              "radial-gradient(ellipse at center, #fb7185 0%, #e11d48 45%, #4c0519 75%, transparent 90%)",
          }}
        />
      </div>
    );
  }

  // DEFAULT: HERO 3D Organic Fluid Blob (Exact replica of "Shades That Inspire" centerpiece!)
  const sizeClasses = {
    sm: "w-[260px] h-[180px]",
    md: "w-[360px] h-[240px] sm:w-[480px] sm:h-[300px]",
    lg: "w-[440px] h-[280px] sm:w-[620px] sm:h-[380px] lg:w-[740px] lg:h-[440px]",
    xl: "w-[520px] h-[340px] sm:w-[760px] sm:h-[480px] lg:w-[920px] lg:h-[540px]",
  }[size];

  return (
    <div
      aria-hidden="true"
      className={`relative flex items-center justify-center pointer-events-none select-none ${className}`}
    >
      {/* Diffuse aura backdrop */}
      <div
        className={`absolute rounded-[50%] blur-[90px] sm:blur-[130px] opacity-60 mix-blend-screen ${sizeClasses} ${
          animated ? "shades-blob-pulse" : ""
        }`}
        style={{
          background:
            "radial-gradient(circle at 40% 40%, #fecdd3 0%, #fb7185 30%, #e11d48 60%, #881337 85%, transparent 100%)",
        }}
      />

      {/* Primary Organic 3D Fluid Shape */}
      <div
        className={`relative ${sizeClasses} shades-organic-fluid ${
          animated ? "shades-blob-float" : ""
        }`}
        style={{
          borderRadius: "58% 42% 64% 36% / 46% 54% 46% 54%",
          background:
            "radial-gradient(circle at 38% 35%, #ffffff 0%, #ffe4e6 8%, #fecdd3 18%, #fb7185 38%, #e11d48 65%, #9f1239 82%, #4c0519 96%)",
          boxShadow:
            "0 0 80px rgba(251, 113, 133, 0.4), inset -15px -15px 40px rgba(76, 5, 25, 0.8), inset 15px 15px 30px rgba(255, 255, 255, 0.35)",
          filter: "drop-shadow(0 25px 50px rgba(225, 29, 72, 0.35))",
        }}
      >
        {/* Subtle noise grain simulation */}
        <div
          className="absolute inset-0 rounded-[inherit] opacity-35 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: "6px 6px",
          }}
        />
        {/* Inner specular luster reflection */}
        <div
          className="absolute top-[12%] left-[18%] w-[45%] h-[35%] rounded-[50%] opacity-70 blur-[14px]"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.9) 0%, rgba(254, 205, 211, 0.4) 50%, transparent 100%)",
          }}
        />
      </div>
    </div>
  );
}

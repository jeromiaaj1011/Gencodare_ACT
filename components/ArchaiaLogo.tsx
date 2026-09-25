import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export default function ArchaiaLogo({ className = "w-9 h-9", size = 36 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="archaiaGoldLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="archaiaGoldRight" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="archaiaGoldCenter" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#FDE68A" />
        </linearGradient>
        <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Stylized Geometric "A" Monogram */}
      <g filter="url(#goldGlow)">
        {/* Left Leg */}
        <polygon
          points="50,12 36,46 16,90 32,90 44,58 50,42"
          fill="url(#archaiaGoldLeft)"
        />

        {/* Right Leg */}
        <polygon
          points="50,12 64,46 84,90 68,90 56,58 50,42"
          fill="url(#archaiaGoldRight)"
        />

        {/* Central Triangle / Inverted Delta */}
        <polygon
          points="50,48 40,74 60,74"
          fill="url(#archaiaGoldCenter)"
          opacity="0.9"
        />
      </g>
    </svg>
  );
}

"use client";

import React, { useEffect, useState } from "react";

export default function GlobalCursorSpotlight() {
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Respect user's motion preferences
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener("change", handler);

      const handleMouseMove = (e: MouseEvent) => {
        setPosition({ x: e.clientX, y: e.clientY });
        if (!visible) setVisible(true);
      };

      const handleMouseLeave = () => setVisible(false);

      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      document.body.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        mediaQuery.removeEventListener("change", handler);
        window.removeEventListener("mousemove", handleMouseMove);
        document.body.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, [visible]);

  if (reducedMotion || !visible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
      style={{
        background: `radial-gradient(650px circle at ${position.x}px ${position.y}px, rgba(59, 130, 246, 0.055), transparent 80%)`,
      }}
    />
  );
}

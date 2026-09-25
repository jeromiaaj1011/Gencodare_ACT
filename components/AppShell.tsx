"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import GlobalCursorSpotlight from "./motion/GlobalCursorSpotlight";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-[#070D1C] text-archaia-text font-sans relative">
        <GlobalCursorSpotlight />
        <main className="flex-1 w-full flex items-center justify-center">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-archaia-darker text-archaia-text font-sans relative overflow-x-hidden">
      <GlobalCursorSpotlight />
      {/* Subtle Ambient Background Pulse (Restrained purple/indigo glow) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden ambient-pulse"
        style={{
          background:
            "radial-gradient(1100px 600px at 50% 0%, rgba(99, 102, 241, 0.07), rgba(217, 70, 239, 0.035) 45%, transparent 75%)",
        }}
      />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="border-t border-archaia-border py-4 text-center text-xs text-archaia-muted font-mono">
          ARCHAIA • AI-Based Learning Misconception Detection (Problem Statement #5) • Cognitive Bisect Engine
        </footer>
      </div>
    </div>
  );
}

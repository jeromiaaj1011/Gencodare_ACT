"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import GlobalCursorSpotlight from "./motion/GlobalCursorSpotlight";
import ShadesFluidBlob from "./decorations/ShadesFluidBlob";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-shades-obsidian text-slate-900 font-sans relative overflow-hidden">
        <GlobalCursorSpotlight />
        {/* Corner Organic 3D Fluid Accents (matching presentation theme) */}
        <ShadesFluidBlob variant="top-right" />
        <ShadesFluidBlob variant="bottom-left" />
        <main className="flex-1 w-full flex items-center justify-center relative z-10">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-shades-obsidian text-slate-900 font-sans relative overflow-x-hidden">
      <GlobalCursorSpotlight />

      {/* Floating 3D Fluid Organic Corner Auras ("Shades That Inspire" signature) */}
      <ShadesFluidBlob variant="top-right" />
      <ShadesFluidBlob variant="bottom-left" />

      {/* Slide Side Metadata Watermarks (Left & Right - exactly like the presentation template) */}
      <div
        aria-hidden="true"
        className="hidden xl:flex fixed left-5 top-1/2 -translate-y-1/2 z-20 side-metadata-left pointer-events-none"
      >
        <span>ARCHAIA // COGNITIVE LABS • DIAGNOSTIC ENGINE</span>
      </div>

      <div
        aria-hidden="true"
        className="hidden xl:flex fixed right-5 top-1/2 -translate-y-1/2 z-20 side-metadata-right pointer-events-none"
      >
        <span>SYS.EDITION 2026 • SHADES THAT ILLUMINATE</span>
      </div>

      <div className="relative z-10 flex flex-row min-h-screen w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
          <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-md py-4 text-center text-[11px] text-slate-500 font-sans tracking-wide">
            <span className="font-editorial italic text-slate-500 mr-1.5 font-normal">Archaia</span>
            • Cognitive Misconception Detection & Prerequisite Bisect • Problem Statement #5
          </footer>
        </div>
      </div>
    </div>
  );
}

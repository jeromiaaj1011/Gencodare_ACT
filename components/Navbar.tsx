"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Network,
  Bug,
  Split,
  HeartPulse,
  LineChart,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import ArchaiaLogo from "./ArchaiaLogo";

export default function Navbar() {
  const pathname = usePathname();
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Knowledge Graph", href: "/graph", icon: Network },
    { label: "Bug Detector", href: "/detector", icon: Bug },
    { label: "Cognitive Bisect", href: "/bisect", icon: Split },
    { label: "Recovery Lab", href: "/recovery", icon: HeartPulse },
    { label: "Progress", href: "/progress", icon: LineChart },
  ];

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      if (res.ok) {
        setResetMessage("State Reset!");
        setTimeout(() => setResetMessage(null), 2500);
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-archaia-dark/80 backdrop-blur-md border-b border-archaia-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <ArchaiaLogo size={32} className="w-8 h-8 group-hover:scale-105 transition-transform drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
              <div>
                <span className="text-xl font-bold tracking-[0.15em] text-white">
                  ARCHAIA
                </span>
                <span className="hidden sm:block text-[10px] uppercase font-mono tracking-widest text-archaia-muted -mt-1">
                  Cognitive Learning Diagnostics
                </span>
              </div>
            </Link>
          </div>

          {/* Module Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-archaia-primary/20 text-archaia-accent border border-archaia-primary/40 shadow-glow"
                      : "text-archaia-muted hover:text-white hover:bg-archaia-card"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              disabled={resetting}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-mono bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border text-archaia-muted hover:text-white transition-colors"
              title="Reset state to initial demo seed"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">
                {resetMessage || (resetting ? "Resetting..." : "Reset Demo")}
              </span>
            </button>

            <Link
              href="/login"
              className="px-2.5 py-1 rounded-md text-xs font-sans text-slate-300 hover:text-white hover:bg-archaia-card transition-colors"
            >
              Sign In
            </Link>

            <Link
              href="/detector"
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-glow transition-all"
            >
              <span>Run Diagnostic</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

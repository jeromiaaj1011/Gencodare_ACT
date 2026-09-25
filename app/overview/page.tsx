"use client";

import Link from "next/link";
import {
  Sparkles,
  Network,
  Bug,
  Split,
  HeartPulse,
  LineChart,
  LayoutDashboard,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
} from "lucide-react";

export default function HomePage() {
  const modules = [
    {
      number: "01",
      title: "Student Dashboard",
      description: "Comprehensive learner cockpit displaying active misconceptions, overall mastery, and prioritized recovery tasks.",
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: "Mastery Hub",
      color: "border-indigo-500/30 hover:border-indigo-500",
    },
    {
      number: "02",
      title: "Knowledge Graph",
      description: "Interactive Causal Dependency DAG visualizing prerequisite edges, node mastery, and active misconception traversal paths.",
      href: "/graph",
      icon: Network,
      badge: "Ontological DAG",
      color: "border-blue-500/30 hover:border-blue-500",
    },
    {
      number: "03",
      title: "Cognitive Bug Detector",
      description: "Multi-modal submission analyzer contrasting student mental assumptions directly against formal computing reality.",
      href: "/detector",
      icon: Bug,
      badge: "Mental Model AI",
      color: "border-rose-500/30 hover:border-rose-500",
    },
    {
      number: "04",
      title: "Cognitive Bisect",
      description: "Algorithmic prerequisite fault isolation. Issues invariant micro-probes to locate the true foundational root learning gap.",
      href: "/bisect",
      icon: Split,
      badge: "Core Innovation",
      color: "border-amber-500/30 hover:border-amber-500",
    },
    {
      number: "05",
      title: "Recovery Lab",
      description: "Multi-modal targeted intervention: Stack frame visualizer, counterexample, micro-puzzle, code fix, and mandatory re-test.",
      href: "/recovery",
      icon: HeartPulse,
      badge: "Cognitive Repair",
      color: "border-emerald-500/30 hover:border-emerald-500",
    },
    {
      number: "06",
      title: "Learning Progress",
      description: "Longitudinal mastery matrix and dynamically updated adaptive learning path unlocking downstream topics.",
      href: "/progress",
      icon: LineChart,
      badge: "Adaptive Roadmap",
      color: "border-purple-500/30 hover:border-purple-500",
    },
  ];

  return (
    <div className="space-y-12 py-4 animate-in fade-in duration-300">
      {/* Hero Section */}
      <div className="relative text-center space-y-4 max-w-3xl mx-auto pt-6">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>ARCHAIA • Cognitive Misconception Detection & Recovery</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
          Debug the learning,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
            not just the answer.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal max-w-2xl mx-auto font-sans">
          Conventional platforms tell students if an answer is wrong. <strong className="text-slate-200">ARCHAIA</strong> traces backward through an ontological <strong className="text-slate-200">Causal Knowledge Graph</strong> using <strong className="text-slate-200">Cognitive Bisect</strong> to isolate the foundational misconception that caused the mistake weeks earlier.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <Link
            href="/detector"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <span>Start Live Demo Scenario</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/graph"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border text-white text-xs font-medium transition-colors"
          >
            <Network className="w-4 h-4 text-blue-400" />
            <span>Explore Knowledge DAG</span>
          </Link>
        </div>
      </div>

      {/* The 6 Core Modules Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-archaia-border pb-2">
          <h2 className="text-base font-bold text-white uppercase tracking-wider font-sans flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>The 6 Integrated Architectural Modules</span>
          </h2>
          <span className="text-xs font-sans text-slate-400">
            Fully Implemented & Interactive
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.number}
                href={m.href}
                className="p-6 rounded-2xl bg-archaia-dark border border-archaia-border hover:border-blue-500/50 transition-all duration-200 group flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500 font-semibold">
                      MODULE {m.number}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-sans bg-slate-900 border border-slate-700 text-slate-300">
                      {m.badge}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-slate-200" />
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                      {m.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    {m.description}
                  </p>
                </div>

                <div className="flex items-center text-xs font-sans font-medium text-blue-400 group-hover:translate-x-1 transition-transform">
                  <span>Open Module →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Primary End-to-End Demo Walkthrough Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-archaia-card border border-archaia-border space-y-4 shadow-sm">
        <div className="flex items-center space-x-2 text-blue-400 font-sans text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Recommended Live Evaluation Sequence for Judges</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2 text-xs font-sans">
          <div className="p-3 rounded-xl bg-archaia-dark border border-slate-800 space-y-1">
            <span className="text-rose-400 font-bold text-[11px]">1. DETECTOR</span>
            <p className="text-[11px] text-slate-400">
              Submit DFS explanation; AI isolates Recursive Context Replacement.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-archaia-dark border border-slate-800 space-y-1">
            <span className="text-amber-400 font-bold text-[11px]">2. DAG TRACE</span>
            <p className="text-[11px] text-slate-400">
              Knowledge DAG animates backward prerequisite dependency chain.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-archaia-dark border border-slate-800 space-y-1">
            <span className="text-blue-400 font-bold text-[11px]">3. COGNITIVE BISECT</span>
            <p className="text-[11px] text-slate-400">
              Micro-probes test pivot concepts, isolating Call Stack as root gap.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-archaia-dark border border-slate-800 space-y-1">
            <span className="text-emerald-400 font-bold text-[11px]">4. RECOVERY LAB</span>
            <p className="text-[11px] text-slate-400">
              Visual stack frames, counterexample, multilingual analogy, and blast radius.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-archaia-dark border border-slate-800 space-y-1">
            <span className="text-indigo-400 font-bold text-[11px]">5. RE-TEST & ADAPT</span>
            <p className="text-[11px] text-slate-400">
              Re-assessment verifies recovery and unlocks downstream graph concepts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

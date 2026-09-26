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
  AlertTriangle,
  Lightbulb,
  Compass,
  Flame,
} from "lucide-react";
import ContentModeBanner from "@/components/mode/ContentModeBanner";

export default function OverviewPage() {
  const modules = [
    {
      number: "01",
      title: "Student Dashboard",
      description:
        "Comprehensive learner cockpit displaying active misconceptions, overall mastery, and prioritized recovery tasks.",
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: "Mastery Hub",
    },
    {
      number: "02",
      title: "Knowledge Graph",
      description:
        "Interactive Causal Dependency DAG visualizing prerequisite edges, node mastery, and active misconception traversal paths.",
      href: "/graph",
      icon: Network,
      badge: "Ontological DAG",
    },
    {
      number: "03",
      title: "Cognitive Bug Detector",
      description:
        "Multi-modal submission analyzer contrasting student mental assumptions directly against formal computing reality.",
      href: "/detector",
      icon: Bug,
      badge: "Mental Model AI",
    },
    {
      number: "04",
      title: "Cognitive Bisect",
      description:
        "Algorithmic prerequisite fault isolation. Issues invariant micro-probes to locate the true foundational root learning gap.",
      href: "/bisect",
      icon: Split,
      badge: "Core Innovation",
    },
    {
      number: "05",
      title: "Recovery Lab",
      description:
        "Multi-modal targeted intervention: Stack frame visualizer, counterexample, micro-puzzle, code fix, and mandatory re-test.",
      href: "/recovery",
      icon: HeartPulse,
      badge: "Cognitive Repair",
    },
    {
      number: "06",
      title: "Learning Progress",
      description:
        "Longitudinal mastery matrix and dynamically updated adaptive learning path unlocking downstream topics.",
      href: "/progress",
      icon: LineChart,
      badge: "Adaptive Roadmap",
    },
  ];

  return (
    <div className="space-y-10 py-4 animate-in fade-in duration-300">
      {/* Mode Indicator & Switcher Banner */}
      <ContentModeBanner />

      {/* Hero Section */}
      <div className="relative text-center space-y-4 max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>ARCHAIA • Cognitive Misconception Detection & Recovery</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Debug the learning,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600">
            not just the answer.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-500 leading-relaxed font-normal max-w-2xl mx-auto font-sans">
          Conventional platforms tell students if an answer is wrong.{" "}
          <strong className="text-slate-700">ARCHAIA</strong> traces backward through an ontological{" "}
          <strong className="text-slate-700">Causal Knowledge Graph</strong> using{" "}
          <strong className="text-slate-700">Cognitive Bisect</strong> to isolate the foundational
          misconception that caused the mistake weeks earlier.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/detector"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition-all btn-interactive"
          >
            <span>Start Diagnostic Session</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/graph"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border text-slate-900 text-xs font-medium transition-colors btn-interactive-subtle"
          >
            <Network className="w-4 h-4 text-blue-600" />
            <span>Explore Knowledge DAG</span>
          </Link>
        </div>
      </div>

      {/* 4 Staggered Diagnostic Analytical Panels (Feature 10: Strengths, Gaps, Recommendations, Next Steps) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-archaia-border pb-2">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider font-sans flex items-center space-x-2">
            <Compass className="w-4 h-4 text-blue-600" />
            <span>Cognitive Diagnostic Overview</span>
          </h2>
          <span className="text-xs text-slate-500 font-sans">Synthesized Pedagogical Telemetry</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Strengths & Verified Invariants (Stagger 1) */}
          <div className="p-5 rounded-2xl bg-archaia-dark border border-emerald-500/30 space-y-3 card-interactive stagger-1">
            <div className="flex items-center space-x-2 text-emerald-600 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>1. Learner Strengths & Verified Invariants</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Syntactic Reasoning & Graph Navigation</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Learner demonstrates proficient command over imperative syntax, loop conditions, and visited set collections. Foundations in discrete data relationships are sound.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {["Graph Topology", "Visited Invariants", "Loop Syntax"].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-800 font-mono"
                >
                  ✓ {tag}
                </span>
              ))}
            </div>
          </div>

          {/* 2. Active Learning Gaps (Stagger 2) */}
          <div className="p-5 rounded-2xl bg-archaia-dark border border-rose-500/30 space-y-3 card-interactive stagger-2">
            <div className="flex items-center space-x-2 text-rose-600 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>2. Fragile Foundations & Learning Gaps</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Execution Frame Lifecycle & LIFO Suspension</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Identified a foundational gap regarding execution state suspension during recursive function calls. The mental model erroneously assumed child invocations replace parent scope.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {["Call Stack Invariants", "Frame Suspension", "Return Unwinding"].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[10px] bg-rose-50 text-rose-600 border border-rose-800 font-mono"
                >
                  ⚠ {tag}
                </span>
              ))}
            </div>
          </div>

          {/* 3. AI Pedagogical Recommendations (Stagger 3) */}
          <div className="p-5 rounded-2xl bg-archaia-dark border border-blue-500/30 space-y-3 card-interactive stagger-3">
            <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
              <Lightbulb className="w-4 h-4" />
              <span>3. AI Pedagogical Recommendations</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Targeted Invariant Restructuring</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Avoid repeated generic DFS coding drills. Instead, engage with the physical hardware stack simulator and complete disconfirmation micro-puzzles to permanently reset the mental model.
            </p>
            <div className="text-[11px] text-blue-600 font-medium">
              Recommendation: Run Cognitive Bisect → Target Call Stack recovery module.
            </div>
          </div>

          {/* 4. Concrete Next Steps (Stagger 4) */}
          <div className="p-5 rounded-2xl bg-archaia-dark border border-purple-500/30 space-y-3 card-interactive stagger-4">
            <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4" />
              <span>4. Concrete Next Steps</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Diagnostic Learning Action Items</h3>
            <div className="space-y-2 text-xs font-sans">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-slate-600">
                <span>Step 1: Test Invariant in Cognitive Bug Detector</span>
                <Link href="/detector" className="text-blue-600 hover:underline font-semibold">
                  Launch →
                </Link>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-slate-600">
                <span>Step 2: Isolate Root Gap via Cognitive Bisect</span>
                <Link href="/bisect" className="text-amber-600 hover:underline font-semibold">
                  Launch →
                </Link>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-slate-600">
                <span>Step 3: Restructure Invariant in Recovery Lab</span>
                <Link href="/recovery" className="text-emerald-600 hover:underline font-semibold">
                  Launch →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The 6 Core Modules Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-archaia-border pb-2">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider font-sans flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span>The 6 Integrated Architectural Modules</span>
          </h2>
          <span className="text-xs font-sans text-slate-500">
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
                className="p-6 rounded-2xl bg-archaia-dark border border-archaia-border hover:border-blue-500/50 transition-all duration-200 group flex flex-col justify-between space-y-4 shadow-sm card-interactive"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500 font-semibold">
                      MODULE {m.number}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-sans bg-slate-50 border border-slate-300 text-slate-600">
                      {m.badge}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-slate-700" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {m.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    {m.description}
                  </p>
                </div>

                <div className="flex items-center text-xs font-sans font-medium text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Open Module →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Split,
  Search,
  CheckCircle2,
  XCircle,
  Flame,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
  Activity,
  Layers,
  BarChart3,
  Terminal,
} from "lucide-react";
import { BisectSession, Concept } from "@/lib/types";

export default function BisectPage() {
  const [session, setSession] = useState<BisectSession | null>(null);
  const [rootConcept, setRootConcept] = useState<Concept | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingOptionId, setSubmittingOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchSession = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bisect");
      const data = await res.json();
      if (data.hasActiveSession) {
        setSession(data.session);
        setRootConcept(data.rootConcept);
      } else {
        // Auto-initialize demo session if none is active
        const initRes = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conceptId: "graph_traversal",
            questionId: "q_dfs_recursive_1",
            questionText: "What happens to the caller's state when dfs() is invoked recursively?",
            responseType: "written",
            content: "The recursive call replaces the parent function state and overwrites memory.",
          }),
        });
        const initData = await initRes.json();
        if (initData.bisectSession) {
          setSession(initData.bisectSession);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleSelectOption = async (probeId: string, optionId: string) => {
    setSubmittingOptionId(optionId);
    try {
      const res = await fetch("/api/bisect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          probeId,
          selectedOptionId: optionId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        setRootConcept(data.rootConcept);
        setFeedback(data.evidenceFeedback);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingOptionId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Split className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Cognitive Bisect Investigation
            </h1>
          </div>
          <p className="text-xs text-archaia-muted mt-1">
            Algorithmic prerequisite fault isolation over the Causal Knowledge Graph (Features 13–18). Issues targeted invariant micro-probes to isolate the likely root learning gap.
          </p>
        </div>

        <button
          onClick={fetchSession}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border text-xs font-mono text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Reset / Sync Session</span>
        </button>
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl bg-archaia-dark border border-archaia-border flex items-center justify-center">
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs">
            <Activity className="w-5 h-5 animate-spin" />
            <span>Resolving Prerequisite Ancestry & Bisect Pivots...</span>
          </div>
        </div>
      ) : session ? (
        <div className="space-y-6">
          {/* Prerequisite Ancestor Traversal Chain (Feature 14) */}
          <div className="p-5 rounded-2xl bg-archaia-dark border border-archaia-border space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-archaia-muted flex items-center space-x-1.5">
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <span>Prerequisite Traversal Chain (Topological Ancestors):</span>
              </span>
              <span className="text-cyan-400">
                {session.investigatedConcepts.length} / {session.ancestorChain.length} Investigated
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              {session.ancestorChain.map((conceptId, idx) => {
                const isInvestigated = session.investigatedConcepts.includes(conceptId);
                const isRootGap = session.likelyRootGapId === conceptId;
                const score = session.candidateScores[conceptId] ?? 50;

                return (
                  <div key={conceptId} className="flex items-center">
                    <div
                      className={`px-3 py-1.5 rounded-xl border flex items-center space-x-2 transition-all ${
                        isRootGap
                          ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-glowWarning"
                          : isInvestigated
                          ? "bg-indigo-950/60 border-indigo-500/50 text-indigo-300 shadow-glow"
                          : "bg-archaia-card border-archaia-border text-archaia-muted"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span className="font-semibold">{conceptId}</span>
                      <span className="text-[10px] opacity-80 font-bold">({score}%)</span>
                    </div>
                    {idx < session.ancestorChain.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 mx-1" />
                    )}
                  </div>
                );
              })}
              <ArrowRight className="w-3.5 h-3.5 text-rose-500 mx-1" />
              <div className="px-3 py-1.5 rounded-xl border border-rose-500/60 bg-rose-950/50 text-rose-300 font-mono text-xs font-bold animate-pulse">
                {session.targetConceptId} [OBSERVED ERROR]
              </div>
            </div>
          </div>

          {/* Real-Time Evidence Accumulation Radar (Feature 16 & 18) */}
          <div className="p-5 rounded-2xl bg-archaia-dark border border-archaia-border space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-white font-semibold flex items-center space-x-1.5">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Bayesian Evidence Weight Distribution (Feature 16 & 18)</span>
              </span>
              <span className="text-archaia-muted text-[11px]">
                Higher weight indicates higher likelihood of root learning gap
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {session.ancestorChain.map((id) => {
                const score = session.candidateScores[id] ?? 50;
                const isRoot = session.likelyRootGapId === id;
                return (
                  <div key={id} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={isRoot ? "text-amber-300 font-bold" : "text-slate-300"}>
                        {id} {isRoot && "★ (HIGHEST-SUPPORTED ROOT GAP)"}
                      </span>
                      <span className={score >= 80 ? "text-amber-400 font-bold" : "text-cyan-400"}>
                        {score}% support
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${score}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          isRoot ? "bg-amber-500 shadow-glowWarning" : score > 50 ? "bg-indigo-500" : "bg-slate-600"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Diagnostic Micro-Probe Card (Feature 15) */}
          {session.status === "active" && session.currentProbe ? (
            <div className="p-6 rounded-3xl bg-archaia-dark border border-indigo-500/40 shadow-glow space-y-4">
              <div className="flex items-center justify-between border-b border-archaia-border pb-3">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    DIAGNOSTIC MICRO-PROBE (FEATURE 15)
                  </span>
                  <span className="text-xs font-mono text-white">
                    Testing Candidate Invariant: <strong className="text-cyan-400">{session.currentProbe.conceptId}</strong>
                  </span>
                </div>
                <span className="text-xs font-mono text-archaia-muted">
                  Pivot Selection: Median Ancestor
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white leading-relaxed">
                  {session.currentProbe.question}
                </h3>
                <p className="text-xs text-archaia-muted font-mono">
                  Invariant under test: {session.currentProbe.invariantTested}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2.5 pt-2">
                {session.currentProbe.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(session.currentProbe!.id, opt.id)}
                    disabled={submittingOptionId !== null}
                    className="w-full text-left p-4 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border hover:border-cyan-500/50 transition-all flex items-start space-x-3 group"
                  >
                    <span className="w-5 h-5 rounded-full border border-archaia-border group-hover:border-cyan-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono text-archaia-muted">
                      {submittingOptionId === opt.id ? "…" : "•"}
                    </span>
                    <span className="text-xs text-slate-200 group-hover:text-white leading-relaxed">
                      {opt.text}
                    </span>
                  </button>
                ))}
              </div>

              {feedback && (
                <div className="p-3 rounded-xl bg-archaia-card border border-indigo-500/30 text-xs font-mono text-indigo-300">
                  {feedback}
                </div>
              )}
            </div>
          ) : null}

          {/* Likely Root Gap Announcement Banner (Feature 17) */}
          {session.status === "concluded" && (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-950/70 via-archaia-dark to-slate-900 border border-amber-500/50 shadow-glowWarning space-y-5 animate-in zoom-in-95">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-archaia-border pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Flame className="w-8 h-8 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      DIAGNOSTIC CONVERGENCE REACHED (FEATURE 17)
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                      Likely Root Learning Gap: {rootConcept?.name || session.likelyRootGapId}
                    </h2>
                  </div>
                </div>

                <Link
                  href="/recovery"
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs shadow-glowWarning transition-transform hover:scale-105"
                >
                  <span>Launch Targeted Recovery Lab →</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-amber-200 leading-relaxed font-mono">
                  {session.conclusionReason}
                </p>
                <p className="text-xs text-archaia-muted leading-relaxed">
                  The learner attempted an advanced topic (<strong>Graph Traversal DFS</strong>), but the cognitive point of failure stems from earlier misunderstandings regarding physical LIFO activation frames in the <strong>Call Stack</strong>. Rather than reviewing graph algorithms, remediation must target the Call Stack first.
                </p>
              </div>

              {/* Diagnostic Evidence Trail */}
              <div className="p-4 rounded-2xl bg-archaia-card border border-archaia-border space-y-2">
                <div className="text-xs font-mono font-semibold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Collected Diagnostic Evidence Trail:</span>
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  {session.probesAnswered.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-archaia-dark/60 text-archaia-muted"
                    >
                      <span>Concept: {p.conceptId}</span>
                      <span className={p.isCorrect ? "text-emerald-400" : "text-rose-400"}>
                        {p.isCorrect ? "Invariant Preserved (Passed)" : "Invariant Broken (Gap Confirmed)"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

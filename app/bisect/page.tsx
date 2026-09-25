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
  PlayCircle,
  RotateCcw,
  Sparkles,
  GitBranch,
  Target,
} from "lucide-react";
import { BisectSession, Concept } from "@/lib/types";
import CognitivePipelineStepper from "@/components/navigation/CognitivePipelineStepper";
import ContentModeBanner from "@/components/mode/ContentModeBanner";

export default function BisectPage() {
  const [session, setSession] = useState<BisectSession | null>(null);
  const [rootConcept, setRootConcept] = useState<Concept | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingOptionId, setSubmittingOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const fetchSession = async (explicitSessionId?: string) => {
    setLoading(true);
    try {
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const targetSessionId =
        explicitSessionId ||
        sessionId ||
        params?.get("sessionId") ||
        (typeof window !== "undefined" ? sessionStorage.getItem("archaia_session_id") : null);

      if (targetSessionId) {
        setSessionId(targetSessionId);
      }

      const paramConceptId = params?.get("conceptId");
      const paramMisconceptionId = params?.get("misconceptionId");

      const queryParams = new URLSearchParams();
      if (targetSessionId) queryParams.set("sessionId", targetSessionId);
      if (paramConceptId) queryParams.set("conceptId", paramConceptId);
      if (paramMisconceptionId) queryParams.set("misconceptionId", paramMisconceptionId);

      const queryUrl = `/api/bisect${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      const res = await fetch(queryUrl);
      const data = await res.json();
      if (data.hasActiveSession && data.session) {
        setSession(data.session);
        setRootConcept(data.rootConcept || null);
      } else {
        setSession(null);
        setRootConcept(null);
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
          sessionId: sessionId || session?.id,
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

  const handleLoadDemo = () => {
    setSessionId("demo_dfs");
    fetchSession("demo_dfs");
  };

  const getEffectiveSessionId = (): string | undefined => {
    if (sessionId && sessionId.trim().length > 0) return sessionId.trim();
    if (session?.id && session.id.trim().length > 0) return session.id.trim();
    if (typeof window !== "undefined") {
      const urlSession = new URLSearchParams(window.location.search).get("sessionId");
      if (urlSession && urlSession.trim().length > 0) return urlSession.trim();
      const stored = sessionStorage.getItem("archaia_session_id");
      if (stored && stored.trim().length > 0) return stored.trim();
    }
    return undefined;
  };

  const getRecoveryHref = () => {
    const sId = getEffectiveSessionId();
    const params = new URLSearchParams();
    if (sId) params.set("sessionId", sId);
    if (session?.likelyRootGapId || session?.targetConceptId) {
      params.set("conceptId", session.likelyRootGapId || session.targetConceptId);
    }
    if (session?.targetConceptId) {
      params.set("fromTarget", session.targetConceptId);
    }
    return `/recovery${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* 4-Step Cognitive Diagnostic Pipeline Stepper */}
      <CognitivePipelineStepper
        currentStep={2}
        sessionId={getEffectiveSessionId()}
        activeConceptName={session?.targetConceptId}
        rootConceptName={session?.likelyRootGapId}
        targetConceptId={session?.targetConceptId}
        misconceptionId={session?.detectedMisconceptionId}
      />

      {/* Mode Indicator & Switcher Banner */}
      <ContentModeBanner onModeChange={() => fetchSession()} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Split className="w-5 h-5 text-amber-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Cognitive Bisect Investigation (Step 2)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Algorithmic prerequisite fault isolation over the Causal Knowledge Graph. Issues targeted invariant micro-probes to isolate the Likely Root Gap.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {sessionId === "demo_dfs" && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Demo Investigation
            </span>
          )}
          <button
            onClick={() => fetchSession()}
            className="p-1.5 rounded-lg bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border text-slate-400 hover:text-white btn-interactive-subtle"
            title="Refresh Bisect Session"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ARCHAIA Signature Interaction Visual Workflow Ribbon */}
      <div className="p-3.5 rounded-2xl bg-[#0E1117] border border-[#282E3D] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-sans">
          <span className="text-slate-400 font-medium">Bisection Diagnostic Sequence:</span>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
              Candidate Concepts
            </span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">
              Diagnostic Probe
            </span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Student Response
            </span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
              Evidence
            </span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
              Candidate Narrowing
            </span>
            <span className="text-slate-600">→</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
              Likely Root Gap
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl bg-archaia-dark border border-archaia-border flex items-center justify-center">
          <div className="flex items-center space-x-3 text-amber-400 text-xs font-medium">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Computing Topological Prerequisite Ancestor Bisection...</span>
          </div>
        </div>
      ) : !session ? (
        /* Clean Empty State when No Active Session exists */
        <div className="p-8 rounded-2xl bg-archaia-dark border border-archaia-border flex flex-col items-center justify-center text-center space-y-4 card-interactive">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Split className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-bold text-white">No Active Cognitive Bisect Session</h3>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Cognitive Bisect traverses the causal ancestors of an identified misconception. Submit a response in the Cognitive Bug Detector or launch the benchmark demo investigation.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/detector"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm flex items-center space-x-1.5 btn-interactive"
            >
              <span>Start Diagnostic in Step 1</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleLoadDemo}
              className="px-4 py-2.5 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center space-x-1.5 btn-interactive-subtle"
            >
              <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Try Demo Investigation</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Ancestor Bisection Chain & Dynamic Candidate Narrowing */}
          <div className="p-5 rounded-2xl bg-archaia-card border border-archaia-border space-y-4 shadow-md card-interactive">
            <div className="flex items-center justify-between text-xs font-medium border-b border-archaia-border pb-3">
              <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Topological Prerequisite Ancestor Chain (Foundations → Target)</span>
              </span>
              <span className="text-amber-400 font-mono text-[11px]">
                {session.investigatedConcepts.length} / {session.ancestorChain.length} Investigated
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {session.ancestorChain.map((cId, idx) => {
                const isInvestigated = session.investigatedConcepts.includes(cId);
                const isRootCandidate = session.likelyRootGapId === cId;
                const isCurrentProbe = session.currentProbe?.conceptId === cId;
                const probeResult = session.probesAnswered.find((p) => p.conceptId === cId);

                return (
                  <div
                    key={cId}
                    className={`p-3 rounded-xl border text-xs font-sans transition-all duration-300 flex flex-col justify-between space-y-2 ${
                      isRootCandidate
                        ? "bg-rose-950/80 border-rose-500 text-rose-200 shadow-md ring-1 ring-rose-500/50"
                        : isCurrentProbe
                        ? "bg-amber-950/70 border-amber-500 text-amber-200 animate-pulse font-semibold shadow-md"
                        : isInvestigated && probeResult?.isCorrect
                        ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 opacity-80"
                        : isInvestigated
                        ? "bg-slate-900 border-slate-700 text-slate-300"
                        : "bg-archaia-dark border-archaia-border text-slate-400 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">Step {idx + 1}</span>
                      {isRootCandidate ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/25 text-rose-300 uppercase">
                          Root Candidate
                        </span>
                      ) : isCurrentProbe ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/25 text-amber-300 uppercase">
                          Active Probe
                        </span>
                      ) : isInvestigated && probeResult?.isCorrect ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-500/20 text-emerald-300">
                          Preserved ✓
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Candidate</span>
                      )}
                    </div>

                    <div className="font-semibold text-white truncate text-xs">{cId}</div>

                    {/* Candidate Support Bar */}
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isRootCandidate
                            ? "bg-rose-500 w-[92%]"
                            : isCurrentProbe
                            ? "bg-amber-400 w-[65%]"
                            : isInvestigated && probeResult?.isCorrect
                            ? "bg-emerald-400 w-[15%]"
                            : "bg-blue-500 w-[45%]"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Diagnostic Micro-Probe */}
          {session.currentProbe && session.status === "active" ? (
            <div className="p-6 rounded-2xl bg-archaia-dark border border-blue-500/40 shadow-xl space-y-5 animate-in slide-in-from-bottom-4 card-interactive">
              <div className="flex items-center justify-between border-b border-archaia-border pb-3">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    MICRO-PROBE IN PROGRESS
                  </span>
                  <span className="text-xs text-slate-400">
                    Probing Prerequisite: <strong className="text-white">{session.currentProbe.conceptId}</strong>
                  </span>
                </div>
                <span className="text-[11px] text-blue-400 font-mono">
                  Invariant: {session.currentProbe.invariantTested}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {session.currentProbe.question}
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  {session.currentProbe.rationale}
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                {session.currentProbe.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(session.currentProbe!.id, opt.id)}
                    disabled={submittingOptionId !== null}
                    className="w-full text-left p-4 rounded-xl bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border hover:border-blue-500/50 transition-all flex items-start space-x-3 group btn-interactive"
                  >
                    <span className="w-5 h-5 rounded-full border border-archaia-border group-hover:border-blue-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-medium text-slate-400">
                      {submittingOptionId === opt.id ? "…" : "•"}
                    </span>
                    <span className="text-xs text-slate-200 group-hover:text-white leading-relaxed font-sans">
                      {opt.text}
                    </span>
                  </button>
                ))}
              </div>

              {feedback && (
                <div className="p-3 rounded-xl bg-archaia-card border border-blue-500/30 text-xs font-sans text-blue-300 animate-in fade-in">
                  {feedback}
                </div>
              )}
            </div>
          ) : null}

          {/* Likely Root Gap Announcement Banner */}
          {session.status === "concluded" && (
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-amber-950/50 via-[#141722] to-slate-900 border border-amber-500/40 shadow-xl space-y-5 animate-in zoom-in-95 card-interactive">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-archaia-border pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Flame className="w-8 h-8 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                      STEP 2 OF 4 COMPLETED: LIKELY ROOT GAP ISOLATED
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                      Likely Root Gap: {rootConcept?.name || session.likelyRootGapId}
                    </h2>
                  </div>
                </div>

                <Link
                  href={getRecoveryHref()}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-transform hover:scale-105 shrink-0 btn-interactive"
                >
                  <span>Proceed to Step 3: Targeted Recovery Lab →</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-amber-200 leading-relaxed font-sans font-medium">
                  {session.conclusionReason}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  The error observed in your input regarding <strong>{session.targetConceptId}</strong> is rooted in an unverified invariant in prerequisite <strong>{rootConcept?.name || session.likelyRootGapId}</strong>. Remediation must now target this root concept.
                </p>
              </div>

              {/* Diagnostic Evidence Trail */}
              <div className="p-4 rounded-xl bg-archaia-card border border-archaia-border space-y-2">
                <div className="text-xs font-semibold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Collected Diagnostic Evidence Trail:</span>
                </div>
                <div className="space-y-1.5 text-xs font-sans">
                  {session.probesAnswered.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-archaia-dark/60 text-slate-400"
                    >
                      <span className="font-medium">Concept: {p.conceptId}</span>
                      <span className={p.isCorrect ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                        {p.isCorrect ? "Invariant Preserved (Passed)" : "Invariant Broken (Gap Confirmed)"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bug,
  FileCode,
  ListOrdered,
  CheckSquare,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Lightbulb,
  Split,
  HelpCircle,
  Plus,
  Trash2,
  FileCheck2,
  CheckCircle2,
  Edit3,
  RotateCcw,
  PlayCircle,
  XCircle,
  FileText,
  FolderOpen,
  UploadCloud,
  BookOpen,
} from "lucide-react";
import { ResponseType, Misconception, CourseMaterial, AppContentMode } from "@/lib/types";
import CognitivePipelineStepper from "@/components/navigation/CognitivePipelineStepper";
import ContentModeBanner from "@/components/mode/ContentModeBanner";
import StagedScanSequence from "@/components/detector/StagedScanSequence";
import ShadesFluidBlob from "@/components/decorations/ShadesFluidBlob";
import { SEED_DEMO_INVESTIGATION } from "@/lib/storage/initialData";

export default function DetectorPage() {
  const router = useRouter();
  const [responseType, setResponseType] = useState<ResponseType>("written");

  // Mode: Curated benchmark demo vs Custom real user input
  const [isDemo, setIsDemo] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<AppContentMode>("demo");
  const [activeCourse, setActiveCourse] = useState<CourseMaterial | null>(null);

  // Staged Scan Motion Animation state
  const [showStagedScan, setShowStagedScan] = useState(false);
  const [pendingAnalysisData, setPendingAnalysisData] = useState<any>(null);

  // Default fields start completely empty for real users, but hydrated with canonical seed in demo mode
  const [customConceptName, setCustomConceptName] = useState("");
  const [conceptId, setConceptId] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [writtenInput, setWrittenInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [mcqSelected, setMcqSelected] = useState<string>("");
  const [steps, setSteps] = useState<string[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  // Form field refs for accessibility and focus management
  const topicInputRef = useRef<HTMLInputElement | null>(null);
  const questionInputRef = useRef<HTMLInputElement | null>(null);
  const reasoningInputRef = useRef<HTMLTextAreaElement | null>(null);
  const codeInputRef = useRef<HTMLTextAreaElement | null>(null);
  const mcqInputRef = useRef<HTMLInputElement | null>(null);
  const stepsInputRef = useRef<HTMLTextAreaElement | null>(null);
  const quizInputRef = useRef<HTMLTextAreaElement | null>(null);
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);

  // Validation & Error states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // File Manager Import State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importingFile, setImportingFile] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [detectedMisconception, setDetectedMisconception] = useState<Misconception | null>(null);
  const [normalizedReasoning, setNormalizedReasoning] = useState<string | null>(null);
  const [submittedSnapshot, setSubmittedSnapshot] = useState<{
    topic: string;
    question: string;
    answer: string;
    evidence?: string;
  } | null>(null);

  const [verifiedResult, setVerifiedResult] = useState<{
    message: string;
    masteryScore?: number;
    conceptId?: string;
    normalizedReasoning?: string;
  } | null>(null);

  // Read URL query params & sessionStorage prefill
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check for prefilled data from login file intake pipeline
      const prefillTopic = sessionStorage.getItem("archaia_prefill_topic");
      const prefillQuestion = sessionStorage.getItem("archaia_prefill_question");
      const prefillAnswer = sessionStorage.getItem("archaia_prefill_answer");
      const prefillCode = sessionStorage.getItem("archaia_prefill_code");

      if (prefillTopic || prefillQuestion || prefillAnswer || prefillCode) {
        setIsDemo(false);
        if (prefillTopic) setCustomConceptName(prefillTopic);
        if (prefillQuestion) setQuestionText(prefillQuestion);
        if (prefillAnswer) setWrittenInput(prefillAnswer);
        if (prefillCode) {
          setCodeInput(prefillCode);
          setResponseType("code");
        } else {
          setResponseType("written");
        }
        setImportMessage(`Loaded Problem Statement from File Manager: "${prefillTopic || "Custom Topic"}"`);
        setTimeout(() => setImportMessage(null), 5000);
        sessionStorage.removeItem("archaia_prefill_topic");
        sessionStorage.removeItem("archaia_prefill_question");
        sessionStorage.removeItem("archaia_prefill_answer");
        sessionStorage.removeItem("archaia_prefill_code");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const urlDemo = params.get("demo");
      const urlConcept = params.get("concept");
      const urlPrompt = params.get("prompt");
      const urlCode = params.get("code");
      const urlSession = params.get("sessionId");

      if (urlSession) {
        setActiveSessionId(urlSession);
      }

      if (urlDemo === "true") {
        handleLoadDfsDemo();
      } else if (urlConcept || urlPrompt || urlCode) {
        setIsDemo(false);
        if (urlConcept) setCustomConceptName(urlConcept);
        if (urlPrompt) setQuestionText(urlPrompt);
        if (urlCode) {
          setResponseType("code");
          setCodeInput(urlCode);
        } else if (urlPrompt) {
          setWrittenInput(urlPrompt);
        }
      } else {
        // P0 FIX: Fresh page in demo mode - immediately hydrate with canonical demo seed!
        handleLoadDfsDemo();
      }
    }
  }, []);

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingFile(true);
    setApiError(null);
    try {
      const text = await file.text();
      const res = await fetch("/api/analyze-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileContent: text,
          fileSize: file.size,
        }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setIsDemo(false);
        setCustomConceptName(data.analysis.topic);
        setQuestionText(data.analysis.problemStatement);
        setWrittenInput(data.analysis.suggestedAnswer);
        if (data.analysis.codeSnippet) {
          setCodeInput(data.analysis.codeSnippet);
          setResponseType("code");
        } else {
          setResponseType("written");
        }
        setImportMessage(`Imported "${file.name}": Formulated Problem Statement for ${data.analysis.topic}`);
        setTimeout(() => setImportMessage(null), 6000);
      } else {
        setApiError(data.error || "Failed to analyze imported file.");
      }
    } catch {
      setApiError("Error reading imported file from file manager.");
    } finally {
      setImportingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Action 1: Start Clean New Diagnostic Session
  const handleStartNewDiagnostic = () => {
    setIsDemo(false);
    setCustomConceptName("");
    setConceptId("");
    setQuestionText("");
    setWrittenInput("");
    setCodeInput("");
    setMcqSelected("");
    setSteps([]);
    setQuizAnswers({});
    setValidationError(null);
    setApiError(null);
    setDetectedMisconception(null);
    setVerifiedResult(null);
    setSubmittedSnapshot(null);
    setActiveSessionId(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("archaia_session_id");
      window.history.replaceState({}, "", "/detector");
    }
    setTimeout(() => {
      topicInputRef.current?.focus();
    }, 50);
  };

  // Action 2: Load Isolated DFS Demo Investigation from Canonical Seed
  const handleLoadDfsDemo = () => {
    setIsDemo(true);
    setConceptId(SEED_DEMO_INVESTIGATION.conceptId);
    setCustomConceptName(SEED_DEMO_INVESTIGATION.conceptName);
    setQuestionText(SEED_DEMO_INVESTIGATION.questionText);
    setWrittenInput(SEED_DEMO_INVESTIGATION.writtenInput);
    setCodeInput(SEED_DEMO_INVESTIGATION.codeInput);
    setResponseType(SEED_DEMO_INVESTIGATION.responseType);
    setValidationError(null);
    setApiError(null);
    setActiveSessionId(SEED_DEMO_INVESTIGATION.sessionId);
  };

  const getPayloadContent = () => {
    switch (responseType) {
      case "code":
        return codeInput;
      case "mcq":
        return mcqSelected;
      case "steps":
        return steps.join("\n");
      case "quiz":
        return Object.entries(quizAnswers)
          .map(([k, v]) => `${k}: ${v}`)
          .join("; ");
      default:
        return writtenInput;
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setApiError(null);

    const activeTopic = (customConceptName || conceptId || "").trim();
    if (!activeTopic) {
      setValidationError("Enter a topic or concept.");
      topicInputRef.current?.focus();
      return;
    }

    if (!questionText.trim()) {
      setValidationError("Enter the question or problem.");
      questionInputRef.current?.focus();
      return;
    }

    const content = getPayloadContent();
    if (!content || !content.trim()) {
      setValidationError("Add your reasoning, answer, or code before analyzing.");
      if (responseType === "written") reasoningInputRef.current?.focus();
      else if (responseType === "code") codeInputRef.current?.focus();
      else if (responseType === "mcq") mcqInputRef.current?.focus();
      else if (responseType === "steps") stepsInputRef.current?.focus();
      else if (responseType === "quiz") quizInputRef.current?.focus();
      return;
    }

    setAnalyzing(true);
    setDetectedMisconception(null);
    setVerifiedResult(null);

    try {
      const activeId = activeTopic.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conceptId: activeId,
          conceptName: activeTopic,
          questionId: "q_" + responseType + "_" + Date.now(),
          questionText,
          responseType,
          content,
          code: responseType === "code" ? codeInput : undefined,
          mcqSelected,
          steps,
          sessionId: isDemo ? "demo_dfs" : (activeSessionId || undefined),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setApiError(data.error || "Diagnostic analysis failed. Please verify your input and try again.");
        return;
      }

      setPendingAnalysisData({
        data,
        activeTopic,
        questionText,
        content,
        activeId,
      });
      setShowStagedScan(true);
    } catch (err: any) {
      console.error(err);
      setApiError("Network connection error. Unable to reach diagnostic engine. Please retry.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleScanComplete = () => {
    setShowStagedScan(false);
    if (!pendingAnalysisData) return;
    const { data, activeTopic, questionText, content, activeId } = pendingAnalysisData;

    const returnedSessionId = data.sessionId || data.diagnosticSessionId;
    if (returnedSessionId) {
      setActiveSessionId(returnedSessionId);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("archaia_session_id", returnedSessionId);
      }
    }

    setSubmittedSnapshot({
      topic: activeTopic,
      question: questionText,
      answer: content,
      evidence: data.evidence,
    });

    if (data.hasMisconception && data.misconception) {
      setDetectedMisconception(data.misconception);
      setNormalizedReasoning(data.normalizedReasoning);
    } else {
      setVerifiedResult({
        message: data.explanation || data.message || "Mental model invariant verified against formal reality.",
        masteryScore: data.masteryScore || 92,
        conceptId: activeId,
        normalizedReasoning: data.normalizedReasoning,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* 4-Step Cognitive Diagnostic Pipeline Stepper */}
      <CognitivePipelineStepper
        currentStep={1}
        sessionId={activeSessionId || undefined}
        activeConceptName={customConceptName || conceptId || undefined}
        targetConceptId={detectedMisconception?.conceptId}
        misconceptionId={detectedMisconception?.id}
      />

      {/* Mode Indicator & Switcher Banner */}
      <ContentModeBanner
        onModeChange={(newMode, course) => {
          setCurrentMode(newMode);
          setActiveCourse(course || null);
          if (newMode === "demo") {
            setIsDemo(true);
          } else {
            setIsDemo(false);
          }
        }}
      />

      {/* Header with Editorial Presentation Typography */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="shades-subtitle text-rose-300/80">01. STAGE ONE • INVARIANT SCAN</span>
          <h1 className="font-editorial text-2xl sm:text-3xl lg:text-4xl font-medium text-white flex items-center space-x-2.5">
            <Bug className="w-6 h-6 text-rose-400" />
            <span>Misconception Detector</span>
          </h1>
          <p className="text-xs text-slate-300 font-sans">
            Enter any computer science concept, question, and student reasoning. The engine isolates mental model invariants against formal computing reality.
          </p>
        </div>

        {/* Action Controls: New Diagnostic vs Load Isolated Demo vs Import File */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden File Input for File Manager Import */}
          <input
            ref={fileInputRef}
            id="detector-file-input"
            name="file"
            type="file"
            className="hidden"
            onChange={handleFileImport}
            accept=".sql,.py,.java,.cpp,.c,.js,.ts,.txt,.md,.json,.rs,.go"
            aria-label="Import code or notes from file manager"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importingFile}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-rose-500/35 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition-colors"
          >
            {importingFile ? (
              <Sparkles className="w-3.5 h-3.5 animate-spin text-rose-400" />
            ) : (
              <FolderOpen className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>{importingFile ? "Analyzing File..." : "Import File"}</span>
          </button>

          <button
            type="button"
            onClick={handleStartNewDiagnostic}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-[#11141e] hover:bg-[#181c28] text-slate-300 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Form</span>
          </button>

          <button
            type="button"
            onClick={handleLoadDfsDemo}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isDemo
                ? "bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                : "border-white/[0.08] bg-[#11141e] hover:bg-[#181c28] text-slate-400 hover:text-white"
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Demo Investigation</span>
          </button>
        </div>
      </div>

      {/* File Import Success Banner */}
      {importMessage && (
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-xs text-blue-200 animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{importMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setImportMessage(null)}
            className="text-[11px] text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Demo Mode Indicator Banner */}
      {isDemo && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center space-x-2">
            <span className="font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40">
              Curated Demo Mode
            </span>
            <span>Graph DFS Loop Resumption benchmark loaded. This session is completely isolated from real user data.</span>
          </div>
          <button
            type="button"
            onClick={handleStartNewDiagnostic}
            className="text-[11px] underline hover:text-white font-medium"
          >
            Switch to Custom Input
          </button>
        </div>
      )}

      {/* Input Modality Form Card */}
      <div className="card-shades p-6 sm:p-7 rounded-2xl space-y-5">
        {/* Modality Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
          <span className="text-xs font-medium text-slate-300">Response Modality:</span>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Response Modalities">
            {[
              { id: "written", label: "Written Text", icon: HelpCircle },
              { id: "code", label: "Code Snippet", icon: FileCode },
              { id: "mcq", label: "Multiple Choice", icon: CheckSquare },
              { id: "steps", label: "Problem Steps", icon: ListOrdered },
              { id: "quiz", label: "Quiz Response", icon: FileCheck2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = responseType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-pressed={isSelected}
                  onClick={() => setResponseType(tab.id as ResponseType)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-rose-500 text-white shadow-[0_0_14px_rgba(244,63,94,0.35)]"
                      : "bg-[#11141e] hover:bg-[#181c28] border border-white/[0.08] text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form id="detector-form" onSubmit={handleAnalyze} className="space-y-4">
          {/* Active Course Concepts Quick Selector */}
          {currentMode === "course" && activeCourse?.concepts && activeCourse.concepts.length > 0 && (
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-purple-300 flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  <span>Active Course Concepts ({activeCourse.title}):</span>
                </span>
                <span className="text-[11px] text-slate-400 font-sans">Click to test concept invariant</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeCourse.concepts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCustomConceptName(c.name);
                      setConceptId(c.id);
                      setQuestionText(`What formal invariant governs ${c.name} across execution boundaries?`);
                      setWrittenInput("");
                      setValidationError(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-sans border transition-all ${
                      customConceptName === c.name
                        ? "bg-rose-500 text-white border-rose-400 font-semibold shadow-sm"
                        : "bg-[#11141e] hover:bg-[#181c28] border-white/[0.08] text-slate-300 hover:text-white"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="detector-concept" className="block text-xs font-medium text-slate-300 mb-1">
                Topic / Concept Name: <span className="text-rose-400">*</span>
              </label>
              <input
                id="detector-concept"
                name="concept"
                ref={topicInputRef}
                type="text"
                value={customConceptName}
                aria-required="true"
                aria-invalid={validationError?.includes("topic") || validationError?.includes("concept") ? "true" : "false"}
                aria-describedby="detector-concept-desc"
                onChange={(e) => {
                  setCustomConceptName(e.target.value);
                  setValidationError(null);
                }}
                placeholder="e.g. Graph Traversal (DFS), Memory Pointer Aliasing..."
                className="w-full px-3 py-2.5 rounded-xl bg-[#090b10] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none input-focus-glow font-sans"
              />
              <span id="detector-concept-desc" className="sr-only">
                Enter the name of the concept or topic under diagnostic investigation.
              </span>
            </div>

            <div>
              <label htmlFor="detector-session-id" className="block text-xs font-medium text-slate-300 mb-1">
                Pipeline Session:
              </label>
              <input
                id="detector-session-id"
                name="sessionId"
                type="text"
                readOnly
                value={activeSessionId || "New Diagnostic Session"}
                className="w-full px-3 py-2.5 rounded-xl bg-[#090b10] border border-white/[0.08] text-xs text-rose-300 font-mono truncate focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="detector-question" className="block text-xs font-medium text-slate-300 mb-1">
              Assessment Prompt / Question: <span className="text-rose-400">*</span>
            </label>
            <input
              id="detector-question"
              name="questionText"
              ref={questionInputRef}
              type="text"
              value={questionText}
              aria-required="true"
              aria-invalid={validationError?.includes("question") ? "true" : "false"}
              aria-describedby="detector-question-desc"
              onChange={(e) => {
                setQuestionText(e.target.value);
                setValidationError(null);
              }}
              placeholder="e.g. In recursive DFS, what happens to the execution state when a child returns?"
              className="w-full px-3 py-2.5 rounded-xl bg-[#090b10] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none input-focus-glow font-sans"
            />
            <span id="detector-question-desc" className="sr-only">
              The specific question prompt or algorithmic problem scenario.
            </span>
          </div>

          {/* DYNAMIC MODALITY INPUT FIELDS */}

          {/* 1. Written Explanation */}
          {responseType === "written" && (
            <div className="space-y-1.5">
              <label htmlFor="detector-written" className="block text-xs font-medium text-slate-300">
                Your Answer / Reasoning to Diagnose: <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="detector-written"
                name="writtenResponse"
                ref={reasoningInputRef}
                value={writtenInput}
                aria-required="true"
                aria-invalid={validationError?.includes("reasoning") || validationError?.includes("answer") ? "true" : "false"}
                aria-describedby="detector-written-desc"
                onChange={(e) => {
                  setWrittenInput(e.target.value);
                  setValidationError(null);
                }}
                rows={4}
                placeholder="Explain your understanding or reasoning..."
                className="w-full p-3 rounded-xl bg-[#090b10] border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none input-focus-glow font-sans leading-relaxed resize-none"
              />
              <span id="detector-written-desc" className="sr-only">
                Explain your mental model and reasoning for automated misconception analysis.
              </span>
            </div>
          )}

          {/* 2. Code Snippet */}
          {responseType === "code" && (
            <div className="space-y-1.5">
              <label htmlFor="detector-code" className="block text-xs font-medium text-slate-300">
                Code Snippet / Implementation: <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="detector-code"
                name="codeResponse"
                ref={codeInputRef}
                value={codeInput}
                aria-required="true"
                aria-invalid={validationError?.includes("code") ? "true" : "false"}
                onChange={(e) => {
                  setCodeInput(e.target.value);
                  setValidationError(null);
                }}
                rows={6}
                placeholder="Paste code snippet here..."
                className="w-full p-3 rounded-xl bg-[#06070a] border border-white/[0.08] text-xs text-emerald-400 font-mono leading-relaxed resize-none focus:outline-none input-focus-glow"
              />
            </div>
          )}

          {/* 3. Multiple Choice */}
          {responseType === "mcq" && (
            <div className="space-y-1.5">
              <label htmlFor="detector-mcq" className="block text-xs font-medium text-slate-300">
                Your Selected Choice: <span className="text-rose-400">*</span>
              </label>
              <input
                id="detector-mcq"
                name="mcqSelected"
                ref={mcqInputRef}
                type="text"
                value={mcqSelected}
                aria-required="true"
                aria-invalid={validationError?.includes("choice") || validationError?.includes("selected") ? "true" : "false"}
                onChange={(e) => {
                  setMcqSelected(e.target.value);
                  setValidationError(null);
                }}
                placeholder="Enter choice or reasoning text..."
                className="w-full px-3 py-2.5 rounded-xl bg-[#090b10] border border-white/[0.08] text-xs text-white focus:outline-none input-focus-glow font-sans"
              />
            </div>
          )}

          {/* 4. Problem Steps */}
          {responseType === "steps" && (
            <div className="space-y-1.5">
              <label htmlFor="detector-steps" className="block text-xs font-medium text-slate-300">
                Execution Steps (one per line): <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="detector-steps"
                name="steps"
                ref={stepsInputRef}
                value={steps.join("\n")}
                aria-required="true"
                onChange={(e) => {
                  setSteps(e.target.value.split("\n"));
                  setValidationError(null);
                }}
                rows={4}
                placeholder="1. Step one&#10;2. Step two&#10;3. Step three"
                className="w-full p-3 rounded-xl bg-[#090b10] border border-white/[0.08] text-xs text-white focus:outline-none input-focus-glow font-sans resize-none"
              />
            </div>
          )}

          {/* 5. Structured Quiz */}
          {responseType === "quiz" && (
            <div className="space-y-1.5">
              <label htmlFor="detector-quiz" className="block text-xs font-medium text-slate-300">
                Quiz Answers / Invariant Assertions: <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="detector-quiz"
                name="quizAnswers"
                ref={quizInputRef}
                value={Object.entries(quizAnswers)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join("\n")}
                aria-required="true"
                onChange={(e) => {
                  const lines = e.target.value.split("\n");
                  const obj: Record<string, string> = {};
                  lines.forEach((l, idx) => {
                    const [k, v] = l.split(":");
                    obj[k ? k.trim() : `q${idx + 1}`] = v ? v.trim() : "";
                  });
                  setQuizAnswers(obj);
                  setValidationError(null);
                }}
                rows={3}
                placeholder="Q1: assertion 1&#10;Q2: assertion 2"
                className="w-full p-3 rounded-xl bg-[#090b10] border border-white/[0.08] text-xs text-white focus:outline-none input-focus-glow font-sans resize-none"
              />
            </div>
          )}

          {/* Validation Error Message */}
          {validationError && (
            <div
              role="alert"
              aria-live="assertive"
              id="detector-validation-error"
              ref={errorSummaryRef}
              tabIndex={-1}
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2 text-rose-300 text-xs focus:outline-none"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* API Error Message with Retry */}
          {apiError && (
            <div
              role="alert"
              aria-live="assertive"
              id="detector-api-error"
              className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-200"
            >
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{apiError}</span>
              </div>
              <button
                type="button"
                onClick={handleAnalyze}
                className="px-3 py-1.5 rounded-lg btn-shades-primary text-white font-medium text-xs shrink-0 self-start sm:self-auto"
              >
                Retry Analysis
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-slate-400 font-sans">
              ARCHAIA analyzes submitted reasoning against formal domain specifications.
            </span>
            <button
              type="submit"
              disabled={analyzing}
              className="flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl btn-shades-primary disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {analyzing
                  ? `Analyzing "${customConceptName || "Topic"}"...`
                  : "Analyze & Begin Investigation"}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Staged Diagnostic Scan Sequence Motion Animation */}
      {showStagedScan && (
        <StagedScanSequence
          topic={customConceptName || conceptId || "Concept"}
          onComplete={handleScanComplete}
          durationMs={1500}
        />
      )}

      {/* Submitted Details Snapshot Display */}
      {submittedSnapshot && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs font-sans">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Analyzed Diagnostic Submission</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
            <div>
              <span className="text-slate-500 font-medium">Topic:</span>{" "}
              <strong className="text-white">{submittedSnapshot.topic}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Question:</span>{" "}
              <span className="text-slate-200">{submittedSnapshot.question}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-slate-500 font-medium">Your Reasoning / Answer:</span>
              <div className="mt-1 p-2.5 rounded-lg bg-black/40 border border-slate-800 text-slate-200 font-mono text-[11px] whitespace-pre-wrap">
                {submittedSnapshot.answer}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Misconception Detection Card Output */}
      {detectedMisconception && (
        <div className="p-6 rounded-2xl bg-archaia-dark border border-rose-500/40 shadow-sm space-y-5 animate-in slide-in-from-bottom-4">
          {/* STEP 1 CONTINUATION BANNER */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-[#181a24] to-slate-900 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                  Step 1 of 4 Completed
                </span>
                <span className="text-xs font-semibold text-white">
                  Mental Model Deconstructed
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans">
                A cognitive gap was identified in <strong>{customConceptName || detectedMisconception.conceptId}</strong>. We must now trace the prerequisite ancestor chain on the Causal DAG to isolate the root cause.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const sId = activeSessionId || (typeof window !== "undefined" ? sessionStorage.getItem("archaia_session_id") : null);
                router.push(
                  `/bisect?sessionId=${sId || ""}&conceptId=${detectedMisconception.conceptId}&misconceptionId=${detectedMisconception.id}`
                );
              }}
              className="shrink-0 flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-transform hover:scale-105"
            >
              <Split className="w-4 h-4" />
              <span>Proceed to Step 2: Cognitive Bisect →</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-archaia-border pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                    Misconception Isolated
                  </span>
                  <span className="text-xs font-semibold text-blue-400">
                    Confidence: {detectedMisconception.confidence}%
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {detectedMisconception.name}
                </h3>
              </div>
            </div>

            <Link
              href={`/graph?sessionId=${activeSessionId || ""}&highlight=${detectedMisconception.conceptId}`}
              className="text-xs text-blue-400 hover:underline font-sans font-medium flex items-center space-x-1"
            >
              <span>View Target on Causal DAG →</span>
            </Link>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {detectedMisconception.description}
          </p>

          {/* Student Assumption vs Formal Reality Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/60 space-y-2">
              <div className="flex items-center space-x-2 text-rose-400 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Student's Flawed Assumption</span>
              </div>
              <p className="text-xs text-rose-200 leading-relaxed font-sans">
                "{detectedMisconception.studentAssumption}"
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/60 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold">
                <Lightbulb className="w-4 h-4" />
                <span>Formal Computing Reality</span>
              </div>
              <p className="text-xs text-emerald-200 leading-relaxed font-sans">
                {detectedMisconception.formalReality}
              </p>
            </div>
          </div>

          {/* Evidence from Student Input */}
          {detectedMisconception.evidence && (
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-sans text-slate-300 space-y-1">
              <strong className="text-slate-400">Evidence from Response:</strong>
              <div className="font-mono text-[11px] text-amber-300">
                {detectedMisconception.evidence}
              </div>
            </div>
          )}

          {/* Affected Concepts Identification */}
          <div className="pt-2 border-t border-archaia-border flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 font-sans">
              <span className="text-slate-400">Prerequisite Ancestors to Probe:</span>
              <div className="flex flex-wrap gap-1.5">
                {detectedMisconception.affectedConcepts.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded bg-archaia-card border border-archaia-border text-blue-300 text-[11px] font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const sId = (activeSessionId && activeSessionId.trim()) || (typeof window !== "undefined" ? sessionStorage.getItem("archaia_session_id")?.trim() : null);
                const query = new URLSearchParams();
                if (sId) query.set("sessionId", sId);
                query.set("conceptId", detectedMisconception.conceptId);
                query.set("misconceptionId", detectedMisconception.id);
                router.push(`/bisect?${query.toString()}`);
              }}
              className="text-amber-400 hover:text-amber-300 font-semibold text-xs flex items-center space-x-1"
            >
              <span>Launch Prerequisite Bisect Traversal →</span>
            </button>
          </div>
        </div>
      )}

      {/* Verified Sound Model Output Card */}
      {verifiedResult && (
        <div className="p-6 rounded-2xl bg-archaia-dark border border-emerald-500/40 shadow-sm space-y-5 animate-in slide-in-from-bottom-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-archaia-border pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-sans">
                    Mental Model Invariant Verified
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 font-sans">
                    Mastery: {verifiedResult.masteryScore}%
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5 font-sans">
                  No Cognitive Misconception Detected
                </h3>
              </div>
            </div>

            <Link
              href={`/graph?sessionId=${activeSessionId || ""}`}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-transform hover:scale-105"
            >
              <span>View Verified Node on DAG →</span>
            </Link>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {verifiedResult.message}
          </p>

          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs font-sans text-emerald-200">
            <strong>Normalized Formal Reasoning:</strong> {verifiedResult.normalizedReasoning}
          </div>
        </div>
      )}
    </div>
  );
}

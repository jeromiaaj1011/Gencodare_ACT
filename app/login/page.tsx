"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  Shield,
  ArrowRight,
  Brain,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  User,
  Sparkles,
  FolderOpen,
  UploadCloud,
  FileCode,
  FileText,
  Copy,
  Check,
  RotateCcw,
  FileUp,
  Code2,
} from "lucide-react";
import ArchaiaLogo from "@/components/ArchaiaLogo";
import CyberMeshBackground from "@/components/CyberMeshBackground";
import LoginConceptGraph from "@/components/LoginConceptGraph";

export default function LoginPage() {
  const router = useRouter();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [pipelineMode, setPipelineMode] = useState<"credentials" | "file_upload">("credentials");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("student@college.edu");
  const [password, setPassword] = useState("Archaia2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"learner" | "instructor" | "researcher">("learner");

  // File Manager Upload State
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [analyzingFile, setAnalyzingFile] = useState(false);
  const [fileAnalysis, setFileAnalysis] = useState<any | null>(null);
  const [copiedProblem, setCopiedProblem] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);

  // Check if user is already authenticated
  React.useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          localStorage.setItem("archaia_user", JSON.stringify(data.user));
          router.replace("/dashboard");
        }
      })
      .catch(() => {});
  }, [router]);

  // Quick Fill Sample Accounts
  const fillCredentials = (type: "student" | "instructor" | "researcher") => {
    setIsRegisterMode(false);
    setErrorMessage(null);
    if (type === "student") {
      setEmail("student@college.edu");
      setPassword("Archaia2026!");
    } else if (type === "instructor") {
      setEmail("admin@archaia.edu");
      setPassword("AdminRoot#2026");
    } else {
      setEmail("researcher@mit.edu");
      setPassword("CognitiveSci!2026");
    }
  };

  const handleQuickActivate = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "student@college.edu", password: "Archaia2026!" }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem("archaia_user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("archaia-auth-change"));
        setSuccessMessage("Workspace Activated! Initializing your cognitive profile...");
        setTimeout(() => router.push("/dashboard"), 500);
      }
    } catch {
      setErrorMessage("Could not activate workspace.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processFile = async (file: File) => {
    setAnalyzingFile(true);
    setFileError(null);
    setFileAnalysis(null);
    try {
      const text = await file.text();
      if (!text || text.trim().length === 0) {
        setFileError("The selected file is empty. Please choose a file containing code, notes, or an assignment.");
        return;
      }

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
      if (!res.ok || !data.success) {
        setFileError(data.error || "Failed to analyze file from file manager.");
        return;
      }

      setFileAnalysis(data.analysis);
    } catch (err: any) {
      console.error(err);
      setFileError("Error reading file from file manager. Please try again.");
    } finally {
      setAnalyzingFile(false);
    }
  };

  const handleCopyProblem = () => {
    if (!fileAnalysis?.problemStatement) return;
    navigator.clipboard.writeText(fileAnalysis.problemStatement);
    setCopiedProblem(true);
    setTimeout(() => setCopiedProblem(false), 2000);
  };

  const handleLaunchWithFile = async () => {
    if (!fileAnalysis) return;
    setIsSubmitting(true);
    try {
      // Ensure user session exists in background
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "student@college.edu", password: "Archaia2026!" }),
      }).catch(() => {});

      // Store prefilled diagnostic data
      if (typeof window !== "undefined") {
        sessionStorage.setItem("archaia_prefill_topic", fileAnalysis.topic);
        sessionStorage.setItem("archaia_prefill_question", fileAnalysis.problemStatement);
        sessionStorage.setItem("archaia_prefill_answer", fileAnalysis.suggestedAnswer);
        if (fileAnalysis.codeSnippet) {
          sessionStorage.setItem("archaia_prefill_code", fileAnalysis.codeSnippet);
        }
      }

      setSuccessMessage(`Problem Statement ready! Opening Cognitive Diagnostic for "${fileAnalysis.topic}"...`);
      setTimeout(() => {
        router.push("/detector");
      }, 500);
    } catch {
      router.push("/detector");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadSampleFile = (type: "sql" | "dfs" | "memory") => {
    let name = "transaction.sql";
    let sampleContent = "";

    if (type === "sql") {
      name = "payment_reconciliation.sql";
      sampleContent = `-- Transaction Isolation & Read Consistency
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
-- Read 1: Check account balance
SELECT balance FROM accounts WHERE user_id = 1042;
-- (External payment worker commits a deduction concurrently here)
-- Read 2: Verify account balance again within the same active transaction
SELECT balance FROM accounts WHERE user_id = 1042;
COMMIT;`;
    } else if (type === "dfs") {
      name = "graph_traversal.py";
      sampleContent = `# Recursive Graph Traversal
def dfs(graph, node, visited):
    visited.add(node)
    for neighbor in graph[node]:
        if neighbor not in visited:
            # Recursive child invocation
            dfs(graph, neighbor, visited)
    return visited`;
    } else {
      name = "buffer_allocation.cpp";
      sampleContent = `// Dynamic Memory Pointer Lifecycle
void process_packet(size_t size) {
    char* buffer = (char*)malloc(size);
    // Process network payload
    free(buffer);
    // Naive access after free
    buffer[0] = '\\0';
}`;
    }

    const blob = new Blob([sampleContent], { type: "text/plain" });
    const file = new File([blob], name, { type: "text/plain" });
    processFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const endpoint = isRegisterMode ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegisterMode
      ? { email, password, fullName, role }
      : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Authentication failed.");
        if (data.attemptsLeft !== undefined) {
          setAttemptsLeft(data.attemptsLeft);
        }
        return;
      }

      // Success
      if (data.user) {
        localStorage.setItem("archaia_user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("archaia-auth-change"));
      }

      setSuccessMessage(
        isRegisterMode
          ? `Profile created for ${data.user.fullName}! Initializing learner model...`
          : `Authenticated as ${data.user.fullName} (${data.user.role}). Redirecting...`
      );

      setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } catch (err: any) {
      setErrorMessage("Network error: Could not reach authentication server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Background Studio Ambient Canvas */}
      <CyberMeshBackground />

      <div className="relative z-10 w-full max-w-6xl mx-auto space-y-6 py-4">
        {/* Top Brand Banner & Sample Accounts Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center space-x-3.5 group cursor-pointer">
            <ArchaiaLogo size={42} className="w-10 h-10 group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-[0.2em] text-white uppercase font-sans">
                ARCHAIA
              </span>
              <span className="text-[11px] tracking-wide text-blue-400 font-sans -mt-0.5">
                Cognitive Learning Diagnostics
              </span>
            </div>
          </Link>

          {/* Sample Accounts Quick Fill */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs backdrop-blur-md">
            <span className="text-slate-400 px-2 flex items-center space-x-1 font-medium font-sans">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Sample Profiles:</span>
            </span>
            <button
              type="button"
              onClick={() => fillCredentials("student")}
              className="px-2.5 py-1 rounded-lg bg-archaia-card hover:bg-archaia-cardHover border border-slate-800 text-blue-400 text-[11px] font-medium transition-colors"
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("instructor")}
              className="px-2.5 py-1 rounded-lg bg-archaia-card hover:bg-archaia-cardHover border border-slate-800 text-indigo-300 text-[11px] font-medium transition-colors"
            >
              Instructor
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("researcher")}
              className="px-2.5 py-1 rounded-lg bg-archaia-card hover:bg-archaia-cardHover border border-slate-800 text-emerald-300 text-[11px] font-medium transition-colors"
            >
              Researcher
            </button>
          </div>
        </div>

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT COLUMN: Clean Card (5 cols on lg) */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto lg:mx-0">
            <div className="relative rounded-2xl bg-[#141722]/95 border border-[#282E3D] backdrop-blur-xl p-6 sm:p-8 shadow-xl space-y-5">
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2.5">
                  <ArchaiaLogo size={24} className="w-6 h-6" />
                  <span className="text-xs text-slate-300 font-sans">
                    {isRegisterMode ? "Create your profile on" : "Welcome to"}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-[0.2em] text-white uppercase font-sans">
                    ARCHAIA
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5 font-sans">
                    {isRegisterMode
                      ? "Register your student profile for personalized cognitive diagnostics."
                      : "Sign in to activate your diagnostic learning workspace."}
                  </p>
                </div>
              </div>

              {/* Pipeline Mode Switcher Tabs */}
              <div className="flex rounded-xl bg-[#0D1017] p-1 border border-[#282E3D]">
                <button
                  type="button"
                  onClick={() => {
                    setPipelineMode("credentials");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold font-sans flex items-center justify-center space-x-1.5 transition-all ${
                    pipelineMode === "credentials"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Account Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPipelineMode("file_upload");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold font-sans flex items-center justify-center space-x-1.5 transition-all ${
                    pipelineMode === "file_upload"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5 text-blue-300" />
                  <span>File Manager Intake</span>
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-blue-400/20 text-blue-200 border border-blue-400/30 font-medium">
                    Analysis
                  </span>
                </button>
              </div>

              {pipelineMode === "file_upload" ? (
                <div className="space-y-4">
                  {/* Hidden File Input connected to OS File Manager */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".sql,.py,.java,.cpp,.c,.js,.ts,.txt,.md,.json,.rs,.go"
                  />

                  {/* Header info */}
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 space-y-1">
                    <div className="font-semibold flex items-center space-x-1.5 text-blue-300">
                      <FolderOpen className="w-4 h-4" />
                      <span>Local File Manager Analysis Pipeline</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Select any code file, SQL script, or assignment from your computer. The engine will inspect the code, extract its domain invariants, and synthesize the exact <span className="text-white font-medium">Problem Statement</span>.
                    </p>
                  </div>

                  {/* Error Notification */}
                  {fileError && (
                    <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-sans flex items-start space-x-2 animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <div>{fileError}</div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] text-rose-300 underline hover:text-white font-medium"
                        >
                          Select another file from file manager
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Analyzing Spinner */}
                  {analyzingFile && (
                    <div className="p-6 rounded-xl bg-[#0D1017] border border-blue-500/30 text-center space-y-3 animate-pulse">
                      <div className="flex justify-center">
                        <Sparkles className="w-8 h-8 text-blue-400 animate-spin" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-white">
                          Analyzing File & Formulating Problem Statement...
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Detecting language, isolating conceptual invariants, synthesizing diagnostic challenge.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* File Upload Trigger Dropzone (shown when no analysis and not loading) */}
                  {!fileAnalysis && !analyzingFile && (
                    <div className="space-y-3">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group border-2 border-dashed border-blue-500/30 hover:border-blue-400/70 rounded-2xl p-6 text-center cursor-pointer bg-blue-500/5 hover:bg-blue-500/10 transition-all duration-200 space-y-3"
                      >
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mx-auto flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-500/20 transition-all">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-white">
                            Choose File from Local File Manager
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Supports .sql, .py, .java, .cpp, .c, .js, .ts, .txt, .md
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="py-1.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-sm inline-flex items-center space-x-1.5"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>Browse Files...</span>
                        </button>
                      </div>

                      {/* Fast Sample File Chips */}
                      <div className="pt-2 border-t border-[#282E3D]/80 space-y-1.5">
                        <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                          Or test immediately with a sample file:
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleLoadSampleFile("sql")}
                            className="w-full text-left p-2 rounded-lg bg-[#0D1017] hover:bg-[#181C26] border border-[#282E3D] text-xs text-slate-300 hover:text-white transition-colors flex items-center justify-between group"
                          >
                            <div className="flex items-center space-x-2">
                              <FileCode className="w-3.5 h-3.5 text-blue-400" />
                              <span className="font-mono text-[11px]">payment_reconciliation.sql</span>
                            </div>
                            <span className="text-[10px] text-slate-500 group-hover:text-blue-400">
                              SQL Isolation
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoadSampleFile("dfs")}
                            className="w-full text-left p-2 rounded-lg bg-[#0D1017] hover:bg-[#181C26] border border-[#282E3D] text-xs text-slate-300 hover:text-white transition-colors flex items-center justify-between group"
                          >
                            <div className="flex items-center space-x-2">
                              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="font-mono text-[11px]">graph_traversal.py</span>
                            </div>
                            <span className="text-[10px] text-slate-500 group-hover:text-indigo-400">
                              DFS Recursion
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoadSampleFile("memory")}
                            className="w-full text-left p-2 rounded-lg bg-[#0D1017] hover:bg-[#181C26] border border-[#282E3D] text-xs text-slate-300 hover:text-white transition-colors flex items-center justify-between group"
                          >
                            <div className="flex items-center space-x-2">
                              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="font-mono text-[11px]">buffer_allocation.cpp</span>
                            </div>
                            <span className="text-[10px] text-slate-500 group-hover:text-emerald-400">
                              Memory Safety
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Analyzed File Output Card */}
                  {fileAnalysis && !analyzingFile && (
                    <div className="space-y-3.5 animate-in fade-in">
                      {/* File Metadata Pill */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0D1017] border border-[#282E3D]">
                        <div className="flex items-center space-x-2 truncate">
                          <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="font-mono text-xs text-white truncate">
                            {fileAnalysis.fileName}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-semibold border border-blue-500/30">
                            {fileAnalysis.detectedLanguage}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {fileAnalysis.fileSize < 1024
                              ? `${fileAnalysis.fileSize} B`
                              : `${(fileAnalysis.fileSize / 1024).toFixed(1)} KB`}
                          </span>
                        </div>
                      </div>

                      {/* Topic Identification */}
                      <div className="p-2.5 rounded-xl bg-[#181C26] border border-[#282E3D] space-y-1">
                        <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                          Identified Topic
                        </div>
                        <div className="text-xs font-semibold text-white">
                          {fileAnalysis.topic}
                        </div>
                      </div>

                      {/* PROBLEM STATEMENT: PRIMARY HIGHLIGHT */}
                      <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-950/40 to-indigo-950/30 border border-blue-500/40 space-y-2 shadow-inner">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5 text-blue-300">
                            <Sparkles className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-bold uppercase tracking-wider">
                              Problem Statement
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyProblem}
                            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-[11px] text-blue-200 transition-colors"
                          >
                            {copiedProblem ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-300">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
                          {fileAnalysis.problemStatement}
                        </p>
                      </div>

                      {/* Key Concepts Tags */}
                      {fileAnalysis.keyConcepts && fileAnalysis.keyConcepts.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                            Key Invariants & Concepts
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {fileAnalysis.keyConcepts.map((c: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-[#0D1017] border border-[#282E3D] text-[10px] text-slate-300"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Naive Student Assumption / Trap Warning */}
                      {fileAnalysis.potentialMisconceptions && fileAnalysis.potentialMisconceptions.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                          <div className="text-[10px] uppercase font-semibold text-amber-300 tracking-wider flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Potential Mental Model Misconception</span>
                          </div>
                          <p className="text-[11px] text-amber-200/90 leading-relaxed font-sans">
                            {fileAnalysis.potentialMisconceptions[0]}
                          </p>
                        </div>
                      )}

                      {/* Primary Action Button: Launch into Diagnostic */}
                      <button
                        type="button"
                        onClick={handleLaunchWithFile}
                        disabled={isSubmitting}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-md transition-all border border-blue-400/40 cursor-pointer disabled:opacity-75"
                      >
                        <Sparkles className="w-4 h-4 text-blue-200" />
                        <span>Launch Cognitive Diagnostic with this Problem Statement →</span>
                      </button>

                      {/* Secondary Action: Select Another File */}
                      <button
                        type="button"
                        onClick={() => {
                          setFileAnalysis(null);
                          setFileError(null);
                          fileInputRef.current?.click();
                        }}
                        className="w-full py-2 px-3 rounded-lg border border-[#282E3D] bg-[#0D1017] hover:bg-[#181C26] text-slate-300 text-xs font-medium transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                        <span>Choose another file from File Manager</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 1-Click Instant Activation Banner */}
              <button
                type="button"
                onClick={handleQuickActivate}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all border border-blue-400/30"
              >
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>Activate Student Workspace (1-Click)</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#282E3D] w-full" />
                <span className="bg-[#141722] px-2 text-[10px] uppercase text-slate-500 font-semibold font-sans absolute">
                  or sign in with credentials
                </span>
              </div>

              {/* Error & Success Banners */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-sans flex items-start space-x-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div>{errorMessage}</div>
                    {attemptsLeft !== null && attemptsLeft > 0 && (
                      <div className="text-[10px] text-rose-300 font-medium">
                        Security Enforcement: {attemptsLeft} attempts left.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs font-sans flex items-center space-x-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Full Name (Registration Mode Only) */}
                {isRegisterMode && (
                  <div className="space-y-1">
                    <label className="block text-xs font-sans text-slate-300">
                      Full Name
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Alex Chen"
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D1017] border border-[#282E3D] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-sans"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="block text-xs font-sans text-slate-300">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@college.edu"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D1017] border border-[#282E3D] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-sans"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-sans text-slate-300">
                      Password
                    </label>
                    {isRegisterMode && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        Min 8 chars, 1 uppercase, 1 number
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0D1017] border border-[#282E3D] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Primary Action Button (Solid Classic Sapphire Blue) */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all duration-200 shadow-sm flex items-center justify-center space-x-1.5 active:scale-[0.99] disabled:opacity-75 pt-2.5"
                >
                  <span>
                    {isSubmitting
                      ? "Verifying Cryptographic Credentials..."
                      : isRegisterMode
                      ? "Register & Launch Dashboard"
                      : "Continue"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Or Divider */}
              <div className="relative flex items-center justify-center pt-1">
                <div className="border-t border-[#282E3D] w-full" />
                <span className="bg-[#141722] px-3 text-[11px] font-sans text-slate-400 uppercase tracking-wider relative z-10">
                  Or
                </span>
                <div className="border-t border-[#282E3D] w-full" />
              </div>

              {/* Toggle Between Sign In and Register Profile Button */}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#181C26] hover:bg-[#202533] border border-[#282E3D] text-xs text-slate-200 font-sans transition-all flex items-center justify-center space-x-2"
              >
                <GraduationCap className="w-4 h-4 text-blue-400" />
                <span>
                  {isRegisterMode
                    ? "Back to Existing Account Sign In"
                    : "Create a new learner profile"}
                </span>
              </button>

              {/* Forgot Password Link */}
              {!isRegisterMode && (
                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        "Security Protocol: Temporary reset token sent to your institutional email. Check inbox."
                      )
                    }
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-sans hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

              {/* Card Footer Badge */}
              <div className="pt-2 border-t border-[#282E3D] flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 font-sans">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>PBKDF2 Salting • Rate Limited • Built for Learners</span>
              </div>
            </div>

            {/* Direct Guest Access */}
            <div className="text-center pt-3">
              <Link
                href="/dashboard"
                className="text-xs text-slate-400 hover:text-blue-400 transition-colors inline-flex items-center space-x-1 group font-sans"
              >
                <span>Continue into Platform as Guest Student</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform text-blue-400" />
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: Value Proposition & Interactive Node Graph (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6 lg:pl-6">
            {/* Tagline & Editorial Typography */}
            <div className="space-y-3">
              <span className="text-[11px] font-sans tracking-[0.25em] text-slate-400 uppercase font-semibold">
                Y O U R &nbsp; L E A R N I N G &nbsp; J O U R N E Y
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-white leading-[1.18] font-sans">
                Understand the <br />
                connections. <br />
                <span className="text-blue-400">Close the gaps.</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 max-w-lg leading-relaxed font-sans pt-1">
                ARCHAIA analyzes your learning patterns, isolates foundational misconceptions, and guides you to true mastery through causal knowledge graphs.
              </p>
            </div>

            {/* Interactive Concept Dependency Graph Diagram */}
            <div className="pt-2">
              <LoginConceptGraph />
            </div>

            {/* Bottom Feature Indicators */}
            <div className="flex flex-wrap items-center gap-5 sm:gap-6 pt-4 border-t border-[#282E3D] text-slate-300">
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-sans font-medium">Root Gap Isolation</span>
              </div>

              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-sans font-medium">Causal Prerequisite Tracing</span>
              </div>

              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-sans font-medium">Physical Memory Models</span>
              </div>

              <div className="flex items-center space-x-2">
                <FolderOpen className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-sans font-medium">File Manager Intake</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

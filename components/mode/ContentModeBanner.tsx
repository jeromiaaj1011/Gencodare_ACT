"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  BookOpen,
  UploadCloud,
  FileText,
  RotateCcw,
  CheckCircle,
  X,
  Layers,
  ArrowRight,
  Database,
  PlayCircle,
  FolderOpen,
} from "lucide-react";
import { CourseMaterial, AppContentMode } from "@/lib/types";

interface BannerProps {
  onModeChange?: (mode: AppContentMode, activeCourse?: CourseMaterial | null) => void;
  className?: string;
}

export default function ContentModeBanner({ onModeChange, className = "" }: BannerProps) {
  const [mode, setMode] = useState<AppContentMode>("demo");
  const [activeCourse, setActiveCourse] = useState<CourseMaterial | null>(null);
  const [courses, setCourses] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadSubject, setUploadSubject] = useState("Computer Science");
  const [uploadContent, setUploadContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const courseFileInputRef = useRef<HTMLInputElement | null>(null);
  const [courseFileMeta, setCourseFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [isCourseDragging, setIsCourseDragging] = useState(false);

  const processCourseFile = async (file: File) => {
    try {
      const text = await file.text();
      setCourseFileMeta({ name: file.name, size: file.size });
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      if (!uploadTitle.trim()) {
        setUploadTitle(cleanName);
      }
      setUploadContent(text);
      if (file.name.endsWith(".sql")) setUploadSubject("Databases & SQL");
      else if (file.name.endsWith(".py")) setUploadSubject("Python / Algorithms");
      else if (file.name.endsWith(".java")) setUploadSubject("Java / OOP Systems");
      else if (file.name.endsWith(".cpp") || file.name.endsWith(".c")) setUploadSubject("Systems / C++");
      else if (file.name.endsWith(".md") || file.name.endsWith(".txt")) setUploadSubject("Computer Science");
      setUploadError(null);
    } catch {
      setUploadError("Error reading course file from file manager.");
    }
  };

  const handleCourseFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processCourseFile(file);
  };

  const fetchModeData = async () => {
    try {
      const res = await fetch("/api/course");
      const data = await res.json();
      if (data.success) {
        setMode(data.mode || "demo");
        setActiveCourse(data.activeCourse || null);
        setCourses(data.courses || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModeData();

    const handleModeEvent = () => fetchModeData();
    window.addEventListener("archaia-mode-change", handleModeEvent);
    return () => window.removeEventListener("archaia-mode-change", handleModeEvent);
  }, []);

  const handleSwitchMode = async (targetMode: AppContentMode) => {
    try {
      const res = await fetch("/api/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setMode", mode: targetMode }),
      });
      const data = await res.json();
      if (data.success) {
        setMode(data.mode);
        setActiveCourse(data.activeCourse);
        window.dispatchEvent(new Event("archaia-mode-change"));
        if (onModeChange) onModeChange(data.mode, data.activeCourse);
      }
    } catch (e) {
      console.error("Mode switch error:", e);
    }
  };

  const handleSelectCourse = async (courseId: string) => {
    try {
      const res = await fetch("/api/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setActiveCourse", courseId }),
      });
      const data = await res.json();
      if (data.success) {
        setMode("course");
        setActiveCourse(data.activeCourse);
        window.dispatchEvent(new Event("archaia-mode-change"));
        if (onModeChange) onModeChange("course", data.activeCourse);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadContent.trim()) {
      setUploadError("Please provide course notes, syllabus text, or textbook excerpt.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const res = await fetch("/api/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "uploadCourse",
          title: uploadTitle.trim() || "Uploaded Course",
          subject: uploadSubject.trim(),
          content: uploadContent.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.course) {
        setUploadSuccess(`Extracted ${data.course.concepts?.length || 0} concepts with prerequisite relationships!`);
        setMode("course");
        setActiveCourse(data.course);
        setCourses((prev) => [data.course, ...prev.filter((c) => c.id !== data.course.id)]);
        window.dispatchEvent(new Event("archaia-mode-change"));
        if (onModeChange) onModeChange("course", data.course);

        setTimeout(() => {
          setShowUploadModal(false);
          setUploadSuccess(null);
          setUploadTitle("");
          setUploadContent("");
        }, 1200);
      } else {
        setUploadError(data.error || "Failed to extract concepts from material.");
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload course material.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div
        className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
          mode === "demo"
            ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
            : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
        } ${className}`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Mode Indicator & Metadata */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-wider uppercase flex items-center space-x-1.5 border ${
                  mode === "demo"
                    ? "bg-amber-500/20 text-amber-600 border-amber-500/40"
                    : "bg-blue-600/20 text-blue-600 border-blue-500/40"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    mode === "demo" ? "bg-amber-400 animate-pulse" : "bg-blue-400 animate-pulse"
                  }`}
                />
                <span>
                  {mode === "demo" ? "DEMO MODE: ARCHAIA Demonstration Dataset" : `COURSE MODE: Operating on: ${activeCourse?.title || "User Material"}`}
                </span>
              </span>

              {mode === "demo" ? (
                <span className="text-[11px] text-slate-500 font-sans">
                  Dataset: <strong className="text-slate-900">System Architecture (Pre-seeded)</strong> • <strong className="text-amber-600">7 Canonical Concepts</strong>
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 font-sans">
                  Subject: <strong className="text-slate-900">{activeCourse?.subject || "Computer Science"}</strong> â€¢{" "}
                  <strong className="text-blue-600">{activeCourse?.concepts?.length || 5} Concepts</strong> Active
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 font-sans leading-relaxed">
              {mode === "demo"
                ? "Demonstrating end-to-end cognitive diagnosis, causal prerequisite bisection, and visual stack frame remediation on recursive call stack invariants."
                : `Universal diagnostic engine running on ingested course material "${activeCourse?.title}". Knowledge Graph and micro-probes generated dynamically.`}
            </p>
          </div>

          {/* Right: Controls to Switch Mode or Upload Material */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {mode === "demo" ? (
              <>
                {courses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSwitchMode("course")}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-blue-600 hover:text-slate-900 text-xs font-medium transition-colors flex items-center space-x-1.5 btn-interactive-subtle"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Switch to Course Mode</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 btn-interactive"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Course Material</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSwitchMode("demo")}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-amber-600 hover:text-slate-900 text-xs font-medium transition-colors flex items-center space-x-1.5 btn-interactive-subtle"
                >
                  <PlayCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Switch to Demo Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 btn-interactive"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload New Material</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Course Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                <span>Ingest Course Material into Knowledge Graph</span>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                aria-label="Close upload dialog"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Paste lecture notes, syllabus modules, or textbook excerpts. ARCHAIA extracts key computing concepts, identifies prerequisite dependency chains, and automatically synthesizes diagnostic micro-probes for the entire platform.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              {/* File Manager Upload Zone for Course Materials */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsCourseDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsCourseDragging(false);
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  setIsCourseDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) await processCourseFile(file);
                }}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCourseDragging
                    ? "border-blue-500 bg-blue-500/15"
                    : courseFileMeta
                    ? "border-emerald-500/40 bg-emerald-50"
                    : "border-dashed border-slate-200 hover:border-blue-500/50 bg-slate-50/60"
                } flex flex-col sm:flex-row items-center justify-between gap-3 text-xs`}
              >
                <input
                  ref={courseFileInputRef}
                  id="course-file-input"
                  name="courseFile"
                  type="file"
                  className="hidden"
                  onChange={handleCourseFileImport}
                  accept=".txt,.md,.pdf,.json,.py,.sql,.java,.cpp,.c,.js,.ts"
                  aria-label="Upload course material from file manager"
                />
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`p-2 rounded-lg border ${
                      courseFileMeta
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-600"
                        : "bg-blue-500/10 border-blue-500/20 text-blue-600"
                    }`}
                  >
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Upload from File Manager</span>
                    <p className="text-[11px] text-slate-500 font-sans">
                      {courseFileMeta
                        ? `Loaded: ${courseFileMeta.name} (${(courseFileMeta.size / 1024).toFixed(1)} KB)`
                        : "Drag & drop syllabus or lecture notes file, or browse files from your computer"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => courseFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-300 transition-colors flex items-center space-x-1.5"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>{courseFileMeta ? "Change File" : "Browse File Manager"}</span>
                  </button>
                  {courseFileMeta && (
                    <button
                      type="button"
                      onClick={() => {
                        setCourseFileMeta(null);
                        setUploadContent("");
                        setUploadTitle("");
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900"
                      title="Clear course file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="course-upload-title" className="block text-xs font-medium text-slate-600 mb-1">
                    Course / Topic Title: <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="course-upload-title"
                    name="courseTitle"
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Operating Systems: Synchronization & Concurrency"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="course-upload-subject" className="block text-xs font-medium text-slate-600 mb-1">Subject Area:</label>
                  <input
                    id="course-upload-subject"
                    name="subject"
                    type="text"
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    placeholder="e.g. Systems"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="course-upload-content" className="block text-xs font-medium text-slate-600 mb-1">
                  Course Material Content (Text, Markdown, or Notes): <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="course-upload-content"
                  name="content"
                  rows={6}
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  placeholder="Paste syllabus, notes, or concepts here:&#10;e.g. CPU Scheduling context switching enables multi-threading. Thread concurrency requires mutual exclusion primitives like Semaphores to prevent race conditions in critical sections. Acquiring multiple mutexes without ordering creates circular wait deadlocks."
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans leading-relaxed resize-none"
                  required
                />
              </div>

              {/* Quick Preset Samples for Easy Testing */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-slate-500 font-medium">Quick Preset Material:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      label: "Operating Systems (Concurrency)",
                      title: "CS 241: Operating Systems & Concurrency",
                      subject: "Systems",
                      content:
                        "Hardware context switching allows processes to share the CPU. Threads share address spaces, which requires Mutual Exclusion (mutexes) and Semaphores to protect critical sections against race conditions. Acquiring multiple locks without hierarchical ordering causes Circular Wait deadlocks.",
                    },
                    {
                      label: "Database Systems (ACID & MVCC)",
                      title: "CS 348: Database Concurrency & Isolation",
                      subject: "Databases",
                      content:
                        "Relational schema tables are stored in B-Tree disk pages. Write-Ahead Logs enforce durability before buffer pools flush. Under Multi-Version Concurrency Control (MVCC), READ COMMITTED takes statement snapshots, while REPEATABLE READ takes transaction snapshots.",
                    },
                    {
                      label: "Computer Networks (TCP Transport)",
                      title: "CS 356: Transport Invariants & Congestion",
                      subject: "Networking",
                      content:
                        "IP packets route datagrams across subnets. TCP 3-way handshakes establish sequence numbers to serialize byte streams. Flow control uses the receiver window (rwnd), while congestion control dynamically tunes cwnd via AIMD when packets drop.",
                    },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setUploadTitle(preset.title);
                        setUploadSubject(preset.subject);
                        setUploadContent(preset.content);
                      }}
                      className="px-2.5 py-1 rounded-md text-[11px] font-sans bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs">
                  {uploadError}
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-sm flex items-center space-x-1.5 btn-interactive disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{uploading ? "Extracting Graph..." : "Extract & Activate Course Mode"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

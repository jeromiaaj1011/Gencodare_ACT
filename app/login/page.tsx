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
} from "lucide-react";
import ArchaiaLogo from "@/components/ArchaiaLogo";
import CyberMeshBackground from "@/components/CyberMeshBackground";
import LoginConceptGraph from "@/components/LoginConceptGraph";

export default function LoginPage() {
  const router = useRouter();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("student@college.edu");
  const [password, setPassword] = useState("Archaia2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"learner" | "instructor" | "researcher">("learner");

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

            {/* Bottom 3 Feature Indicators */}
            <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-4 border-t border-[#282E3D] text-slate-300">
              <div className="flex items-center space-x-2.5">
                <Brain className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-sans font-medium">Root Gap Isolation</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-sans font-medium">Causal Prerequisite Tracing</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-sans font-medium">Physical Memory Models</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

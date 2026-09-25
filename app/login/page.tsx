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

  // Demo Credentials quick-fill for Judges
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
      {/* Background Cybernetic Mesh & Celestial Wireframe Sphere */}
      <CyberMeshBackground />

      <div className="relative z-10 w-full max-w-6xl mx-auto space-y-6 py-4">
        {/* Top Brand Banner & Demo Quick-Credentials Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <ArchaiaLogo size={42} className="w-10 h-10 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]" />
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-[0.2em] text-white uppercase font-sans">
                ARCHAIA
              </span>
              <span className="text-[11px] tracking-wide text-cyan-400/90 font-sans -mt-0.5">
                Cognitive Learning Diagnostics
              </span>
            </div>
          </div>

          {/* Quick Demo Credentials Bar for Judges */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-slate-900/60 border border-slate-700/60 text-xs font-mono backdrop-blur-md">
            <span className="text-slate-400 px-2 flex items-center space-x-1">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Demo Accounts:</span>
            </span>
            <button
              type="button"
              onClick={() => fillCredentials("student")}
              className="px-2.5 py-1 rounded-lg bg-archaia-card hover:bg-archaia-cardHover border border-slate-700 text-cyan-300 text-[11px] transition-colors"
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("instructor")}
              className="px-2.5 py-1 rounded-lg bg-archaia-card hover:bg-archaia-cardHover border border-slate-700 text-indigo-300 text-[11px] transition-colors"
            >
              Instructor
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("researcher")}
              className="px-2.5 py-1 rounded-lg bg-archaia-card hover:bg-archaia-cardHover border border-slate-700 text-emerald-300 text-[11px] transition-colors"
            >
              Researcher
            </button>
          </div>
        </div>

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT COLUMN: Glassmorphic Login Card (5 cols on lg) */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto lg:mx-0">
            <div className="relative rounded-[26px] bg-[#070D1C]/80 border border-slate-700/50 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-5">
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2.5">
                  <ArchaiaLogo size={24} className="w-6 h-6" />
                  <span className="text-xs text-slate-300 font-sans">
                    {isRegisterMode ? "Create profile on" : "Welcome to"}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-[0.2em] text-white uppercase font-sans">
                    ARCHAIA
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isRegisterMode
                      ? "Register your student profile for personalized cognitive diagnostics."
                      : "Sign in to continue your learning investigation."}
                  </p>
                </div>
              </div>

              {/* Error & Success Banners */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-sans flex items-start space-x-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div>{errorMessage}</div>
                    {attemptsLeft !== null && attemptsLeft > 0 && (
                      <div className="text-[10px] text-rose-300 font-mono">
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
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B132B]/70 border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors font-sans"
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B132B]/70 border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors font-sans"
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
                      <span className="text-[10px] text-slate-400 font-mono">
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
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0B132B]/70 border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors font-sans"
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

                {/* Primary Action Button (Gold Champagne Gradient) */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#F6D097] via-[#E8B878] to-[#D4A364] hover:from-[#FDE2B8] hover:to-[#E0B075] text-[#0A0E1A] font-semibold text-xs transition-all duration-200 shadow-[0_4px_20px_rgba(232,184,120,0.3)] flex items-center justify-center space-x-1.5 active:scale-[0.99] disabled:opacity-75 pt-2"
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
                <div className="border-t border-slate-700/60 w-full" />
                <span className="bg-[#070D1C] px-3 text-[11px] font-sans text-slate-400 uppercase tracking-wider relative z-10">
                  Or
                </span>
                <div className="border-t border-slate-700/60 w-full" />
              </div>

              {/* Toggle Between Sign In and Register Profile Button */}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0B132B]/50 hover:bg-[#0E1838] border border-slate-700/60 text-xs text-slate-200 font-sans transition-all flex items-center justify-center space-x-2"
              >
                <GraduationCap className="w-4 h-4 text-cyan-400" />
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
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-sans hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Card Footer Badge */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 font-sans">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>PBKDF2 Salting • Rate Limited • Built for Learners</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Value Proposition & Interactive Node Graph (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6 lg:pl-6">
            {/* Tagline & Editorial Typography */}
            <div className="space-y-3">
              <span className="text-[11px] font-sans tracking-[0.25em] text-slate-400 uppercase font-medium">
                Y O U R &nbsp; L E A R N I N G &nbsp; J O U R N E Y
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-normal tracking-tight text-white leading-[1.18] font-serif">
                Understand the <br />
                connections. <br />
                <span className="text-[#2DD4BF] font-serif">Close the gaps.</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 max-w-lg leading-relaxed font-sans pt-1">
                ARCHAIA analyzes your learning patterns, finds what's missing, and helps you build a stronger understanding — one concept at a time.
              </p>
            </div>

            {/* Interactive Concept Dependency Graph Diagram */}
            <div className="pt-2">
              <LoginConceptGraph />
            </div>

            {/* Bottom 3 Feature Indicators */}
            <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-4 border-t border-slate-800/80 text-slate-300">
              <div className="flex items-center space-x-2.5">
                <Brain className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-sans">Better Focus</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-sans">Deeper Understanding</span>
              </div>

              <div className="flex items-center space-x-2.5">
                <Target className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-sans">Real Progress</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

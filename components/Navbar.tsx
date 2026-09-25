"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Network,
  Bug,
  Split,
  HeartPulse,
  LineChart,
  RotateCcw,
  LogOut,
  LogIn,
  BookOpen,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";

import ArchaiaLogo from "./ArchaiaLogo";

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: "learner" | "instructor" | "researcher";
  institution?: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState<"demo" | "course">("demo");

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const syncMode = () => {
    fetch("/api/course")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.mode) {
          setCurrentMode(data.mode);
        }
      })
      .catch(() => {});
  };

  const handleToggleMode = async () => {
    const nextMode = currentMode === "demo" ? "course" : "demo";
    try {
      const res = await fetch("/api/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setMode", mode: nextMode }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentMode(data.mode);
        window.dispatchEvent(new Event("archaia-mode-change"));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Sync user state from localStorage and verify with session API
  const syncSession = () => {
    try {
      const stored = localStorage.getItem("archaia_user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem("archaia_user", JSON.stringify(data.user));
        } else {
          setCurrentUser(null);
          localStorage.removeItem("archaia_user");
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    syncSession();
    syncMode();

    // Listen to custom auth & mode events
    const handleAuthChange = () => syncSession();
    const handleModeChange = () => syncMode();
    window.addEventListener("archaia-auth-change", handleAuthChange);
    window.addEventListener("archaia-mode-change", handleModeChange);
    return () => {
      window.removeEventListener("archaia-auth-change", handleAuthChange);
      window.removeEventListener("archaia-mode-change", handleModeChange);
    };
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Knowledge Graph", href: "/graph", icon: Network },
    { label: "Bug Detector", href: "/detector", icon: Bug },
    { label: "Cognitive Bisect", href: "/bisect", icon: Split },
    { label: "Recovery Lab", href: "/recovery", icon: HeartPulse },
    { label: "Progress", href: "/progress", icon: LineChart },
    { label: "Overview", href: "/overview", icon: BookOpen },
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

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("archaia_user");
      setCurrentUser(null);
      window.dispatchEvent(new Event("archaia-auth-change"));
      router.push("/login");
    } catch (e) {
      console.error(e);
    } finally {
      setLoggingOut(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0C0E12]/95 backdrop-blur-md border-b border-archaia-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="flex items-center space-x-2.5 group">
              <ArchaiaLogo
                size={32}
                className="w-8 h-8 group-hover:scale-105 transition-transform"
              />
              <div>
                <span className="text-xl font-bold tracking-[0.15em] text-white logo-shimmer block">
                  ARCHAIA
                </span>
                <span className="hidden sm:block text-[10px] uppercase font-medium tracking-wider text-slate-400 -mt-1">
                  Cognitive Learning Diagnostics
                </span>
              </div>
            </Link>
          </div>

          {/* Module Navigation (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium nav-item-interactive ${
                    isActive
                      ? "bg-blue-600/15 text-blue-300 border border-blue-500/35 font-semibold shadow-[0_0_14px_rgba(59,130,246,0.18)]"
                      : "text-slate-400 hover:text-white hover:bg-archaia-card/80 border border-transparent"
                  }`}
                >
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-0.5 animate-pulse" />
                  )}
                  <Icon className="w-3.5 h-3.5 nav-icon" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions & Auth Profile */}
          <div className="flex items-center space-x-2">
            {/* Mode Switcher Pill */}
            <button
              onClick={handleToggleMode}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border transition-all btn-interactive-subtle ${
                currentMode === "demo"
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25"
                  : "bg-blue-600/15 text-blue-300 border-blue-500/30 hover:bg-blue-600/25"
              }`}
              title={`Active Content Mode: ${currentMode.toUpperCase()}. Click to switch between Demo & Course Mode.`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  currentMode === "demo" ? "bg-amber-400 animate-pulse" : "bg-blue-400 animate-pulse"
                }`}
              />
              <span>{currentMode === "demo" ? "DEMO MODE" : "COURSE MODE"}</span>
            </button>

            <button
              onClick={handleReset}
              disabled={resetting}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border text-slate-400 hover:text-white transition-colors btn-interactive-subtle"
              title="Reset state to initial demo seed"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">
                {resetMessage || (resetting ? "Resetting..." : "Reset")}
              </span>
            </button>

            {currentUser ? (
              /* Logged In User Pill */
              <div className="flex items-center space-x-1.5 pl-1">
                <div className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                    {getInitials(currentUser.fullName)}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-[11px] font-medium text-slate-200 leading-tight">
                      {currentUser.fullName}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-blue-400 font-medium">
                      {currentUser.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/50 transition-colors"
                  title="Sign out of ARCHAIA"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            ) : (
              /* Guest / Not Logged In */
              <Link
                href="/login"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            <Link
              href="/detector"
              className="hidden sm:flex items-center space-x-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Diagnostic</span>
            </Link>

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-archaia-card border border-archaia-border text-slate-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-archaia-border bg-[#0C0E12]/98 backdrop-blur-xl px-4 py-3 space-y-2 animate-in slide-in-from-top-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-archaia-card"
                }`}
              >
                <Icon className="w-4 h-4 text-blue-400" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}

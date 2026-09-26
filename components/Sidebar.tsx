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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentMode, setCurrentMode] = useState<"demo" | "course">("demo");

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
      .then((res) => {
        if (res.status === 401 || !res.ok) {
          return { authenticated: false };
        }
        return res.json();
      })
      .then((data) => {
        if (data?.authenticated && data?.user) {
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
    { label: "Bug Detector", href: "/detector", icon: Bug },
    { label: "Cognitive Bisect", href: "/bisect", icon: Split },
    { label: "Recovery Lab", href: "/recovery", icon: HeartPulse },
    { label: "Adaptive Roadmap", href: "/progress", icon: LineChart },
    { label: "Knowledge Graph", href: "/graph", icon: Network },
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
    <aside
      className="static flex flex-col z-40 w-64 min-w-[16rem] h-screen sticky top-0 bg-white/95 backdrop-blur-xl border-r border-slate-200"
    >
      <div className="flex flex-col h-full overflow-y-auto p-4 sm:p-5">
        {/* Logo & Tagline (Desktop) */}
        <div className="flex items-center space-x-3 mb-8 px-2 mt-2">
          <Link href="/dashboard" className="flex items-center space-x-2.5 group">
            <ArchaiaLogo
              size={32}
              className="w-8 h-8 group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="text-xl font-bold tracking-[0.16em] text-slate-900 logo-shimmer block font-editorial">
                ARCHAIA
              </span>
              <span className="text-[9.5px] uppercase font-medium tracking-[0.2em] text-rose-600/80 -mt-0.5 block">
                Cognitive Diagnostics
              </span>
            </div>
          </Link>
        </div>

        {/* Module Navigation */}
        <nav className="flex-1 space-y-2 mt-4 lg:mt-0" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-rose-500/15 text-rose-700 border border-rose-500/40 shadow-[0_0_16px_rgba(244,63,94,0.15)]"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-rose-600" : "text-slate-500"}`} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="flex flex-col space-y-4 pt-6 mt-6 border-t border-slate-200">
          <Link
            href="/detector"
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold btn-shades-primary transition-all w-full"
          >
            <Sparkles className="w-4 h-4" />
            <span>Diagnostic</span>
          </Link>

          <button
            type="button"
            onClick={handleToggleMode}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs uppercase font-bold tracking-wider border transition-all ${
              currentMode === "demo"
                ? "bg-rose-500/15 text-rose-600 border-rose-500/35 hover:bg-rose-500/25"
                : "bg-purple-600/15 text-purple-600 border-purple-500/35 hover:bg-purple-600/25"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                currentMode === "demo" ? "bg-rose-400 animate-pulse" : "bg-purple-400 animate-pulse"
              }`}
            />
            <span>{currentMode === "demo" ? "DEMO MODE" : "COURSE MODE"}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <RotateCcw className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`} />
            <span>{resetMessage || (resetting ? "Resetting..." : "Reset State")}</span>
          </button>

          {currentUser ? (
            <div className="flex flex-col space-y-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white font-bold flex items-center justify-center text-sm">
                  {getInitials(currentUser.fullName)}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700 truncate max-w-[140px]">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-rose-600 font-medium">
                    {currentUser.role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center justify-center space-x-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-slate-600 bg-rose-50 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-900/50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 border border-rose-500/35 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}

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
  Sparkles,
  LogOut,
  LogIn,
  User,
  BookOpen,
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

    // Listen to custom auth events
    const handleAuthChange = () => syncSession();
    window.addEventListener("archaia-auth-change", handleAuthChange);
    return () => window.removeEventListener("archaia-auth-change", handleAuthChange);
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
    <header className="sticky top-0 z-50 bg-archaia-dark/85 backdrop-blur-md border-b border-archaia-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="flex items-center space-x-2.5 group">
              <ArchaiaLogo
                size={32}
                className="w-8 h-8 group-hover:scale-105 transition-transform drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]"
              />
              <div>
                <span className="text-xl font-bold tracking-[0.15em] text-white">
                  ARCHAIA
                </span>
                <span className="hidden sm:block text-[10px] uppercase font-mono tracking-widest text-archaia-muted -mt-1">
                  Cognitive Learning Diagnostics
                </span>
              </div>
            </Link>
          </div>

          {/* Module Navigation */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-archaia-primary/20 text-archaia-accent border border-archaia-primary/40 shadow-glow"
                      : "text-archaia-muted hover:text-white hover:bg-archaia-card"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions & Auth Profile */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleReset}
              disabled={resetting}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-mono bg-archaia-card hover:bg-archaia-cardHover border border-archaia-border text-archaia-muted hover:text-white transition-colors"
              title="Reset state to initial demo seed"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">
                {resetMessage || (resetting ? "Resetting..." : "Reset")}
              </span>
            </button>

            {currentUser ? (
              /* Logged In User Pill */
              <div className="flex items-center space-x-2 pl-1">
                <div className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-700/70 text-xs">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 text-slate-950 font-bold flex items-center justify-center text-[10px]">
                    {getInitials(currentUser.fullName)}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-[11px] font-medium text-slate-200 leading-tight">
                      {currentUser.fullName}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-mono">
                      {currentUser.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/50 transition-colors"
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
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F6D097]/15 hover:bg-[#F6D097]/25 text-[#F6D097] border border-[#F6D097]/40 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            <Link
              href="/detector"
              className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-glow transition-all"
            >
              <span>Diagnostic</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

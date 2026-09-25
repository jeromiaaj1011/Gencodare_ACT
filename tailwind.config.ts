import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        archaia: {
          dark: "#090D16",
          darker: "#05080E",
          card: "#0F1523",
          cardHover: "#151E32",
          border: "#1E293B",
          borderGlow: "#334155",
          accent: "#38BDF8",     // cyan
          primary: "#6366F1",    // indigo
          primaryHover: "#4F46E5",
          success: "#10B981",    // emerald
          warning: "#F59E0B",    // amber
          danger: "#EF4444",     // red
          text: "#F8FAFC",
          muted: "#94A3B8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(99, 102, 241, 0.25)",
        glowSuccess: "0 0 25px -5px rgba(16, 185, 129, 0.25)",
        glowDanger: "0 0 25px -5px rgba(239, 68, 68, 0.25)",
        glowWarning: "0 0 25px -5px rgba(245, 158, 11, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;

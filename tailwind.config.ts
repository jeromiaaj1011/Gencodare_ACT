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
          dark: "#12151C",
          darker: "#0C0E12",
          card: "#181C26",
          cardHover: "#202533",
          border: "#282E3D",
          borderGlow: "#3E465B",
          accent: "#2563EB",     // Professional sapphire blue
          primary: "#3B82F6",    // Clear cobalt blue
          primaryHover: "#1D4ED8",
          success: "#10B981",    // Natural emerald
          warning: "#F59E0B",    // Warm amber
          danger: "#E11D48",     // Refined crimson
          text: "#F1F5F9",
          muted: "#94A3B8",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        glow: "0 2px 12px rgba(37, 99, 235, 0.15)",
        glowSuccess: "0 2px 12px rgba(16, 185, 129, 0.15)",
        glowDanger: "0 2px 12px rgba(225, 29, 72, 0.15)",
        glowWarning: "0 2px 12px rgba(245, 158, 11, 0.15)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.25), 0 1px 2px -1px rgba(0, 0, 0, 0.25)",
        elevated: "0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [],
};
export default config;

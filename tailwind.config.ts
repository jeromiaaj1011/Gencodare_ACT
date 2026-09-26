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
        shades: {
          obsidian: "#F8FAFC",
          dark: "#F1F5F9",
          card: "#FFFFFF",
          cardHover: "#F8FAFC",
          border: "#E2E8F0",
          borderCoral: "rgba(244, 63, 94, 0.28)",
          coral: "#FF6484",
          rose: "#FB7185",
          crimson: "#E11D48",
          ruby: "#881337",
          blush: "#FECDD3",
          peach: "#FFE4E6",
        },
        archaia: {
          dark: "#F1F5F9",
          darker: "#F8FAFC",
          card: "#FFFFFF",
          cardHover: "#F8FAFC",
          border: "#E2E8F0",
          borderGlow: "#F43F5E",
          accent: "#F43F5E",       // Shades vibrant coral rose
          primary: "#FB7185",      // Neon rose
          primaryHover: "#E11D48", // Crimson red
          success: "#10B981",      // Natural emerald
          warning: "#F59E0B",      // Warm amber
          danger: "#E11D48",       // Refined crimson
          text: "#0F172A",
          muted: "#64748B",
        },
      },
      fontFamily: {
        serif: ["'Playfair Display'", "Georgia", "'Times New Roman'", "serif"],
        sans: ["'Plus Jakarta Sans'", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        glow: "0 4px 20px rgba(244, 63, 94, 0.25)",
        glowCoral: "0 0 25px rgba(255, 100, 132, 0.4)",
        glowRose: "0 0 35px rgba(244, 63, 94, 0.45)",
        glowSuccess: "0 2px 12px rgba(16, 185, 129, 0.2)",
        glowDanger: "0 2px 12px rgba(225, 29, 72, 0.3)",
        glowWarning: "0 2px 12px rgba(245, 158, 11, 0.2)",
        card: "0 2px 8px 0 rgba(0, 0, 0, 0.5), 0 1px 2px -1px rgba(0, 0, 0, 0.4)",
        elevated: "0 12px 30px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [],
};
export default config;

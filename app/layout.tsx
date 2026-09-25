import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "ARCHAIA — Shades That Illuminate | Cognitive Learning Diagnostics",
  description:
    "AI-powered cognitive diagnostic platform debugging learning gaps through Causal Knowledge Graphs and Cognitive Bisect.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-shades-obsidian text-archaia-text min-h-screen font-sans antialiased selection:bg-shades-coral selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "ARCHAIA — Cognitive Learning Diagnostics",
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
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-archaia-darker text-archaia-text min-h-screen flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="border-t border-archaia-border py-4 text-center text-xs text-archaia-muted font-mono">
          ARCHAIA • AI-Based Learning Misconception Detection (Problem Statement #5) • Cognitive Bisect Engine
        </footer>
      </body>
    </html>
  );
}

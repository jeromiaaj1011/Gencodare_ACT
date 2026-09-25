# ARCHAIA — Causal Knowledge Graph + Cognitive Bisect Engine for Root-Cause Misconception Detection

> **Official Problem Statement:** AI-Based Learning Misconception Detection (Problem Statement #5)  
> **Core Value Proposition:** *"Debug the learning, not just the answer."*

---

## 1. Project Overview
ARCHAIA is an advanced cognitive diagnostic learning platform. When students encounter obstacles on advanced technical topics, conventional educational tools merely flag the answer as incorrect and display standard solutions. Learning science demonstrates that students fail because they carry undetected faulty mental models formed during foundational topics weeks prior.

ARCHAIA performs **Cognitive Bisect** over an ontological **Causal Knowledge Dependency Graph (DAG)**:
1. Detects underlying misconceptions by contrasting student assumptions against formal computing reality.
2. Traverses backward along dependency edges.
3. Issues diagnostic micro-probes to isolate the **Likely Root Learning Gap**.
4. Delivers targeted multi-modal interventions in a **Recovery Lab** (Interactive Stack Frame Visualizer, Micro-Puzzles, Code Exercises, Multilingual Bridges, and Industry Blast-Radius Drills).
5. Mandates **Re-Testing** to verify cognitive restructuring before updating the student's **Adaptive Learning Path**.

---

## 2. The 6 Integrated UI Modules
- **Module 1: Student Dashboard (`/dashboard`)**: Central cockpit displaying mastery telemetry, active cognitive bugs, and recommended actions.
- **Module 2: Causal Knowledge Graph (`/graph`)**: Interactive SVG DAG with pan/zoom, prerequisite rationale links, and dynamic course material extraction.
- **Module 3: Cognitive Bug Detector (`/detector`)**: Multi-modal response analyzer (written text, code snippets, MCQs, problem steps) highlighting student assumptions vs. formal reality.
- **Module 4: Cognitive Bisect (`/bisect`)**: Active prerequisite diagnostic console issuing invariant micro-probes and accumulating Bayesian evidence.
- **Module 5: Recovery Lab (`/recovery`)**: Multi-modal remediation studio featuring an interactive call-stack frame animator, counterexamples, micro-puzzles, multilingual explanations with technical term preservation, and industry blast-radius context.
- **Module 6: Learning Progress (`/progress`)**: Mastery matrix and dynamically recalculated adaptive progression roadmaps.

---

## 3. Technology Stack & Architecture
- **Frontend**: Next.js 14 (App Router, TypeScript, React 18)
- **Styling**: Tailwind CSS with custom cyber-pedagogical theme and Lucide React icons
- **Graph Engine**: Native SVG DAG layout engine with Bézier curved edges, animated flow particles, and interactive state coloring
- **AI Core**: Google Gemini API (`gemini-1.5-flash`) integration with deterministic zero-fail cognitive heuristic fallback
- **State Store**: In-memory singleton store with full seed state reset capabilities

---

## 4. Getting Started

### Prerequisites
- Node.js 18+ (tested on Node.js 24)
- npm 9+

### Installation & Run
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Live Judge Evaluation & Demo Walkthrough

### The Scenario: Data Structures & Graph Traversal (DFS)
1. **Navigate to `/detector`**: Click **"Load Primary Demo Scenario"**. A student submits: *"When dfs(neighbor) is invoked, it replaces the current function. Because the child executes, the parent function is overwritten..."*
2. **Click "Analyze Learner Reasoning"**: ARCHAIA isolates the **Recursive Context Replacement** misconception and contrasts the student assumption against physical runtime reality.
3. **Click "Execute Cognitive Bisect on DAG"**: Routes to `/bisect`. The system displays the prerequisite ancestor chain: `Memory` $\to$ `Functions` $\to$ `Call Stack` $\to$ `Recursion` $\to$ `Tree Traversal` $\to$ `Graph Traversal`.
4. **Answer the Diagnostic Micro-Probe**: Answer the question on recursive resumption. Evidence updates in real time.
5. **Convergence on Root Gap**: The system isolates **Likely Root Learning Gap: Call Stack & LIFO Frames**.
6. **Click "Launch Targeted Recovery Lab"**: Routes to `/recovery`.
   - Step through the **Visual Memory Simulator** to watch stack frames push and pop.
   - Switch to **Multilingual Bridge** to toggle Tamil, Hindi, or Telugu (with English terms strictly preserved).
   - Read the **Industry Blast Radius** to see how recursive stack exhaustion causes production outages.
7. **Take Mandatory Re-Test**: Select the correct answer on activation frame counts. The system verifies recovery, marks Call Stack 🟢, Recursion 🟢, and unlocks Tree & Graph Traversal.
8. **View Updated Adaptive Path**: Navigate to `/progress` to see the personalized curriculum roadmap dynamically updated.

import { callGemini } from "./gemini";

export interface FileAnalysisResult {
  fileName: string;
  fileSize: number;
  detectedLanguage: string;
  topic: string;
  problemStatement: string;
  suggestedQuestion: string;
  suggestedAnswer: string;
  codeSnippet?: string;
  keyConcepts: string[];
  analysisSummary: string;
  potentialMisconceptions: string[];
  formalReality: string;
  recommendedNextStep: string;
}

/**
 * Detects the programming language / file format from name and content.
 */
function detectLanguage(fileName: string, content: string): string {
  const ext = fileName.toLowerCase().split(".").pop() || "";
  switch (ext) {
    case "sql":
      return "SQL";
    case "py":
      return "Python";
    case "java":
      return "Java";
    case "cpp":
    case "cc":
    case "cxx":
    case "h":
    case "hpp":
      return "C++";
    case "c":
      return "C";
    case "js":
    case "mjs":
    case "cjs":
      return "JavaScript";
    case "ts":
    case "tsx":
      return "TypeScript";
    case "rs":
      return "Rust";
    case "go":
      return "Go";
    case "md":
      return "Markdown";
    case "json":
      return "JSON";
    default:
      if (/SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN/i.test(content)) return "SQL";
      if (/def |import |class |print\(/i.test(content)) return "Python";
      if (/public class |System\.out\.println/i.test(content)) return "Java";
      if (/#include |std::|cout <</i.test(content)) return "C++";
      if (/function |const |let |console\.log/i.test(content)) return "JavaScript";
      return "Plain Text / Code";
  }
}

/**
 * Extracts explicitly stated problem statements from comments or markdown if present.
 */
function extractEmbeddedProblem(content: string): string | null {
  const patterns = [
    /(?:problem statement|problem|task|challenge|question)[:\s-]+\n?([^\n#/*]+(?:\n[^\n#/*]+){0,4})/i,
    /\/\*\s*(?:problem|task|question)[:\s-]*([\s\S]*?)\*\//i,
    /#\s*(?:problem|task|question)[:\s-]*([\s\S]*?)(?=\n\n|\nclass|\ndef|$)/i,
    /<!--\s*(?:problem|task|question)[:\s-]*([\s\S]*?)-->/i,
  ];

  for (const regex of patterns) {
    const match = content.match(regex);
    if (match && match[1] && match[1].trim().length > 15) {
      return match[1].trim().replace(/^[/*#\s-]+|[/*#\s-]+$/g, "");
    }
  }
  return null;
}

/**
 * Analyzes an uploaded file from file manager and synthesizes topic, problem statement, and diagnostic metadata.
 */
export async function analyzeUploadedFile(
  fileName: string,
  content: string,
  fileSize: number = 0
): Promise<FileAnalysisResult> {
  const lang = detectLanguage(fileName, content);
  const embeddedProblem = extractEmbeddedProblem(content);
  const lower = content.toLowerCase();

  // 1. Try Gemini API first if configured
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim() !== "") {
    try {
      const prompt = `
You are ARCHAIA, an expert cognitive diagnostic engine for computer science.
A student or instructor has uploaded a file from their file manager.
Analyze this file and extract/formulate:
1. topic: A clear, academic topic name (e.g. "SQL Transaction Isolation", "Recursive Call Stack Invariants", "Memory Allocation & Pointer Safety").
2. problemStatement: A rigorous, formal problem statement or challenge derived from this file (what problem is being solved, tested, or investigated?).
3. suggestedQuestion: A focused diagnostic question testing student understanding of the underlying invariant.
4. suggestedAnswer: A common naive student reasoning or hypothesis that might contain a conceptual flaw.
5. keyConcepts: Array of 3-5 core computer science concept names.
6. analysisSummary: A 2-3 sentence technical summary of what this code/file tests and its primary algorithmic invariants.
7. potentialMisconceptions: Array of 1-2 common misconceptions learners have about this concept.
8. formalReality: The correct, formal computing invariant governing this scenario.

File Name: "${fileName}"
Detected Language: "${lang}"
File Content:
\`\`\`
${content.slice(0, 4000)}
\`\`\`

Return ONLY valid JSON matching this schema:
{
  "topic": string,
  "problemStatement": string,
  "suggestedQuestion": string,
  "suggestedAnswer": string,
  "keyConcepts": string[],
  "analysisSummary": string,
  "potentialMisconceptions": string[],
  "formalReality": string
}
`;

      const aiText = await callGemini({ prompt });
      if (aiText) {
        const cleaned = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.topic && parsed.problemStatement) {
          return {
            fileName,
            fileSize: fileSize || content.length,
            detectedLanguage: lang,
            topic: parsed.topic,
            problemStatement: embeddedProblem || parsed.problemStatement,
            suggestedQuestion: parsed.suggestedQuestion || `What happens in ${parsed.topic} under edge conditions?`,
            suggestedAnswer: parsed.suggestedAnswer || "The system maintains a single global register state.",
            codeSnippet: content.slice(0, 800),
            keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : [parsed.topic],
            analysisSummary: parsed.analysisSummary || `Analyzed ${fileName} for conceptual invariants.`,
            potentialMisconceptions: Array.isArray(parsed.potentialMisconceptions) ? parsed.potentialMisconceptions : ["Mental model gap in system execution."],
            formalReality: parsed.formalReality || "Formally verified system invariant.",
            recommendedNextStep: "Launch Cognitive Bisect to trace prerequisite dependencies.",
          };
        }
      }
    } catch (e) {
      console.warn("Gemini file analysis fallback triggered:", e);
    }
  }

  // 2. Deterministic Domain Synthesizer & Problem Formulation

  // DOMAIN 1: SQL / Database Transactions
  if (
    lang === "SQL" ||
    lower.includes("transaction") ||
    lower.includes("isolation") ||
    lower.includes("commit") ||
    lower.includes("rollback") ||
    lower.includes("read committed") ||
    lower.includes("repeatable read") ||
    lower.includes("mvcc") ||
    lower.includes("acid")
  ) {
    const topic = "SQL Transaction Isolation & Concurrency Control";
    const problemStatement =
      embeddedProblem ||
      "In a high-throughput multi-user database system, analyze how concurrent transactions executing under the READ COMMITTED isolation level handle statement-level snapshot creation. Specifically, evaluate why two consecutive read operations within an active transaction block can observe conflicting state when external updates commit between statements, and determine the invariant configuration required to enforce transaction-level snapshot isolation.";

    return {
      fileName,
      fileSize: fileSize || content.length,
      detectedLanguage: lang,
      topic,
      problemStatement,
      suggestedQuestion: "Why can READ COMMITTED return different values between two reads in the same transaction?",
      suggestedAnswer: "The transaction should keep one fixed snapshot throughout its entire lifecycle.",
      codeSnippet: content.slice(0, 800),
      keyConcepts: [
        "ACID Transactions",
        "MVCC Snapshot Lifecycle",
        "ANSI Isolation Levels",
        "Non-Repeatable Reads",
        "Concurrency Control",
      ],
      analysisSummary:
        "Analyzes database transaction boundaries and Multi-Version Concurrency Control (MVCC). Verifies whether the learner understands per-statement vs per-transaction read view generation.",
      potentialMisconceptions: [
        "Statement-Level vs Transaction-Level Snapshot Scope Fallacy (believing READ COMMITTED creates a transaction-wide snapshot).",
      ],
      formalReality:
        "In ANSI SQL / MVCC databases, READ COMMITTED acquires a fresh snapshot per individual statement; maintaining a fixed snapshot across all statements requires REPEATABLE READ or SERIALIZABLE.",
      recommendedNextStep: "Run Step 1 Cognitive Diagnostic to verify mental model invariants.",
    };
  }

  // DOMAIN 2: Recursion, Trees, Graphs & Call Stack
  if (
    lower.includes("dfs") ||
    lower.includes("bfs") ||
    lower.includes("recursion") ||
    lower.includes("visited") ||
    lower.includes("traversal") ||
    lower.includes("backtrack") ||
    lower.includes("call stack") ||
    lower.includes("tree node")
  ) {
    const topic = "Recursive Graph Traversal & Call Stack Invariants";
    const problemStatement =
      embeddedProblem ||
      "Implement and analyze a recursive traversal over a branched graph topology. Investigate the execution state of the current caller node when dfs() is recursively invoked on an unvisited neighbor, and evaluate whether recursive child calls preserve suspended caller loop positions or destructively overwrite parent activation records.";

    return {
      fileName,
      fileSize: fileSize || content.length,
      detectedLanguage: lang,
      topic,
      problemStatement,
      suggestedQuestion:
        "In recursive Depth-First Search (DFS), what happens to the caller function's local variables and loop position when a recursive child call executes?",
      suggestedAnswer:
        "The child call replaces the current function context, overwriting the caller state so previous loop positions are lost.",
      codeSnippet: content.slice(0, 800),
      keyConcepts: [
        "Call Stack Activation Frames",
        "Recursive Invariants",
        "Graph Traversal (DFS)",
        "State Preservation & Unwinding",
        "Backtracking",
      ],
      analysisSummary:
        "Tests understanding of isolated stack frames in the runtime call stack during deep recursion. Identifies whether the learner views execution as a single mutating register.",
      potentialMisconceptions: [
        "Recursive Context Replacement Fallacy (believing child calls overwrite caller frames).",
      ],
      formalReality:
        "Each recursive invocation pushes a distinct activation record onto the call stack. The caller's frame remains frozen and intact until child completion.",
      recommendedNextStep: "Execute Cognitive Bisect on Call Stack Lifo to isolate prerequisite gap.",
    };
  }

  // DOMAIN 3: Memory Allocation, Pointers & Safety
  if (
    lower.includes("malloc") ||
    lower.includes("free(") ||
    lower.includes("pointer") ||
    lower.includes("nullptr") ||
    lower.includes("memory leak") ||
    lower.includes("segfault") ||
    lower.includes("dereference") ||
    lower.includes("heap") ||
    lower.includes("stack overflow")
  ) {
    const topic = "Dynamic Memory Allocation & Pointer Invariants";
    const problemStatement =
      embeddedProblem ||
      "Evaluate dynamic memory allocation and pointer lifetime management. Determine whether dereferencing a pointer after deallocation (free) safely accesses retained data or triggers undefined memory corruption, and analyze the distinction between pointer variables and heap allocation records.";

    return {
      fileName,
      fileSize: fileSize || content.length,
      detectedLanguage: lang,
      topic,
      problemStatement,
      suggestedQuestion:
        "What occurs when accessing memory through a pointer after calling free(ptr)?",
      suggestedAnswer:
        "The pointer still holds the address so the data remains intact and valid until new memory is requested.",
      codeSnippet: content.slice(0, 800),
      keyConcepts: [
        "Heap Allocation Lifecycle",
        "Dangling Pointer Invalidation",
        "Spatial vs Temporal Memory Safety",
        "Virtual Memory & Segmentation",
      ],
      analysisSummary:
        "Examines low-level dynamic memory invariants. Checks whether the learner understands that calling free immediately invalidates lifetime rights regardless of physical bits.",
      potentialMisconceptions: [
        "Address Retention Equals Data Validity Fallacy (believing pointers remain valid after deallocation).",
      ],
      formalReality:
        "Calling free() releases the memory range to the allocator. Any subsequent read or write constitutes undefined behavior.",
      recommendedNextStep: "Trace memory invariants in the Physical Memory Model lab.",
    };
  }

  // DOMAIN 4: Networking & TCP Protocols
  if (
    lower.includes("tcp") ||
    lower.includes("congestion") ||
    lower.includes("flow control") ||
    lower.includes("window") ||
    lower.includes("socket") ||
    lower.includes("rtt") ||
    lower.includes("packet")
  ) {
    const topic = "TCP Congestion Control & Windowing Mechanics";
    const problemStatement =
      embeddedProblem ||
      "Analyze end-to-end transport protocol transmission dynamics over high-latency networks. Differentiate between receiver-advertised flow control window limits and network-inferred congestion windows, evaluating how AIMD mechanisms respond to packet loss.";

    return {
      fileName,
      fileSize: fileSize || content.length,
      detectedLanguage: lang,
      topic,
      problemStatement,
      suggestedQuestion:
        "Why can sender throughput degrade even when the receiver window (rwnd) is large?",
      suggestedAnswer:
        "If the receiver window is large, the sender will always transmit at maximum network bandwidth.",
      codeSnippet: content.slice(0, 800),
      keyConcepts: [
        "Flow Control vs Congestion Control",
        "Bandwidth-Delay Product (BDP)",
        "Additive Increase / Multiplicative Decrease (AIMD)",
        "TCP Reno / Cubic Congestion Window",
      ],
      analysisSummary:
        "Distinguishes between endpoint receiver buffer capacity and transit network intermediate queue saturation.",
      potentialMisconceptions: [
        "Receiver Window Congestion Equivalence Fallacy.",
      ],
      formalReality:
        "Transmission throughput is strictly bounded by min(rwnd, cwnd). Intermediate router queue drops force cwnd halving regardless of receiver buffer space.",
      recommendedNextStep: "Inspect DAG prerequisite graph for transport layer invariants.",
    };
  }

  // DOMAIN 5: Object-Oriented Inheritance & Polymorphism
  if (
    lower.includes("class ") ||
    lower.includes("extends") ||
    lower.includes("implements") ||
    lower.includes("override") ||
    lower.includes("polymorphism") ||
    lower.includes("virtual")
  ) {
    const topic = "Object-Oriented Inheritance & Dynamic Method Dispatch";
    const problemStatement =
      embeddedProblem ||
      "Analyze polymorphic class hierarchies and method resolution at runtime. Determine whether invoking an overridden method through a superclass reference invokes the superclass definition or the runtime instantiated subclass definition through virtual table lookup.";

    return {
      fileName,
      fileSize: fileSize || content.length,
      detectedLanguage: lang,
      topic,
      problemStatement,
      suggestedQuestion:
        "When calling an overridden method through a base class reference pointing to a derived object, which method executes?",
      suggestedAnswer:
        "The base class method executes because the variable is typed as the base class.",
      codeSnippet: content.slice(0, 800),
      keyConcepts: [
        "Inheritance & Subtyping (IS-A)",
        "Method Overriding",
        "Virtual Method Table (VTable)",
        "Dynamic vs Static Dispatch",
      ],
      analysisSummary:
        "Verifies comprehension of late binding and runtime vtable dispatch versus compile-time type resolution.",
      potentialMisconceptions: [
        "Static Variable Type Determines Dispatch Fallacy.",
      ],
      formalReality:
        "Non-static, non-private methods resolve polymorphically at runtime according to the actual object instance on the heap.",
      recommendedNextStep: "Proceed to Diagnostic Detector with this synthesized problem statement.",
    };
  }

  // DOMAIN 6: General Computer Science & Algorithmic Code
  const cleanName = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
  const derivedTopic = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  const problemStatement =
    embeddedProblem ||
    `Evaluate the algorithmic correctness and computational complexity of ${cleanName}. Determine the preconditions, loop invariants, and boundary conditions required to ensure safe termination and optimal asymptotic scaling.`;

  return {
    fileName,
    fileSize: fileSize || content.length,
    detectedLanguage: lang,
    topic: derivedTopic || "Computer Science Principles",
    problemStatement,
    suggestedQuestion: `What invariant ensures ${derivedTopic} operates correctly on all boundary inputs?`,
    suggestedAnswer: "The algorithm assumes inputs conform to sequential positive bounds.",
    codeSnippet: content.slice(0, 800),
    keyConcepts: [
      derivedTopic,
      "Algorithmic Invariants",
      "Boundary Condition Verification",
      "Time & Space Complexity",
    ],
    analysisSummary: `Synthesized formal problem statement and computational invariant breakdown from ${fileName}.`,
    potentialMisconceptions: [
      "Naive mental model assuming happy-path input distributions without boundary validation.",
    ],
    formalReality:
      "Formal computing systems require explicit preconditions, inductive loop invariants, and termination proofs.",
    recommendedNextStep: "Launch diagnostic pipeline with the formulated problem statement.",
  };
}

import {
  Concept,
  ConceptEdge,
  DiagnosticProbe,
  InterventionContent,
  ReTestAssessment,
  LearnerConceptState,
  CourseMaterial,
} from "../types/index";
import { callGemini } from "./gemini";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .substring(0, 40);
}

/**
 * Extracts and synthesizes a full Causal Knowledge Graph, Diagnostic Probes,
 * and Remediation content from user-uploaded course material.
 */
export async function extractCourseMaterial(
  title: string,
  content: string,
  subject: string = "Computer Science",
  fileName?: string
): Promise<CourseMaterial> {
  const courseId = "course_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  const cleanTitle = title.trim() || (fileName ? fileName.replace(/\.[^/.]+$/, "") : "Course Material");

  // 1. Try Gemini API first if configured
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim() !== "") {
    try {
      const prompt = `
You are ARCHAIA, an ontological knowledge graph and cognitive diagnostic engine.
A user has uploaded course material. Extract the underlying conceptual dependencies into a Directed Acyclic Graph (DAG) with diagnostic probes.

Course Title: "${cleanTitle}"
Subject: "${subject}"
Content excerpt:
"""
${content.slice(0, 5000)}
"""

Extract 4 to 6 ordered computer science / engineering concepts arranged from foundational to advanced.
Return ONLY valid JSON matching this schema:
{
  "concepts": [
    {
      "id": string (snake_case),
      "name": string,
      "category": string,
      "description": string,
      "prerequisites": string[],
      "difficulty": "beginner" | "intermediate" | "advanced",
      "estimatedMinutes": number
    }
  ],
  "edges": [
    {
      "from": string,
      "to": string,
      "rationale": string
    }
  ],
  "probes": [
    {
      "id": string,
      "conceptId": string,
      "targetConceptId": string,
      "question": string,
      "options": [
        { "id": string, "text": string, "isCorrect": boolean, "indicator": string }
      ],
      "invariantTested": string,
      "rationale": string
    }
  ],
  "rootRemediation": {
    "conceptId": string,
    "title": string,
    "explanation": string,
    "counterexample": {
      "title": string,
      "code": string,
      "expectedOutput": string,
      "actualOutput": string,
      "mentalModelExplanation": string
    },
    "microPuzzle": {
      "question": string,
      "options": string[],
      "correctIndex": number,
      "explanation": string
    },
    "retest": {
      "question": string,
      "options": [
        { "id": string, "text": string, "isCorrect": boolean, "feedback": string }
      ]
    }
  }
}
`;
      const aiText = await callGemini({
        prompt,
        systemInstruction: "You are the ARCHAIA Knowledge Graph Extractor. Output ONLY pure raw JSON without markdown formatting or code blocks.",
      });

      if (aiText) {
        const cleaned = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        if (parsed.concepts && Array.isArray(parsed.concepts) && parsed.concepts.length >= 3) {
          const concepts: Concept[] = parsed.concepts.map((c: any) => ({
            id: slugify(c.id || c.name),
            conceptId: slugify(c.id || c.name),
            name: c.name,
            category: c.category || "Core Systems",
            description: c.description || `Conceptual invariant governing ${c.name}.`,
            prerequisites: Array.isArray(c.prerequisites) ? c.prerequisites.map(slugify) : [],
            learningMaterialReference: `${cleanTitle} • Section`,
            difficulty: c.difficulty || "intermediate",
            estimatedMinutes: c.estimatedMinutes || 25,
            recoveryStatus: "untested",
          }));

          // Compute dependent concepts
          concepts.forEach((c) => {
            c.dependentConcepts = concepts
              .filter((other) => other.prerequisites.includes(c.id))
              .map((other) => other.id);
          });

          const edges: ConceptEdge[] = (parsed.edges || []).map((e: any) => ({
            from: slugify(e.from),
            to: slugify(e.to),
            rationale: e.rationale || `Understanding ${e.from} is required before mastering ${e.to}.`,
          }));

          const probes: DiagnosticProbe[] = (parsed.probes || []).map((p: any, idx: number) => ({
            id: p.id || `probe_${slugify(p.conceptId || concepts[0].id)}_${idx}`,
            conceptId: slugify(p.conceptId || concepts[0].id),
            targetConceptId: slugify(p.targetConceptId || concepts[concepts.length - 1].id),
            question: p.question || `What invariant governs ${p.conceptId}?`,
            options: Array.isArray(p.options)
              ? p.options
              : [
                  { id: "opt_1", text: "Formal invariant holds correctly", isCorrect: true, indicator: "Mastered" },
                  { id: "opt_2", text: "Naive misconception assumption", isCorrect: false, indicator: "Mental Gap" },
                ],
            invariantTested: p.invariantTested || "Core Invariant",
            rationale: p.rationale || "Diagnostic invariant verification.",
          }));

          const rootConceptId = slugify(parsed.rootRemediation?.conceptId || concepts[0].id);
          const interventions: Record<string, InterventionContent> = {};
          const retests: Record<string, ReTestAssessment> = {};

          if (parsed.rootRemediation) {
            interventions[rootConceptId] = {
              id: `recovery_${rootConceptId}`,
              rootConceptId,
              targetConceptId: concepts[concepts.length - 1].id,
              title: parsed.rootRemediation.title || `${concepts[0].name} Invariant Remediation`,
              explanation: parsed.rootRemediation.explanation || `Core invariant breakdown for ${concepts[0].name}.`,
              visualMemoryModel: {
                type: "timeline",
                title: `${concepts[0].name} Execution Model`,
                description: "State transition sequence under rigorous computing contracts.",
                frames: [
                  {
                    step: 1,
                    label: "Initial Allocation",
                    stackFrames: ["Frame: caller"],
                    activeLine: 1,
                    explanation: "Preconditions verified.",
                  },
                  {
                    step: 2,
                    label: "Transition & Return",
                    stackFrames: ["Frame: caller (resumed)"],
                    activeLine: 2,
                    explanation: "Postconditions and invariants preserved.",
                  },
                ],
              },
              counterexample: parsed.rootRemediation.counterexample || {
                title: `Counterexample in ${concepts[0].name}`,
                code: `// Invariant contract in ${concepts[0].name}`,
                expectedOutput: "Expected State",
                actualOutput: "Observed State",
                mentalModelExplanation: "Violating the invariant produces unexpected execution.",
              },
              microPuzzle: parsed.rootRemediation.microPuzzle || {
                question: `What contract is guaranteed by ${concepts[0].name}?`,
                options: ["Unbounded state mutation", "Strict invariant preservation", "Ignore boundary conditions"],
                correctIndex: 1,
                explanation: "Formal systems require explicit invariant enforcement.",
              },
              codeExercise: {
                instructions: `Refactor the routine to respect ${concepts[0].name} invariants.`,
                initialCode: `// Fix implementation for ${concepts[0].name}`,
                expectedPattern: "return",
                solutionCode: `// Validated solution for ${concepts[0].name}`,
                hints: ["Enforce boundary guarantees."],
              },
              industryBlastRadius: {
                incidentTitle: `Production Outage in ${concepts[0].name}`,
                organizationType: "Distributed Infrastructure",
                outageDescription: `Subtle flaw in ${concepts[0].name} invariant handling propagated to downstream services.`,
                howMisconceptionCausesIt: "Unverified assumptions allowed anomalous state mutations.",
                illustrativeNote: `Real-world impact: Understanding ${concepts[0].name} prevents critical system failure.`,
              },
            };

            retests[rootConceptId] = {
              id: `retest_${rootConceptId}`,
              conceptId: rootConceptId,
              question: parsed.rootRemediation.retest?.question || `What is the key invariant guarantee in ${concepts[0].name}?`,
              options: parsed.rootRemediation.retest?.options || [
                { id: "opt_corr", text: "Formal invariant is consistently preserved", isCorrect: true, feedback: "Correct! Invariant mastered." },
                { id: "opt_flaw", text: "Naive assumption replaces state", isCorrect: false, feedback: "Incorrect. Reflects original misconception." },
              ],
            };
          }

          const learnerStates: Record<string, LearnerConceptState> = {};
          concepts.forEach((c) => {
            learnerStates[c.id] = {
              conceptId: c.id,
              masteryScore: 0,
              status: "untested",
              confidence: 0,
              recoveryAttempts: 0,
            };
          });

          return {
            id: courseId,
            title: cleanTitle,
            subject,
            content,
            extractedConcepts: concepts.map((c) => c.id),
            concepts,
            edges,
            probes,
            interventions,
            retests,
            learnerStates,
            createdAt: new Date().toISOString(),
          };
        }
      }
    } catch (e) {
      console.warn("Gemini course extraction fallback triggered:", e);
    }
  }

  // 2. High-Precision Deterministic Synthesizer
  return synthesizeDeterministicCourse(cleanTitle, content, subject, courseId);
}

/**
 * Deterministic domain extractor parsing headers, bullet points, keywords, and technical structure.
 */
function synthesizeDeterministicCourse(
  title: string,
  content: string,
  subject: string,
  courseId: string
): CourseMaterial {
  const lower = content.toLowerCase();

  // Pattern A: Operating Systems / Concurrency / Processes
  if (
    lower.includes("process") ||
    lower.includes("thread") ||
    lower.includes("deadlock") ||
    lower.includes("mutex") ||
    lower.includes("semaphore") ||
    lower.includes("scheduling") ||
    lower.includes("virtual memory") ||
    lower.includes("paging")
  ) {
    const rawConcepts = [
      { id: "cpu_scheduling", name: "CPU Scheduling & Context Switching", category: "Hardware & Kernel", diff: "beginner" as const, min: 20 },
      { id: "process_threads", name: "Processes & Thread Concurrency", category: "OS Foundations", diff: "beginner" as const, min: 25 },
      { id: "mutex_semaphores", name: "Mutual Exclusion & Semaphores", category: "Synchronization", diff: "intermediate" as const, min: 30 },
      { id: "race_conditions", name: "Race Conditions & Critical Sections", category: "Concurrency Safety", diff: "intermediate" as const, min: 35 },
      { id: "deadlock_avoidance", name: "Deadlock Detection & Banker's Invariants", category: "Resource Safety", diff: "advanced" as const, min: 40 },
    ];

    return buildCoursePackage(
      courseId,
      title || "Operating Systems: Concurrency & Invariants",
      "Operating Systems",
      content,
      rawConcepts,
      [
        ["cpu_scheduling", "process_threads", "Hardware context switching is the physical foundation for thread concurrency."],
        ["process_threads", "mutex_semaphores", "Shared thread memory spaces mandate mutual exclusion primitives."],
        ["mutex_semaphores", "race_conditions", "Semaphores prevent atomicity violations in critical sections."],
        ["race_conditions", "deadlock_avoidance", "Acquiring multiple mutexes without ordering creates circular wait deadlocks."],
      ],
      "mutex_semaphores",
      "In concurrent multi-threaded execution, what invariant must a binary semaphore enforce?",
      [
        { id: "opt_1", text: "At most one execution thread can hold the critical lock concurrently", isCorrect: true, indicator: "Mastered" },
        { id: "opt_2", text: "Threads automatically preempt other threads without atomic synchronization", isCorrect: false, indicator: "Naive preemption assumption" },
      ],
      "Binary semaphore invariant: atomic wait(S) decrement ensures P(S) blocks when value is 0.",
      "Deadlock in Distributed Lock Manager",
      "Inconsistent lock acquisition ordering caused cyclic dependency across 4 worker nodes."
    );
  }

  // Pattern B: Database Systems / Transactions / ACID
  if (
    lower.includes("sql") ||
    lower.includes("transaction") ||
    lower.includes("acid") ||
    lower.includes("isolation") ||
    lower.includes("mvcc") ||
    lower.includes("index") ||
    lower.includes("btree")
  ) {
    const rawConcepts = [
      { id: "relational_algebra", name: "Relational Algebra & Schema Constraints", category: "Data Foundations", diff: "beginner" as const, min: 20 },
      { id: "b_tree_indexing", name: "B-Tree Indices & Disk Pages", category: "Storage Engine", diff: "beginner" as const, min: 25 },
      { id: "acid_transactions", name: "ACID Atomicity & Write-Ahead Logging", category: "Transaction Logs", diff: "intermediate" as const, min: 30 },
      { id: "isolation_levels", name: "Snapshot Isolation & MVCC Versions", category: "Concurrency Control", diff: "intermediate" as const, min: 35 },
      { id: "distributed_consensus", name: "Distributed 2-Phase Commit (2PC)", category: "Distributed DBs", diff: "advanced" as const, min: 45 },
    ];

    return buildCoursePackage(
      courseId,
      title || "Database Systems: ACID & MVCC Concurrency",
      "Database Systems",
      content,
      rawConcepts,
      [
        ["relational_algebra", "b_tree_indexing", "Schema relations are indexed into physical B-Tree pages on disk."],
        ["b_tree_indexing", "acid_transactions", "Write-Ahead Logs guarantee durability before dirty buffer pool pages flush to disk."],
        ["acid_transactions", "isolation_levels", "Transaction lifecycles define statement snapshot boundaries under MVCC."],
        ["isolation_levels", "distributed_consensus", "Single-node serializability generalizes to 2-phase commit across shards."],
      ],
      "isolation_levels",
      "Under READ COMMITTED MVCC snapshot isolation, when is a query's read view generated?",
      [
        { id: "opt_1", text: "At the beginning of each individual SQL statement", isCorrect: true, indicator: "Mastered" },
        { id: "opt_2", text: "Once at the start of the entire transaction block", isCorrect: false, indicator: "Snapshot scope confusion" },
      ],
      "READ COMMITTED creates a fresh snapshot for each statement; transaction-level snapshots require REPEATABLE READ.",
      "Financial Transaction Double-Deduction",
      "Concurrent non-repeatable read allowed simultaneous balance check and debit."
    );
  }

  // Pattern C: Computer Networks / Distributed Systems / TCP
  if (
    lower.includes("network") ||
    lower.includes("packet") ||
    lower.includes("tcp") ||
    lower.includes("ip") ||
    lower.includes("dns") ||
    lower.includes("congestion") ||
    lower.includes("latency") ||
    lower.includes("socket")
  ) {
    const rawConcepts = [
      { id: "packet_switching", name: "Packet Switching & Framing", category: "Physical & Link", diff: "beginner" as const, min: 20 },
      { id: "ip_routing", name: "IP Addressing & Subnet Routing", category: "Network Layer", diff: "beginner" as const, min: 25 },
      { id: "tcp_handshake", name: "TCP 3-Way Handshake & Sequence Numbers", category: "Transport Layer", diff: "intermediate" as const, min: 30 },
      { id: "flow_control", name: "Receiver Window Flow Control", category: "Buffer Management", diff: "intermediate" as const, min: 35 },
      { id: "congestion_control", name: "AIMD Congestion Window (cwnd) Dynamics", category: "Transport Dynamics", diff: "advanced" as const, min: 40 },
    ];

    return buildCoursePackage(
      courseId,
      title || "Computer Networks: Transport Invariants & Congestion",
      "Computer Networks",
      content,
      rawConcepts,
      [
        ["packet_switching", "ip_routing", "Framed packets are routed across hops via IP headers."],
        ["ip_routing", "tcp_handshake", "Unreliable IP datagrams are serialized into ordered byte streams via TCP."],
        ["tcp_handshake", "flow_control", "Sequence numbers allow receiver buffer boundaries to regulate transmission."],
        ["flow_control", "congestion_control", "Flow control protects the receiver; congestion control protects intermediate router queues."],
      ],
      "tcp_handshake",
      "Why must TCP SYN packets consume a sequence number during connection establishment?",
      [
        { id: "opt_1", text: "To reliably acknowledge connection initiation and synchronize sequence state", isCorrect: true, indicator: "Mastered" },
        { id: "opt_2", text: "Sequence numbers are only needed when actual user data payload is present", isCorrect: false, indicator: "Handshake payload fallacy" },
      ],
      "TCP SYN consumes 1 sequence number to guarantee reliable delivery and duplicate packet rejection.",
      "Edge Proxy Connection Starvation",
      "Half-open SYN flood saturated transmission control blocks."
    );
  }

  // Pattern D: Machine Learning / Neural Networks / Optimization
  if (
    lower.includes("machine learning") ||
    lower.includes("neural") ||
    lower.includes("gradient") ||
    lower.includes("backprop") ||
    lower.includes("loss") ||
    lower.includes("epoch") ||
    lower.includes("overfit")
  ) {
    const rawConcepts = [
      { id: "vector_spaces", name: "Linear Algebra & Vector Tensors", category: "Math Foundations", diff: "beginner" as const, min: 20 },
      { id: "loss_functions", name: "Empirical Risk & Loss Formulations", category: "Optimization Objectives", diff: "beginner" as const, min: 25 },
      { id: "gradient_descent", name: "Gradient Descent & Learning Rates", category: "Optimization", diff: "intermediate" as const, min: 30 },
      { id: "backpropagation", name: "Computational Graphs & Backpropagation", category: "Chain Rule", diff: "intermediate" as const, min: 35 },
      { id: "regularization", name: "Generalization Bounds & Regularization", category: "Model Invariants", diff: "advanced" as const, min: 40 },
    ];

    return buildCoursePackage(
      courseId,
      title || "Machine Learning: Optimization & Backpropagation Invariants",
      "Machine Learning",
      content,
      rawConcepts,
      [
        ["vector_spaces", "loss_functions", "High-dimensional tensor outputs are mapped to scalar loss manifolds."],
        ["loss_functions", "gradient_descent", "Partial derivatives of loss guide parameter update trajectories."],
        ["gradient_descent", "backpropagation", "Chain rule propagates gradient vectors backward through layer activations."],
        ["backpropagation", "regularization", "Unconstrained gradient steps overfit sample noise without weight decay or dropout."],
      ],
      "backpropagation",
      "In backpropagation, what is the role of caching forward pass activation values?",
      [
        { id: "opt_1", text: "Local gradients require forward activation values to compute layer derivatives", isCorrect: true, indicator: "Mastered" },
        { id: "opt_2", text: "Forward activations can be discarded immediately once loss is calculated", isCorrect: false, indicator: "Activation disposal misconception" },
      ],
      "The chain rule derivative dL/dW depends on input activation x, requiring activations to be cached until the backward pass.",
      "Out of Memory Failure in Deep Transformer Training",
      "Retaining unneeded autograd graph activations caused GPU VRAM exhaustion."
    );
  }

  // Fallback Pattern: Generic Course Material Deconstructor
  // Extract key terms from lines or words
  const extractedLines = content
    .split("\n")
    .map((l) => l.replace(/^[#*\d.-]+\s*/, "").trim())
    .filter((l) => l.length > 5 && l.length < 60);

  const conceptNames = extractedLines.slice(0, 5);
  if (conceptNames.length < 3) {
    conceptNames.push(
      `${title}: Core Invariants`,
      `${title}: State Transitions`,
      `${title}: Boundary Execution`,
      `${title}: Advanced Invariants`
    );
  }

  const rawConcepts = conceptNames.slice(0, 5).map((name, idx) => ({
    id: slugify(name) || `concept_${idx + 1}`,
    name: name,
    category: idx === 0 ? "Foundations" : idx < 3 ? "Core Invariants" : "Advanced Architecture",
    diff: idx === 0 ? ("beginner" as const) : idx < 3 ? ("intermediate" as const) : ("advanced" as const),
    min: 20 + idx * 5,
  }));

  const edges: [string, string, string][] = [];
  for (let i = 0; i < rawConcepts.length - 1; i++) {
    edges.push([
      rawConcepts[i].id,
      rawConcepts[i + 1].id,
      `Mastering ${rawConcepts[i].name} establishes the invariant preconditions required for ${rawConcepts[i + 1].name}.`,
    ]);
  }

  return buildCoursePackage(
    courseId,
    title,
    subject,
    content,
    rawConcepts,
    edges,
    rawConcepts[0].id,
    `What fundamental invariant governs ${rawConcepts[0].name}?`,
    [
      { id: "opt_1", text: "Preconditions and postconditions must be strictly preserved across state transitions", isCorrect: true, indicator: "Mastered" },
      { id: "opt_2", text: "The system tolerates arbitrary uncontrolled mutation of internal registers", isCorrect: false, indicator: "Uncontrolled state assumption" },
    ],
    "Formal computing systems enforce inductive invariants at every state boundary.",
    `Production Failure in ${title}`,
    `Unverified assumptions in ${rawConcepts[0].name} led to system corruption.`
  );
}

/**
 * Helper to construct the complete normalized CourseMaterial package.
 */
function buildCoursePackage(
  courseId: string,
  title: string,
  subject: string,
  content: string,
  rawConcepts: { id: string; name: string; category: string; diff: "beginner" | "intermediate" | "advanced"; min: number }[],
  edgesData: [string, string, string][],
  rootId: string,
  probeQuestion: string,
  probeOptions: { id: string; text: string; isCorrect: boolean; indicator: string }[],
  formalReality: string,
  incidentTitle: string,
  incidentDesc: string
): CourseMaterial {
  const concepts: Concept[] = rawConcepts.map((c) => ({
    id: c.id,
    conceptId: c.id,
    name: c.name,
    category: c.category,
    description: `Formal computing invariants and execution contracts governing ${c.name}.`,
    prerequisites: edgesData.filter((e) => e[1] === c.id).map((e) => e[0]),
    dependentConcepts: edgesData.filter((e) => e[0] === c.id).map((e) => e[1]),
    learningMaterialReference: `${title} • Syllabus`,
    difficulty: c.diff,
    estimatedMinutes: c.min,
    recoveryStatus: "untested",
  }));

  const edges: ConceptEdge[] = edgesData.map(([from, to, rationale]) => ({
    from,
    to,
    rationale,
  }));

  const targetId = concepts[concepts.length - 1].id;

  const probes: DiagnosticProbe[] = [
    {
      id: `probe_${rootId}_1`,
      conceptId: rootId,
      targetConceptId: targetId,
      question: probeQuestion,
      options: probeOptions,
      invariantTested: `${concepts[0].name} Invariant`,
      rationale: `Validates whether the student has mastered foundational preconditions for ${concepts[0].name}.`,
    },
  ];

  const interventions: Record<string, InterventionContent> = {};
  interventions[rootId] = {
    id: `recovery_${rootId}`,
    rootConceptId: rootId,
    targetConceptId: targetId,
    title: `${concepts[0].name}: Formal Invariant Remediation`,
    explanation: formalReality,
    visualMemoryModel: {
      type: "timeline",
      title: `${concepts[0].name} Execution Model`,
      description: "Step-by-step state preservation across execution boundaries.",
      frames: [
        {
          step: 1,
          label: "Precondition Verification",
          stackFrames: [`${concepts[0].name}: Initialized`],
          activeLine: 1,
          explanation: "Input parameters validated against formal contracts.",
        },
        {
          step: 2,
          label: "Atomic State Transition",
          stackFrames: [`${concepts[0].name}: Transition Active`],
          activeLine: 2,
          explanation: "System invariant preserved during transformation.",
        },
        {
          step: 3,
          label: "Postcondition Verification",
          stackFrames: [`${concepts[0].name}: Resolved`],
          activeLine: 3,
          explanation: "State verified and returned safely to caller context.",
        },
      ],
    },
    counterexample: {
      title: `Common Flaw in ${concepts[0].name}`,
      code: `// Flawed assumption in ${concepts[0].name}\nexecuteWithoutInvariantVerification();`,
      expectedOutput: "Invariant maintained: State consistent",
      actualOutput: "Invariant violated: State corrupted",
      mentalModelExplanation: "Failing to check invariants leads to inconsistent runtime execution.",
    },
    microPuzzle: {
      question: `Why must ${concepts[0].name} preserve invariants?`,
      options: [
        "To satisfy the formal contract and prevent downstream corruption",
        "It doesn't; execution continues regardless",
        "Only for logging purposes",
      ],
      correctIndex: 0,
      explanation: "Invariant preservation ensures mathematical correctness across state boundaries.",
    },
    codeExercise: {
      instructions: `Refactor the function to guarantee ${concepts[0].name} invariants.`,
      initialCode: `function execute() {\n  // Invariant check missing\n  return true;\n}`,
      expectedPattern: "return",
      solutionCode: `function execute() {\n  // Invariant verified\n  if (invariantHolds()) return true;\n  throw new Error("Invariant violated");\n}`,
      hints: ["Verify preconditions before executing state changes."],
    },
    industryBlastRadius: {
      incidentTitle,
      organizationType: "Mission-Critical Systems",
      outageDescription: incidentDesc,
      howMisconceptionCausesIt: "Operating on flawed assumptions led to cascading downstream system failures.",
      illustrativeNote: `Real-world impact: Understanding ${concepts[0].name} prevents production outages.`,
    },
  };

  const retests: Record<string, ReTestAssessment> = {};
  retests[rootId] = {
    id: `retest_${rootId}`,
    conceptId: rootId,
    question: `What is the fundamental invariant guarantee in ${concepts[0].name}?`,
    options: [
      { id: "opt_correct", text: formalReality, isCorrect: true, feedback: "Correct! You have mastered the invariant." },
      { id: "opt_flawed", text: "The system permits unrestricted register overwrites", isCorrect: false, feedback: "Incorrect. That reflects the original naive misconception." },
    ],
  };

  const learnerStates: Record<string, LearnerConceptState> = {};
  concepts.forEach((c) => {
    learnerStates[c.id] = {
      conceptId: c.id,
      masteryScore: 0,
      status: "untested",
      confidence: 0,
      recoveryAttempts: 0,
    };
  });

  return {
    id: courseId,
    title,
    subject,
    content,
    extractedConcepts: concepts.map((c) => c.id),
    concepts,
    edges,
    probes,
    interventions,
    retests,
    learnerStates,
    createdAt: new Date().toISOString(),
  };
}

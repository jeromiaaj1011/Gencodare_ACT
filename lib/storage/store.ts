import {
  Concept,
  ConceptEdge,
  LearnerConceptState,
  Misconception,
  DiagnosticProbe,
  BisectSession,
  InterventionContent,
  ReTestAssessment,
  StudentSubmission,
  CourseMaterial,
  LearningProgressMetrics,
} from "../types";
import { INITIAL_CONCEPTS, INITIAL_EDGES } from "../graph/topology";
import {
  SEED_COURSE_MATERIALS,
  SEED_LEARNER_STATES,
  SEED_MISCONCEPTIONS,
  SEED_DIAGNOSTIC_PROBES,
  SEED_INTERVENTIONS,
  SEED_RETEST_ASSESSMENTS,
} from "./initialData";
import { DAGEngine } from "../graph/dagEngine";

class DataStore {
  private concepts: Concept[];
  private edges: ConceptEdge[];
  private learnerStates: Map<string, LearnerConceptState>;
  private misconceptions: Map<string, Misconception>;
  private probes: Map<string, DiagnosticProbe>;
  private interventions: Map<string, InterventionContent>;
  private reTests: Map<string, ReTestAssessment>;
  private submissions: StudentSubmission[];
  private activeBisectSession?: BisectSession;
  private courseMaterials: CourseMaterial[];
  private dagEngine: DAGEngine;

  constructor() {
    this.concepts = [...INITIAL_CONCEPTS];
    this.edges = [...INITIAL_EDGES];
    this.learnerStates = new Map();
    this.misconceptions = new Map();
    this.probes = new Map();
    this.interventions = new Map();
    this.reTests = new Map();
    this.submissions = [];
    this.courseMaterials = [...SEED_COURSE_MATERIALS];

    this.resetToSeed();
    this.dagEngine = new DAGEngine(this.concepts, this.edges);
  }

  public resetToSeed(): void {
    this.concepts = [...INITIAL_CONCEPTS];
    this.edges = [...INITIAL_EDGES];
    this.learnerStates = new Map();
    SEED_LEARNER_STATES.forEach((s) =>
      this.learnerStates.set(s.conceptId, { ...s })
    );

    this.misconceptions = new Map();
    SEED_MISCONCEPTIONS.forEach((m) => this.misconceptions.set(m.id, { ...m }));

    this.probes = new Map();
    SEED_DIAGNOSTIC_PROBES.forEach((p) => this.probes.set(p.id, { ...p }));

    this.interventions = new Map();
    Object.entries(SEED_INTERVENTIONS).forEach(([k, v]) =>
      this.interventions.set(k, { ...v })
    );

    this.reTests = new Map();
    Object.entries(SEED_RETEST_ASSESSMENTS).forEach(([k, v]) =>
      this.reTests.set(k, { ...v })
    );

    this.submissions = [];
    this.activeBisectSession = undefined;
    this.dagEngine = new DAGEngine(this.concepts, this.edges);
  }

  public getDagEngine(): DAGEngine {
    return this.dagEngine;
  }

  public getConcepts(): Concept[] {
    return this.concepts;
  }

  public getEdges(): ConceptEdge[] {
    return this.edges;
  }

  public getCourseMaterials(): CourseMaterial[] {
    return this.courseMaterials;
  }

  public addCourseMaterial(material: CourseMaterial): void {
    this.courseMaterials.push(material);
  }

  public getLearnerState(conceptId: string): LearnerConceptState | undefined {
    return this.learnerStates.get(conceptId);
  }

  public getAllLearnerStates(): LearnerConceptState[] {
    return Array.from(this.learnerStates.values());
  }

  public updateLearnerState(
    conceptId: string,
    updates: Partial<LearnerConceptState>
  ): LearnerConceptState {
    const existing = this.learnerStates.get(conceptId) || {
      conceptId,
      masteryScore: 0,
      status: "untested",
      confidence: 0,
      recoveryAttempts: 0,
    };

    const updated = { ...existing, ...updates };
    this.learnerStates.set(conceptId, updated);
    return updated;
  }

  public getMisconception(id: string): Misconception | undefined {
    return this.misconceptions.get(id);
  }

  public getAllMisconceptions(): Misconception[] {
    return Array.from(this.misconceptions.values());
  }

  public addMisconception(m: Misconception): void {
    this.misconceptions.set(m.id, m);
  }

  public addSubmission(submission: StudentSubmission): void {
    this.submissions.push(submission);
  }

  public getSubmissions(): StudentSubmission[] {
    return this.submissions;
  }

  public ensureConcept(
    conceptId: string,
    name?: string,
    prerequisites?: string[],
    description?: string
  ): Concept {
    let concept = this.concepts.find((c) => c.id === conceptId);
    if (!concept) {
      const cleanName =
        name ||
        conceptId
          .split(/[-_]/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

      let inferredPrereqs = prerequisites;
      if (!inferredPrereqs || inferredPrereqs.length === 0) {
        const lower = conceptId.toLowerCase();
        if (lower.includes("async") || lower.includes("promise") || lower.includes("event")) {
          inferredPrereqs = ["call_stack", "functions_context"];
        } else if (lower.includes("tree") || lower.includes("graph") || lower.includes("dfs") || lower.includes("bfs")) {
          inferredPrereqs = ["tree_traversal", "recursion"];
        } else if (lower.includes("dynamic") || lower.includes("dp") || lower.includes("memo")) {
          inferredPrereqs = ["recursion", "memory_allocation"];
        } else if (lower.includes("sort") || lower.includes("search") || lower.includes("binary")) {
          inferredPrereqs = ["recursion", "memory_allocation"];
        } else {
          inferredPrereqs = ["call_stack", "memory_allocation"];
        }
      }

      concept = {
        id: conceptId,
        name: cleanName,
        category: "Investigated Topic",
        description:
          description ||
          `Learner-submitted concept: ${cleanName}. Evaluated against foundational computing execution invariants.`,
        prerequisites: inferredPrereqs,
        difficulty: "intermediate",
        estimatedMinutes: 30,
      };

      this.concepts.push(concept);

      for (const p of inferredPrereqs) {
        if (!this.edges.some((e) => e.from === p && e.to === conceptId)) {
          this.edges.push({
            from: p,
            to: conceptId,
            rationale: `Understanding ${p} is required to master ${cleanName}.`,
          });
        }
      }

      this.dagEngine = new DAGEngine(this.concepts, this.edges);

      if (!this.learnerStates.has(conceptId)) {
        this.learnerStates.set(conceptId, {
          conceptId,
          masteryScore: 45,
          status: "misconception_detected",
          confidence: 85,
          recoveryAttempts: 0,
        });
      }
    }
    return concept;
  }

  public getProbe(id: string): DiagnosticProbe | undefined {
    return this.probes.get(id);
  }

  public getProbesForConcept(conceptId: string): DiagnosticProbe[] {
    const existing = Array.from(this.probes.values()).filter(
      (p) => p.conceptId === conceptId
    );
    if (existing.length > 0) return existing;

    const concept = this.concepts.find((c) => c.id === conceptId);
    const conceptName = concept?.name || conceptId.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    const dynamicProbe: DiagnosticProbe = {
      id: `probe_dynamic_${conceptId}`,
      conceptId,
      targetConceptId: conceptId,
      question: `In the runtime execution model of ${conceptName}, how are state transitions and execution context preserved across boundaries?`,
      options: [
        {
          id: `opt_${conceptId}_flawed`,
          text: `The active context overwrites the caller's memory state, terminating or replacing preceding frames.`,
          isCorrect: false,
          indicator: `Exhibits context replacement and destructive state mutation fallacy in ${conceptName}.`,
        },
        {
          id: `opt_${conceptId}_correct`,
          text: `Each execution context preserves its own isolated scope/frame, resuming state deterministically upon boundary return.`,
          isCorrect: true,
          indicator: `Accurately models frame isolation and invariant preservation in ${conceptName}.`,
        },
        {
          id: `opt_${conceptId}_distractor`,
          text: `All state is immediately written to non-volatile secondary storage on every sub-routine step.`,
          isCorrect: false,
          indicator: `Confuses runtime RAM memory frames with persistent secondary disk storage.`,
        },
      ],
      invariantTested: `State isolation and execution resumption invariants in ${conceptName}.`,
      rationale: `Determines whether the learner understands physical memory preservation versus destructive mutation in ${conceptName}.`,
    };

    this.probes.set(dynamicProbe.id, dynamicProbe);
    return [dynamicProbe];
  }

  public getActiveBisectSession(): BisectSession | undefined {
    return this.activeBisectSession;
  }

  public setActiveBisectSession(session?: BisectSession): void {
    this.activeBisectSession = session;
  }

  public getIntervention(conceptId: string): InterventionContent | undefined {
    const existing = this.interventions.get(conceptId);
    if (existing) return existing;

    const concept = this.concepts.find((c) => c.id === conceptId);
    const cleanName = concept?.name || conceptId.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    const dynamicIntervention: InterventionContent = {
      id: `intervention_${conceptId}`,
      rootConceptId: conceptId,
      targetConceptId: conceptId,
      title: `${cleanName}: Execution Invariant Remediation`,
      explanation: `When analyzing ${cleanName}, misconceptions arise when conflating mutable memory pointers with isolated state frames. At the hardware and runtime level, every execution boundary maintains an isolated environment. Child invocations or sub-operations do not destroy the caller's context; they suspend it until completion.`,
      visualMemoryModel: {
        type: "call_stack",
        title: `Interactive ${cleanName} Memory Model`,
        description: `Inspect how execution state is preserved across transitions in ${cleanName}.`,
        frames: [
          {
            step: 1,
            label: `Initial State: ${cleanName} Frame 1`,
            stackFrames: [`Context 1: ${cleanName} (Active)`],
            activeLine: 1,
            explanation: `Initial execution boundary created. Local variables allocated in isolated memory space.`,
          },
          {
            step: 2,
            label: `Sub-Procedure Dispatched`,
            stackFrames: [
              `Context 2: Sub-operation (Active)`,
              `Context 1: ${cleanName} (Frozen / Suspended)`,
            ],
            activeLine: 2,
            explanation: `Child operation pushed to execution queue. Context 1 is NOT overwritten; it pauses at current instruction.`,
          },
          {
            step: 3,
            label: `Unwind & Resumption`,
            stackFrames: [`Context 1: ${cleanName} (Resumed)`],
            activeLine: 3,
            explanation: `Sub-operation finishes and releases memory. Context 1 instantly resumes with preserved local state.`,
          },
        ],
      },
      counterexample: {
        title: `Counterexample: Proving Isolated Scope in ${cleanName}`,
        code: `function verifyBoundary(depth) {\n  let savedState = "Parent_" + depth;\n  if (depth < 2) {\n    verifyBoundary(depth + 1);\n  }\n  console.log(savedState); // Verifies parent state survived!\n}\nverifyBoundary(1);\n// Output:\n// Parent_2\n// Parent_1`,
        expectedOutput: "Parent_2\nParent_1",
        actualOutput: "Parent_2\nParent_1",
        mentalModelExplanation: `Notice that 'Parent_1' prints after 'Parent_2'. If the sub-procedure had overwritten the memory context, 'Parent_1' would be lost. Instead, runtime invariants kept it safely intact!`,
      },
      microPuzzle: {
        question: `In ${cleanName}, what happens to local variables when a nested sub-routine is executed?`,
        codeSnippet: `let state = 100;\nfunction execute() {\n  nestedCall();\n  return state;\n}`,
        options: [
          "State is permanently erased to free CPU cache.",
          "State is safely frozen in its execution frame and preserved.",
          "State is cloned into a separate operating system process.",
          "State becomes undefined until explicitly re-assigned.",
        ],
        correctIndex: 1,
        explanation: `Runtime memory architectures preserve local frames on the activation stack, keeping state frozen until the nested sub-routine returns.`,
      },
      codeExercise: {
        instructions: `Refactor the procedure below to ensure the parent execution state is preserved without early premature termination.`,
        initialCode: `function executeRoutine(items, processItem) {\n  let results = [];\n  for (let item of items) {\n    // Fix premature exit:\n    return processItem(item, results);\n  }\n  return results;\n}`,
        expectedPattern: "processItem(item",
        solutionCode: `function executeRoutine(items, processItem) {\n  let results = [];\n  for (let item of items) {\n    processItem(item, results);\n  }\n  return results;\n}`,
        hints: ["Remove the early return inside the loop so the loop can iterate through all items."],
      },
      industryBlastRadius: {
        incidentTitle: `Production Outage from Corrupted State in ${cleanName}`,
        organizationType: "Distributed High-Frequency Trading Platform",
        outageDescription: `A production engine encountered silent transaction loss when a developer mistakenly assumed that sub-calls mutated caller registers in place.`,
        howMisconceptionCausesIt: `Assuming destructive context replacement leads engineers to bypass return value checking, causing downstream data pipelines to process uninitialized records.`,
        illustrativeNote: `Real-world impact: Understanding memory boundaries in ${cleanName} prevents critical data corruption in production systems.`,
      },
    };

    this.interventions.set(conceptId, dynamicIntervention);
    return dynamicIntervention;
  }

  public setIntervention(conceptId: string, content: InterventionContent): void {
    this.interventions.set(conceptId, content);
  }

  public getReTest(conceptId: string): ReTestAssessment | undefined {
    const existing = this.reTests.get(conceptId);
    if (existing) return existing;

    const concept = this.concepts.find((c) => c.id === conceptId);
    const cleanName = concept?.name || conceptId.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    const dynamicReTest: ReTestAssessment = {
      id: `retest_${conceptId}`,
      conceptId,
      question: `Now that you have reviewed the runtime execution invariants for ${cleanName}, what is the fundamental guarantee provided by the runtime regarding execution context?`,
      options: [
        {
          id: `retest_${conceptId}_opt_correct`,
          text: `Each activation record retains its private frame; child invocations pause the caller, which resumes automatically when child frames pop.`,
          isCorrect: true,
          feedback: `Verified! You correctly understand the physical execution boundary and frame lifecycle in ${cleanName}.`,
        },
        {
          id: `retest_${conceptId}_opt_flawed`,
          text: `The child invocation directly replaces and overwrites the parent's memory context, requiring manual restoration.`,
          isCorrect: false,
          feedback: `Incorrect. In modern runtimes, caller frames are preserved in LIFO order and are never overwritten by child invocations.`,
        },
        {
          id: `retest_${conceptId}_opt_distractor`,
          text: `Context is destroyed and recomputed on demand from scratch via compiler JIT caches.`,
          isCorrect: false,
          feedback: `Incorrect. JIT compilation does not alter the physical stack frame semantics of runtime execution.`,
        },
      ],
    };

    this.reTests.set(conceptId, dynamicReTest);
    return dynamicReTest;
  }

  public calculateMetrics(): LearningProgressMetrics {
    const states = Array.from(this.learnerStates.values());
    const total = this.concepts.length;
    let mastered = 0;
    let diagnosed = 0;
    let recovered = 0;
    let unresolved = 0;
    let totalScore = 0;

    for (const s of states) {
      totalScore += s.masteryScore;
      if (s.status === "mastered") mastered++;
      if (s.status === "recovered") {
        mastered++;
        recovered++;
      }
      if (
        s.status === "misconception_detected" ||
        s.status === "root_gap_identified" ||
        s.status === "diagnosing"
      ) {
        diagnosed++;
      }
      if (s.status === "unresolved") unresolved++;
    }

    const overallMastery = total > 0 ? Math.round(totalScore / total) : 0;
    const totalInterventions = recovered + unresolved;
    const recoveryRate =
      totalInterventions > 0
        ? Math.round((recovered / totalInterventions) * 100)
        : 100;

    const activeMisconceptions = Array.from(this.misconceptions.values()).filter(
      (m) => {
        const state = this.learnerStates.get(m.conceptId);
        return (
          state?.status === "misconception_detected" ||
          state?.status === "root_gap_identified"
        );
      }
    );

    return {
      totalConcepts: total,
      masteredCount: mastered,
      diagnosedCount: diagnosed,
      recoveredCount: recovered,
      unresolvedCount: unresolved,
      overallMasteryPercentage: overallMastery,
      recoverySuccessRate: recoveryRate,
      activeMisconceptions,
    };
  }
}

// Global singleton instance for in-memory persistence in development
const globalForStore = globalThis as unknown as { archaiaStore?: DataStore };

export const store = globalForStore.archaiaStore ?? new DataStore();

if (process.env.NODE_ENV !== "production") {
  globalForStore.archaiaStore = store;
}

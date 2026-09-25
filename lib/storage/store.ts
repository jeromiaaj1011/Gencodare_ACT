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
  DiagnosticSession,
} from "../types/index";
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
import fs from "fs";
import path from "path";
import os from "os";

const SESSIONS_DIR = path.join(os.tmpdir(), "archaia_sessions");

function ensureSessionsDir() {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    }
  } catch (e) {}
}

function saveSessionToDisk(session: DiagnosticSession) {
  try {
    ensureSessionsDir();
    fs.writeFileSync(
      path.join(SESSIONS_DIR, `${session.id}.json`),
      JSON.stringify(session),
      "utf-8"
    );
  } catch (e) {}
}

function loadSessionFromDisk(sessionId: string): DiagnosticSession | undefined {
  try {
    const filePath = path.join(SESSIONS_DIR, `${sessionId}.json`);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data) as DiagnosticSession;
    }
  } catch (e) {}
  return undefined;
}

class DataStore {
  // Session Registry: Isolated per diagnostic session
  private diagnosticSessions: Map<string, DiagnosticSession> = new Map();

  // Curated Demo investigation store (isolated from normal user flow)
  private demoConcepts: Concept[] = [...INITIAL_CONCEPTS];
  private demoEdges: ConceptEdge[] = [...INITIAL_EDGES];
  private demoLearnerStates: Map<string, LearnerConceptState> = new Map();
  private demoMisconceptions: Map<string, Misconception> = new Map();
  private demoProbes: Map<string, DiagnosticProbe> = new Map();
  private demoInterventions: Map<string, InterventionContent> = new Map();
  private demoReTests: Map<string, ReTestAssessment> = new Map();
  private demoActiveBisect?: BisectSession;

  private courseMaterials: CourseMaterial[];
  private dagEngine: DAGEngine;

  constructor() {
    this.courseMaterials = [...SEED_COURSE_MATERIALS];
    this.resetDemoData();
    this.dagEngine = new DAGEngine(this.demoConcepts, this.demoEdges);
  }

  public resetDemoData(): void {
    this.demoConcepts = [...INITIAL_CONCEPTS];
    this.demoEdges = [...INITIAL_EDGES];
    this.demoLearnerStates = new Map();
    SEED_LEARNER_STATES.forEach((s) => this.demoLearnerStates.set(s.conceptId, { ...s }));

    this.demoMisconceptions = new Map();
    SEED_MISCONCEPTIONS.forEach((m) => this.demoMisconceptions.set(m.id, { ...m }));

    this.demoProbes = new Map();
    SEED_DIAGNOSTIC_PROBES.forEach((p) => this.demoProbes.set(p.id, { ...p }));

    this.demoInterventions = new Map();
    Object.entries(SEED_INTERVENTIONS).forEach(([k, v]) => this.demoInterventions.set(k, { ...v }));

    this.demoReTests = new Map();
    Object.entries(SEED_RETEST_ASSESSMENTS).forEach(([k, v]) => this.demoReTests.set(k, { ...v }));

    this.demoActiveBisect = {
      id: "bisect_demo_dfs",
      targetConceptId: "graph_traversal",
      detectedMisconceptionId: "rec_context_replace",
      ancestorChain: ["memory_allocation", "functions_context", "call_stack", "recursion", "tree_traversal"],
      investigatedConcepts: [],
      probesAnswered: [],
      candidateScores: {
        memory_allocation: 50,
        functions_context: 50,
        call_stack: 50,
        recursion: 50,
        tree_traversal: 50,
      },
      currentProbe: SEED_DIAGNOSTIC_PROBES.find((p) => p.conceptId === "call_stack"),
      status: "active",
    };
  }

  // --- Diagnostic Session Lifecycle (Scoped by Session ID) ---

  public createDiagnosticSession(session: DiagnosticSession): void {
    this.diagnosticSessions.set(session.id, session);
    saveSessionToDisk(session);
  }

  public getDiagnosticSession(sessionId?: string): DiagnosticSession | undefined {
    if (!sessionId) return undefined;
    if (sessionId === "demo" || sessionId === "demo_dfs") {
      return this.getDemoSession();
    }
    let session = this.diagnosticSessions.get(sessionId);
    if (!session) {
      session = loadSessionFromDisk(sessionId);
      if (session) {
        this.diagnosticSessions.set(sessionId, session);
      }
    }
    return session;
  }

  public updateDiagnosticSession(
    sessionId: string,
    updates: Partial<DiagnosticSession>
  ): DiagnosticSession | undefined {
    if (sessionId === "demo" || sessionId === "demo_dfs") {
      return this.getDemoSession();
    }
    const session = this.getDiagnosticSession(sessionId);
    if (!session) return undefined;
    const updated = { ...session, ...updates };
    this.diagnosticSessions.set(sessionId, updated);
    saveSessionToDisk(updated);
    return updated;
  }

  public getLatestSession(userId?: string): DiagnosticSession | undefined {
    let list = Array.from(this.diagnosticSessions.values()).filter(
      (s) => !s.isDemo && (!userId || s.userId === userId)
    );
    if (list.length === 0) {
      try {
        ensureSessionsDir();
        const files = fs.readdirSync(SESSIONS_DIR).filter((f) => f.endsWith(".json"));
        for (const file of files) {
          const s = loadSessionFromDisk(file.replace(".json", ""));
          if (s && !s.isDemo && (!userId || s.userId === userId)) {
            this.diagnosticSessions.set(s.id, s);
          }
        }
        list = Array.from(this.diagnosticSessions.values()).filter(
          (s) => !s.isDemo && (!userId || s.userId === userId)
        );
      } catch (e) {}
    }
    return list.length > 0 ? list[list.length - 1] : undefined;
  }

  public getUserSessions(userId?: string): DiagnosticSession[] {
    return Array.from(this.diagnosticSessions.values()).filter(
      (s) => !s.isDemo && (!userId || s.userId === userId)
    );
  }

  public getDemoSession(): DiagnosticSession {
    const statesRecord: Record<string, LearnerConceptState> = {};
    this.demoLearnerStates.forEach((v, k) => {
      statesRecord[k] = { ...v };
    });

    return {
      id: "demo_dfs",
      isDemo: true,
      createdAt: new Date().toISOString(),
      submission: {
        conceptId: "graph_traversal",
        conceptName: "Graph Traversal (DFS)",
        questionText:
          "In recursive Depth-First Search (DFS) on a graph, what happens to the execution state of the current node when dfs() is called on an unvisited neighbor?",
        responseType: "written",
        content:
          "When dfs(neighbor) is invoked, it replaces the current function. Because the child executes, the parent function is overwritten, so after visiting node 2 it forgets where it was and exits without exploring node 3.",
      },
      analysis: {
        hasMisconception: true,
        misconception: SEED_MISCONCEPTIONS[0],
        masteryScore: 45,
        confidence: 94,
        evidence: 'Student stated: "When dfs(neighbor) is invoked, it replaces the current function..."',
        explanation:
          "The learner models execution as a single mutating state register rather than a stack of isolated activation records.",
        studentAssumption:
          "Recursive child calls replace or overwrite the parent function frame, destroying caller loop positions.",
        formalReality:
          "Each recursive invocation pushes a new stack frame onto the Call Stack. The caller frame remains suspended in memory and seamlessly resumes when the child returns.",
        normalizedReasoning:
          "Belief in destructive activation record overwriting during nested recursion.",
        extractedIndicators: ["Recursive context replacement", "Call stack unwinding misunderstanding"],
        affectedConcepts: ["graph_traversal", "recursion", "call_stack"],
      },
      graph: {
        concepts: [...this.demoConcepts],
        edges: [...this.demoEdges],
        learnerStates: statesRecord,
      },
      bisectSession: this.demoActiveBisect,
      bisectProbes: Array.from(this.demoProbes.values()),
      recoveryIntervention: this.demoInterventions.get("call_stack"),
      retestAssessment: this.demoReTests.get("call_stack"),
    };
  }

  // --- Session-Aware DAG & Concept Methods ---

  public getConcepts(sessionId?: string, userId?: string): Concept[] {
    if (sessionId === "demo" || sessionId === "demo_dfs") {
      return this.demoConcepts;
    }
    if (sessionId) {
      const session = this.getDiagnosticSession(sessionId);
      if (session) return session.graph.concepts;
      return [];
    }
    if (userId) {
      const latest = this.getLatestSession(userId);
      return latest ? latest.graph.concepts : [];
    }
    return [];
  }

  public getEdges(sessionId?: string, userId?: string): ConceptEdge[] {
    if (sessionId === "demo" || sessionId === "demo_dfs") {
      return this.demoEdges;
    }
    if (sessionId) {
      const session = this.getDiagnosticSession(sessionId);
      if (session) return session.graph.edges;
      return [];
    }
    if (userId) {
      const latest = this.getLatestSession(userId);
      return latest ? latest.graph.edges : [];
    }
    return [];
  }

  public getAllLearnerStates(sessionId?: string, userId?: string): LearnerConceptState[] {
    if (sessionId === "demo" || sessionId === "demo_dfs") {
      return Array.from(this.demoLearnerStates.values());
    }
    if (sessionId) {
      const session = this.getDiagnosticSession(sessionId);
      if (session) return Object.values(session.graph.learnerStates);
      return [];
    }
    if (userId) {
      const latest = this.getLatestSession(userId);
      return latest ? Object.values(latest.graph.learnerStates) : [];
    }
    return [];
  }

  public getLearnerState(conceptId: string, sessionId?: string, userId?: string): LearnerConceptState | undefined {
    if (sessionId === "demo" || sessionId === "demo_dfs") {
      return this.demoLearnerStates.get(conceptId);
    }
    if (sessionId) {
      const session = this.getDiagnosticSession(sessionId);
      if (session) return session.graph.learnerStates[conceptId];
      return undefined;
    }
    if (userId) {
      const latest = this.getLatestSession(userId);
      return latest?.graph.learnerStates[conceptId];
    }
    return undefined;
  }

  public updateLearnerState(
    conceptId: string,
    updates: Partial<LearnerConceptState>,
    sessionId?: string
  ): LearnerConceptState {
    if (sessionId === "demo" || sessionId === "demo_dfs") {
      const existing = this.demoLearnerStates.get(conceptId) || {
        conceptId,
        masteryScore: 0,
        status: "untested",
        confidence: 0,
        recoveryAttempts: 0,
      };
      const updated = { ...existing, ...updates };
      this.demoLearnerStates.set(conceptId, updated);
      return updated;
    }

    const session = sessionId ? this.getDiagnosticSession(sessionId) : this.getLatestSession();
    if (session) {
      const existing = session.graph.learnerStates[conceptId] || {
        conceptId,
        masteryScore: 0,
        status: "untested",
        confidence: 0,
        recoveryAttempts: 0,
      };
      const updated = { ...existing, ...updates };
      session.graph.learnerStates[conceptId] = updated;
      saveSessionToDisk(session);
      return updated;
    }

    const fallback: LearnerConceptState = {
      conceptId,
      masteryScore: 0,
      status: "untested",
      confidence: 0,
      recoveryAttempts: 0,
      ...updates,
    };
    return fallback;
  }

  public getDagEngine(sessionId?: string): DAGEngine {
    const concepts = this.getConcepts(sessionId);
    const edges = this.getEdges(sessionId);
    return new DAGEngine(concepts, edges);
  }

  // --- Bisect & Probes ---

  public getActiveBisectSession(sessionId?: string, userId?: string): BisectSession | undefined {
    if (sessionId === "demo" || sessionId === "demo_dfs") {
      return this.demoActiveBisect;
    }
    if (sessionId) {
      return this.getDiagnosticSession(sessionId)?.bisectSession;
    }
    if (userId) {
      return this.getLatestSession(userId)?.bisectSession;
    }
    return undefined;
  }

  public setActiveBisectSession(session: BisectSession, sessionId?: string): void {
    if (sessionId === "demo" || sessionId === "demo_dfs") {
      this.demoActiveBisect = session;
      return;
    }
    const diagSession = sessionId ? this.getDiagnosticSession(sessionId) : this.getLatestSession();
    if (diagSession) {
      diagSession.bisectSession = session;
      saveSessionToDisk(diagSession);
    }
  }

  public getProbesForConcept(conceptId: string, sessionId?: string): DiagnosticProbe[] {
    if (sessionId === "demo" || sessionId === "demo_dfs") {
      return Array.from(this.demoProbes.values()).filter((p) => p.conceptId === conceptId);
    }
    const diagSession = sessionId ? this.getDiagnosticSession(sessionId) : this.getLatestSession();
    if (diagSession) {
      return diagSession.bisectProbes.filter((p) => p.conceptId === conceptId);
    }
    return [];
  }

  public getProbe(probeId: string, sessionId?: string): DiagnosticProbe | undefined {
    if (sessionId === "demo" || sessionId === "demo_dfs") {
      return this.demoProbes.get(probeId);
    }
    const diagSession = sessionId ? this.getDiagnosticSession(sessionId) : this.getLatestSession();
    if (diagSession) {
      return diagSession.bisectProbes.find((p) => p.id === probeId);
    }
    return this.demoProbes.get(probeId);
  }

  // --- Recovery & Retest ---

  public getIntervention(conceptId: string, sessionId?: string, userId?: string): InterventionContent | undefined {
    if (sessionId === "demo" || sessionId === "demo_dfs") {
      return this.demoInterventions.get(conceptId) || this.demoInterventions.get("call_stack");
    }
    const diagSession = sessionId ? this.getDiagnosticSession(sessionId) : (userId ? this.getLatestSession(userId) : undefined);
    if (diagSession && diagSession.recoveryIntervention) {
      return diagSession.recoveryIntervention;
    }
    return undefined;
  }

  public getReTest(conceptId: string, sessionId?: string, userId?: string): ReTestAssessment | undefined {
    if (sessionId === "demo" || sessionId === "demo_dfs") {
      return this.demoReTests.get(conceptId) || this.demoReTests.get("call_stack");
    }
    const diagSession = sessionId ? this.getDiagnosticSession(sessionId) : (userId ? this.getLatestSession(userId) : undefined);
    if (diagSession && diagSession.retestAssessment) {
      return diagSession.retestAssessment;
    }
    return undefined;
  }

  // --- Metrics Calculation ---

  public calculateMetrics(sessionId?: string, userId?: string): LearningProgressMetrics | null {
    if (sessionId === "demo" || sessionId === "demo_dfs") {
      return this.calculateMetricsFromStates(
        this.demoConcepts,
        Array.from(this.demoLearnerStates.values()),
        Array.from(this.demoMisconceptions.values())
      );
    }

    const targetSession = sessionId
      ? this.getDiagnosticSession(sessionId)
      : userId
      ? this.getLatestSession(userId)
      : undefined;

    // If user has no sessions, return null (indicating clean empty state!)
    if (!targetSession) {
      return null;
    }

    const states = Object.values(targetSession.graph.learnerStates);
    const misconceptions = targetSession.analysis.misconception
      ? [targetSession.analysis.misconception]
      : [];

    return this.calculateMetricsFromStates(targetSession.graph.concepts, states, misconceptions);
  }

  private calculateMetricsFromStates(
    concepts: Concept[],
    states: LearnerConceptState[],
    misconceptions: Misconception[]
  ): LearningProgressMetrics {
    const total = concepts.length;
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
      totalInterventions > 0 ? Math.round((recovered / totalInterventions) * 100) : 100;

    const activeMisconceptions = misconceptions.filter((m) => {
      const state = states.find((s) => s.conceptId === m.conceptId);
      return (
        state?.status === "misconception_detected" ||
        state?.status === "root_gap_identified"
      );
    });

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

  public getCourseMaterials(): CourseMaterial[] {
    return this.courseMaterials;
  }

  public addCourseMaterial(material: CourseMaterial): void {
    this.courseMaterials.push(material);
  }
}

// Global singleton instance for in-memory persistence across routes
const globalForStore = globalThis as unknown as { archaiaStore?: DataStore };

export const store = globalForStore.archaiaStore ?? new DataStore();

globalForStore.archaiaStore = store;


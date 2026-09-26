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
  AppContentMode,
} from "../types/index";
import { INITIAL_CONCEPTS, INITIAL_EDGES } from "../graph/topology";
import {
  SEED_COURSE_MATERIALS,
  SEED_LEARNER_STATES,
  SEED_MISCONCEPTIONS,
  SEED_DIAGNOSTIC_PROBES,
  SEED_INTERVENTIONS,
  SEED_RETEST_ASSESSMENTS,
  SEED_DEMO_INVESTIGATION,
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

  // Mode: "demo" (seeded DFS worked example) vs "course" (user uploaded course material)
  private currentMode: AppContentMode = "demo";

  // Curated Demo investigation store (isolated from normal user flow)
  private demoConcepts: Concept[] = [...INITIAL_CONCEPTS];
  private demoEdges: ConceptEdge[] = [...INITIAL_EDGES];
  private demoLearnerStates: Map<string, LearnerConceptState> = new Map();
  private demoMisconceptions: Map<string, Misconception> = new Map();
  private demoProbes: Map<string, DiagnosticProbe> = new Map();
  private demoInterventions: Map<string, InterventionContent> = new Map();
  private demoReTests: Map<string, ReTestAssessment> = new Map();
  private demoActiveBisect?: BisectSession;

  // Course Mode Stores (user uploaded materials)
  private courseMaterials: CourseMaterial[] = [];
  private activeCourseId: string | null = null;

  constructor() {
    this.resetDemoData();
    this.loadPersistentState();
  }

  private loadPersistentState() {
    try {
      ensureSessionsDir();
      // 1. Load Mode
      const modePath = path.join(SESSIONS_DIR, "mode.json");
      if (fs.existsSync(modePath)) {
        const raw = fs.readFileSync(modePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.mode === "demo" || parsed.mode === "course") {
          this.currentMode = parsed.mode;
        }
      }

      // 2. Load Courses
      const coursesPath = path.join(SESSIONS_DIR, "courses.json");
      if (fs.existsSync(coursesPath)) {
        const raw = fs.readFileSync(coursesPath, "utf-8");
        this.courseMaterials = JSON.parse(raw);
      } else {
        this.courseMaterials = [...SEED_COURSE_MATERIALS];
      }

      // 3. Load Active Course Id
      const activePath = path.join(SESSIONS_DIR, "active_course_id.json");
      if (fs.existsSync(activePath)) {
        const raw = fs.readFileSync(activePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.activeCourseId) {
          this.activeCourseId = parsed.activeCourseId;
        }
      } else if (this.courseMaterials.length > 0) {
        this.activeCourseId = this.courseMaterials[0].id;
      }

      // 4. Load Demo Learner States
      const demoStatesPath = path.join(SESSIONS_DIR, "demo_learner_states.json");
      if (fs.existsSync(demoStatesPath)) {
        const raw = fs.readFileSync(demoStatesPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.demoLearnerStates = new Map(parsed);
        }
      }

      // 5. Load Demo Active Bisect Session
      const demoBisectPath = path.join(SESSIONS_DIR, "demo_bisect.json");
      if (fs.existsSync(demoBisectPath)) {
        const raw = fs.readFileSync(demoBisectPath, "utf-8");
        this.demoActiveBisect = JSON.parse(raw);
      }
    } catch (e) {
      this.courseMaterials = [...SEED_COURSE_MATERIALS];
    }
  }

  private saveStateToDisk() {
    try {
      ensureSessionsDir();
      fs.writeFileSync(
        path.join(SESSIONS_DIR, "mode.json"),
        JSON.stringify({ mode: this.currentMode }),
        "utf-8"
      );
      fs.writeFileSync(
        path.join(SESSIONS_DIR, "courses.json"),
        JSON.stringify(this.courseMaterials),
        "utf-8"
      );
      fs.writeFileSync(
        path.join(SESSIONS_DIR, "active_course_id.json"),
        JSON.stringify({ activeCourseId: this.activeCourseId }),
        "utf-8"
      );
    } catch (e) {}
  }

  // --- Content Mode Management ---

  public getMode(): AppContentMode {
    return this.currentMode;
  }

  public setMode(mode: AppContentMode): void {
    this.currentMode = mode;
    this.saveStateToDisk();
  }

  public getActiveCourse(): CourseMaterial | null {
    if (!this.activeCourseId || this.courseMaterials.length === 0) {
      return this.courseMaterials.length > 0 ? this.courseMaterials[0] : null;
    }
    return this.courseMaterials.find((c) => c.id === this.activeCourseId) || this.courseMaterials[0];
  }

  public setActiveCourse(courseId: string): boolean {
    const exists = this.courseMaterials.some((c) => c.id === courseId);
    if (exists) {
      this.activeCourseId = courseId;
      this.currentMode = "course";
      this.saveStateToDisk();
      return true;
    }
    return false;
  }

  public addCourseMaterial(material: CourseMaterial, setAsActive: boolean = true): void {
    // Check if course with this ID already exists, update or push
    const idx = this.courseMaterials.findIndex((c) => c.id === material.id);
    if (idx >= 0) {
      this.courseMaterials[idx] = material;
    } else {
      this.courseMaterials.push(material);
    }

    if (setAsActive) {
      this.activeCourseId = material.id;
      this.currentMode = "course";
    }
    this.saveStateToDisk();
  }

  public getCourseMaterials(): CourseMaterial[] {
    return this.courseMaterials;
  }

  // --- Demo Mode Management (Non-Contaminating) ---

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
      ancestorChain: ["tree_traversal", "recursion", "call_stack"],
      investigatedConcepts: ["tree_traversal", "call_stack"],
      probesAnswered: [
        {
          probeId: "probe_tree_1",
          conceptId: "tree_traversal",
          selectedOptionId: "opt_tree_pass",
          isCorrect: true,
          evidenceWeight: -35,
          timestamp: new Date().toISOString(),
        }
      ],
      currentProbe: SEED_DIAGNOSTIC_PROBES.find((p) => p.id === "probe_stack_1"),
      candidateScores: {
        tree_traversal: 15,
        recursion: 50,
        call_stack: 70,
      },
      status: "active",
      likelyRootGapId: undefined,
      conclusionReason: undefined
    };

    this.currentMode = "demo";

    try {
      ensureSessionsDir();
      const demoStatesPath = path.join(SESSIONS_DIR, "demo_learner_states.json");
      if (fs.existsSync(demoStatesPath)) {
        fs.unlinkSync(demoStatesPath);
      }
      const demoSessionPath = path.join(SESSIONS_DIR, "demo_session.json");
      if (fs.existsSync(demoSessionPath)) {
        fs.unlinkSync(demoSessionPath);
      }
      fs.writeFileSync(
        path.join(SESSIONS_DIR, "demo_bisect.json"),
        JSON.stringify(this.demoActiveBisect),
        "utf-8"
      );
      fs.writeFileSync(
        path.join(SESSIONS_DIR, "mode.json"),
        JSON.stringify({ mode: "demo" }),
        "utf-8"
      );
    } catch (e) {}
  }

  // --- Diagnostic Session Lifecycle (Scoped by Session ID) ---

  public createDiagnosticSession(session: DiagnosticSession): void {
    this.diagnosticSessions.set(session.id, session);
    saveSessionToDisk(session);
  }

  public getDiagnosticSession(sessionId?: string): DiagnosticSession | undefined {
    if (!sessionId) return undefined;
    if (sessionId === "demo" || sessionId === "demo_dfs" || sessionId === "bisect_demo_dfs") {
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
    if (sessionId === "demo" || sessionId === "demo_dfs" || sessionId === "bisect_demo_dfs") {
      const demoSession = this.getDemoSession();
      const updated = { ...demoSession, ...updates };
      try {
        ensureSessionsDir();
        fs.writeFileSync(
          path.join(SESSIONS_DIR, "demo_session.json"),
          JSON.stringify({
            recoveryCompleted: updated.recoveryCompleted,
            retestResult: updated.retestResult,
            adaptivePath: updated.adaptivePath,
          }),
          "utf-8"
        );
      } catch (e) {}
      return updated;
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
          if (["mode.json", "courses.json", "active_course_id.json", "demo_learner_states.json", "demo_bisect.json", "demo_session.json"].includes(file)) continue;
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
    let persistedUpdates: Partial<DiagnosticSession> = {};
    try {
      ensureSessionsDir();
      const demoSessionPath = path.join(SESSIONS_DIR, "demo_session.json");
      if (fs.existsSync(demoSessionPath)) {
        const raw = fs.readFileSync(demoSessionPath, "utf-8");
        persistedUpdates = JSON.parse(raw);
      }
      const demoStatesPath = path.join(SESSIONS_DIR, "demo_learner_states.json");
      if (fs.existsSync(demoStatesPath)) {
        const raw = fs.readFileSync(demoStatesPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.demoLearnerStates = new Map(parsed);
        }
      }
      const demoBisectPath = path.join(SESSIONS_DIR, "demo_bisect.json");
      if (fs.existsSync(demoBisectPath)) {
        const raw = fs.readFileSync(demoBisectPath, "utf-8");
        this.demoActiveBisect = JSON.parse(raw);
      }
    } catch (e) {}

    const statesRecord: Record<string, LearnerConceptState> = {};
    this.demoLearnerStates.forEach((v, k) => {
      statesRecord[k] = { ...v };
    });

    return {
      id: SEED_DEMO_INVESTIGATION.sessionId,
      isDemo: true,
      createdAt: new Date().toISOString(),
      submission: {
        conceptId: SEED_DEMO_INVESTIGATION.conceptId,
        conceptName: SEED_DEMO_INVESTIGATION.conceptName,
        questionText: SEED_DEMO_INVESTIGATION.questionText,
        responseType: SEED_DEMO_INVESTIGATION.responseType,
        content: SEED_DEMO_INVESTIGATION.writtenInput,
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
      recoveryCompleted: persistedUpdates.recoveryCompleted,
      retestResult: persistedUpdates.retestResult,
      adaptivePath: persistedUpdates.adaptivePath,
    };
  }

  // --- Dynamic Causal DAG & Concept Methods (Unified Across Modes) ---

  public getConcepts(sessionId?: string, userId?: string): Concept[] {
    if (sessionId === "demo" || sessionId === "demo_dfs" || sessionId === "bisect_demo_dfs") {
      return this.demoConcepts;
    }
    if (sessionId) {
      const session = this.getDiagnosticSession(sessionId);
      if (session) return session.graph.concepts;
      return [];
    }
    if (userId) {
      const latest = this.getLatestSession(userId);
      if (latest) return latest.graph.concepts;
    }

    // Fallback based on active content mode
    if (this.currentMode === "course") {
      const active = this.getActiveCourse();
      if (active && active.concepts && active.concepts.length > 0) {
        return active.concepts;
      }
    }

    return this.demoConcepts;
  }

  public getEdges(sessionId?: string, userId?: string): ConceptEdge[] {
    if (sessionId === "demo" || sessionId === "demo_dfs" || sessionId === "bisect_demo_dfs") {
      return this.demoEdges;
    }
    if (sessionId) {
      const session = this.getDiagnosticSession(sessionId);
      if (session) return session.graph.edges;
      return [];
    }
    if (userId) {
      const latest = this.getLatestSession(userId);
      if (latest) return latest.graph.edges;
    }

    if (this.currentMode === "course") {
      const active = this.getActiveCourse();
      if (active && active.edges && active.edges.length > 0) {
        return active.edges;
      }
    }

    return this.demoEdges;
  }

  public getAllLearnerStates(sessionId?: string, userId?: string): LearnerConceptState[] {
    if (sessionId === "demo" || sessionId === "demo_dfs" || sessionId === "bisect_demo_dfs" || (!sessionId && this.currentMode === "demo")) {
      try {
        ensureSessionsDir();
        const demoStatesPath = path.join(SESSIONS_DIR, "demo_learner_states.json");
        if (fs.existsSync(demoStatesPath)) {
          const raw = fs.readFileSync(demoStatesPath, "utf-8");
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.demoLearnerStates = new Map(parsed);
          }
        }
      } catch (e) {}
      return Array.from(this.demoLearnerStates.values());
    }
    if (sessionId) {
      const session = this.getDiagnosticSession(sessionId);
      if (session) return Object.values(session.graph.learnerStates);
      return [];
    }
    if (userId) {
      const latest = this.getLatestSession(userId);
      if (latest) return Object.values(latest.graph.learnerStates);
    }

    if (this.currentMode === "course") {
      const active = this.getActiveCourse();
      if (active) {
        if (active.learnerStates && Object.keys(active.learnerStates).length > 0) {
          return Object.values(active.learnerStates);
        }
        if (active.concepts) {
          return active.concepts.map((c) => ({
            conceptId: c.id,
            masteryScore: 0,
            status: "untested" as const,
            confidence: 0,
            recoveryAttempts: 0,
          }));
        }
      }
    }

    return Array.from(this.demoLearnerStates.values());
  }

  public getLearnerState(conceptId: string, sessionId?: string, userId?: string): LearnerConceptState | undefined {
    if (sessionId === "demo" || sessionId === "demo_dfs" || sessionId === "bisect_demo_dfs" || (!sessionId && this.currentMode === "demo")) {
      try {
        ensureSessionsDir();
        const demoStatesPath = path.join(SESSIONS_DIR, "demo_learner_states.json");
        if (fs.existsSync(demoStatesPath)) {
          const raw = fs.readFileSync(demoStatesPath, "utf-8");
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.demoLearnerStates = new Map(parsed);
          }
        }
      } catch (e) {}
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

    if (this.currentMode === "course") {
      const active = this.getActiveCourse();
      return active?.learnerStates?.[conceptId];
    }

    return this.demoLearnerStates.get(conceptId);
  }

  public updateLearnerState(
    conceptId: string,
    updates: Partial<LearnerConceptState>,
    sessionId?: string
  ): LearnerConceptState {
    if (sessionId === "demo" || sessionId === "demo_dfs" || sessionId === "bisect_demo_dfs") {
      try {
        ensureSessionsDir();
        const demoStatesPath = path.join(SESSIONS_DIR, "demo_learner_states.json");
        if (fs.existsSync(demoStatesPath)) {
          const raw = fs.readFileSync(demoStatesPath, "utf-8");
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.demoLearnerStates = new Map(parsed);
          }
        }
      } catch (e) {}
      const existing = this.demoLearnerStates.get(conceptId) || {
        conceptId,
        masteryScore: 0,
        status: "untested",
        confidence: 0,
        recoveryAttempts: 0,
      };
      const updated = { ...existing, ...updates };
      this.demoLearnerStates.set(conceptId, updated);
      try {
        ensureSessionsDir();
        fs.writeFileSync(
          path.join(SESSIONS_DIR, "demo_learner_states.json"),
          JSON.stringify(Array.from(this.demoLearnerStates.entries())),
          "utf-8"
        );
      } catch (e) {}
      return updated;
    }

    if (sessionId) {
      const session = this.getDiagnosticSession(sessionId);
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
    }

    // In course mode, update active course's learner states
    if (this.currentMode === "course") {
      const active = this.getActiveCourse();
      if (active) {
        if (!active.learnerStates) active.learnerStates = {};
        const existing = active.learnerStates[conceptId] || {
          conceptId,
          masteryScore: 0,
          status: "untested",
          confidence: 0,
          recoveryAttempts: 0,
        };
        active.learnerStates[conceptId] = { ...existing, ...updates };
        this.saveStateToDisk();
        return active.learnerStates[conceptId];
      }
    }

    // Fallback to demo learner states
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

  public getDagEngine(sessionId?: string): DAGEngine {
    const concepts = this.getConcepts(sessionId);
    const edges = this.getEdges(sessionId);
    return new DAGEngine(concepts, edges);
  }

  // --- Bisect & Probes ---

  public getActiveBisectSession(sessionId?: string, userId?: string): BisectSession | undefined {
    if (sessionId === "demo" || sessionId === "demo_dfs" || sessionId === "bisect_demo_dfs") {
      try {
        ensureSessionsDir();
        const demoBisectPath = path.join(SESSIONS_DIR, "demo_bisect.json");
        if (fs.existsSync(demoBisectPath)) {
          const raw = fs.readFileSync(demoBisectPath, "utf-8");
          this.demoActiveBisect = JSON.parse(raw);
        }
      } catch (e) {}
      return this.demoActiveBisect;
    }
    if (sessionId) {
      return this.getDiagnosticSession(sessionId)?.bisectSession;
    }
    if (userId) {
      return this.getLatestSession(userId)?.bisectSession;
    }

    if (this.currentMode === "course") {
      const active = this.getActiveCourse();
      if (active && active.concepts && active.concepts.length > 0) {
        const target = active.concepts[active.concepts.length - 1];
        const root = active.concepts[0];
        const scores: Record<string, number> = {};
        active.concepts.forEach((c) => {
          scores[c.id] = c.id === root.id ? 90 : 50;
        });

        return {
          id: `bisect_${active.id}`,
          targetConceptId: target.id,
          detectedMisconceptionId: `misc_${target.id}`,
          ancestorChain: active.concepts.map((c) => c.id),
          investigatedConcepts: [],
          probesAnswered: [],
          candidateScores: scores,
          currentProbe: active.probes && active.probes.length > 0 ? active.probes[0] : undefined,
          likelyRootGapId: root.id,
          status: "active",
        };
      }
    }

    try {
      ensureSessionsDir();
      const demoBisectPath = path.join(SESSIONS_DIR, "demo_bisect.json");
      if (fs.existsSync(demoBisectPath)) {
        const raw = fs.readFileSync(demoBisectPath, "utf-8");
        this.demoActiveBisect = JSON.parse(raw);
      }
    } catch (e) {}
    return this.demoActiveBisect;
  }

  public setActiveBisectSession(session: BisectSession, sessionId?: string): void {
    if (sessionId === "demo" || sessionId === "demo_dfs" || sessionId === "bisect_demo_dfs") {
      this.demoActiveBisect = session;
      try {
        ensureSessionsDir();
        fs.writeFileSync(
          path.join(SESSIONS_DIR, "demo_bisect.json"),
          JSON.stringify(session),
          "utf-8"
        );
      } catch (e) {}
      return;
    }
    const diagSession = sessionId ? this.getDiagnosticSession(sessionId) : this.getLatestSession();
    if (diagSession) {
      diagSession.bisectSession = session;
      saveSessionToDisk(diagSession);
    }
  }

  public getProbesForConcept(conceptId: string, sessionId?: string): DiagnosticProbe[] {
    if (sessionId === "demo" || sessionId === "demo_dfs" || sessionId === "bisect_demo_dfs") {
      return Array.from(this.demoProbes.values()).filter((p) => p.conceptId === conceptId);
    }
    if (sessionId) {
      const diagSession = this.getDiagnosticSession(sessionId);
      if (diagSession) {
        return diagSession.bisectProbes.filter((p) => p.conceptId === conceptId);
      }
    }

    if (this.currentMode === "course") {
      const active = this.getActiveCourse();
      if (active && active.probes) {
        return active.probes.filter((p) => p.conceptId === conceptId);
      }
    }

    return Array.from(this.demoProbes.values()).filter((p) => p.conceptId === conceptId);
  }

  public getProbe(probeId: string, sessionId?: string): DiagnosticProbe | undefined {
    if (sessionId === "demo" || sessionId === "demo_dfs" || sessionId === "bisect_demo_dfs") {
      return this.demoProbes.get(probeId);
    }
    if (sessionId) {
      const diagSession = this.getDiagnosticSession(sessionId);
      if (diagSession) {
        return diagSession.bisectProbes.find((p) => p.id === probeId);
      }
    }

    if (this.currentMode === "course") {
      const active = this.getActiveCourse();
      const p = active?.probes?.find((pr) => pr.id === probeId);
      if (p) return p;
    }

    return this.demoProbes.get(probeId);
  }

  // --- Recovery & Retest ---

  public getIntervention(conceptId: string, sessionId?: string, userId?: string): InterventionContent | undefined {
    if (sessionId === "demo" || sessionId === "demo_dfs" || sessionId === "bisect_demo_dfs") {
      return this.demoInterventions.get(conceptId) || this.demoInterventions.get("call_stack");
    }
    const diagSession = sessionId ? this.getDiagnosticSession(sessionId) : (userId ? this.getLatestSession(userId) : undefined);
    if (diagSession && diagSession.recoveryIntervention) {
      return diagSession.recoveryIntervention;
    }

    if (this.currentMode === "course") {
      const active = this.getActiveCourse();
      if (active?.interventions?.[conceptId]) {
        return active.interventions[conceptId];
      }
      if (active?.interventions && Object.values(active.interventions).length > 0) {
        return Object.values(active.interventions)[0];
      }
    }

    return this.demoInterventions.get(conceptId) || this.demoInterventions.get("call_stack");
  }

  public getReTest(conceptId: string, sessionId?: string, userId?: string): ReTestAssessment | undefined {
    if (sessionId === "demo" || sessionId === "demo_dfs" || sessionId === "bisect_demo_dfs") {
      return this.demoReTests.get(conceptId) || this.demoReTests.get("call_stack");
    }
    const diagSession = sessionId ? this.getDiagnosticSession(sessionId) : (userId ? this.getLatestSession(userId) : undefined);
    if (diagSession && diagSession.retestAssessment) {
      return diagSession.retestAssessment;
    }

    if (this.currentMode === "course") {
      const active = this.getActiveCourse();
      if (active?.retests?.[conceptId]) {
        return active.retests[conceptId];
      }
      if (active?.retests && Object.values(active.retests).length > 0) {
        return Object.values(active.retests)[0];
      }
    }

    return this.demoReTests.get(conceptId) || this.demoReTests.get("call_stack");
  }

  // --- Metrics Calculation ---

  public calculateMetrics(sessionId?: string, userId?: string): LearningProgressMetrics | null {
    if (sessionId === "demo" || sessionId === "demo_dfs" || sessionId === "bisect_demo_dfs") {
      return this.calculateMetricsFromStates(
        this.demoConcepts,
        this.getAllLearnerStates(sessionId),
        Array.from(this.demoMisconceptions.values())
      );
    }

    const targetSession = sessionId
      ? this.getDiagnosticSession(sessionId)
      : userId
      ? this.getLatestSession(userId)
      : undefined;

    if (targetSession) {
      const states = Object.values(targetSession.graph.learnerStates);
      const misconceptions = targetSession.analysis.misconception
        ? [targetSession.analysis.misconception]
        : [];
      return this.calculateMetricsFromStates(targetSession.graph.concepts, states, misconceptions);
    }

    // If in Course Mode without a session
    if (this.currentMode === "course") {
      const active = this.getActiveCourse();
      if (active && active.concepts && active.concepts.length > 0) {
        const states = active.learnerStates ? Object.values(active.learnerStates) : [];
        return this.calculateMetricsFromStates(active.concepts, states, []);
      }
    }

    // Default Demo Mode Metrics
    return this.calculateMetricsFromStates(
      this.demoConcepts,
      this.getAllLearnerStates("demo"),
      Array.from(this.demoMisconceptions.values())
    );
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
}

// Global singleton instance for in-memory persistence across routes
const globalForStore = globalThis as unknown as { archaiaStore?: DataStore };

export const store = globalForStore.archaiaStore ?? new DataStore();

globalForStore.archaiaStore = store;

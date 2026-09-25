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

  public getProbe(id: string): DiagnosticProbe | undefined {
    return this.probes.get(id);
  }

  public getProbesForConcept(conceptId: string): DiagnosticProbe[] {
    return Array.from(this.probes.values()).filter(
      (p) => p.conceptId === conceptId
    );
  }

  public getActiveBisectSession(): BisectSession | undefined {
    return this.activeBisectSession;
  }

  public setActiveBisectSession(session?: BisectSession): void {
    this.activeBisectSession = session;
  }

  public getIntervention(conceptId: string): InterventionContent | undefined {
    return this.interventions.get(conceptId);
  }

  public setIntervention(conceptId: string, content: InterventionContent): void {
    this.interventions.set(conceptId, content);
  }

  public getReTest(conceptId: string): ReTestAssessment | undefined {
    return this.reTests.get(conceptId);
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

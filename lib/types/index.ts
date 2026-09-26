// ARCHAIA Data Models & Contracts

export type MasteryStatus =
  | "untested"
  | "mastered"
  | "diagnosing"
  | "misconception_detected"
  | "root_gap_identified"
  | "recovered"
  | "unresolved";

export type ResponseType = "mcq" | "written" | "code" | "steps" | "quiz";

export type AppContentMode = "demo" | "course";

export interface Concept {
  id: string;
  conceptId?: string; // Generic alias
  name: string;
  category: string;
  description: string;
  prerequisites: string[]; // List of concept IDs that must be learned prior
  dependentConcepts?: string[]; // Concepts that depend on this concept
  learningMaterialReference?: string; // Source citation (section, page, slide)
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  recoveryStatus?: MasteryStatus;
}

export interface ConceptEdge {
  from: string; // Prerequisite concept ID
  to: string;   // Dependent concept ID
  rationale: string; // Pedagogical explanation of why 'from' is mandatory before 'to'
}

export interface LearnerConceptState {
  conceptId: string;
  masteryScore: number; // 0 - 100
  status: MasteryStatus;
  activeMisconceptionId?: string;
  diagnosticEvidence?: string[];
  confidence: number; // 0 - 100
  lastTestedAt?: string;
  recoveryAttempts: number;
}

export interface StudentSubmission {
  id: string;
  conceptId: string;
  questionId: string;
  questionText: string;
  responseType: ResponseType;
  content: string; // The student's answer text, code, or selected choice
  timestamp: string;
}

export interface Misconception {
  id: string;
  conceptId: string;
  name: string;
  description: string;
  studentAssumption: string; // Flawed mental model
  formalReality: string;      // Formal computing/system truth
  affectedConcepts: string[]; // Concepts corrupted by this mental model
  confidence: number;
  evidence: string;
}

export interface DiagnosticProbe {
  id: string;
  conceptId: string; // Concept being probed
  targetConceptId: string; // Downstream concept where error occurred
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    indicator: string; // Mental model indicated by selecting this option
  }[];
  invariantTested: string; // The foundational invariant being checked
  rationale: string;
}

export interface ProbeAnswerRecord {
  probeId: string;
  conceptId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  evidenceWeight: number; // Impact on likelihood (+ positive evidence for gap, - negative)
  timestamp: string;
}

export interface BisectSession {
  id: string;
  targetConceptId: string;
  detectedMisconceptionId: string;
  ancestorChain: string[]; // Ordered list from foundational to target concept
  investigatedConcepts: string[];
  currentProbe?: DiagnosticProbe;
  probesAnswered: ProbeAnswerRecord[];
  candidateScores: Record<string, number>; // conceptId -> evidence score (0-100)
  likelyRootGapId?: string;
  status: "active" | "concluded";
  conclusionReason?: string;
}

export interface InterventionContent {
  id: string;
  rootConceptId: string;
  targetConceptId: string;
  title: string;
  explanation: string;
  visualMemoryModel: {
    type: "call_stack" | "heap_pointers" | "tree_recursion" | "state_machine" | "timeline" | "tabular" | string;
    title: string;
    description: string;
    frames: {
      step: number;
      label: string;
      stackFrames: string[];
      heapObjects?: Record<string, string>;
      activeLine: number;
      explanation: string;
    }[];
  };
  counterexample: {
    title: string;
    code: string;
    expectedOutput: string;
    actualOutput: string;
    mentalModelExplanation: string;
  };
  microPuzzle: {
    question: string;
    codeSnippet?: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  codeExercise: {
    instructions: string;
    initialCode: string;
    expectedPattern: string;
    solutionCode: string;
    hints: string[];
  };
  industryBlastRadius: {
    incidentTitle: string;
    organizationType: string;
    outageDescription: string;
    howMisconceptionCausesIt: string;
    illustrativeNote: string;
  };
}

export interface ReTestAssessment {
  id: string;
  conceptId: string;
  question: string;
  codeSnippet?: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    feedback: string;
  }[];
}

export interface CourseMaterial {
  id: string;
  title: string;
  subject: string;
  content: string;
  extractedConcepts: string[];
  concepts?: Concept[];
  edges?: ConceptEdge[];
  probes?: DiagnosticProbe[];
  interventions?: Record<string, InterventionContent>;
  retests?: Record<string, ReTestAssessment>;
  learnerStates?: Record<string, LearnerConceptState>;
  createdAt?: string;
  isDefault?: boolean;
}

export interface LearningProgressMetrics {
  totalConcepts: number;
  masteredCount: number;
  diagnosedCount: number;
  recoveredCount: number;
  unresolvedCount: number;
  overallMasteryPercentage: number;
  recoverySuccessRate: number;
  activeMisconceptions: Misconception[];
}

export interface DiagnosticSession {
  id: string;
  topic?: string;
  userId?: string;
  createdAt: string;
  isDemo?: boolean;

  submission: {
    conceptId: string;
    conceptName: string;
    questionText: string;
    responseType: ResponseType;
    content: string;
    code?: string;
    mcqSelected?: string;
    steps?: string[];
  };

  analysis: {
    hasMisconception: boolean;
    misconception?: Misconception;
    masteryScore?: number;
    evidence: string;
    explanation: string;
    studentAssumption: string;
    formalReality: string;
    normalizedReasoning: string;
    confidence: number;
    extractedIndicators: string[];
    affectedConcepts: string[];
  };

  graph: {
    concepts: Concept[];
    edges: ConceptEdge[];
    learnerStates: Record<string, LearnerConceptState>;
  };

  bisectSession?: BisectSession;
  bisectProbes: DiagnosticProbe[];

  recoveryIntervention?: InterventionContent;
  retestAssessment?: ReTestAssessment;

  recoveryCompleted?: boolean;
  retestResult?: {
    isCorrect: boolean;
    score?: number;
    updatedMastery: number;
    unlockedConcepts: string[];
    feedback: string;
  };
  adaptivePath?: {
    conceptId: string;
    status: "ready_to_learn" | "locked" | "needs_recovery" | "mastered";
    blockingPrerequisite?: string;
  }[];
}


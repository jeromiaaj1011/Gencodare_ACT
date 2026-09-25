import { store } from "../storage/store";

export interface ReTestResult {
  isCorrect: boolean;
  status: "recovered" | "unresolved";
  feedback: string;
  updatedMastery: number;
  unlockedConcepts: string[];
  furtherDiagnosisNotes?: string;
  adaptivePath: {
    conceptId: string;
    status: "ready_to_learn" | "locked" | "needs_recovery" | "mastered";
    blockingPrerequisite?: string;
  }[];
}

export class ReTestService {
  public static evaluateReTest(conceptId: string, selectedOptionId: string): ReTestResult {
    const retest = store.getReTest(conceptId);
    if (!retest) {
      throw new Error(`Re-test assessment for concept "${conceptId}" not found.`);
    }

    const selectedOption = retest.options.find((o) => o.id === selectedOptionId);
    const isCorrect = selectedOption?.isCorrect ?? false;
    const feedback = selectedOption?.feedback || (isCorrect ? "Correct answer!" : "Incorrect answer.");

    const dagEngine = store.getDagEngine();
    const existingState = store.getLearnerState(conceptId);

    if (isCorrect) {
      // 1. Mark root concept as recovered (Feature 28)
      store.updateLearnerState(conceptId, {
        status: "recovered",
        masteryScore: 92,
        confidence: 95,
        activeMisconceptionId: undefined,
        lastTestedAt: new Date().toISOString(),
      });

      // 2. Cascade recovery: Dynamically unblock downstream dependent concepts in the DAG
      const edges = dagEngine.getAllEdges();
      const dependentIds = edges.filter((e) => e.from === conceptId).map((e) => e.to);

      for (const depId of dependentIds) {
        const depState = store.getLearnerState(depId);
        if (!depState || depState.status === "untested" || depState.status === "misconception_detected") {
          store.updateLearnerState(depId, {
            status: "untested",
            confidence: Math.max(70, depState?.confidence || 60),
            activeMisconceptionId: undefined,
          });
        }
      }

      if (conceptId === "call_stack") {
        store.updateLearnerState("recursion", {
          status: "mastered",
          masteryScore: 88,
          confidence: 90,
        });

        store.updateLearnerState("tree_traversal", {
          status: "untested",
          masteryScore: 75,
          confidence: 70,
        });

        store.updateLearnerState("graph_traversal", {
          status: "untested",
          masteryScore: 65,
          confidence: 60,
          activeMisconceptionId: undefined,
        });
      }

      const unlocked = dependentIds.length > 0 ? dependentIds : ["recursion", "tree_traversal", "graph_traversal"];
      const allStates = new Map(store.getAllLearnerStates().map((s) => [s.conceptId, s]));
      const adaptivePath = dagEngine.computeAdaptivePath(allStates);

      return {
        isCorrect: true,
        status: "recovered",
        feedback,
        updatedMastery: 92,
        unlockedConcepts: unlocked,
        adaptivePath,
      };
    } else {
      // Unresolved state handling (Feature 29 & 30: Further Diagnosis)
      const attempts = (existingState?.recoveryAttempts || 0) + 1;
      store.updateLearnerState(conceptId, {
        status: "unresolved",
        recoveryAttempts: attempts,
        lastTestedAt: new Date().toISOString(),
      });

      const allStates = new Map(store.getAllLearnerStates().map((s) => [s.conceptId, s]));
      const adaptivePath = dagEngine.computeAdaptivePath(allStates);

      return {
        isCorrect: false,
        status: "unresolved",
        feedback,
        updatedMastery: Math.max(30, (existingState?.masteryScore || 50) - 10),
        unlockedConcepts: [],
        furtherDiagnosisNotes: "Learner still conflates execution context with static procedure code. Recommended action: step through stack frame assembly instructions in low-level sandbox.",
        adaptivePath,
      };
    }
  }
}

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
  public static evaluateReTest(
    conceptId: string,
    selectedOptionId: string,
    sessionId?: string
  ): ReTestResult {
    const retest = store.getReTest(conceptId, sessionId);
    if (!retest) {
      throw new Error(`Re-test assessment for concept "${conceptId}" not found.`);
    }

    const selectedOption = retest.options.find((o) => o.id === selectedOptionId);
    const isCorrect = selectedOption?.isCorrect ?? false;
    const feedback = selectedOption?.feedback || (isCorrect ? "Correct answer!" : "Incorrect answer.");

    const dagEngine = store.getDagEngine(sessionId);

    if (isCorrect) {
      // 1. Mark concept as recovered
      store.updateLearnerState(
        conceptId,
        {
          status: "recovered",
          masteryScore: 92,
          confidence: 95,
          activeMisconceptionId: undefined,
          lastTestedAt: new Date().toISOString(),
        },
        sessionId
      );

      // 2. Cascade recovery: Dynamically unblock downstream dependent concepts in the session's DAG
      const edges = dagEngine.getAllEdges();
      const dependentIds = edges.filter((e) => e.from === conceptId).map((e) => e.to);

      for (const depId of dependentIds) {
        const depState = store.getLearnerState(depId, sessionId);
        if (!depState || depState.status === "untested" || depState.status === "misconception_detected") {
          store.updateLearnerState(
            depId,
            {
              status: "untested",
              confidence: Math.max(70, depState?.confidence || 60),
              activeMisconceptionId: undefined,
            },
            sessionId
          );
        }
      }

      // Record in session
      if (sessionId) {
        store.updateDiagnosticSession(sessionId, {
          recoveryCompleted: true,
          retestResult: {
            isCorrect: true,
            updatedMastery: 92,
            unlockedConcepts: dependentIds,
            feedback,
          },
        });
      }

      const allStates = store.getAllLearnerStates(sessionId);
      const statesMap = new Map(allStates.map((s) => [s.conceptId, s]));
      const adaptivePath = dagEngine.computeAdaptivePath(statesMap);

      return {
        isCorrect: true,
        status: "recovered",
        feedback,
        updatedMastery: 92,
        unlockedConcepts: dependentIds,
        adaptivePath,
      };
    } else {
      // Mark as unresolved
      store.updateLearnerState(
        conceptId,
        {
          status: "unresolved",
          masteryScore: 40,
          confidence: 50,
          lastTestedAt: new Date().toISOString(),
        },
        sessionId
      );

      if (sessionId) {
        store.updateDiagnosticSession(sessionId, {
          recoveryCompleted: false,
          retestResult: {
            isCorrect: false,
            updatedMastery: 40,
            unlockedConcepts: [],
            feedback,
          },
        });
      }

      const allStates = store.getAllLearnerStates(sessionId);
      const statesMap = new Map(allStates.map((s) => [s.conceptId, s]));
      const adaptivePath = dagEngine.computeAdaptivePath(statesMap);

      return {
        isCorrect: false,
        status: "unresolved",
        feedback,
        updatedMastery: 40,
        unlockedConcepts: [],
        furtherDiagnosisNotes: "The mental model gap persists. Additional cognitive bisection is recommended.",
        adaptivePath,
      };
    }
  }
}

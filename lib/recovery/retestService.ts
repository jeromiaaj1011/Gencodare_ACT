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

    const effectiveSessionId =
      sessionId && sessionId.trim().length > 0
        ? sessionId.trim()
        : store.getLatestSession()?.id;
    const session = effectiveSessionId ? store.getDiagnosticSession(effectiveSessionId) : undefined;

    const dagEngine = store.getDagEngine(effectiveSessionId);

    const targetConcept = retest.conceptId || conceptId;

    if (isCorrect) {
      // 1. Mark concept and any associated session root gap IDs as recovered
      const conceptsToRecover = new Set<string>();
      if (targetConcept) conceptsToRecover.add(targetConcept);
      if (conceptId) conceptsToRecover.add(conceptId);
      if (session?.bisectSession?.likelyRootGapId) conceptsToRecover.add(session.bisectSession.likelyRootGapId);
      if (session?.recoveryIntervention?.rootConceptId) conceptsToRecover.add(session.recoveryIntervention.rootConceptId);
      if (session?.retestAssessment?.conceptId) conceptsToRecover.add(session.retestAssessment.conceptId);

      for (const cId of conceptsToRecover) {
        store.updateLearnerState(
          cId,
          {
            status: "recovered",
            masteryScore: 92,
            confidence: 95,
            activeMisconceptionId: undefined,
            lastTestedAt: new Date().toISOString(),
          },
          effectiveSessionId
        );
      }

      // 2. Cascade recovery: Dynamically unblock downstream dependent concepts in the session's DAG
      const edges = dagEngine.getAllEdges();
      const dependentIds = edges.filter((e) => e.from === conceptId).map((e) => e.to);

      for (const depId of dependentIds) {
        const depState = store.getLearnerState(depId, effectiveSessionId);
        if (!depState || depState.status === "untested" || depState.status === "misconception_detected") {
          store.updateLearnerState(
            depId,
            {
              status: "untested",
              confidence: Math.max(70, depState?.confidence || 60),
              activeMisconceptionId: undefined,
            },
            effectiveSessionId
          );
        }
      }

      const allStates = store.getAllLearnerStates(effectiveSessionId);
      const statesMap = new Map(allStates.map((s) => [s.conceptId, s]));
      const adaptivePath = dagEngine.computeAdaptivePath(statesMap);

      // Record in session
      if (effectiveSessionId) {
        store.updateDiagnosticSession(effectiveSessionId, {
          recoveryCompleted: true,
          retestResult: {
            isCorrect: true,
            updatedMastery: 92,
            unlockedConcepts: dependentIds,
            feedback,
          },
          adaptivePath,
        });
      }

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
        targetConcept,
        {
          status: "unresolved",
          masteryScore: 40,
          confidence: 50,
          lastTestedAt: new Date().toISOString(),
        },
        effectiveSessionId
      );

      if (conceptId && conceptId !== targetConcept) {
        store.updateLearnerState(
          conceptId,
          {
            status: "unresolved",
            masteryScore: 40,
            confidence: 50,
            lastTestedAt: new Date().toISOString(),
          },
          effectiveSessionId
        );
      }

      if (effectiveSessionId) {
        store.updateDiagnosticSession(effectiveSessionId, {
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

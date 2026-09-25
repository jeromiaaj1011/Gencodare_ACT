import {
  BisectSession,
  DiagnosticProbe,
  ProbeAnswerRecord,
  Misconception,
} from "../types/index";
import { store } from "../storage/store";

export class BisectEngine {
  /**
   * Initializes a new Cognitive Bisect session for a detected misconception.
   */
  public static startSession(
    targetConceptId: string,
    misconceptionId: string,
    sessionId?: string
  ): BisectSession {
    const dagEngine = store.getDagEngine(sessionId);
    // Topological list of ancestors from foundational to direct prerequisite
    const ancestors = dagEngine.getAncestorsTopological(targetConceptId);
    let ancestorIds = ancestors.map((a) => a.id);

    if (ancestorIds.length === 0) {
      // Use the session concepts as ancestors
      const allConcepts = store.getConcepts(sessionId);
      ancestorIds = allConcepts.map((c) => c.id).filter((id) => id !== targetConceptId);
    }

    // Initial candidate scores: evenly distributed prior
    const candidateScores: Record<string, number> = {};
    ancestorIds.forEach((id) => {
      candidateScores[id] = 50; // Neutral prior
    });

    const session: BisectSession = {
      id: "bisect_" + Date.now(),
      targetConceptId,
      detectedMisconceptionId: misconceptionId,
      ancestorChain: ancestorIds,
      investigatedConcepts: [],
      probesAnswered: [],
      candidateScores,
      status: "active",
    };

    // Pick the first probe using the bisect pivot
    this.advanceSession(session, sessionId);
    store.setActiveBisectSession(session, sessionId);
    return session;
  }

  /**
   * Advances the session: selects the next micro-probe or concludes the session.
   */
  public static advanceSession(session: BisectSession, sessionId?: string): void {
    const testedSet = new Set(session.investigatedConcepts);
    const dagEngine = store.getDagEngine(sessionId);

    // Pivot selection over ancestor chain
    const pivotId = dagEngine.selectBisectPivot(session.ancestorChain, testedSet);

    if (!pivotId) {
      // All ancestors investigated or chain exhausted -> conclude session
      this.concludeSession(session, sessionId);
      return;
    }

    // Retrieve probes for the selected pivot concept
    const probes = store.getProbesForConcept(pivotId, sessionId);
    if (probes.length === 0) {
      // If no probe found for this concept, mark as investigated and advance
      session.investigatedConcepts.push(pivotId);
      this.advanceSession(session, sessionId);
      return;
    }

    // Select the first unasked probe
    const answeredProbeIds = new Set(session.probesAnswered.map((p) => p.probeId));
    const nextProbe = probes.find((p) => !answeredProbeIds.has(p.id)) || probes[0];

    session.currentProbe = nextProbe;
  }

  /**
   * Records a student's answer to a diagnostic micro-probe, updates Bayesian evidence,
   * and triggers the next step.
   */
  public static recordProbeAnswer(
    session: BisectSession,
    probeId: string,
    selectedOptionId: string,
    sessionId?: string
  ): {
    session: BisectSession;
    isCorrect: boolean;
    evidenceFeedback: string;
    concluded: boolean;
  } {
    const probe = store.getProbe(probeId, sessionId);
    if (!probe) {
      throw new Error(`Diagnostic probe ${probeId} not found.`);
    }

    const selectedOption = probe.options.find((o) => o.id === selectedOptionId);
    const isCorrect = selectedOption?.isCorrect ?? false;

    // Weight: if incorrect, strong evidence for gap (+45%); if correct, evidence against gap (-35%)
    const evidenceDelta = isCorrect ? -35 : 45;
    const currentScore = session.candidateScores[probe.conceptId] ?? 50;
    const newScore = Math.min(100, Math.max(5, currentScore + evidenceDelta));
    session.candidateScores[probe.conceptId] = newScore;

    if (!session.investigatedConcepts.includes(probe.conceptId)) {
      session.investigatedConcepts.push(probe.conceptId);
    }

    const record: ProbeAnswerRecord = {
      probeId,
      conceptId: probe.conceptId,
      selectedOptionId,
      isCorrect,
      evidenceWeight: evidenceDelta,
      timestamp: new Date().toISOString(),
    };

    session.probesAnswered.push(record);

    // Check if we have isolated the root gap
    const highestCandidate = Object.entries(session.candidateScores).sort(
      (a, b) => b[1] - a[1]
    )[0];

    // Conclude condition: candidate >= 80% evidence support or at least 2 probes answered
    if (highestCandidate && highestCandidate[1] >= 80) {
      session.likelyRootGapId = highestCandidate[0];
      this.concludeSession(session, sessionId);
      return {
        session,
        isCorrect,
        evidenceFeedback:
          selectedOption?.indicator || (isCorrect ? "Correct invariant" : "Flawed invariant"),
        concluded: true,
      };
    }

    if (session.probesAnswered.length >= 2 || session.investigatedConcepts.length >= session.ancestorChain.length) {
      this.concludeSession(session, sessionId);
      return {
        session,
        isCorrect,
        evidenceFeedback: selectedOption?.indicator || "Diagnostic evidence collected.",
        concluded: true,
      };
    }

    // Otherwise, pick next probe
    this.advanceSession(session, sessionId);
    store.setActiveBisectSession(session, sessionId);

    return {
      session,
      isCorrect,
      evidenceFeedback: selectedOption?.indicator || "Evidence updated.",
      concluded: session.status === "concluded",
    };
  }

  /**
   * Concludes the session by isolating the highest-supported root learning gap.
   */
  private static concludeSession(session: BisectSession, sessionId?: string): void {
    session.status = "concluded";
    session.currentProbe = undefined;

    // Sort candidate scores descending
    const sorted = Object.entries(session.candidateScores).sort((a, b) => b[1] - a[1]);
    const rootGapId =
      sorted.length > 0 && sorted[0][0]
        ? sorted[0][0]
        : (session.ancestorChain.length > 0 ? session.ancestorChain[0] : session.targetConceptId);
    session.likelyRootGapId = rootGapId;

    const dagEngine = store.getDagEngine(sessionId);
    const rootConcept = dagEngine.getConcept(rootGapId);
    session.conclusionReason = `Diagnostic micro-probes accumulated highest evidence weight on prerequisite concept "${rootConcept?.name || rootGapId}".`;

    // Update the learner concept state for the root gap in the store
    store.updateLearnerState(
      rootGapId,
      {
        status: "root_gap_identified",
        confidence: sorted.length > 0 ? sorted[0][1] : 90,
        diagnosticEvidence: session.probesAnswered.map(
          (p) => `${p.conceptId}: ${p.isCorrect ? "Passed" : "Failed"} (${p.evidenceWeight > 0 ? "+" : ""}${p.evidenceWeight}%)`
        ),
      },
      sessionId
    );

    store.setActiveBisectSession(session, sessionId);
  }
}

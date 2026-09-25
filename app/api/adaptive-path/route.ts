import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const rawSessionId = req.nextUrl.searchParams.get("sessionId");
    const sessionId = rawSessionId && rawSessionId.trim().length > 0 ? rawSessionId.trim() : undefined;

    // Check if an explicit non-demo session was requested but does not exist
    if (sessionId && sessionId !== "demo" && sessionId !== "demo_dfs") {
      const existingSession = store.getDiagnosticSession(sessionId);
      if (!existingSession) {
        return NextResponse.json({
          success: true,
          hasSessions: false,
          sessionNotFound: true,
          requestedSessionId: sessionId,
          isEmpty: true,
          adaptivePath: [],
          metrics: null,
          session: null,
        });
      }
    }

    const targetSession = sessionId ? store.getDiagnosticSession(sessionId) : store.getLatestSession();

    // If recovery was completed or retest was passed, ensure the session's root gap concepts persist as recovered
    if (targetSession && (targetSession.recoveryCompleted || targetSession.retestResult?.isCorrect)) {
      const rootGap =
        targetSession.bisectSession?.likelyRootGapId ||
        targetSession.recoveryIntervention?.rootConceptId ||
        targetSession.retestAssessment?.conceptId;

      const conceptsToEnsure = new Set<string>();
      if (rootGap) conceptsToEnsure.add(rootGap);
      if (targetSession.bisectSession?.likelyRootGapId) conceptsToEnsure.add(targetSession.bisectSession.likelyRootGapId);
      if (targetSession.recoveryIntervention?.rootConceptId) conceptsToEnsure.add(targetSession.recoveryIntervention.rootConceptId);
      if (targetSession.retestAssessment?.conceptId) conceptsToEnsure.add(targetSession.retestAssessment.conceptId);

      for (const cId of conceptsToEnsure) {
        const state = targetSession.graph.learnerStates[cId];
        if (!state || (state.status !== "mastered" && state.status !== "recovered")) {
          store.updateLearnerState(
            cId,
            {
              status: "recovered",
              masteryScore: 92,
              confidence: 95,
              activeMisconceptionId: undefined,
              lastTestedAt: state?.lastTestedAt || new Date().toISOString(),
            },
            targetSession.id
          );
        }
      }
    }

    const dagEngine = store.getDagEngine(sessionId);
    const states = store.getAllLearnerStates(sessionId);

    if (states.length === 0 && sessionId !== "demo" && sessionId !== "demo_dfs") {
      return NextResponse.json({
        success: true,
        hasSessions: false,
        sessionNotFound: false,
        isEmpty: true,
        adaptivePath: [],
        metrics: null,
        session: null,
      });
    }

    const allStates = new Map(states.map((s) => [s.conceptId, s]));
    const adaptivePath = dagEngine.computeAdaptivePath(allStates);
    const metrics = store.calculateMetrics(sessionId);

    return NextResponse.json({
      success: true,
      hasSessions: true,
      sessionNotFound: false,
      session: targetSession
        ? {
            id: targetSession.id,
            topic: targetSession.topic || targetSession.submission?.conceptName,
            submission: targetSession.submission,
            recoveryCompleted: targetSession.recoveryCompleted,
            rootGap:
              targetSession.bisectSession?.likelyRootGapId ||
              targetSession.recoveryIntervention?.rootConceptId ||
              targetSession.retestAssessment?.conceptId,
            retestResult: targetSession.retestResult,
            createdAt: targetSession.createdAt,
          }
        : null,
      adaptivePath,
      metrics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

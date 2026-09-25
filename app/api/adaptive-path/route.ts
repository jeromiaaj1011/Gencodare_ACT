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
    const targetSession = sessionId ? store.getDiagnosticSession(sessionId) : store.getLatestSession();

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

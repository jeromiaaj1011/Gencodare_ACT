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
        return NextResponse.json(
          {
            success: true,
            hasSessions: false,
            sessionNotFound: true,
            requestedSessionId: sessionId,
            isEmpty: true,
            adaptivePath: [],
            metrics: null,
            session: null,
          },
          {
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate",
            },
          }
        );
      }
    }

    const effectiveSessionId = sessionId || (store.getMode() === "demo" ? "demo_dfs" : undefined);
    const targetSession = effectiveSessionId ? store.getDiagnosticSession(effectiveSessionId) : store.getLatestSession();

    // If recovery was completed or retest was passed, ensure the session's root gap concepts persist as recovered
    if (targetSession && (targetSession.recoveryCompleted || targetSession.retestResult?.isCorrect)) {
      const rootGap =
        targetSession.bisectSession?.likelyRootGapId ||
        targetSession.recoveryIntervention?.rootConceptId ||
        targetSession.retestAssessment?.conceptId ||
        "call_stack";

      const conceptsToEnsure = new Set<string>();
      if (rootGap) conceptsToEnsure.add(rootGap);
      if (targetSession.bisectSession?.likelyRootGapId) conceptsToEnsure.add(targetSession.bisectSession.likelyRootGapId);
      if (targetSession.recoveryIntervention?.rootConceptId) conceptsToEnsure.add(targetSession.recoveryIntervention.rootConceptId);
      if (targetSession.retestAssessment?.conceptId) conceptsToEnsure.add(targetSession.retestAssessment.conceptId);

      for (const cId of conceptsToEnsure) {
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
    }

    const dagEngine = store.getDagEngine(effectiveSessionId);
    const states = store.getAllLearnerStates(effectiveSessionId);

    if (states.length === 0 && effectiveSessionId !== "demo" && effectiveSessionId !== "demo_dfs") {
      return NextResponse.json(
        {
          success: true,
          hasSessions: false,
          sessionNotFound: false,
          isEmpty: true,
          adaptivePath: [],
          metrics: null,
          session: null,
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    const allStates = new Map(states.map((s) => [s.conceptId, s]));

    // If recovery was completed, ensure root gap in allStates map reflects recovered status
    if (targetSession && (targetSession.recoveryCompleted || targetSession.retestResult?.isCorrect)) {
      const rootGap =
        targetSession.bisectSession?.likelyRootGapId ||
        targetSession.recoveryIntervention?.rootConceptId ||
        targetSession.retestAssessment?.conceptId ||
        "call_stack";

      if (allStates.has(rootGap)) {
        const cur = allStates.get(rootGap)!;
        allStates.set(rootGap, {
          ...cur,
          status: "recovered",
          masteryScore: Math.max(90, cur.masteryScore || 92),
        });
      }
    }

    const calculatedPath = dagEngine.computeAdaptivePath(allStates);
    const adaptivePath =
      targetSession?.adaptivePath &&
      targetSession.adaptivePath.length > 0 &&
      (targetSession.recoveryCompleted || targetSession.retestResult?.isCorrect)
        ? targetSession.adaptivePath
        : calculatedPath;

    // Persist authoritative adaptivePath onto session
    if (targetSession && effectiveSessionId && (!targetSession.adaptivePath || targetSession.adaptivePath.length === 0)) {
      targetSession.adaptivePath = adaptivePath;
      store.updateDiagnosticSession(effectiveSessionId, { adaptivePath });
    }

    const metrics = store.calculateMetrics(effectiveSessionId);

    return NextResponse.json(
      {
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
                targetSession.retestAssessment?.conceptId ||
                "call_stack",
              retestResult: targetSession.retestResult,
              createdAt: targetSession.createdAt,
            }
          : null,
        adaptivePath,
        metrics,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { RecoveryService } from "@/lib/recovery/recoveryService";
import { store } from "@/lib/storage/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId") || undefined;
    let conceptId = searchParams.get("conceptId") || undefined;
    const effectiveSessionId =
      sessionId || (store.getMode() === "demo" ? "demo_dfs" : store.getLatestSession()?.id || "demo_dfs");
    const session = store.getDiagnosticSession(effectiveSessionId);

    // If no conceptId provided, check session's identified root gap
    if (!conceptId && session) {
      conceptId =
        session.bisectSession?.likelyRootGapId ||
        session.recoveryIntervention?.rootConceptId ||
        session.submission?.conceptId;
    }

    if (!conceptId) {
      conceptId = "call_stack";
    }

    const intervention =
      RecoveryService.getIntervention(conceptId, effectiveSessionId) ||
      RecoveryService.getIntervention("call_stack", "demo_dfs");
    const retest =
      RecoveryService.getReTest(conceptId, effectiveSessionId) ||
      RecoveryService.getReTest("call_stack", "demo_dfs");
    const dagEngine = store.getDagEngine(effectiveSessionId);
    const concept = dagEngine.getConcept(conceptId) || {
      id: conceptId,
      name: intervention?.title || conceptId,
      category: "Recovery Target",
      description: intervention?.explanation || "Targeted concept for invariant recovery.",
      prerequisites: [],
      difficulty: "intermediate",
      estimatedMinutes: 30,
    };

    if (!intervention) {
      return NextResponse.json(
        { success: false, error: `No intervention found for concept ${conceptId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      concept,
      intervention,
      retest,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage/store";
import { BisectEngine } from "@/lib/bisect/bisectEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId") || undefined;
  const paramConceptId = searchParams.get("conceptId");
  const paramMisconceptionId = searchParams.get("misconceptionId");

  let session = store.getActiveBisectSession(sessionId);

  // If a specific concept was requested and doesn't match active target, sync or start for that concept
  if (paramConceptId && (!session || session.targetConceptId !== paramConceptId)) {
    // If it's a demo session, don't silently create a new empty session which bypasses probes.
    if (sessionId === "demo" || sessionId === "demo_dfs" || sessionId === "bisect_demo_dfs") {
      session = store.getDemoSession();
    } else {
      session = BisectEngine.startSession(
        paramConceptId,
        paramMisconceptionId || `misc_${paramConceptId}_active`,
        sessionId
      );
    }
  }

  if (!session) {
    return NextResponse.json({
      success: true,
      hasActiveSession: false,
      isEmpty: true,
    });
  }

  const dagEngine = store.getDagEngine(sessionId);
  const rootConcept = session.likelyRootGapId
    ? dagEngine.getConcept(session.likelyRootGapId)
    : undefined;

  return NextResponse.json(
    {
      success: true,
      hasActiveSession: true,
      session,
      currentProbe: session.currentProbe,
      rootConcept,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { probeId, sessionId } = body;
    let selectedOptionId = body.selectedOptionId;

    const session = store.getActiveBisectSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "No active Cognitive Bisect session found. Please run a diagnostic first." },
        { status: 400 }
      );
    }

    if (!selectedOptionId && typeof body.selectedOptionIndex === "number") {
      const probe = store.getProbe(probeId, sessionId);
      if (probe && probe.options[body.selectedOptionIndex]) {
        selectedOptionId = probe.options[body.selectedOptionIndex].id;
      }
    }

    if (!probeId || !selectedOptionId) {
      return NextResponse.json(
        { success: false, error: "probeId and selectedOptionId are required." },
        { status: 400 }
      );
    }

    const result = BisectEngine.recordProbeAnswer(session, probeId, selectedOptionId, sessionId);
    const dagEngine = store.getDagEngine(sessionId);
    const rootConcept = result.session.likelyRootGapId
      ? dagEngine.getConcept(result.session.likelyRootGapId)
      : undefined;

    return NextResponse.json(
      {
        success: true,
        isCorrect: result.isCorrect,
        evidenceFeedback: result.evidenceFeedback,
        concluded: result.concluded,
        session: result.session,
        rootConcept,
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

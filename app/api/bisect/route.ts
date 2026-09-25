import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage/store";
import { BisectEngine } from "@/lib/bisect/bisectEngine";

export async function GET() {
  const session = store.getActiveBisectSession();
  if (!session) {
    return NextResponse.json({
      success: true,
      hasActiveSession: false,
    });
  }

  const dagEngine = store.getDagEngine();
  const rootConcept = session.likelyRootGapId
    ? dagEngine.getConcept(session.likelyRootGapId)
    : undefined;

  return NextResponse.json({
    success: true,
    hasActiveSession: true,
    session,
    rootConcept,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { probeId, selectedOptionId } = body;

    const session = store.getActiveBisectSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "No active Cognitive Bisect session found." },
        { status: 400 }
      );
    }

    if (!probeId || !selectedOptionId) {
      return NextResponse.json(
        { success: false, error: "probeId and selectedOptionId are required." },
        { status: 400 }
      );
    }

    const result = BisectEngine.recordProbeAnswer(session, probeId, selectedOptionId);
    const dagEngine = store.getDagEngine();
    const rootConcept = result.session.likelyRootGapId
      ? dagEngine.getConcept(result.session.likelyRootGapId)
      : undefined;

    return NextResponse.json({
      success: true,
      isCorrect: result.isCorrect,
      evidenceFeedback: result.evidenceFeedback,
      concluded: result.concluded,
      session: result.session,
      rootConcept,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

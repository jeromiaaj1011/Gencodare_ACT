import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("sessionId") || undefined;
    const dagEngine = store.getDagEngine(sessionId);
    const states = store.getAllLearnerStates(sessionId);

    if (states.length === 0 && sessionId !== "demo" && sessionId !== "demo_dfs") {
      return NextResponse.json({
        success: true,
        hasSessions: false,
        isEmpty: true,
        adaptivePath: [],
        metrics: null,
      });
    }

    const allStates = new Map(states.map((s) => [s.conceptId, s]));
    const adaptivePath = dagEngine.computeAdaptivePath(allStates);
    const metrics = store.calculateMetrics(sessionId);

    return NextResponse.json({
      success: true,
      hasSessions: true,
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

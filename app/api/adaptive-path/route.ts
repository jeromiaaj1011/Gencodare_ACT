import { NextResponse } from "next/server";
import { store } from "@/lib/storage/store";

export async function GET() {
  try {
    const dagEngine = store.getDagEngine();
    const allStates = new Map(store.getAllLearnerStates().map((s) => [s.conceptId, s]));
    const adaptivePath = dagEngine.computeAdaptivePath(allStates);
    const metrics = store.calculateMetrics();

    return NextResponse.json({
      success: true,
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

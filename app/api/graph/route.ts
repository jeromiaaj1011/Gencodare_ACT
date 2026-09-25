import { NextResponse } from "next/server";
import { store } from "@/lib/storage/store";
import { computeHierarchicalLayout } from "@/lib/graph/layoutEngine";

export async function GET() {
  try {
    const concepts = store.getConcepts();
    const edges = store.getEdges();
    const learnerStates = store.getAllLearnerStates();
    const metrics = store.calculateMetrics();
    const activeBisect = store.getActiveBisectSession();

    const { positions, width, height } = computeHierarchicalLayout(concepts, edges);

    const positionsRecord: Record<string, { x: number; y: number; layer: number }> = {};
    positions.forEach((pos, id) => {
      positionsRecord[id] = { x: pos.x, y: pos.y, layer: pos.layer };
    });

    const statesRecord: Record<string, any> = {};
    learnerStates.forEach((s) => {
      statesRecord[s.conceptId] = s;
    });

    return NextResponse.json({
      success: true,
      concepts,
      edges,
      positions: positionsRecord,
      canvasSize: { width, height },
      learnerStates: statesRecord,
      metrics,
      activeBisect,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

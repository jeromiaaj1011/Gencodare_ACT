import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage/store";
import { computeHierarchicalLayout } from "@/lib/graph/layoutEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId") || undefined;

    const concepts = store.getConcepts(sessionId);
    const edges = store.getEdges(sessionId);

    // If graph is empty (no active diagnostic session and not demo), return clean empty graph
    if (!concepts || concepts.length === 0) {
      return NextResponse.json({
        success: true,
        isEmpty: true,
        concepts: [],
        edges: [],
        positions: {},
        canvasSize: { width: 1000, height: 500 },
        learnerStates: {},
        metrics: null,
        activeBisect: null,
      });
    }

    const learnerStates = store.getAllLearnerStates(sessionId);
    const metrics = store.calculateMetrics(sessionId);
    const activeBisect = store.getActiveBisectSession(sessionId);

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
      isEmpty: false,
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

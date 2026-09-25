import { NextRequest, NextResponse } from "next/server";
import { RecoveryService } from "@/lib/recovery/recoveryService";
import { store } from "@/lib/storage/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conceptId = searchParams.get("conceptId") || "call_stack";

    const intervention = RecoveryService.getIntervention(conceptId);
    const retest = RecoveryService.getReTest(conceptId);
    const concept = store.getDagEngine().getConcept(conceptId);

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

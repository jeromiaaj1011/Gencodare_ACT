import { NextRequest, NextResponse } from "next/server";
import { ReTestService } from "@/lib/recovery/retestService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conceptId, selectedOptionId, sessionId } = body;

    if (!selectedOptionId) {
      return NextResponse.json(
        { success: false, error: "Please select an answer." },
        { status: 400 }
      );
    }

    if (!conceptId) {
      return NextResponse.json(
        { success: false, error: "conceptId is required." },
        { status: 400 }
      );
    }

    const result = ReTestService.evaluateReTest(conceptId, selectedOptionId, sessionId);

    return NextResponse.json({
      success: true,
      sessionId,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

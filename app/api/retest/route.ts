import { NextRequest, NextResponse } from "next/server";
import { ReTestService } from "@/lib/recovery/retestService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conceptId, selectedOptionId } = body;

    if (!conceptId || !selectedOptionId) {
      return NextResponse.json(
        { success: false, error: "conceptId and selectedOptionId are required." },
        { status: 400 }
      );
    }

    const result = ReTestService.evaluateReTest(conceptId, selectedOptionId);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

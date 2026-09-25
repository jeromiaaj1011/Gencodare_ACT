import { NextRequest, NextResponse } from "next/server";
import { MultilingualService } from "@/lib/multilingual/multilingualService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conceptId, language } = body;

    const result = await MultilingualService.getLocalizedExplanation(
      conceptId || "call_stack",
      language || "ta"
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

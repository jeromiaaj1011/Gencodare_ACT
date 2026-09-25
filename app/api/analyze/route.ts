import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage/store";
import { analyzeStudentResponse } from "@/lib/ai/cognitiveAnalyzer";
import { BisectEngine } from "@/lib/bisect/bisectEngine";
import { StudentSubmission } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conceptId, questionId, questionText, responseType, content } = body;

    if (!conceptId || !content) {
      return NextResponse.json(
        { success: false, error: "conceptId and content are required." },
        { status: 400 }
      );
    }

    // Save student submission
    const submission: StudentSubmission = {
      id: "sub_" + Date.now(),
      conceptId,
      questionId: questionId || "q_default",
      questionText: questionText || "Explain the recursive execution of DFS.",
      responseType: responseType || "written",
      content,
      timestamp: new Date().toISOString(),
    };
    store.addSubmission(submission);

    // Run AI Misconception Detection
    const analysis = await analyzeStudentResponse(
      conceptId,
      submission.questionText,
      submission.responseType,
      content
    );

    if (analysis.hasMisconception && analysis.misconception) {
      store.addMisconception(analysis.misconception);

      // Update target concept status
      store.updateLearnerState(conceptId, {
        status: "misconception_detected",
        activeMisconceptionId: analysis.misconception.id,
        confidence: analysis.confidence,
      });

      // Automatically launch Cognitive Bisect session
      const bisectSession = BisectEngine.startSession(
        conceptId,
        analysis.misconception.id
      );

      return NextResponse.json({
        success: true,
        misconception: analysis.misconception,
        normalizedReasoning: analysis.normalizedReasoning,
        bisectSession,
      });
    }

    return NextResponse.json({
      success: true,
      hasMisconception: false,
      message: "No fundamental conceptual misconception detected.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

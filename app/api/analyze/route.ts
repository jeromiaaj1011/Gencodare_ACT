import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage/store";
import { analyzeStudentResponse } from "@/lib/ai/cognitiveAnalyzer";
import { BisectEngine } from "@/lib/bisect/bisectEngine";
import { StudentSubmission } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conceptId, questionId, questionText, responseType, content, conceptName, prerequisites } = body;

    if (!conceptId || !content) {
      return NextResponse.json(
        { success: false, error: "conceptId and content are required." },
        { status: 400 }
      );
    }

    // Ensure concept exists in the Causal Knowledge Graph DAG
    const conceptObj = store.ensureConcept(conceptId, conceptName, prerequisites);

    // Save student submission
    const submission: StudentSubmission = {
      id: "sub_" + Date.now(),
      conceptId,
      questionId: questionId || "q_default",
      questionText: questionText || `Explain the execution of ${conceptObj.name}.`,
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

    // If no misconception detected, update concept mastery state
    const currentState = store.getLearnerState(conceptId);
    const newScore = Math.min(100, Math.max(88, (currentState?.masteryScore || 65) + 15));
    store.updateLearnerState(conceptId, {
      status: "mastered",
      masteryScore: newScore,
      activeMisconceptionId: undefined,
    });

    return NextResponse.json({
      success: true,
      hasMisconception: false,
      message: "Mental Model Invariant Verified! Your reasoning accurately reflects runtime memory execution invariants. No conceptual gap detected.",
      conceptId,
      masteryScore: newScore,
      normalizedReasoning: analysis.normalizedReasoning,
      indicators: analysis.extractedIndicators,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

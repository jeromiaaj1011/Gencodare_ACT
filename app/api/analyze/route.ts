import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage/store";
import { analyzeStudentResponse } from "@/lib/ai/cognitiveAnalyzer";
import { BisectEngine } from "@/lib/bisect/bisectEngine";
import { DiagnosticSession, LearnerConceptState } from "@/lib/types/index";
import { SecurityService } from "@/lib/auth/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      conceptId,
      conceptName,
      questionText,
      responseType,
      content,
      code,
      mcqSelected,
      steps,
      sessionId: requestedSessionId,
    } = body;

    // Strict Server-Side Validation with clear user-facing messages
    const activeTopic = (body.topic || conceptName || conceptId || "").trim();
    if (!activeTopic) {
      return NextResponse.json(
        { success: false, error: "Enter a topic or concept." },
        { status: 400 }
      );
    }

    const activeQuestion = (body.question || questionText || "").trim();
    if (!activeQuestion) {
      return NextResponse.json(
        { success: false, error: "Enter the question or problem." },
        { status: 400 }
      );
    }

    const activeAnswer = (body.answer || content || code || "").trim();
    if (!activeAnswer) {
      return NextResponse.json(
        { success: false, error: "Add your reasoning, answer, or code before analyzing." },
        { status: 400 }
      );
    }

    // Identify user/guest session
    const token =
      req.cookies.get("archaia_session")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");
    let userId: string | undefined;
    if (token) {
      const verified = SecurityService.verifySessionToken(token);
      if (verified.valid && verified.payload) {
        userId = verified.payload.userId;
      }
    }

    // Benchmark Demo Investigation check: Preserve canonical demo_dfs flow
    const isBenchmarkDemo =
      requestedSessionId === "demo_dfs" ||
      requestedSessionId === "demo" ||
      body.isDemo === true;

    if (isBenchmarkDemo) {
      store.resetDemoData();
      const demoSession = store.getDemoSession();
      if (!userId) {
        userId = req.cookies.get("archaia_guest_id")?.value || "guest_demo_user";
      }
      demoSession.userId = userId;
      demoSession.submission = {
        conceptId: conceptId || demoSession.submission.conceptId,
        conceptName: activeTopic || demoSession.submission.conceptName,
        questionText: activeQuestion || demoSession.submission.questionText,
        responseType: responseType || "written",
        content: activeAnswer || demoSession.submission.content,
        code: code || undefined,
        mcqSelected,
        steps,
      };

      store.createDiagnosticSession(demoSession);

      const response = NextResponse.json({
        success: true,
        sessionId: demoSession.id,
        diagnosticSessionId: demoSession.id,
        session: demoSession,
        hasMisconception: demoSession.analysis.hasMisconception,
        misconception: demoSession.analysis.misconception,
        explanation: demoSession.analysis.explanation,
        evidence: demoSession.analysis.evidence,
        studentAssumption: demoSession.analysis.studentAssumption,
        formalReality: demoSession.analysis.formalReality,
        normalizedReasoning: demoSession.analysis.normalizedReasoning,
        masteryScore: demoSession.analysis.masteryScore,
        bisectSession: demoSession.bisectSession,
        concepts: demoSession.graph.concepts,
        edges: demoSession.graph.edges,
      });

      if (!token && !req.cookies.get("archaia_guest_id")?.value) {
        response.cookies.set("archaia_guest_id", userId, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
        });
      }

      return response;
    }

    // Determine or generate unique diagnosticSessionId for dynamic custom analysis
    const sessionId =
      requestedSessionId && requestedSessionId !== "demo" && requestedSessionId !== "demo_dfs"
        ? requestedSessionId
        : "diag_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);

    if (!userId) {
      userId = req.cookies.get("archaia_guest_id")?.value || "guest_" + sessionId.substring(5);
    }

    // Run Topic-Specific AI Cognitive Analysis
    const analysis = await analyzeStudentResponse(
      conceptId || activeTopic,
      activeQuestion,
      responseType || "written",
      activeAnswer,
      activeTopic,
      code
    );

    // Prepare session-scoped learner states for the generated topic DAG
    const statesRecord: Record<string, LearnerConceptState> = {};
    const targetId = analysis.concepts[analysis.concepts.length - 1]?.id || (conceptId || activeTopic);

    analysis.concepts.forEach((c, idx) => {
      const isTarget = c.id === targetId || idx === analysis.concepts.length - 1;
      const isFoundational = idx === 0 && analysis.concepts.length > 2;

      statesRecord[c.id] = {
        conceptId: c.id,
        masteryScore: analysis.hasMisconception ? (isTarget ? 45 : isFoundational ? 85 : 60) : 92,
        status: analysis.hasMisconception
          ? isTarget
            ? "misconception_detected"
            : isFoundational
            ? "mastered"
            : "untested"
          : "mastered",
        confidence: analysis.confidence,
        activeMisconceptionId: isTarget && analysis.misconception ? analysis.misconception.id : undefined,
        recoveryAttempts: 0,
        lastTestedAt: new Date().toISOString(),
      };
    });

    // Assemble the complete DiagnosticSession
    const session: DiagnosticSession = {
      id: sessionId,
      topic: activeTopic,
      userId,
      createdAt: new Date().toISOString(),
      isDemo: false,
      submission: {
        conceptId: targetId,
        conceptName: activeTopic,
        questionText: activeQuestion,
        responseType: responseType || "written",
        content: activeAnswer,
        code,
        mcqSelected,
        steps,
      },
      analysis: {
        hasMisconception: analysis.hasMisconception,
        misconception: analysis.misconception,
        masteryScore: analysis.masteryScore,
        evidence: analysis.evidence,
        explanation: analysis.explanation,
        studentAssumption: analysis.studentAssumption,
        formalReality: analysis.formalReality,
        normalizedReasoning: analysis.normalizedReasoning,
        confidence: analysis.confidence,
        extractedIndicators: analysis.extractedIndicators,
        affectedConcepts: analysis.affectedConcepts,
      },
      graph: {
        concepts: analysis.concepts,
        edges: analysis.edges,
        learnerStates: statesRecord,
      },
      bisectProbes: analysis.bisectProbes,
      recoveryIntervention: analysis.recoveryIntervention,
      retestAssessment: analysis.retestAssessment,
    };

    // Save session in store
    store.createDiagnosticSession(session);

    // Automatically initialize Cognitive Bisect session if misconception detected
    let bisectSession;
    if (analysis.hasMisconception && analysis.misconception) {
      bisectSession = BisectEngine.startSession(
        targetId,
        analysis.misconception.id,
        sessionId
      );
      session.bisectSession = bisectSession;
    }

    const response = NextResponse.json({
      success: true,
      sessionId: session.id,
      diagnosticSessionId: session.id,
      session,
      hasMisconception: analysis.hasMisconception,
      misconception: analysis.misconception,
      explanation: analysis.explanation,
      evidence: analysis.evidence,
      studentAssumption: analysis.studentAssumption,
      formalReality: analysis.formalReality,
      normalizedReasoning: analysis.normalizedReasoning,
      masteryScore: analysis.masteryScore,
      bisectSession,
      concepts: analysis.concepts,
      edges: analysis.edges,
    });

    // Attach guest cookie if not present
    if (!token && !req.cookies.get("archaia_guest_id")?.value) {
      response.cookies.set("archaia_guest_id", userId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Diagnostic analysis failed." },
      { status: 500 }
    );
  }
}

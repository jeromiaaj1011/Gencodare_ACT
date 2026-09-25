import { ResponseType, Misconception, Concept, ConceptEdge, DiagnosticProbe, InterventionContent, ReTestAssessment } from "../types/index";
import { callGemini } from "./gemini";
import { analyzeDomainTopic, AnalyzedDomainResult, toId, toCleanName } from "./domainAnalyzer";

export interface AnalysisResult extends AnalyzedDomainResult {}

export async function analyzeStudentResponse(
  conceptIdOrTopic: string,
  questionText: string,
  responseType: ResponseType,
  rawContent: string,
  conceptName?: string,
  codeContent?: string
): Promise<AnalysisResult> {
  const content = rawContent.trim();
  const topic = conceptName || toCleanName(conceptIdOrTopic);

  // 1. Try Gemini API first if configured
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim() !== "") {
    const prompt = `
You are ARCHAIA, an expert cognitive diagnostic engine for Computer Science and Software Engineering.
Analyze the following student response for deep conceptual misconceptions vs formal computing reality.

Topic / Concept: "${topic}"
Question / Problem: "${questionText}"
Response Type: ${responseType}
Student Content: "${content}"
${codeContent ? `Submitted Code:\n${codeContent}\n` : ""}

Evaluate whether the student exhibits an inaccurate mental model.
DO NOT provide generic or superficial classification. Contrast their underlying assumption against formal system invariants.
Return ONLY valid JSON matching this schema:
{
  "hasMisconception": boolean,
  "misconceptionName": string,
  "description": string,
  "studentAssumption": string,
  "formalReality": string,
  "evidence": string,
  "explanation": string,
  "masteryScore": number,
  "confidence": number,
  "extractedIndicators": string[],
  "affectedConcepts": string[],
  "concepts": [
    {
      "id": string,
      "name": string,
      "category": string,
      "description": string,
      "prerequisites": string[],
      "difficulty": "beginner" | "intermediate" | "advanced",
      "estimatedMinutes": number
    }
  ],
  "edges": [
    {
      "from": string,
      "to": string,
      "rationale": string
    }
  ],
  "bisectProbes": [
    {
      "id": string,
      "conceptId": string,
      "targetConceptId": string,
      "question": string,
      "options": [
        { "id": string, "text": string, "isCorrect": boolean, "indicator": string }
      ],
      "invariantTested": string,
      "rationale": string
    }
  ],
  "recovery": {
    "rootConceptId": string,
    "title": string,
    "explanation": string,
    "counterexample": {
      "title": string,
      "code": string,
      "expectedOutput": string,
      "actualOutput": string,
      "mentalModelExplanation": string
    },
    "microPuzzle": {
      "question": string,
      "codeSnippet": string,
      "options": string[],
      "correctIndex": number,
      "explanation": string
    },
    "codeExercise": {
      "instructions": string,
      "initialCode": string,
      "expectedPattern": string,
      "solutionCode": string,
      "hints": string[]
    },
    "industryBlastRadius": {
      "incidentTitle": string,
      "organizationType": string,
      "outageDescription": string,
      "howMisconceptionCausesIt": string,
      "illustrativeNote": string
    },
    "retest": {
      "question": string,
      "options": [
        { "id": string, "text": string, "isCorrect": boolean, "feedback": string }
      ]
    }
  }
}
`;

    try {
      const geminiText = await callGemini({
        prompt,
        systemInstruction: "You are the ARCHAIA Cognitive Analyzer. Return ONLY raw JSON without markdown formatting or code fences.",
      });

      if (geminiText) {
        const cleanJson = geminiText.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);

        if (parsed.concepts && parsed.concepts.length > 0) {
          const rootConceptId = parsed.recovery?.rootConceptId || parsed.concepts[0].id;
          const targetConceptId = toId(topic);

          const misconception: Misconception | undefined = parsed.hasMisconception
            ? {
                id: "misc_" + Date.now(),
                conceptId: targetConceptId,
                name: parsed.misconceptionName || `${topic} Conceptual Misconception`,
                description: parsed.description || `Inaccurate mental model regarding ${topic}.`,
                studentAssumption: parsed.studentAssumption || content,
                formalReality: parsed.formalReality || `Formal specification for ${topic}.`,
                affectedConcepts: parsed.affectedConcepts || [targetConceptId, rootConceptId],
                confidence: parsed.confidence || 90,
                evidence: parsed.evidence || `Student stated: "${content.substring(0, 140)}"`,
              }
            : undefined;

          const recoveryIntervention: InterventionContent = {
            id: `recovery_${rootConceptId}`,
            rootConceptId,
            targetConceptId,
            title: parsed.recovery?.title || `${topic}: Invariant Remediation`,
            explanation: parsed.recovery?.explanation || parsed.formalReality,
            visualMemoryModel: {
              type: "timeline",
              title: `${topic} Execution Timeline`,
              description: "System state transition sequence.",
              frames: [
                {
                  step: 1,
                  label: "Initial State",
                  stackFrames: ["Context active"],
                  activeLine: 1,
                  explanation: "Preconditions established.",
                },
                {
                  step: 2,
                  label: "State Transition",
                  stackFrames: ["Processing transition"],
                  activeLine: 2,
                  explanation: "Invariant evaluated.",
                },
              ],
            },
            counterexample: parsed.recovery?.counterexample || {
              title: `Counterexample in ${topic}`,
              code: `// Demonstrating invariant contract in ${topic}`,
              expectedOutput: "Expected state",
              actualOutput: "Observed state",
              mentalModelExplanation: parsed.formalReality,
            },
            microPuzzle: parsed.recovery?.microPuzzle || {
              question: `In ${topic}, what is the foundational contract?`,
              options: ["Arbitrary state mutation", "Strict invariant preservation", "Ignore boundary conditions"],
              correctIndex: 1,
              explanation: "Preserving invariants guarantees correctness.",
            },
            codeExercise: parsed.recovery?.codeExercise || {
              instructions: `Refactor the code to respect ${topic} guarantees.`,
              initialCode: `// Fix implementation for ${topic}`,
              expectedPattern: "return",
              solutionCode: `// Solution for ${topic}`,
              hints: ["Enforce boundary verification."],
            },
            industryBlastRadius: parsed.recovery?.industryBlastRadius || {
              incidentTitle: `Production Outage in ${topic}`,
              organizationType: "Distributed Services",
              outageDescription: `Inconsistent state handling in ${topic} led to downstream service disruption.`,
              howMisconceptionCausesIt: "Unverified assumptions allowed anomalous state transitions to occur.",
              illustrativeNote: `Real-world impact: Understanding ${topic} prevents production failures.`,
            },
          };

          const retestAssessment: ReTestAssessment = {
            id: `retest_${rootConceptId}`,
            conceptId: rootConceptId,
            question: parsed.recovery?.retest?.question || `What is the key invariant guarantee in ${topic}?`,
            options: parsed.recovery?.retest?.options || [
              {
                id: "opt_correct",
                text: parsed.formalReality,
                isCorrect: true,
                feedback: "Correct! You have mastered the invariant.",
              },
              {
                id: "opt_flawed",
                text: parsed.studentAssumption,
                isCorrect: false,
                feedback: "Incorrect. That reflects the original misconception.",
              },
            ],
          };

          return {
            hasMisconception: parsed.hasMisconception ?? true,
            misconception,
            masteryScore: parsed.masteryScore ?? (parsed.hasMisconception ? 45 : 92),
            explanation: parsed.explanation || (parsed.hasMisconception ? parsed.description : "Accurate understanding."),
            evidence: parsed.evidence || `Student stated: "${content.substring(0, 140)}"`,
            studentAssumption: parsed.studentAssumption || content,
            formalReality: parsed.formalReality || `Formal rules of ${topic}.`,
            normalizedReasoning: parsed.normalizedReasoning || content,
            confidence: parsed.confidence || 90,
            extractedIndicators: parsed.extractedIndicators || ["Domain invariants evaluated"],
            affectedConcepts: parsed.affectedConcepts || [targetConceptId],
            concepts: parsed.concepts,
            edges: parsed.edges || [],
            bisectProbes: parsed.bisectProbes || [],
            recoveryIntervention,
            retestAssessment,
          };
        }
      }
    } catch (e) {
      console.warn("Gemini analysis parse error, utilizing deterministic domain synthesizer:", e);
    }
  }

  // 2. High-Fidelity Domain-Aware Cognitive Synthesizer
  return analyzeDomainTopic(topic, questionText, content, codeContent);
}

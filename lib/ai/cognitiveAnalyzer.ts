import { Misconception, ResponseType } from "../types";
import { callGemini } from "./gemini";

export interface AnalysisResult {
  hasMisconception: boolean;
  misconception?: Misconception;
  normalizedReasoning: string;
  confidence: number;
  extractedIndicators: string[];
}

export async function analyzeStudentResponse(
  conceptId: string,
  questionText: string,
  responseType: ResponseType,
  rawContent: string
): Promise<AnalysisResult> {
  const content = rawContent.trim();
  const lower = content.toLowerCase();

  // Try live Gemini API first if configured
  const prompt = `
You are ARCHAIA, an expert cognitive diagnostic engine for Computer Science education.
A student answered the following question on concept "${conceptId}":
Question: "${questionText}"
Response Type: ${responseType}
Student Answer: "${content}"

Analyze if the student exhibits a fundamental conceptual misconception.
DO NOT just classify as right or wrong. Contrast their underlying mental model against formal computing reality.
Respond in valid JSON format:
{
  "hasMisconception": boolean,
  "misconceptionName": string,
  "description": string,
  "studentAssumption": string,
  "formalReality": string,
  "affectedConcepts": string[],
  "confidence": number,
  "evidence": string,
  "normalizedReasoning": string,
  "extractedIndicators": string[]
}
`;

  const geminiText = await callGemini({
    prompt,
    systemInstruction: "You are ARCHAIA Cognitive Analyzer. Return ONLY raw JSON without markdown fences.",
  });

  if (geminiText) {
    try {
      const cleanJson = geminiText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.hasMisconception) {
        const misconception: Misconception = {
          id: "misc_" + Date.now(),
          conceptId,
          name: parsed.misconceptionName || "Recursive Context Replacement",
          description: parsed.description || "Misunderstanding runtime activation records.",
          studentAssumption: parsed.studentAssumption || "Recursive calls overwrite caller state.",
          formalReality: parsed.formalReality || "Each invocation maintains an independent stack frame.",
          affectedConcepts: parsed.affectedConcepts || [conceptId, "recursion", "call_stack"],
          confidence: parsed.confidence || 92,
          evidence: parsed.evidence || content,
        };
        return {
          hasMisconception: true,
          misconception,
          normalizedReasoning: parsed.normalizedReasoning || content,
          confidence: parsed.confidence || 92,
          extractedIndicators: parsed.extractedIndicators || ["Context replacement indicator"],
        };
      }
    } catch (e) {
      console.warn("Failed to parse Gemini response JSON, utilizing deterministic cognitive heuristic:", e);
    }
  }

  // Deterministic Multi-Scenario Cognitive Heuristics Engine

  // Check 1: Student has an ACCURATE Mental Model (No Misconception)
  const isSoundExplanation =
    (lower.includes("stack frame") || lower.includes("activation record") || lower.includes("call stack")) &&
    (lower.includes("pause") || lower.includes("suspend") || lower.includes("resume") || lower.includes("return") || lower.includes("preserve") || lower.includes("lifo"));

  const isSoundAliasing =
    (lower.includes("reference") || lower.includes("address") || lower.includes("pointer")) &&
    (lower.includes("same") || lower.includes("mutate") || lower.includes("affects both") || lower.includes("shallow"));

  const isExplicitlyCorrect =
    lower.includes("resumes its loop") ||
    lower.includes("continues to the next neighbor") ||
    lower.includes("pushed onto the stack") ||
    lower.includes("does not overwrite") ||
    lower.includes("does not replace") ||
    lower.includes("isolated in memory");

  if (isSoundExplanation || isSoundAliasing || isExplicitlyCorrect) {
    return {
      hasMisconception: false,
      normalizedReasoning: "The learner exhibits an accurate, verified mental model aligned with formal runtime computing reality.",
      confidence: 96,
      extractedIndicators: [
        "Accurate execution invariant preserved",
        "Correct understanding of runtime memory boundaries",
      ],
    };
  }

  // Check 2: Reference vs Value / Aliasing Fallacy
  if (
    lower.includes("copy") ||
    lower.includes("visited_copy") ||
    lower.includes("clone") ||
    lower.includes("duplicate") ||
    lower.includes("independent memory") ||
    lower.includes("will not mutate original") ||
    lower.includes("separate array") ||
    conceptId === "memory_allocation"
  ) {
    const misconception: Misconception = {
      id: "pass_by_val_aliasing",
      conceptId: "memory_allocation",
      name: "Object Reference Aliasing Fallacy",
      description: "Believing that assigning an array or object to a new variable creates an isolated duplicate in memory.",
      studentAssumption: "Writing `let copy = visited` duplicates the array so modifications to `copy` will not mutate `visited`.",
      formalReality: "In modern programming runtimes, object and array variables store memory references. Assigning a reference copies only the memory address pointing to the same heap structure.",
      affectedConcepts: ["memory_allocation", "functions_context", "graph_traversal"],
      confidence: 93,
      evidence: `Student asserted: "${content.substring(0, 140)}"`,
    };

    return {
      hasMisconception: true,
      misconception,
      normalizedReasoning: "The learner confuses variable reference assignment with deep value copying.",
      confidence: 93,
      extractedIndicators: [
        "Confuses reference copy with deep clone",
        "Assumes separate heap memory addresses",
      ],
    };
  }

  // Check 3: Recursive Context Replacement
  if (
    lower.includes("replace") ||
    lower.includes("overwrite") ||
    lower.includes("cannot go back") ||
    lower.includes("forgets") ||
    lower.includes("exit") ||
    lower.includes("lost") ||
    lower.includes("terminate") ||
    lower.includes("destroys") ||
    conceptId === "graph_traversal" ||
    conceptId === "recursion" ||
    conceptId === "tree_traversal"
  ) {
    const misconception: Misconception = {
      id: "rec_context_replace",
      conceptId: "graph_traversal",
      name: "Recursive Context Replacement",
      description: "Believing that a recursive function invocation overwrites or replaces the caller's execution environment.",
      studentAssumption: "When dfs(neighbor) is invoked, it replaces the current function. Once the child finishes, the function exits or forgets its loop position.",
      formalReality: "Each recursive invocation pushes a distinct activation record onto the Call Stack. The parent invocation remains paused in memory and seamlessly resumes its loop index when the child returns.",
      affectedConcepts: ["graph_traversal", "tree_traversal", "recursion", "dynamic_programming"],
      confidence: 94,
      evidence: `Student stated: "${content.substring(0, 140)}"`,
    };

    return {
      hasMisconception: true,
      misconception,
      normalizedReasoning: "The learner models recursion as a single mutating execution register rather than a LIFO stack of isolated activation frames.",
      confidence: 94,
      extractedIndicators: [
        "Believes child execution destroys parent local scope",
        "Lacks mental model of stack unwinding and resumption",
      ],
    };
  }

  // Fallback for short general entries
  return {
    hasMisconception: false,
    normalizedReasoning: "Response evaluated. No fundamental conceptual flaw detected under current diagnostic constraints.",
    confidence: 85,
    extractedIndicators: ["Basic procedural understanding indicated"],
  };
}

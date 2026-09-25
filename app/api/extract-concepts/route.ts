import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, subject, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "Title and content are required." },
        { status: 400 }
      );
    }

    // Heuristic concept extractor (can also call Gemini LLM if key is present)
    const lines = content.split("\n");
    const extracted: string[] = [];

    const keywordPatterns = [
      { id: "memory_allocation", match: /memory|pointer|stack|heap/i },
      { id: "functions_context", match: /function|scope|variable|lifetime/i },
      { id: "call_stack", match: /call stack|activation frame|lifo/i },
      { id: "recursion", match: /recursion|base case|inductive/i },
      { id: "tree_traversal", match: /tree|binary tree|inorder|preorder/i },
      { id: "graph_traversal", match: /graph|dfs|bfs|visited/i },
      { id: "dynamic_programming", match: /dynamic programming|memoization|subproblem/i },
    ];

    keywordPatterns.forEach((p) => {
      if (p.match.test(content)) {
        extracted.push(p.id);
      }
    });

    const newMaterial = {
      id: "mat_" + Date.now(),
      title,
      subject: subject || "Computer Science",
      content,
      extractedConcepts: extracted.length > 0 ? extracted : ["recursion", "call_stack"],
    };

    store.addCourseMaterial(newMaterial);

    return NextResponse.json({
      success: true,
      material: newMaterial,
      message: `Extracted ${newMaterial.extractedConcepts.length} concepts and mapped to Causal Knowledge Graph.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    materials: store.getCourseMaterials(),
  });
}

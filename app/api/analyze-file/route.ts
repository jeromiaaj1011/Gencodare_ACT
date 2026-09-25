import { NextRequest, NextResponse } from "next/server";
import { analyzeUploadedFile } from "@/lib/ai/fileAnalyzer";
import { store } from "@/lib/storage/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, fileContent, fileSize } = body;

    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json(
        { success: false, error: "Please select a valid file from your file manager." },
        { status: 400 }
      );
    }

    if (!fileContent || typeof fileContent !== "string") {
      return NextResponse.json(
        { success: false, error: "The selected file is empty or could not be read." },
        { status: 400 }
      );
    }

    // Limit content size to 500KB to protect against huge file uploads
    const cleanContent = fileContent.slice(0, 500000);

    const analysis = await analyzeUploadedFile(fileName, cleanContent, fileSize || cleanContent.length);

    // Register into course materials catalog for workspace availability
    try {
      store.addCourseMaterial({
        id: "mat_upload_" + Date.now(),
        title: analysis.topic,
        subject: analysis.detectedLanguage || "Computer Science",
        content: `Problem Statement:\n${analysis.problemStatement}\n\nCode Preview:\n${cleanContent.slice(0, 2000)}`,
        extractedConcepts: analysis.keyConcepts,
      });
    } catch (e) {
      console.warn("Could not register course material:", e);
    }

    return NextResponse.json({
      success: true,
      analysis,
      message: `File "${fileName}" analyzed successfully. Problem statement formulated.`,
    });
  } catch (error: any) {
    console.error("Error analyzing uploaded file:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to analyze uploaded file." },
      { status: 500 }
    );
  }
}

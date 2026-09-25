import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage/store";
import { extractCourseMaterial } from "@/lib/ai/courseExtractor";

export const dynamic = "force-dynamic";

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

    const newMaterial = await extractCourseMaterial(
      title,
      content,
      subject || "Computer Science"
    );

    store.addCourseMaterial(newMaterial, true);

    return NextResponse.json({
      success: true,
      mode: "course",
      material: newMaterial,
      message: `Extracted ${newMaterial.concepts?.length || newMaterial.extractedConcepts.length} concepts and mapped to Causal Knowledge Graph. Switched to COURSE MODE.`,
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
    mode: store.getMode(),
    activeCourse: store.getActiveCourse(),
    materials: store.getCourseMaterials(),
  });
}

import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/storage/store";
import { extractCourseMaterial } from "@/lib/ai/courseExtractor";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const mode = store.getMode();
    const activeCourse = store.getActiveCourse();
    const courses = store.getCourseMaterials();

    return NextResponse.json(
      {
        success: true,
        mode,
        activeCourse,
        courses,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // Action 1: Switch Mode
    if (action === "setMode" || (body.mode && !action)) {
      const targetMode = body.mode === "course" ? "course" : "demo";
      store.setMode(targetMode);
      return NextResponse.json(
        {
          success: true,
          mode: targetMode,
          activeCourse: store.getActiveCourse(),
          message: `Switched to ${targetMode.toUpperCase()} MODE.`,
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    // Action 2: Set Active Course
    if (action === "setActiveCourse") {
      const courseId = body.courseId;
      if (!courseId) {
        return NextResponse.json(
          { success: false, error: "courseId is required." },
          { status: 400 }
        );
      }
      const switched = store.setActiveCourse(courseId);
      if (!switched) {
        return NextResponse.json(
          { success: false, error: "Course not found." },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        mode: "course",
        activeCourse: store.getActiveCourse(),
        message: `Active course set to "${store.getActiveCourse()?.title}".`,
      });
    }

    // Action 3: Ingest Course Material & Extract Concepts
    if (action === "uploadCourse" || !action) {
      const { title, content, subject, fileName } = body;
      if (!content || content.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Course content is required (paste notes, syllabus, or upload file)." },
          { status: 400 }
        );
      }

      const extracted = await extractCourseMaterial(
        title || fileName || "Course Material",
        content,
        subject || "Computer Science",
        fileName
      );

      // Save to store and activate course mode
      store.addCourseMaterial(extracted, true);

      return NextResponse.json({
        success: true,
        mode: "course",
        course: extracted,
        activeCourse: extracted,
        message: `Extracted ${extracted.concepts?.length || 0} concepts with prerequisite relationships. Active mode set to COURSE MODE.`,
      });
    }

    return NextResponse.json(
      { success: false, error: `Unknown action "${action}"` },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Course operation failed." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { userStore } from "@/lib/auth/userStore";
import { SecurityService } from "@/lib/auth/security";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, role } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { success: false, error: "Full name, email address, and password are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid institutional email address." },
        { status: 400 }
      );
    }

    // Password strength check
    const strength = SecurityService.evaluatePasswordStrength(password);
    if (strength.score < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Password does not meet minimum security standards: " + strength.feedback.join(" "),
          strength,
        },
        { status: 400 }
      );
    }

    const result = userStore.createUser(
      email,
      password,
      fullName,
      role === "instructor" ? "instructor" : role === "researcher" ? "researcher" : "learner"
    );

    if (!result.success || !result.user) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    const sessionToken = SecurityService.generateSessionToken(
      result.user.id,
      result.user.email,
      result.user.role
    );

    const publicProfile = userStore.getPublicProfile(result.user);

    const response = NextResponse.json({
      success: true,
      user: publicProfile,
      token: sessionToken,
      message: "Learner account successfully registered.",
    });

    response.cookies.set("archaia_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

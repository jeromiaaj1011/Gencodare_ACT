import { NextRequest, NextResponse } from "next/server";
import { userStore } from "@/lib/auth/userStore";
import { SecurityService } from "@/lib/auth/security";

export async function GET(req: NextRequest) {
  try {
    const token =
      req.cookies.get("archaia_session")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const verification = SecurityService.verifySessionToken(token);
    if (!verification.valid || !verification.payload) {
      return NextResponse.json(
        { authenticated: false, error: verification.error },
        { status: 401 }
      );
    }

    const user = userStore.findByEmail(verification.payload.email);
    if (!user) {
      return NextResponse.json({ authenticated: false, error: "User not found" }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: userStore.getPublicProfile(user),
    });
  } catch (error: any) {
    return NextResponse.json(
      { authenticated: false, error: error.message },
      { status: 500 }
    );
  }
}

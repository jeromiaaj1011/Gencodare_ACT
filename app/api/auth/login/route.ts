import { NextRequest, NextResponse } from "next/server";
import { userStore } from "@/lib/auth/userStore";
import { SecurityService } from "@/lib/auth/security";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email address and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Check Rate Limit / Brute Force Lockout
    const rateCheck = SecurityService.checkRateLimit(cleanEmail);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed login attempts. Security lock active. Please wait ${rateCheck.remainingLockoutSeconds} seconds before trying again.`,
          locked: true,
          remainingLockoutSeconds: rateCheck.remainingLockoutSeconds,
        },
        { status: 429 }
      );
    }

    // 2. Lookup User
    const user = userStore.findByEmail(cleanEmail);
    if (!user) {
      const attempt = SecurityService.recordFailedAttempt(cleanEmail);
      return NextResponse.json(
        {
          success: false,
          error: `Invalid credentials. ${attempt.attemptsLeft} attempt(s) remaining before security lockout.`,
          attemptsLeft: attempt.attemptsLeft,
        },
        { status: 401 }
      );
    }

    // 3. Verify Password Hash with Cryptographic Salt
    const isMatch = SecurityService.verifyPassword(password, user.salt, user.passwordHash);
    if (!isMatch) {
      const attempt = SecurityService.recordFailedAttempt(cleanEmail);
      return NextResponse.json(
        {
          success: false,
          error: attempt.locked
            ? "Account temporarily locked due to 5 failed security attempts. Try again in 10 minutes."
            : `Invalid password. ${attempt.attemptsLeft} attempt(s) remaining before security lockout.`,
          locked: attempt.locked,
          attemptsLeft: attempt.attemptsLeft,
        },
        { status: 401 }
      );
    }

    // 4. Success: Clear failed attempts
    SecurityService.clearFailedAttempts(cleanEmail);
    userStore.updateLastLogin(cleanEmail);

    // 5. Generate Signed HMAC-SHA256 Session Token
    const sessionToken = SecurityService.generateSessionToken(user.id, user.email, user.role);

    const publicProfile = userStore.getPublicProfile(user);

    // 6. Set Secure Cookie
    const response = NextResponse.json({
      success: true,
      user: publicProfile,
      token: sessionToken,
      message: "Authentication successful.",
    });

    response.cookies.set("archaia_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Session ended. Logged out successfully.",
  });

  response.cookies.delete("archaia_session");
  return response;
}

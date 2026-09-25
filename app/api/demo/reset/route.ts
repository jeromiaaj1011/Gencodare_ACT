import { NextResponse } from "next/server";
import { store } from "@/lib/storage/store";

export async function POST() {
  store.resetToSeed();
  return NextResponse.json({
    success: true,
    message: "ARCHAIA demo state successfully reset to initial seed.",
  });
}

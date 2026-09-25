import { NextResponse } from "next/server";
import { store } from "@/lib/storage/store";

export async function POST() {
  store.resetDemoData();
  return NextResponse.json({
    success: true,
    message: "ARCHAIA demo state successfully reset to initial seed.",
  });
}

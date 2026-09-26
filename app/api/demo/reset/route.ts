import { NextResponse } from "next/server";
import { store } from "@/lib/storage/store";

export async function POST() {
  store.resetDemoData();
  const res = NextResponse.json({
    success: true,
    message: "ARCHAIA demo state successfully reset to initial seed.",
  });
  res.cookies.delete("archaia_retest_recovered");
  res.cookies.delete("archaia_retest_unresolved");
  return res;
}

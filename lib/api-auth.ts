import { getAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function getApiAuth() {
  const auth = await getAuth();
  if (!auth) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { auth };
}

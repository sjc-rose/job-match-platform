import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/server";

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
    };
  }

  return {
    response: null,
    user,
  };
}

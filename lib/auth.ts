import { NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/supabase/server";

export async function requireCurrentUser(request?: Request) {
  const user = await getCurrentUserFromRequest(request);

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

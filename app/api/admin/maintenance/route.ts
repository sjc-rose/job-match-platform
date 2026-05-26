import { NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE, ADMIN_AUTH_VALUE } from "@/lib/adminAuth";
import { runMaintenanceCheck } from "@/lib/maintenance";

function hasAdminCookie(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .some((cookie) => cookie === `${ADMIN_AUTH_COOKIE}=${ADMIN_AUTH_VALUE}`);
}

function hasCronSecret(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-cron-secret");
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");

  return (
    authorization === `Bearer ${cronSecret}` ||
    headerSecret === cronSecret ||
    querySecret === cronSecret
  );
}

function isAuthorized(request: Request) {
  return hasAdminCookie(request) || hasCronSecret(request);
}

async function handleMaintenance(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runMaintenanceCheck();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Maintenance check failed", error);
    return NextResponse.json(
      {
        database: "error",
        message: "Database unavailable",
        ok: false,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}

export async function GET(request: Request) {
  return handleMaintenance(request);
}

export async function POST(request: Request) {
  return handleMaintenance(request);
}

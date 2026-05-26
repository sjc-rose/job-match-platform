import { NextResponse } from "next/server";
import { getHealthStatus } from "@/lib/maintenance";

export async function GET() {
  const healthStatus = await getHealthStatus();

  return NextResponse.json(healthStatus, {
    status: healthStatus.ok ? 200 : 503,
  });
}

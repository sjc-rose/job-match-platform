import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type AdminJobRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: Request, { params }: AdminJobRouteProps) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Job id is required" }, { status: 400 });
  }

  try {
    await prisma.job.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      ok: true,
      id,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    console.error("Failed to delete admin job", error);
    return NextResponse.json(
      { error: "Failed to delete admin job" },
      { status: 500 },
    );
  }
}

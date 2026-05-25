import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type DataSourceRecord = {
  id: string;
  name: string;
  code: string;
  type: string;
  websiteUrl: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function parseString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCode(value: unknown) {
  return parseString(value).toLowerCase();
}

function isValidCode(code: string) {
  return /^[a-z0-9_-]+$/.test(code);
}

function toApiSource(source: DataSourceRecord) {
  return {
    id: source.id,
    name: source.name,
    code: source.code,
    type: source.type,
    websiteUrl: source.websiteUrl ?? "",
    description: source.description ?? "",
    isActive: source.isActive,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}

function parsePayload(body: Record<string, unknown>) {
  const name = parseString(body.name);
  const code = normalizeCode(body.code);
  const type = parseString(body.type);
  const websiteUrl = parseString(body.websiteUrl) || null;
  const description = parseString(body.description) || null;
  const isActive =
    typeof body.isActive === "boolean" ? body.isActive : true;

  if (!name || !code || !type) {
    throw new Error("name、code、type 为必填字段");
  }

  if (!isValidCode(code)) {
    throw new Error("code 只能包含英文、数字、短横线和下划线");
  }

  return {
    name,
    code,
    type,
    websiteUrl,
    description,
    isActive,
  };
}

function toErrorResponse(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json({ error: "数据源 code 已存在" }, { status: 409 });
  }

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ error: "Request failed" }, { status: 500 });
}

export async function GET() {
  try {
    const sources = await prisma.dataSource.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      sources: sources.map(toApiSource),
    });
  } catch (error) {
    console.error("Failed to fetch data sources", error);
    return NextResponse.json(
      { error: "Failed to fetch data sources" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const payload = parsePayload(body);
    const source = await prisma.dataSource.create({
      data: payload,
    });

    return NextResponse.json({ source: toApiSource(source) }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const id = parseString(body.id);

    if (!id) {
      return NextResponse.json({ error: "id 为必填字段" }, { status: 400 });
    }

    const payload = parsePayload(body);
    const source = await prisma.dataSource.update({
      where: {
        id,
      },
      data: payload,
    });

    return NextResponse.json({ source: toApiSource(source) });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "数据源不存在" }, { status: 404 });
    }

    return toErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const id = parseString(body.id);

    if (!id) {
      return NextResponse.json({ error: "id 为必填字段" }, { status: 400 });
    }

    await prisma.dataSource.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "数据源不存在" }, { status: 404 });
    }

    console.error("Failed to delete data source", error);
    return NextResponse.json(
      { error: "Failed to delete data source" },
      { status: 500 },
    );
  }
}

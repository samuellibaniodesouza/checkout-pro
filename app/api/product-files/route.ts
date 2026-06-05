import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.productId || !body.title || !body.fileUrl) {
      return NextResponse.json(
        { error: "Produto, nome e arquivo são obrigatórios." },
        { status: 400 }
      );
    }

    const lastFile = await prisma.productFile.findFirst({
      where: {
        productId: body.productId,
      },
      orderBy: {
        sortOrder: "desc",
      },
    });

    const newFile = await prisma.productFile.create({
      data: {
        productId: body.productId,
        title: body.title,
        description: body.description || "",
        fileUrl: body.fileUrl,
        type: "main",
        sortOrder: lastFile ? lastFile.sortOrder + 1 : 1,
      },
    });

    return NextResponse.json(newFile);
  } catch (error) {
    console.error("Erro ao adicionar arquivo:", error);

    return NextResponse.json(
      { error: "Erro ao adicionar arquivo." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (!body.fileId || !body.title) {
      return NextResponse.json(
        { error: "ID do arquivo e nome são obrigatórios." },
        { status: 400 }
      );
    }

    const updatedFile = await prisma.productFile.update({
      where: {
        id: body.fileId,
      },
      data: {
        title: body.title,
        description: body.description || "",
      },
    });

    return NextResponse.json(updatedFile);
  } catch (error) {
    console.error("Erro ao editar arquivo:", error);

    return NextResponse.json(
      { error: "Erro ao editar arquivo." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    if (!body.fileId) {
      return NextResponse.json(
        { error: "ID do arquivo não informado." },
        { status: 400 }
      );
    }

    await prisma.productFile.delete({
      where: {
        id: body.fileId,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Arquivo removido com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao remover arquivo:", error);

    return NextResponse.json(
      { error: "Erro ao remover arquivo." },
      { status: 500 }
    );
  }
}
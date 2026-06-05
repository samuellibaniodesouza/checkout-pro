import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.slug || !body.price) {
      return NextResponse.json(
        {
          error: "Nome, slug e preço são obrigatórios.",
        },
        {
          status: 400,
        }
      );
    }

    const existingProduct = await prisma.product.findUnique({
      where: {
        slug: body.slug,
      },
    });

    if (existingProduct) {
      return NextResponse.json(
        {
          error: "Já existe um produto com esse slug.",
        },
        {
          status: 400,
        }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description || "",
        price: Number(body.price),
        imageUrl: body.imageUrl || "",
        fileUrl: body.fileUrl || "",
        metaPixelId: body.metaPixelId || "",
        upsellHeadline: body.upsellHeadline || "",
        upsellBenefits: body.upsellBenefits || "",
        isActive: true,

        upsellEnabled: Boolean(body.upsellEnabled),
        upsellProductId: body.upsellProductId || null,

        files: {
          create: Array.isArray(body.files)
            ? body.files.map(
                (
                  file: {
                    title: string;
                    description?: string;
                    fileUrl: string;
                    type?: string;
                    sortOrder?: number;
                  },
                  index: number
                ) => ({
                  title: file.title,
                  description: file.description || "",
                  fileUrl: file.fileUrl,
                  type: file.type || "main",
                  sortOrder: file.sortOrder || index + 1,
                })
              )
            : [],
        },
      },
      include: {
        files: true,
        upsellProduct: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Erro ao criar produto:", error);

    return NextResponse.json(
      {
        error: "Erro ao criar produto.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        files: {
          orderBy: {
            sortOrder: "asc",
          },
        },
        upsellProduct: true,
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);

    return NextResponse.json(
      {
        error: "Erro ao buscar produtos.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    if (!body.productId) {
      return NextResponse.json(
        {
          error: "ID do produto não informado.",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.product.updateMany({
      where: {
        upsellProductId: body.productId,
      },
      data: {
        upsellEnabled: false,
        upsellProductId: null,
      },
    });

    await prisma.product.delete({
      where: { 
        id: body.productId,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Produto excluído com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao excluir produto:", error);

    return NextResponse.json(
      {
        error: "Erro ao excluir produto.",
      },
      {
        status: 500,
      }
    );
  }
}

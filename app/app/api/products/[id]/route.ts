import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID do produto não informado." },
        { status: 400 }
      );
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id,
      },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description || "",
        price: Number(body.price),
        imageUrl: body.imageUrl || "",
        metaPixelId: body.metaPixelId || "",
        upsellHeadline: body.upsellHeadline || "",
        upsellBenefits: body.upsellBenefits || "",
        isActive: body.isActive ?? true,

        upsellEnabled: Boolean(body.upsellEnabled),
        upsellProductId: body.upsellEnabled
          ? body.upsellProductId || null
          : null,
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

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);

    return NextResponse.json(
      { error: "Erro ao atualizar produto." },
      { status: 500 }
    );
  }
}

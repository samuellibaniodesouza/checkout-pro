import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import EditProductForm from "./EditProductForm";

type EditarProdutoPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarProdutoPage({
  params,
}: EditarProdutoPageProps) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: {
      id,
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

  if (!product) {
    notFound();
  }

  const allProducts = await prisma.product.findMany({
    where: {
      id: {
        not: product.id,
      },
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      imageUrl: true,
    },
  });

  return (
    <EditProductForm
      product={{
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl,
        metaPixelId: product.metaPixelId,
        upsellHeadline: product.upsellHeadline,
        upsellBenefits: product.upsellBenefits,
        isActive: product.isActive,
        upsellEnabled: product.upsellEnabled,
        upsellProductId: product.upsellProductId,
        files: product.files.map((file) => ({
          id: file.id,
          title: file.title,
          fileUrl: file.fileUrl,
          sortOrder: file.sortOrder,
        })),
      }}
      allProducts={allProducts}
    />
  );
}

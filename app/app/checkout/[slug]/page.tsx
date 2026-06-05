import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import CheckoutClient from "./CheckoutClient";

type CheckoutPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CheckoutProdutoPage({
  params,
}: CheckoutPageProps) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: {
      slug,
    },
    include: {
      upsellProduct: true,
    },
  });

  if (!product || !product.isActive) {
    notFound();
  }

  return (
    <CheckoutClient
      product={{
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl,
        metaPixelId: product.metaPixelId,
        upsellEnabled: product.upsellEnabled,
        upsellProductId: product.upsellProductId,
        upsellProduct: product.upsellProduct
          ? {
              id: product.upsellProduct.id,
              name: product.upsellProduct.name,
              slug: product.upsellProduct.slug,
              price: product.upsellProduct.price,
              imageUrl: product.upsellProduct.imageUrl,
              upsellHeadline: product.upsellProduct.upsellHeadline,
              upsellBenefits: product.upsellProduct.upsellBenefits,
            }
          : null,
      }}
    />
  );
}

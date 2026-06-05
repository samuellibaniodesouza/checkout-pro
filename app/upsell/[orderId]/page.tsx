import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import UpsellClient from "./UpsellClient";

type UpsellPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function UpsellPage({ params }: UpsellPageProps) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      product: {
        include: {
          upsellProduct: true,
        },
      },
    },
  });

  if (!order || !order.product || !order.product.upsellProduct) {
    notFound();
  }

  const upsellProduct = order.product.upsellProduct;

  return (
    <UpsellClient
      parentOrder={{
        id: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        customerCpf: order.customerCpf,
        productName: order.product.name,
      }}
      upsellProduct={{
        id: upsellProduct.id,
        name: upsellProduct.name,
        slug: upsellProduct.slug,
        description: upsellProduct.description,
        price: upsellProduct.price,
        imageUrl: upsellProduct.imageUrl,
      }}
    />
  );
}

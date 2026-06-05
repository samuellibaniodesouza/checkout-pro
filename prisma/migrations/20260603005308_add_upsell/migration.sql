-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerCpf" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productId" TEXT,
    "amount" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "orderBump" BOOLEAN NOT NULL DEFAULT false,
    "gatewayPaymentId" TEXT,
    "metaPurchaseSent" BOOLEAN NOT NULL DEFAULT false,
    "metaPurchaseSentAt" DATETIME,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" DATETIME,
    "isUpsellOrder" BOOLEAN NOT NULL DEFAULT false,
    "parentOrderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("amount", "createdAt", "customerCpf", "customerEmail", "customerName", "customerPhone", "emailSent", "emailSentAt", "gatewayPaymentId", "id", "metaPurchaseSent", "metaPurchaseSentAt", "orderBump", "paymentMethod", "paymentStatus", "productId", "productName", "updatedAt") SELECT "amount", "createdAt", "customerCpf", "customerEmail", "customerName", "customerPhone", "emailSent", "emailSentAt", "gatewayPaymentId", "id", "metaPurchaseSent", "metaPurchaseSentAt", "orderBump", "paymentMethod", "paymentStatus", "productId", "productName", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price" REAL NOT NULL,
    "imageUrl" TEXT,
    "fileUrl" TEXT,
    "metaPixelId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "upsellEnabled" BOOLEAN NOT NULL DEFAULT false,
    "upsellProductId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_upsellProductId_fkey" FOREIGN KEY ("upsellProductId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("createdAt", "description", "fileUrl", "id", "imageUrl", "isActive", "metaPixelId", "name", "price", "slug", "updatedAt") SELECT "createdAt", "description", "fileUrl", "id", "imageUrl", "isActive", "metaPixelId", "name", "price", "slug", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

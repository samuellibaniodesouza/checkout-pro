-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'percent',
    "value" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

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
    "couponCode" TEXT,
    "couponDiscount" REAL NOT NULL DEFAULT 0,
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
INSERT INTO "new_Order" ("amount", "createdAt", "customerCpf", "customerEmail", "customerName", "customerPhone", "emailSent", "emailSentAt", "gatewayPaymentId", "id", "isUpsellOrder", "metaPurchaseSent", "metaPurchaseSentAt", "orderBump", "parentOrderId", "paymentMethod", "paymentStatus", "productId", "productName", "updatedAt") SELECT "amount", "createdAt", "customerCpf", "customerEmail", "customerName", "customerPhone", "emailSent", "emailSentAt", "gatewayPaymentId", "id", "isUpsellOrder", "metaPurchaseSent", "metaPurchaseSentAt", "orderBump", "parentOrderId", "paymentMethod", "paymentStatus", "productId", "productName", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

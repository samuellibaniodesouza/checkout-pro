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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("amount", "createdAt", "customerCpf", "customerEmail", "customerName", "customerPhone", "gatewayPaymentId", "id", "metaPurchaseSent", "metaPurchaseSentAt", "orderBump", "paymentMethod", "paymentStatus", "productId", "productName", "updatedAt") SELECT "amount", "createdAt", "customerCpf", "customerEmail", "customerName", "customerPhone", "gatewayPaymentId", "id", "metaPurchaseSent", "metaPurchaseSentAt", "orderBump", "paymentMethod", "paymentStatus", "productId", "productName", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

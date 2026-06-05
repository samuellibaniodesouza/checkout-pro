-- CreateTable
CREATE TABLE "PaymentSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "provider" TEXT NOT NULL DEFAULT 'mercado_pago',
    "environment" TEXT NOT NULL DEFAULT 'test',
    "mercadoPagoAccessToken" TEXT,
    "mercadoPagoPublicKey" TEXT,
    "mercadoPagoAccountEmail" TEXT,
    "receiverName" TEXT,
    "manualPixEnabled" BOOLEAN NOT NULL DEFAULT false,
    "manualPixKey" TEXT,
    "manualPixKeyType" TEXT,
    "manualPixReceiverName" TEXT,
    "manualPixBankName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

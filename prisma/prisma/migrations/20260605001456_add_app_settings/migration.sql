-- CreateTable
CREATE TABLE "IntegrationSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "metaPixelId" TEXT,
    "metaAccessToken" TEXT,
    "metaGraphVersion" TEXT NOT NULL DEFAULT 'v21.0',
    "metaTestCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "companyName" TEXT NOT NULL DEFAULT 'Checkout Digital',
    "supportEmail" TEXT,
    "supportWhatsapp" TEXT,
    "logoUrl" TEXT,
    "footerText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

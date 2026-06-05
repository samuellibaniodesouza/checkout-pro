-- CreateTable
CREATE TABLE "CheckoutSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "checkoutTitle" TEXT NOT NULL DEFAULT 'Finalize sua compra com segurança',
    "checkoutSubtitle" TEXT NOT NULL DEFAULT 'Produto digital com acesso após confirmação do pagamento.',
    "checkoutButtonText" TEXT NOT NULL DEFAULT 'Comprar agora com segurança',
    "checkoutGuaranteeText" TEXT NOT NULL DEFAULT 'Seus dados estão protegidos. Não armazenamos dados de cartão.',
    "primaryColor" TEXT NOT NULL DEFAULT '#16a34a',
    "secondaryColor" TEXT NOT NULL DEFAULT '#7e22ce',
    "orderBumpEnabled" BOOLEAN NOT NULL DEFAULT true,
    "orderBumpName" TEXT NOT NULL DEFAULT 'Kit Fornecedores Premium',
    "orderBumpDescription" TEXT NOT NULL DEFAULT 'Receba uma lista prática com fornecedores, ideias de compra de matéria-prima e caminhos para começar vendendo mais rápido.',
    "orderBumpPrice" REAL NOT NULL DEFAULT 9.90,
    "orderBumpOldPrice" REAL NOT NULL DEFAULT 19.90,
    "orderBumpBadge" TEXT NOT NULL DEFAULT 'Oferta rápida',
    "orderBumpButtonText" TEXT NOT NULL DEFAULT 'adicionar ao pedido',
    "orderBumpBenefits" TEXT NOT NULL DEFAULT 'Lista de fornecedores
Matérias-primas
Ideias para revenda
Acesso imediato',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

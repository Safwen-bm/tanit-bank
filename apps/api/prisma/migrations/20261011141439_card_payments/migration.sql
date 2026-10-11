-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'CARD_PAYMENT';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "cardId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_cardId_createdAt_idx" ON "Transaction"("cardId", "createdAt");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - Added the required column `method` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'IN_PERSON');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "confirmed_at" TIMESTAMP(3),
ADD COLUMN     "confirmed_by_id" TEXT,
ADD COLUMN     "method" "PaymentMethod" NOT NULL,
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "target_plan" "SubscriptionPlan";

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_confirmed_by_id_fkey" FOREIGN KEY ("confirmed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

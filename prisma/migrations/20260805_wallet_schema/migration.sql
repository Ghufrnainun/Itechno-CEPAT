-- CreateEnum
CREATE TYPE "TransactionSubType" AS ENUM ('topup', 'task_earning', 'task_payment', 'refund', 'hold');

-- AlterTable
ALTER TABLE "Transactions" ADD COLUMN     "sub_type" "TransactionSubType" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "held_balance" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

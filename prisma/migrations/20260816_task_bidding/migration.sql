-- Bidding System (Fase 1 — feat/bidding)
-- Task bidding: worker melamar dengan harga penawaran; kompensasi = budget_max (plafon escrow).

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "is_bidding" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Task" ADD COLUMN     "budget_min" DOUBLE PRECISION;
ALTER TABLE "Task" ADD COLUMN     "budget_max" DOUBLE PRECISION;
ALTER TABLE "Task" ADD COLUMN     "held_slots_json" TEXT;

-- AlterTable
ALTER TABLE "TaskApplicants" ADD COLUMN     "bid_amount" DOUBLE PRECISION;

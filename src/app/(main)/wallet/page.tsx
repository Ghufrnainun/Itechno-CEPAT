"use client";

import React, { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useWallet, type TransactionSubType } from "@/hooks/useWallet";

// ─── UI Helpers ──────────────────────────────────────────────────────────────

function getBadgeStyle(subType: TransactionSubType): string {
  switch (subType) {
    case "topup":
    case "task_earning":
    case "refund":
      return "bg-secondary-container/20 text-secondary border border-secondary/20";
    case "hold":
    case "task_payment":
      return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
    default:
      return "bg-surface-container text-on-surface-variant";
  }
}

function getSubTypeLabel(subType: TransactionSubType): string {
  switch (subType) {
    case "topup":
      return "Top Up";
    case "task_earning":
      return "Pendapatan";
    case "task_payment":
      return "Pembayaran";
    case "refund":
      return "Refund";
    case "hold":
      return "Hold Escrow";
    default:
      return subType;
  }
}

// ─── Skeleton Component ──────────────────────────────────────────────────────

function WalletSkeleton() {
  return (
    <div className="flex flex-col h-full bg-layout-bg font-sans animate-pulse">
      <header className="page-header">
        <div>
          <div className="h-6 w-40 bg-surface-container rounded" />
          <div className="h-4 w-64 bg-surface-container rounded mt-2" />
        </div>
        <div className="h-9 w-24 bg-surface-container rounded" />
      </header>
      <div className="max-w-4xl mx-auto w-full p-lg md:p-xl flex flex-col gap-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div className="bento-card h-24" />
          <div className="bento-card h-24" />
        </div>
        <div className="flex flex-col gap-sm">
          <div className="h-5 w-36 bg-surface-container rounded" />
          <div className="bg-white border border-outline-variant rounded-xl h-48" />
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const { showToast } = useToast();
  const { balance, transactions, isLoading, isTopUpLoading, error, topUp } =
    useWallet();

  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");

  // ── Loading state ────────────────────────────────────────────────────────

  if (isLoading) return <WalletSkeleton />;

  // ── Error state ──────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col h-full bg-layout-bg font-sans">
        <header className="page-header">
          <div>
            <h1 className="font-headline-md text-headline-md text-on-surface">
              Dompet Poin
            </h1>
          </div>
        </header>
        <div className="max-w-4xl mx-auto w-full p-lg md:p-xl">
          <div className="bento-card flex flex-col items-center gap-md py-xl text-center">
            <span className="material-symbols-outlined text-[40px] text-error">
              error
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {error}
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Top Up Handler ───────────────────────────────────────────────────────

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseInt(topUpAmount, 10);
    if (isNaN(amountVal) || amountVal <= 0) {
      showToast("Masukkan nominal top up yang valid!");
      return;
    }

    const errorMsg = await topUp(amountVal);
    if (errorMsg) {
      showToast(errorMsg);
      return;
    }

    setIsTopUpOpen(false);
    setTopUpAmount("");
    showToast(
      `Berhasil melakukan top up sebesar ${amountVal.toLocaleString("id-ID")} pts!`
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const availableBalance = balance?.balance ?? 0;
  const heldBalance = balance?.held_balance ?? 0;

  return (
    <div className="flex flex-col h-full bg-layout-bg font-sans">
      {/* Page Header */}
      <header className="page-header">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface">
            Dompet Poin
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Lacak transaksi keluar-masuk poin untuk pengerjaan tugas mikro.
          </p>
        </div>
        <Button onClick={() => setIsTopUpOpen(true)} variant="primary">
          <span className="material-symbols-outlined text-[18px]">
            add_circle
          </span>{" "}
          Top Up
        </Button>
      </header>

      <div className="max-w-4xl mx-auto w-full p-lg md:p-xl flex flex-col gap-lg">
        {/* Balance Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          {/* Saldo Tersedia */}
          <div className="bento-card">
            <div className="flex items-center justify-between mb-sm text-on-surface-variant">
              <span className="font-label-sm text-label-sm font-medium">
                Saldo Tersedia
              </span>
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                account_balance_wallet
              </span>
            </div>
            <div>
              <div
                className="font-headline-md text-headline-md font-bold text-secondary tracking-tight"
                style={{ fontFamily: "'JetBrains Mono'" }}
              >
                {formatCurrency(availableBalance)}
              </div>
              <div className="font-label-sm text-[10px] text-primary mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">
                  trending_up
                </span>{" "}
                Saldo aktif
              </div>
            </div>
          </div>

          {/* Saldo Ditahan (Escrow) */}
          <div className="bento-card">
            <div className="flex items-center justify-between mb-sm text-on-surface-variant">
              <span className="font-label-sm text-label-sm font-medium">
                Saldo Ditahan (Escrow)
              </span>
              <span className="material-symbols-outlined text-[18px]">
                lock_clock
              </span>
            </div>
            <div>
              <div
                className="font-headline-md text-headline-md font-bold text-amber-600 tracking-tight"
                style={{ fontFamily: "'JetBrains Mono'" }}
              >
                {formatCurrency(heldBalance)}
              </div>
              <div className="font-label-sm text-[10px] text-amber-600 mt-1 flex items-center gap-1 bg-amber-50 w-fit px-1.5 py-0.5 rounded border border-amber-200">
                Dalam escrow
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="flex flex-col gap-sm">
          <h3 className="font-body-md text-body-md font-semibold text-on-surface">
            Histori Transaksi
          </h3>

          {transactions.length === 0 ? (
            <div className="bento-card flex flex-col items-center gap-sm py-xl text-center">
              <span className="material-symbols-outlined text-[36px] text-on-surface-variant">
                receipt_long
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Belum ada transaksi.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low font-label-sm text-label-sm text-on-surface-variant">
                    <th className="px-md py-sm">Transaksi</th>
                    <th className="px-md py-sm">Tipe</th>
                    <th className="px-md py-sm">Nominal</th>
                    <th className="px-md py-sm">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-outline-variant/60 last:border-0 hover:bg-surface-container-low/30 transition-colors"
                    >
                      <td className="px-md py-md font-body-sm text-body-sm font-medium text-on-surface">
                        {tx.description || getSubTypeLabel(tx.sub_type)}
                      </td>
                      <td className="px-md py-md">
                        <span
                          className={`inline-block px-sm py-[2px] rounded-full font-label-sm text-[10px] font-bold uppercase tracking-wide ${getBadgeStyle(tx.sub_type)}`}
                        >
                          {getSubTypeLabel(tx.sub_type)}
                        </span>
                      </td>
                      <td
                        className={`px-md py-md font-label-sm text-label-sm font-bold font-mono ${
                          tx.amount > 0 ? "text-secondary" : "text-amber-600"
                        }`}
                      >
                        {tx.amount > 0 ? "+" : ""}
                        {tx.amount.toLocaleString("id-ID")} pts
                      </td>
                      <td className="px-md py-md font-label-sm text-[11px] text-on-surface-variant font-mono">
                        {formatDate(tx.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Up Modal */}
        <Modal
          isOpen={isTopUpOpen}
          onClose={() => {
            setIsTopUpOpen(false);
            setTopUpAmount("");
          }}
          title="Simulasi Top Up Poin"
        >
          <form onSubmit={handleTopUpSubmit} className="flex flex-col gap-md">
            <Input
              label="Nominal Top Up (Poin)"
              type="number"
              placeholder="Masukkan nominal, contoh: 50000"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              required
              min="1000"
            />
            <p className="font-body-sm text-body-sm text-on-surface-variant italic">
              *Ini adalah simulasi pengisian saldo untuk keperluan demo
              aplikasi ITechno Cup 2026.
            </p>
            <div className="flex justify-end gap-sm border-t border-outline-variant/30 pt-md mt-sm">
              <button
                type="button"
                onClick={() => {
                  setIsTopUpOpen(false);
                  setTopUpAmount("");
                }}
                className="font-label-md text-label-md font-bold px-md py-sm rounded border border-outline-variant/60 hover:bg-surface-container cursor-pointer transition-colors"
              >
                Batal
              </button>
              <Button type="submit" disabled={isTopUpLoading}>
                {isTopUpLoading ? "Memproses..." : "Konfirmasi Top Up"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}

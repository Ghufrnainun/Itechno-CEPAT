"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useWallet, type TransactionSubType } from "@/hooks/useWallet";

// ─── Constants ───────────────────────────────────────────────────────────────

const PRESET_AMOUNTS = [
  { label: "10rb", value: 10_000 },
  { label: "25rb", value: 25_000 },
  { label: "50rb", value: 50_000 },
  { label: "100rb", value: 100_000 },
  { label: "250rb", value: 250_000 },
  { label: "500rb", value: 500_000 },
];

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

function WalletPageInner() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const {
    balance,
    transactions,
    isLoading,
    isTopUpLoading,
    isPaymentLoading,
    error,
    topUp,
    createPayment,
    checkPaymentStatus,
    refresh,
  } = useWallet();

  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpMode, setTopUpMode] = useState<"midtrans" | "simulasi">("midtrans");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  // ── Handle Midtrans callback from redirect ─────────────────────────────

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "finish") {
      showToast("Pembayaran sedang diproses. Saldo akan diperbarui.");
      refresh();
    } else if (paymentStatus === "error") {
      showToast("Pembayaran gagal. Silakan coba lagi.");
    } else if (paymentStatus === "pending") {
      showToast("Pembayaran pending. Selesaikan pembayaran untuk menambah saldo.");
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Preset amount click ────────────────────────────────────────────────

  const handlePresetClick = (value: number) => {
    setSelectedPreset(value);
    setTopUpAmount(String(value));
  };

  // ── Top Up Handler (Simulasi) ───────────────────────────────────────────

  const handleSimulasiTopUp = async (e: React.FormEvent) => {
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
    setSelectedPreset(null);
    showToast(
      `Berhasil top up ${amountVal.toLocaleString("id-ID")} pts! (Simulasi)`
    );
  };

  // ── Top Up Handler (Midtrans) ───────────────────────────────────────────

  const handleMidtransTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseInt(topUpAmount, 10);
    if (isNaN(amountVal) || amountVal < 1000) {
      showToast("Nominal minimal Rp1.000!");
      return;
    }

    setIsTopUpOpen(false);

    const errorMsg = await createPayment(amountVal, {
      onSuccess: () => {
        showToast(`Pembayaran berhasil! Saldo bertambah ${amountVal.toLocaleString("id-ID")} pts.`);
        setTopUpAmount("");
        setSelectedPreset(null);
      },
      onPending: () => {
        showToast("Pembayaran pending. Selesaikan pembayaran untuk menambah saldo.");
      },
      onError: () => {
        showToast("Pembayaran gagal. Silakan coba lagi.");
      },
      onClose: () => {
        showToast("Pembayaran dibatalkan.");
      },
    });

    if (errorMsg) {
      showToast(errorMsg);
      setIsTopUpOpen(true);
    }
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
        <div className="flex items-center gap-sm">
          <button
            onClick={() => refresh()}
            className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container transition-colors cursor-pointer text-on-surface-variant"
            title="Refresh Saldo"
          >
            <span className="material-symbols-outlined text-[20px] block">refresh</span>
          </button>
          <Button onClick={() => setIsTopUpOpen(true)} variant="primary">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add_circle</span> Top Up
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full p-lg md:p-xl flex flex-col gap-lg">
        {/* Balance Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          {/* Saldo Tersedia */}
          <div className="bento-card">
            <div className="flex items-center justify-between mb-sm text-on-surface-variant">
              <span className="font-label-sm text-label-sm font-medium">Saldo Tersedia</span>
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">account_balance_wallet</span>
            </div>
            <div>
              <div
                className="font-headline-md text-headline-md font-bold text-secondary tracking-tight"
                style={{ fontFamily: "'JetBrains Mono'" }}
              >
                {formatCurrency(availableBalance)}
              </div>
              <div className="font-label-sm text-[10px] text-primary mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]" aria-hidden="true">trending_up</span> Saldo aktif
              </div>
            </div>
          </div>

          {/* Saldo Ditahan (Escrow) */}
          <div className="bento-card">
            <div className="flex items-center justify-between mb-sm text-on-surface-variant">
              <span className="font-label-sm text-label-sm font-medium">Saldo Ditahan (Escrow)</span>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">lock_clock</span>
            </div>
            <div>
              <div
                className="font-headline-md text-headline-md font-bold text-amber-600 tracking-tight"
                style={{ fontFamily: "'JetBrains Mono'" }}
              >
                {formatCurrency(heldBalance)}
              </div>
              <div className="font-label-sm text-[10px] text-amber-700 mt-1 flex items-center gap-1 bg-amber-50 w-fit px-1.5 py-0.5 rounded border border-amber-200" title="Saldo dikunci saat kamu memposting tugas dan dirilis ke worker saat tugas selesai">
                <span className="material-symbols-outlined text-[12px]">info</span>
                Dikunci untuk tugas aktif
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
            <div className="bg-white border border-outline-variant rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full min-w-[500px] text-left border-collapse">
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
            setSelectedPreset(null);
          }}
          title="Top Up Saldo"
        >
          <form
            onSubmit={topUpMode === "midtrans" ? handleMidtransTopUp : handleSimulasiTopUp}
            className="flex flex-col gap-md"
          >
            {/* Mode Tabs */}
            <div className="flex gap-1 p-1 bg-surface-container rounded-lg">
              <button
                type="button"
                onClick={() => setTopUpMode("midtrans")}
                className={`flex-1 py-2 px-3 rounded-md font-label-sm text-label-sm font-bold transition-all cursor-pointer ${
                  topUpMode === "midtrans"
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-[14px] align-middle mr-1">credit_card</span>
                Midtrans
              </button>
              <button
                type="button"
                onClick={() => setTopUpMode("simulasi")}
                className={`flex-1 py-2 px-3 rounded-md font-label-sm text-label-sm font-bold transition-all cursor-pointer ${
                  topUpMode === "simulasi"
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-[14px] align-middle mr-1">bolt</span>
                Simulasi
              </button>
            </div>

            {/* Preset Amounts */}
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-2">
                Pilih nominal:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handlePresetClick(preset.value)}
                    className={`py-2.5 px-3 rounded-lg font-label-md text-label-md font-bold transition-all border cursor-pointer ${
                      selectedPreset === preset.value
                        ? "bg-primary/10 text-primary border-primary ring-1 ring-primary/30"
                        : "bg-surface-container-low text-on-surface border-outline-variant/40 hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <Input
              label="Atau masukkan nominal lain"
              type="number"
              placeholder="Contoh: 75000"
              value={topUpAmount}
              onChange={(e) => {
                setTopUpAmount(e.target.value);
                setSelectedPreset(null);
              }}
              required
              min={topUpMode === "midtrans" ? "1000" : "1"}
            />

            {/* Info Text */}
            <p className="font-body-sm text-body-sm text-on-surface-variant italic">
              {topUpMode === "midtrans" ? (
                <>
                  *Pembayaran akan diproses melalui <strong>Midtrans Sandbox</strong>. Gunakan test card untuk simulasi.
                </>
              ) : (
                <>
                  *Ini adalah simulasi pengisian saldo untuk keperluan demo
                  aplikasi ITechno Cup 2026.
                </>
              )}
            </p>

            {/* Actions */}
            <div className="flex justify-end gap-sm border-t border-outline-variant/30 pt-md mt-sm">
              <button
                type="button"
                onClick={() => {
                  setIsTopUpOpen(false);
                  setTopUpAmount("");
                  setSelectedPreset(null);
                }}
                className="font-label-md text-label-md font-bold px-md py-sm rounded border border-outline-variant/60 hover:bg-surface-container cursor-pointer transition-colors"
              >
                Batal
              </button>
              <Button
                type="submit"
                disabled={isTopUpLoading || isPaymentLoading}
              >
                {isTopUpLoading || isPaymentLoading ? (
                  "Memproses..."
                ) : topUpMode === "midtrans" ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] align-middle mr-1">payment</span>
                    Bayar via Midtrans
                  </>
                ) : (
                  "Konfirmasi Top Up"
                )}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}

// ─── Suspense Wrapper (required for useSearchParams) ─────────────────────────

export default function WalletPage() {
  return (
    <Suspense fallback={<WalletSkeleton />}>
      <WalletPageInner />
    </Suspense>
  );
}

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { useWallet, type TransactionSubType } from "@/hooks/useWallet";
import {
  Wallet,
  Lock,
  RefreshCw,
  PlusCircle,
  TrendingUp,
  Info,
  Receipt,
  CreditCard,
  Zap,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
      return "bg-secondary-container/50 text-secondary border border-secondary/25";
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
    <div className="flex flex-col h-full bg-surface font-sans animate-pulse">
      <header className="page-header bg-surface-container-lowest border-b border-card-border px-6 py-5">
        <div>
          <div className="h-6 w-40 bg-surface-container-low rounded-lg" />
          <div className="h-4 w-64 bg-surface-container-low rounded mt-2" />
        </div>
      </header>
      <div className="max-w-4xl mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest border border-card-border rounded-xl h-32" />
          <div className="bg-surface-container-lowest border border-card-border rounded-xl h-32" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="h-5 w-36 bg-surface-container-low rounded" />
          <div className="bg-surface-container-lowest border border-card-border rounded-xl h-48" />
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
    refresh,
  } = useWallet();

  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpMode, setTopUpMode] = useState<"midtrans" | "simulasi">("midtrans");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

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

  if (isLoading) return <WalletSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col h-full bg-surface font-sans">
        <header className="page-header bg-surface-container-lowest border-b border-card-border px-6 py-5">
          <div>
            <h1 className="font-headline text-2xl text-on-surface font-extrabold tracking-tight">
              Dompet Poin
            </h1>
          </div>
        </header>
        <div className="max-w-4xl mx-auto w-full p-4 md:p-6 lg:p-8">
          <div className="bg-surface-container-lowest border border-card-border rounded-xl flex flex-col items-center gap-3 p-8 text-center shadow-xs">
            <AlertCircle className="w-10 h-10 text-error" />
            <p className="font-body-md text-sm text-on-surface-variant">
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

  const handlePresetClick = (value: number) => {
    setSelectedPreset(value);
    setTopUpAmount(String(value));
  };

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

  const availableBalance = balance?.balance ?? 0;
  const heldBalance = balance?.held_balance ?? 0;

  return (
    <div className="flex flex-col h-full bg-surface font-sans">
      {/* Page Header */}
      <header className="page-header bg-surface-container-lowest border-b border-card-border px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl text-on-surface font-extrabold tracking-tight">
            Dompet Poin
          </h1>
          <p className="font-body-sm text-sm text-on-surface-variant font-medium mt-0.5">
            Lacak transaksi keluar-masuk poin untuk pengerjaan tugas mikro.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refresh()}
            className="w-10 h-10 rounded-lg border border-card-border hover:bg-surface-container flex items-center justify-center transition-colors duration-150 cursor-pointer text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            title="Refresh Saldo"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button onClick={() => setIsTopUpOpen(true)} variant="primary" icon={<PlusCircle className="w-4 h-4" />}>
            Top Up
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Saldo Tersedia */}
          <div className="rounded-xl bg-surface-container-lowest border border-card-border p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 text-on-surface-variant">
              <span className="font-sans text-xs font-semibold">Saldo Tersedia</span>
              <div className="p-2 rounded-lg bg-secondary-container/40 text-secondary">
                <Wallet className="w-4.5 h-4.5" />
              </div>
            </div>
            <div>
              <div className="font-mono text-3xl font-extrabold text-secondary tracking-tight tabular-nums">
                {formatCurrency(availableBalance)}
              </div>
              <div className="font-sans text-xs text-primary mt-1.5 flex items-center gap-1 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" /> Saldo aktif siap pakai
              </div>
            </div>
          </div>

          {/* Saldo Ditahan (Escrow) */}
          <div className="rounded-xl bg-surface-container-lowest border border-card-border p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 text-on-surface-variant">
              <span className="font-sans text-xs font-semibold">Saldo Ditahan (Escrow)</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                <Lock className="w-4.5 h-4.5" />
              </div>
            </div>
            <div>
              <div className="font-mono text-3xl font-extrabold text-amber-600 tracking-tight tabular-nums">
                {formatCurrency(heldBalance)}
              </div>
              <div className="font-sans text-[11px] text-amber-700 mt-1.5 flex items-center gap-1 bg-amber-500/10 w-fit px-2 py-0.5 rounded-md border border-amber-500/20" title="Saldo dikunci saat memposting tugas dan dirilis ke worker saat tugas selesai">
                <Info className="w-3 h-3 shrink-0" />
                Dikunci untuk tugas aktif
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-headline text-base font-bold text-on-surface">
              Histori Transaksi
            </h3>
            {transactions.length > 0 && (
              <div className="overflow-x-auto pb-1 no-scrollbar">
                <Tabs
                  value={filterType}
                  onValueChange={setFilterType}
                  variant="segment"
                >
                  <TabsList className="w-fit">
                    <TabsTrigger value="all">Semua ({transactions.length})</TabsTrigger>
                    <TabsTrigger value="topup">Top Up</TabsTrigger>
                    <TabsTrigger value="earning">Pendapatan</TabsTrigger>
                    <TabsTrigger value="payment">Pembayaran</TabsTrigger>
                    <TabsTrigger value="escrow">Escrow</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}
          </div>

          {(() => {
            const filteredTransactions = transactions.filter((t) => {
              if (filterType === "all") return true;
              if (filterType === "topup") return t.sub_type === "topup";
              if (filterType === "earning") return t.sub_type === "task_earning";
              if (filterType === "payment") return t.sub_type === "task_payment";
              if (filterType === "escrow") return t.sub_type === "hold" || t.sub_type === "refund";
              return true;
            });

            if (transactions.length === 0) {
              return (
                <div className="rounded-xl bg-surface-container-lowest border border-card-border flex flex-col items-center gap-2.5 py-12 text-center shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <p className="font-headline text-sm font-bold text-on-surface">
                    Belum ada transaksi
                  </p>
                  <p className="font-body-sm text-xs text-on-surface-variant">
                    Riwayat transaksi masuk dan keluar Anda akan tercatat di sini.
                  </p>
                </div>
              );
            }

            if (filteredTransactions.length === 0) {
              return (
                <div className="rounded-xl bg-surface-container-lowest border border-card-border flex flex-col items-center gap-2 py-8 text-center shadow-xs">
                  <p className="font-headline text-xs font-bold text-on-surface">
                    Tidak ada transaksi untuk filter ini
                  </p>
                  <p className="font-body-sm text-[11px] text-on-surface-variant">
                    Pilih tab lain untuk melihat riwayat mutasi saldo.
                  </p>
                </div>
              );
            }

            return (
              <div className="bg-surface-container-lowest border border-card-border rounded-xl overflow-x-auto shadow-xs">
                <table className="w-full min-w-[500px] text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="border-b border-card-border bg-surface-container-low font-bold text-on-surface-variant">
                      <th className="px-4 py-3">Transaksi</th>
                      <th className="px-4 py-3">Tipe</th>
                      <th className="px-4 py-3">Nominal</th>
                      <th className="px-4 py-3">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border/60">
                    {filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-surface-container-low/50 transition-colors duration-150"
                      >
                        <td className="px-4 py-3 font-medium text-on-surface">
                          {tx.description || getSubTypeLabel(tx.sub_type)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono",
                              getBadgeStyle(tx.sub_type)
                            )}
                          >
                            {getSubTypeLabel(tx.sub_type)}
                          </span>
                        </td>
                        <td
                          className={cn(
                            "px-4 py-3 font-mono font-bold tabular-nums",
                            tx.amount > 0 ? "text-secondary" : "text-amber-600"
                          )}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount.toLocaleString("id-ID")} pts
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant font-mono text-[11px] tabular-nums">
                          {formatDate(tx.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
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
            className="flex flex-col gap-4 font-sans text-xs"
          >
            {/* Mode Tabs */}
            <div className="flex gap-1 p-1 bg-surface-container-low border border-card-border rounded-lg">
              <button
                type="button"
                onClick={() => setTopUpMode("midtrans")}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-md font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5",
                  topUpMode === "midtrans"
                    ? "bg-surface-container-lowest text-on-surface shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Midtrans
              </button>
              <button
                type="button"
                onClick={() => setTopUpMode("simulasi")}
                className={cn(
                  "flex-1 py-1.5 px-3 rounded-md font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5",
                  topUpMode === "simulasi"
                    ? "bg-surface-container-lowest text-on-surface shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                <Zap className="w-3.5 h-3.5" />
                Simulasi
              </button>
            </div>

            {/* Preset Amounts */}
            <div>
              <p className="font-semibold text-on-surface-variant mb-2">
                Pilih nominal instan:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handlePresetClick(preset.value)}
                    className={cn(
                      "py-2.5 px-3 rounded-xl font-mono font-bold transition-colors duration-150 border cursor-pointer tabular-nums text-xs min-h-[44px] flex items-center justify-center",
                      selectedPreset === preset.value
                        ? "bg-primary/10 text-primary border-primary ring-1 ring-primary/25"
                        : "bg-surface-container-low text-on-surface border-card-border hover:border-primary/40 hover:bg-surface-container"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <Input
              label="Atau masukkan nominal kustom"
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
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              {topUpMode === "midtrans" ? (
                <>
                  *Pembayaran diproses via <strong>Midtrans Sandbox</strong>. Gunakan test card untuk simulasi pembayaran.
                </>
              ) : (
                <>
                  *Simulasi pengisian saldo instan untuk keperluan demo aplikasi ITechno Cup 2026.
                </>
              )}
            </p>

            {/* Actions */}
            <div className="flex justify-end gap-2 border-t border-card-border pt-3 mt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsTopUpOpen(false);
                  setTopUpAmount("");
                  setSelectedPreset(null);
                }}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isTopUpLoading || isPaymentLoading}
              >
                {isTopUpLoading || isPaymentLoading ? (
                  "Memproses..."
                ) : topUpMode === "midtrans" ? (
                  "Bayar via Midtrans"
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

// ─── Suspense Wrapper ─────────────────────────────────────────────────────────

export default function WalletPage() {
  return (
    <Suspense fallback={<WalletSkeleton />}>
      <WalletPageInner />
    </Suspense>
  );
}

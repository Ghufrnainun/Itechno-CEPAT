"use client";

import React, { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

interface TransactionRow {
  id: string;
  type: "hold" | "release" | "refund" | "topup";
  description: string;
  amount: number;
  date: string;
}

export default function WalletPage() {
  const { showToast } = useToast();
  const [balance, setBalance] = useState(250000);
  const [held, setHeld] = useState(100000);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");

  const [transactions, setTransactions] = useState<TransactionRow[]>([
    {
      id: "tx-1",
      type: "release",
      description: "Penyelesaian Tugas: Foto Katalog 15 Menu Makanan",
      amount: 75000,
      date: new Date(Date.now() - 600000).toISOString(),
    },
    {
      id: "tx-2",
      type: "hold",
      description: "Dana Ditahan: Desain Spanduk Ulang Tahun Toko",
      amount: -100000,
      date: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "tx-3",
      type: "topup",
      description: "Top Up Saldo Mandiri",
      amount: 200000,
      date: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "tx-4",
      type: "refund",
      description: "Refund Pembatalan Tugas: Input Data Excel",
      amount: 50000,
      date: new Date(Date.now() - 172800000).toISOString(),
    },
  ]);

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseInt(topUpAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      showToast("Masukkan nominal top up yang valid!");
      return;
    }

    setBalance(balance + amountVal);
    
    const newTx: TransactionRow = {
      id: "tx-new-" + Date.now(),
      type: "topup",
      description: "Top Up Saldo Mandiri (Simulasi)",
      amount: amountVal,
      date: new Date().toISOString(),
    };
    
    setTransactions([newTx, ...transactions]);
    setIsTopUpOpen(false);
    setTopUpAmount("");
    showToast(`Berhasil melakukan top up sebesar ${amountVal.toLocaleString()} pts!`);
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case "topup":
      case "release":
      case "refund":
        return "bg-secondary-container/20 text-secondary border border-secondary/20";
      case "hold":
        return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
      default:
        return "bg-surface-container text-on-surface-variant";
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case "topup":
        return "Top Up";
      case "release":
        return "Pendapatan";
      case "refund":
        return "Refund";
      case "hold":
        return "Hold Escrow";
      default:
        return type;
    }
  };

  return (
    <div className="flex flex-col h-full bg-layout-bg font-sans">
      {/* Page Header */}
      <header className="page-header">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface">Dompet Poin</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Lacak transaksi keluar-masuk poin untuk pengerjaan tugas mikro.
          </p>
        </div>
        <Button onClick={() => setIsTopUpOpen(true)} variant="primary">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add_circle</span> Top Up
        </Button>
      </header>

      <div className="max-w-4xl mx-auto w-full p-lg md:p-xl flex flex-col gap-lg">

      {/* Balance Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
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
                {formatCurrency(balance)}
              </div>
              <div className="font-label-sm text-[10px] text-primary mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]" aria-hidden="true">trending_up</span> Saldo aktif
              </div>
            </div>
          </div>

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
                {formatCurrency(held)}
              </div>
              <div className="font-label-sm text-[10px] text-amber-600 mt-1 flex items-center gap-1 bg-amber-50 w-fit px-1.5 py-0.5 rounded border border-amber-200">
                Dalam escrow
              </div>
            </div>
          </div>
        </div>

      {/* Transaction History */}
      <div className="flex flex-col gap-sm">
        <h3 className="font-body-md text-body-md font-semibold text-on-surface">Histori Transaksi</h3>

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
                <tr key={tx.id} className="border-b border-outline-variant/60 last:border-0 hover:bg-surface-container-low/30 transition-colors">
                  <td className="px-md py-md font-body-sm text-body-sm font-medium text-on-surface">
                    {tx.description}
                  </td>
                  <td className="px-md py-md">
                    <span className={`inline-block px-sm py-[2px] rounded-full font-label-sm text-[10px] font-bold uppercase tracking-wide ${getBadgeStyle(tx.type)}`}>
                      {getLabel(tx.type)}
                    </span>
                  </td>
                  <td
                    className={`px-md py-md font-label-sm text-label-sm font-bold font-mono ${tx.amount > 0 ? "text-secondary" : "text-amber-600"}`}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount.toLocaleString()} pts
                  </td>
                  <td className="px-md py-md font-label-sm text-[11px] text-on-surface-variant font-mono">
                    {formatDate(tx.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Up Modal */}
      <Modal isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} title="Simulasi Top Up Poin">
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
            *Ini adalah simulasi pengisian saldo untuk keperluan demo aplikasi ITechno Cup 2026.
          </p>
          <div className="flex justify-end gap-sm border-t border-outline-variant/30 pt-md mt-sm">
            <button
              type="button"
              onClick={() => setIsTopUpOpen(false)}
              className="font-label-md text-label-md font-bold px-md py-sm rounded border border-outline-variant/60 hover:bg-surface-container cursor-pointer transition-colors"
            >
              Batal
            </button>
            <Button type="submit">Konfirmasi Top Up</Button>
          </div>
        </form>
      </Modal>
      </div>
    </div>
  );
}

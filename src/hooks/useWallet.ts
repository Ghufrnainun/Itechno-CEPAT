"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types (mirroring wallet.service.ts untuk client-side) ──────────────────

export type TransactionSubType =
  | "topup"
  | "task_earning"
  | "task_payment"
  | "refund"
  | "hold";

export interface WalletBalance {
  balance: number;       // saldo yang bisa dipakai (total - held)
  held_balance: number;  // escrow aktif
  total_balance: number;
}

export interface TransactionItem {
  id: string;
  type: "MASUK" | "KELUAR";
  sub_type: TransactionSubType;
  description: string | null;
  amount: number; // positif = masuk, negatif = keluar
  createdAt: string;
}

export interface WalletPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useWallet() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [pagination, setPagination] = useState<WalletPagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch balance ────────────────────────────────────────────────────────

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/points/balance");
      if (!res.ok) {
        if (res.status === 401) return; // Belum login, silent
        throw new Error("Gagal mengambil saldo.");
      }
      const data = await res.json();
      if (data.success) setBalance(data.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengambil saldo.";
      setError(msg);
    }
  }, []);

  // ── Fetch history ────────────────────────────────────────────────────────

  const fetchHistory = useCallback(async (page = 1, limit = 20) => {
    try {
      const res = await fetch(`/api/points/history?page=${page}&limit=${limit}`);
      if (!res.ok) {
        if (res.status === 401) return;
        throw new Error("Gagal mengambil histori transaksi.");
      }
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions ?? []);
        setPagination(data.pagination ?? null);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Gagal mengambil histori.";
      setError(msg);
    }
  }, []);

  // ── Initial load ─────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      setError(null);
      await Promise.all([fetchBalance(), fetchHistory()]);
      setIsLoading(false);
    };
    init();
  }, [fetchBalance, fetchHistory]);

  // ── Top Up ───────────────────────────────────────────────────────────────

  /**
   * Kirim request top-up ke server.
   * @returns error message string jika gagal, undefined jika sukses.
   */
  const topUp = useCallback(
    async (amount: number): Promise<string | undefined> => {
      if (amount <= 0) return "Nominal top-up harus lebih dari 0.";

      setIsTopUpLoading(true);
      try {
        const res = await fetch("/api/points/topup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          return data.message || "Gagal melakukan top-up.";
        }

        // Update balance optimistically dari response (no extra round-trip)
        if (data.data) setBalance(data.data);

        // Refresh history to show the new transaction
        await fetchHistory();
        return undefined;
      } catch {
        return "Terjadi kesalahan. Silakan coba lagi.";
      } finally {
        setIsTopUpLoading(false);
      }
    },
    [fetchHistory]
  );

  // ── Refresh all ──────────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    setError(null);
    await Promise.all([fetchBalance(), fetchHistory()]);
  }, [fetchBalance, fetchHistory]);

  return {
    balance,
    transactions,
    pagination,
    isLoading,
    isTopUpLoading,
    error,
    topUp,
    refresh,
  };
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { triggerHaptic } from "@/lib/utils/haptics";

// Module-level in-memory SWR cache for instant navigation
let cachedBalance: WalletBalance | null = null;
let cachedTransactions: TransactionItem[] = [];
let cachedPagination: WalletPagination | null = null;
let hasLoadedWalletOnce = false;

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

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED";

export interface PendingPayment {
  order_id: string;
  amount: number;
  status: PaymentStatus;
  snap_token: string | null;
  created_at: string;
}

// ─── Snap.js Global Type ─────────────────────────────────────────────────────

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: Record<string, unknown>) => void;
          onPending?: (result: Record<string, unknown>) => void;
          onError?: (result: Record<string, unknown>) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useWallet() {
  const [balance, setBalance] = useState<WalletBalance | null>(cachedBalance);
  const [transactions, setTransactions] = useState<TransactionItem[]>(cachedTransactions);
  const [pagination, setPagination] = useState<WalletPagination | null>(cachedPagination);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [isLoading, setIsLoading] = useState(!hasLoadedWalletOnce);
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch balance ────────────────────────────────────────────────────────

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/points/balance");
      if (!res.ok) {
        if (res.status === 401) return; // Belum login, silent
        throw new Error("Gagal mengambil saldo.");
      }
      const data = await res.json().catch(() => ({}));
      if (data.success && data.data) {
        cachedBalance = data.data;
        setBalance(data.data);
      }
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
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        cachedTransactions = data.transactions ?? [];
        cachedPagination = data.pagination ?? null;
        setTransactions(cachedTransactions);
        setPagination(cachedPagination);
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
      if (!hasLoadedWalletOnce) {
        setIsLoading(true);
      }
      setError(null);
      await Promise.allSettled([fetchBalance(), fetchHistory()]);
      hasLoadedWalletOnce = true;
      setIsLoading(false);
    };
    init();
  }, [fetchBalance, fetchHistory]);

  // ── Simulasi Top Up (instant — untuk demo cepat) ─────────────────────────

  /**
   * Kirim request top-up simulasi ke server (instant, tanpa Midtrans).
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

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.success) {
          return data.message || "Gagal melakukan top-up.";
        }

        // Update balance optimistically dari response (no extra round-trip)
        if (data.data) {
          cachedBalance = data.data;
          setBalance(data.data);
          triggerHaptic("success");
        }

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

  // ── Manual Payment Status Check ──────────────────────────────────────────

  /**
   * Cek status pembayaran langsung dari Midtrans API (fallback untuk localhost).
   * Melakukan retry hingga 3x (jeda 1s) jika status masih PENDING.
   */
  const checkPaymentStatus = useCallback(
    async (orderId: string, retries = 3): Promise<PaymentStatus | undefined> => {
      for (let i = 0; i < retries; i++) {
        try {
          const res = await fetch(`/api/payment/status/${orderId}`);
          if (res.ok) {
            const data = await res.json().catch(() => ({}));

            if (data.success && data.data) {
              const status = data.data.status as PaymentStatus;
              if (status === "SUCCESS") {
                await fetchBalance();
                await fetchHistory();
                return status;
              }
            }
          }
        } catch (err) {
          console.error("Error checking payment status:", err);
        }
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      await fetchBalance();
      await fetchHistory();
      return undefined;
    },
    [fetchBalance, fetchHistory]
  );

  // ── Midtrans Payment (Snap popup) ────────────────────────────────────────

  /**
   * Buat transaksi Midtrans dan buka Snap popup.
   * @returns error message string jika gagal, undefined jika berhasil dibuka.
   */
  const createPayment = useCallback(
    async (
      amount: number,
      callbacks?: {
        onSuccess?: () => void;
        onPending?: () => void;
        onError?: () => void;
        onClose?: () => void;
      }
    ): Promise<string | undefined> => {
      if (amount < 1000) return "Nominal minimal Rp1.000.";

      setIsPaymentLoading(true);
      try {
        // 1. Create Snap transaction via backend
        const res = await fetch("/api/payment/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.success) {
          return data.message || "Gagal membuat transaksi.";
        }

        const { snap_token, order_id } = data.data;

        // 2. Open Snap popup
        if (!window.snap) {
          // Snap.js belum loaded — fallback redirect
          if (data.data.redirect_url) {
            window.location.href = data.data.redirect_url;
            return undefined;
          }
          return "Snap.js belum dimuat. Refresh halaman dan coba lagi.";
        }

        window.snap.pay(snap_token, {
          onSuccess: async () => {
            await checkPaymentStatus(order_id);
            callbacks?.onSuccess?.();
          },
          onPending: async () => {
            await checkPaymentStatus(order_id);
            callbacks?.onPending?.();
          },
          onError: () => {
            callbacks?.onError?.();
          },
          onClose: async () => {
            await checkPaymentStatus(order_id);
            callbacks?.onClose?.();
          },
        });

        return undefined;
      } catch {
        return "Terjadi kesalahan. Silakan coba lagi.";
      } finally {
        setIsPaymentLoading(false);
      }
    },
    [checkPaymentStatus]
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
    pendingPayments,
    isLoading,
    isTopUpLoading,
    isPaymentLoading,
    error,
    topUp,
    createPayment,
    checkPaymentStatus,
    refresh,
  };
}

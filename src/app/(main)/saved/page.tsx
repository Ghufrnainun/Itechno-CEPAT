"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkX, Loader2, Clock, Users, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { useToast } from "@/components/ui/Toast";

interface SavedTaskItem {
  id_saved: string;
  saved_at: string;
  task: {
    id_task: string;
    id_requester: string;
    title: string;
    description: string;
    compensation: number;
    status: string;
    duration_estimate: string | null;
    created_at: string;
    is_bidding: boolean;
    budget_min: number | null;
    budget_max: number | null;
    scheduled_at: string | null;
    scheduled_end: string | null;
    max_applicants: number | null;
    requester_name?: string;
    requester_avatar?: string | null;
  };
}

export default function SavedTasksPage() {
  const [items, setItems] = useState<SavedTaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/saved-tasks");
        const json = await res.json();
        if (!cancelled && json.success) {
          setItems(json.data);
        }
      } catch (e) {
        console.error("Gagal ambil tugas tersimpan", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRemove = async (item: SavedTaskItem) => {
    setRemovingId(item.id_saved);
    try {
      const res = await fetch("/api/saved-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_tasks: item.task.id_task }),
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) => prev.filter((i) => i.id_saved !== item.id_saved));
        showToast("Tugas dihapus dari tersimpan.");
      } else {
        showToast(json.message || "Gagal menghapus tugas.");
      }
    } catch (e) {
      console.error("Gagal hapus bookmark", e);
      showToast("Gagal menghapus tugas.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 max-w-4xl mx-auto w-full pb-36 md:pb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 text-primary rounded-xl">
          <Bookmark className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-headline font-bold text-xl text-on-surface">Tugas Tersimpan</h1>
          <p className="font-body-sm text-xs text-on-surface-variant">
            {items.length > 0
              ? `${items.length} tugas kamu simpan untuk dikerjakan nanti`
              : "Bookmark tugas yang menarik biar gak lupa"}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center bg-surface-container-lowest border border-card-border rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <BookmarkX className="w-7 h-7" />
          </div>
          <h2 className="font-headline font-bold text-base text-on-surface">Belum ada tugas tersimpan</h2>
          <p className="font-body-sm text-xs text-on-surface-variant max-w-xs">
            Ketuk ikon bookmark di detail tugas buat menyimpannya. Tugas yang kamu simpan bakal muncul di sini.
          </p>
          <Link
            href="/feed"
            className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-lg hover:bg-primary-container transition-colors"
          >
            Cari Tugas
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const t = item.task;
            return (
              <div
                key={item.id_saved}
                className="bg-surface-container-lowest border border-card-border rounded-xl p-4 shadow-xs hover:border-primary/40 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/task/${t.id_task}`} className="flex-1 min-w-0">
                    <h3 className="font-headline font-bold text-sm text-on-surface leading-snug group-hover:text-primary transition-colors line-clamp-1">
                      {t.title}
                    </h3>
                    <p className="font-body-sm text-xs text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>
                  </Link>
                  <button
                    onClick={() => handleRemove(item)}
                    disabled={removingId === item.id_saved}
                    title="Hapus dari Tersimpan"
                    aria-label="Hapus dari Tersimpan"
                    className="shrink-0 p-2 rounded-lg text-on-surface-variant/60 hover:text-error hover:bg-error-container/20 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {removingId === item.id_saved ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <BookmarkX className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-card-border/60">
                  <span className="font-mono text-sm font-extrabold text-primary tabular-nums">
                    {t.is_bidding
                      ? `${formatCurrency(t.budget_min ?? 0)}–${formatCurrency(t.budget_max ?? t.compensation)}`
                      : formatCurrency(t.compensation)}
                  </span>
                  {t.duration_estimate && (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md uppercase font-medium">
                      <Clock className="w-2.5 h-2.5" />
                      {t.duration_estimate}
                    </span>
                  )}
                  {t.max_applicants != null && t.max_applicants > 0 && (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md font-medium">
                      <Users className="w-2.5 h-2.5" />
                      {t.max_applicants} worker
                    </span>
                  )}
                  {t.scheduled_at && (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-md font-medium">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(t.scheduled_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  )}
                  <span className="ml-auto text-[10px] text-on-surface-variant/70 font-mono">
                    Disimpan {new Date(item.saved_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

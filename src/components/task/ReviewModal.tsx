"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { RatingStars } from "@/components/ui/RatingStars";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  revieweeId: string;
  revieweeName: string;
  onSuccess?: () => void;
}

export function ReviewModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  revieweeId,
  revieweeName,
  onSuccess,
}: ReviewModalProps) {
  const { showToast } = useToast();
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      showToast("Pilih rating minimal 1 bintang.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          reviewee_id: revieweeId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal menyimpan ulasan.");
      }

      showToast("Terima kasih! Ulasan Anda berhasil disimpan. ⭐");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Terjadi kesalahan.";
      showToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Beri Rating & Ulasan">
      <form onSubmit={handleSubmit} className="flex flex-col gap-md">
        <div className="bg-surface-container-low p-3 rounded-xl border border-card-border">
          <p className="text-xs text-on-surface-variant font-medium">Tugas:</p>
          <p className="font-headline text-sm text-on-surface font-bold truncate">{taskTitle}</p>
          <p className="text-xs text-on-surface-variant mt-1">
            Memberikan rating untuk: <span className="font-bold text-primary">{revieweeName}</span>
          </p>
        </div>

        {/* Rating Input */}
        <div className="flex flex-col items-center justify-center gap-2 py-2">
          <p className="text-xs text-on-surface font-semibold">Bagaimana kualitas hasil pengerjaannya?</p>
          <RatingStars
            rating={rating}
            interactive={true}
            size="lg"
            onChange={(val) => setRating(val)}
          />
          <span className="font-mono text-xs font-bold text-amber-600 mt-1">
            {rating === 5 ? "Sangat Memuaskan! 🔥" :
             rating === 4 ? "Bagus & Rapi 👍" :
             rating === 3 ? "Cukup Baik 👌" :
             rating === 2 ? "Kurang Memuaskan 😕" :
             "Sangat Buruk 👎"}
          </span>
        </div>

        {/* Comment Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="review-comment" className="text-xs font-bold text-on-surface">
            Ulasan Singkat (Opsional)
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tulis kesan, kecepatan pengerjaan, atau saran..."
            rows={3}
            maxLength={500}
            className="w-full p-3 rounded-xl border border-card-border bg-surface-container-low text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-base sm:text-xs resize-none min-h-[85px]"
          />
          <span className="text-right text-[11px] text-on-surface-variant font-mono">
            {comment.length}/500
          </span>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-card-border">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Kirim Ulasan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

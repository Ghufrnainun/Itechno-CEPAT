"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SKILL_CATEGORIES } from "@/constants/skills";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useToast } from "@/components/ui/Toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EscrowBanner } from "@/components/ui/EscrowBanner";
import MapPickerWrapper from "@/features/task/components/MapPickerWrapper";

export default function NewTaskPage() {
  const router = useRouter();
  const { coords } = useGeolocation();
  const { showToast } = useToast();

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [compensation, setCompensation] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLocationSelect = (selectedLat: number, selectedLng: number) => {
    setLat(selectedLat);
    setLng(selectedLng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lat || !lng) {
      showToast("Pilih titik lokasi tugas pada peta terlebih dahulu!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judul_tugas: title,
          deskripsi_tugas: description,
          kategori: category,
          estimasi_waktu: duration,
          kompensasi: parseFloat(compensation),
          latitude: lat,
          longitude: lng,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.message || "Gagal membuat task. Coba lagi.");
        return;
      }

      showToast("Tugas berhasil diposting! Dana dikunci di Escrow.");
      router.push(`/task/${data.data.id_tasks}`);
    } catch {
      showToast("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-layout-bg font-sans">
      {/* Page Header */}
      <header className="page-header">
        <div className="flex items-center gap-sm">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">Post Tugas Baru</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">Buat tugas baru untuk dikerjakan oleh worker mikro terdekat</p>
          </div>
        </div>
        <div className="flex items-center gap-sm px-md py-sm rounded-lg bg-amber-50 border border-amber-200">
          <span className="material-symbols-outlined text-[16px] text-amber-600" aria-hidden="true">lock</span>
          <span className="font-label-sm text-label-sm text-amber-600 font-medium">Dana dikunci escrow saat tugas diterima</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full p-4 md:p-8 pb-28 md:pb-8 flex flex-col gap-lg overflow-y-auto custom-scrollbar">
        <EscrowBanner />

        <form onSubmit={handleSubmit} className="bg-white border border-outline-variant rounded-xl p-md md:p-lg flex flex-col gap-md shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {/* Form Fields */}
            <div className="flex flex-col gap-md">
              <Input
                label="Judul Tugas"
                type="text"
                placeholder="Contoh: Foto Katalog 15 Menu Makanan"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div className="flex flex-col gap-xs">
                <label className="font-body-sm text-body-sm text-on-surface-variant font-medium">Deskripsi Tugas</label>
                <textarea
                  className="input-field min-h-[100px] font-body-sm custom-scrollbar"
                  placeholder="Jelaskan instruksi kerja, kriteria hasil, dan perlengkapan yang perlu dibawa."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-body-sm text-body-sm text-on-surface-variant font-medium">Kategori Skill</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field text-body-sm font-sans"
                  required
                >
                  <option value="">-- Pilih kategori skill --</option>
                  {SKILL_CATEGORIES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-sm">
                <Input
                  label="Estimasi Durasi"
                  type="text"
                  placeholder="Contoh: 2 jam"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
                <Input
                  label="Kompensasi (Poin)"
                  type="number"
                  placeholder="Contoh: 75000"
                  value={compensation}
                  onChange={(e) => setCompensation(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Location Picker Map */}
            <div className="flex flex-col gap-xs">
              <label className="font-body-sm text-body-sm text-on-surface-variant font-medium flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">location_on</span>
                Titik Lokasi Tugas (Klik pada Peta)
              </label>
              
              <div className="flex-grow h-[260px] md:h-auto min-h-[220px] relative rounded-lg overflow-hidden border border-outline-variant">
                <MapPickerWrapper
                  center={{ latitude: coords.latitude, longitude: coords.longitude }}
                  onLocationSelect={handleLocationSelect}
                />
              </div>

              {lat && lng ? (
                <span className="font-label-sm text-label-sm text-primary font-mono mt-xs flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">location_on</span>
                  Koordinat Terpilih: {lat.toFixed(6)}, {lng.toFixed(6)}
                </span>
              ) : (
                <span className="font-label-sm text-label-sm text-error mt-xs flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">info</span>
                  Silakan klik titik di peta untuk menandai lokasi.
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-outline-variant/50 pt-md flex justify-end gap-sm">
            <button
              type="button"
              onClick={() => router.back()}
              className="font-label-md text-label-md font-bold px-lg py-sm rounded-lg border border-outline-variant/60 hover:bg-surface-container-low cursor-pointer transition-colors"
            >
              Batal
            </button>
            
            <Button type="submit" disabled={loading}>
              {loading ? "Memproses..." : "Posting Tugas Sekarang"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

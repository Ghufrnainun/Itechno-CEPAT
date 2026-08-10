"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useToast } from "@/components/ui/Toast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EscrowBanner } from "@/components/ui/EscrowBanner";
import { formatCurrency } from "@/lib/utils/format";
import MapPickerWrapper from "@/features/task/components/MapPickerWrapper";

export default function NewTaskPage() {
  const router = useRouter();
  const { coords } = useGeolocation();
  const { showToast } = useToast();

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [compensation, setCompensation] = useState("");
  const [maxApplicants, setMaxApplicants] = useState("1");
  const [maxApplyAttempts, setMaxApplyAttempts] = useState("3");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLocation, setSearchLocation] = useState("");
  const [searching, setSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | null>(null);

  const [categories, setCategories] = useState<{ id_category: string; nama_kategori: string }[]>([]);
  const [skills, setSkills] = useState<{ id_skill_master: string; nama_skill: string }[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, skillRes] = await Promise.all([
          fetch("/api/categories").then(r => r.json()),
          fetch("/api/skills").then(r => r.json())
        ]);
        if (catRes.success) setCategories(catRes.data);
        if (skillRes.success) setSkills(skillRes.data);
      } catch (error) {
        console.error("Gagal memuat kategori dan keahlian:", error);
      }
    }
    loadData();
  }, []);

  const toggleSkill = (id: string) => {
    setSelectedSkills(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleLocationSelect = (selectedLat: number, selectedLng: number) => {
    setLat(selectedLat);
    setLng(selectedLng);
  };

  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLocation.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);
        setMapCenter({ latitude: newLat, longitude: newLng });
        setLat(newLat);
        setLng(newLng);
        showToast("Lokasi berhasil ditemukan!");
      } else {
        showToast("Lokasi tidak ditemukan. Coba kata kunci lain.");
      }
    } catch {
      showToast("Gagal mencari lokasi. Periksa koneksi Anda.");
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lat || !lng) {
      showToast("Pilih titik lokasi tugas pada peta terlebih dahulu!");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        judul_tugas: title,
        deskripsi_tugas: description,
        id_category: categoryId || undefined,
        estimasi_waktu: duration.toLowerCase().includes("jam") ? duration : `${parseFloat(duration) || 1} Jam`,
        kompensasi: parseFloat(compensation),
        max_applicants: parseInt(maxApplicants, 10) || 1,
        max_apply_attempts: parseInt(maxApplyAttempts, 10) || 3,
        latitude: lat,
        longitude: lng,
      };

      if (selectedSkills && selectedSkills.length > 0) {
        payload.skill_requirements = selectedSkills;
      }

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
                <label className="font-body-sm text-body-sm text-on-surface-variant font-medium">Kategori</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="input-field text-body-sm font-sans"
                  required
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((c) => (
                    <option key={c.id_category} value={c.id_category}>
                      {c.nama_kategori}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-body-sm text-body-sm text-on-surface-variant font-medium">Skill (Opsional)</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {skills.map((s) => {
                    const isSelected = selectedSkills.includes(s.id_skill_master);
                    return (
                      <button
                        key={s.id_skill_master}
                        type="button"
                        onClick={() => toggleSkill(s.id_skill_master)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-primary text-on-primary border-primary hover:bg-primary/90' 
                            : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container-low hover:border-primary/50'
                        }`}
                      >
                        {s.nama_skill}
                      </button>
                    );
                  })}
                  {skills.length === 0 && (
                    <span className="text-sm text-on-surface-variant italic">Belum ada skill yang tersedia...</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-sm">
                <Input
                  label="Estimasi Durasi (Jam)"
                  type="number"
                  placeholder="Contoh: 2"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min={1}
                  required
                />
                <Input
                  label="Kompensasi per Worker (Poin)"
                  type="number"
                  placeholder="Contoh: 75000"
                  value={compensation}
                  onChange={(e) => setCompensation(e.target.value)}
                  min={1000}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-sm">
                <Input
                  label="Batas Maksimal Pelamar / Worker"
                  type="number"
                  placeholder="Contoh: 3"
                  value={maxApplicants}
                  onChange={(e) => setMaxApplicants(e.target.value)}
                  min={1}
                  required
                />
                <Input
                  label="Batas Percobaan Apply (per Worker)"
                  type="number"
                  placeholder="Contoh: 3"
                  value={maxApplyAttempts}
                  onChange={(e) => setMaxApplyAttempts(e.target.value)}
                  min={1}
                  required
                />
              </div>

              {/* Ringkasan Escrow Real-time */}
              <div className="bg-surface-container-low border border-outline-variant/60 rounded-lg p-sm flex flex-col gap-xs font-label-sm">
                <span className="text-on-surface-variant font-medium">Ringkasan Penguncian Escrow:</span>
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-on-surface-variant font-mono">
                    {parseInt(maxApplicants, 10) || 1} Worker × {formatCurrency(parseFloat(compensation) || 0)}
                  </span>
                  <span className="font-bold text-primary font-mono text-[15px]">
                    Total: {formatCurrency((parseFloat(compensation) || 0) * (parseInt(maxApplicants, 10) || 1))}
                  </span>
                </div>
              </div>
            </div>

            {/* Location Picker Map */}
            <div className="flex flex-col gap-xs">
              <label className="font-body-sm text-body-sm text-on-surface-variant font-medium flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">location_on</span>
                Titik Lokasi Tugas
              </label>
              
              <div className="flex items-center gap-sm mb-xs">
                <div className="flex-grow">
                  <Input 
                    type="text" 
                    placeholder="Cari lokasi spesifik (misal: UGM, Monas)" 
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchLocation(e as any);
                      }
                    }}
                  />
                </div>
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="px-md mt-2 md:mt-0 whitespace-nowrap"
                  onClick={handleSearchLocation}
                  disabled={searching}
                >
                  <span className="material-symbols-outlined text-[18px]">search</span>
                  Cari
                </Button>
              </div>
              
              <div className="font-body-sm text-on-surface-variant mb-xs">
                Atau geser pin pada peta untuk memilih lokasi.
              </div>

              <div className="flex-grow h-[260px] md:h-auto min-h-[220px] relative rounded-lg overflow-hidden border border-outline-variant">
                <MapPickerWrapper
                  center={mapCenter || { latitude: coords.latitude, longitude: coords.longitude }}
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

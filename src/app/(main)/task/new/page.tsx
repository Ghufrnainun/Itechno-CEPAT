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
import { Lock, MapPin, Search, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
      const parsedCompensation = parseFloat(compensation);
      if (isNaN(parsedCompensation) || parsedCompensation <= 0) {
        showToast("Kompensasi harus berupa angka lebih dari 0.");
        setLoading(false);
        return;
      }

      const selectedCategory = categories.find((c) => c.id_category === categoryId);

      const payload = {
        judul_tugas: title.trim(),
        deskripsi_tugas: description.trim(),
        id_category: categoryId || undefined,
        kategori: selectedCategory?.nama_kategori || undefined,
        skill_requirements: selectedSkills,
        estimasi_waktu: duration ? (duration.includes("Jam") ? duration : `${duration} Jam`) : "1 Jam",
        kompensasi: parsedCompensation,
        max_applicants: parseInt(maxApplicants, 10) || 1,
        max_apply_attempts: parseInt(maxApplyAttempts, 10) || 3,
        latitude: lat,
        longitude: lng,
      };

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
    <div className="flex flex-col h-full bg-surface font-sans">
      {/* Page Header */}
      <header className="page-header bg-surface-container-lowest border-b border-card-border px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl text-on-surface font-extrabold tracking-tight">Post Tugas Baru</h1>
          <p className="font-body-sm text-sm text-on-surface-variant font-medium mt-0.5">
            Buat tugas baru untuk dikerjakan oleh worker mikro terdekat
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
          <Lock className="w-3.5 h-3.5" />
          <span className="font-mono text-xs font-semibold">Dana dikunci escrow saat tugas diterima</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full p-4 md:p-6 lg:p-8 pb-28 md:pb-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        <EscrowBanner />

        <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-card-border rounded-xl p-4 md:p-6 flex flex-col gap-5 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Form Fields */}
            <div className="flex flex-col gap-4">
              <Input
                label="Judul Tugas"
                type="text"
                placeholder="Contoh: Foto Katalog 15 Menu Makanan"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-xs text-on-surface">Deskripsi Tugas</label>
                <textarea
                  className="w-full bg-surface-container-low border border-card-border rounded-lg p-3 text-base sm:text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:outline-none min-h-[90px] custom-scrollbar"
                  placeholder="Jelaskan instruksi kerja, kriteria hasil, dan perlengkapan yang perlu dibawa."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-xs text-on-surface">Kategori</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-surface-container-low border border-card-border rounded-lg p-2.5 text-base sm:text-xs text-on-surface focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:outline-none cursor-pointer min-h-[44px]"
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

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-xs text-on-surface">Skill (Opsional)</label>
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {skills.map((s) => {
                    const isSelected = selectedSkills.includes(s.id_skill_master);
                    return (
                      <button
                        key={s.id_skill_master}
                        type="button"
                        onClick={() => toggleSkill(s.id_skill_master)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors duration-150 cursor-pointer",
                          isSelected 
                            ? "bg-primary text-on-primary border-primary shadow-xs" 
                            : "bg-surface-container-low text-on-surface-variant border-card-border hover:bg-surface-container hover:text-on-surface"
                        )}
                      >
                        {s.nama_skill}
                      </button>
                    );
                  })}
                  {skills.length === 0 && (
                    <span className="text-xs text-on-surface-variant italic">Belum ada skill yang tersedia...</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              <div className="grid grid-cols-2 gap-3">
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
              <div className="bg-surface-container-low border border-card-border rounded-lg p-3 flex flex-col gap-1">
                <span className="text-xs text-on-surface-variant font-medium">Ringkasan Penguncian Escrow:</span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant font-mono tabular-nums">
                    {parseInt(maxApplicants, 10) || 1} Worker × {formatCurrency(parseFloat(compensation) || 0)}
                  </span>
                  <span className="font-bold text-primary font-mono text-sm tabular-nums">
                    Total: {formatCurrency((parseFloat(compensation) || 0) * (parseInt(maxApplicants, 10) || 1))}
                  </span>
                </div>
              </div>
            </div>

            {/* Location Picker Map */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-xs text-on-surface flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                Titik Lokasi Tugas
              </label>
              
              <div className="flex items-center gap-2">
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
                  size="sm"
                  className="whitespace-nowrap"
                  onClick={handleSearchLocation}
                  disabled={searching}
                  icon={searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                >
                  Cari
                </Button>
              </div>
              
              <div className="font-body-sm text-xs text-on-surface-variant">
                Atau geser pin pada peta untuk memilih lokasi.
              </div>

              <div className="flex-grow h-[260px] md:h-auto min-h-[220px] relative rounded-lg overflow-hidden border border-card-border">
                <MapPickerWrapper
                  center={mapCenter || { latitude: coords.latitude, longitude: coords.longitude }}
                  onLocationSelect={handleLocationSelect}
                />
              </div>

              {lat && lng ? (
                <span className="font-mono text-xs text-primary font-bold flex items-center gap-1.5 tabular-nums">
                  <MapPin className="w-3.5 h-3.5 fill-primary text-primary" />
                  Koordinat Terpilih: {lat.toFixed(6)}, {lng.toFixed(6)}
                </span>
              ) : (
                <span className="font-sans text-xs text-error font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Silakan klik titik di peta untuk menandai lokasi.
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-card-border pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => router.back()}
            >
              Batal
            </Button>
            
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Memproses..." : "Posting Tugas Sekarang"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

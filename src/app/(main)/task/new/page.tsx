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
import { renderIcon } from "@/lib/icon-map";
import { Lock, ChevronDown, Check, X, MapPin, Search, Info } from "lucide-react";

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
  const [skills, setSkills] = useState<{ id_skill_master: string; nama_skill: string; icon: string | null }[]>([]);
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);

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
    <div className="flex flex-col h-full bg-surface font-sans text-xs">
      {/* Page Header */}
      <header className="shrink-0 bg-surface-container-lowest border-b border-card-border px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">Post Tugas Baru</h1>
          <p className="font-body-sm text-xs text-on-surface-variant font-medium mt-1">Buat tugas baru untuk dikerjakan oleh worker mikro terdekat</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
          <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Dana dikunci escrow saat tugas diterima</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full p-4 md:p-8 pb-28 md:pb-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        <EscrowBanner />

        <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-card-border rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <label className="font-semibold text-on-surface">Deskripsi Tugas</label>
                <textarea
                  className="w-full bg-surface-container-low border border-card-border rounded-xl p-3 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none min-h-[100px] custom-scrollbar font-sans"
                  placeholder="Jelaskan instruksi kerja, kriteria hasil, dan perlengkapan yang perlu dibawa."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-on-surface">Kategori</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full min-h-[44px] bg-surface-container-low border border-card-border rounded-xl px-3.5 text-xs text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none transition-all font-sans cursor-pointer"
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

              <div className="flex flex-col gap-1.5 relative">
                <label className="font-semibold text-on-surface">Skill (Opsional)</label>
                
                {/* Dropdown Button */}
                <button
                  type="button"
                  onClick={() => setIsSkillDropdownOpen(!isSkillDropdownOpen)}
                  className="min-h-[44px] px-3.5 bg-surface-container-low border border-card-border rounded-xl text-xs font-sans flex justify-between items-center w-full text-left text-on-surface-variant cursor-pointer"
                >
                  <span>{selectedSkills.length > 0 ? `${selectedSkills.length} Skill Terpilih` : 'Pilih Skill yang Dibutuhkan...'}</span>
                  <ChevronDown className="w-4 h-4 text-on-surface-variant shrink-0" />
                </button>

                {/* Dropdown Panel */}
                {isSkillDropdownOpen && (
                  <div className="absolute top-[70px] left-0 w-full bg-surface-container-lowest border border-card-border rounded-xl shadow-xl z-20 overflow-hidden flex flex-col">
                    <div className="max-h-[240px] overflow-y-auto p-2 flex flex-col custom-scrollbar">
                      {skills.map((s) => {
                        const isSelected = selectedSkills.includes(s.id_skill_master);
                        return (
                          <button
                            key={s.id_skill_master}
                            type="button"
                            onClick={() => toggleSkill(s.id_skill_master)}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer w-full text-left ${
                              isSelected 
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-transparent text-on-surface hover:bg-surface-container-low'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {renderIcon(s.icon, `w-4 h-4 shrink-0 ${isSelected ? "text-primary" : "text-on-surface-variant"}`)}
                              <span>{s.nama_skill}</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4" />}
                          </button>
                        );
                      })}
                      {skills.length === 0 && (
                        <span className="text-xs text-on-surface-variant italic p-3 text-center">Belum ada skill yang tersedia...</span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Selected Tags */}
                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedSkills.map(id => {
                      const s = skills.find(sk => sk.id_skill_master === id);
                      if (!s) return null;
                      return (
                        <div key={id} className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-low border border-card-border rounded-full text-xs font-medium text-on-surface">
                          {renderIcon(s.icon, "w-3.5 h-3.5 shrink-0 text-primary")}
                          <span>{s.nama_skill}</span>
                          <button 
                            type="button"
                            onClick={() => toggleSkill(id)}
                            className="ml-1 text-on-surface-variant hover:text-error transition-colors flex items-center justify-center cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Batas Maksimal Pelamar"
                  type="number"
                  placeholder="Contoh: 3"
                  value={maxApplicants}
                  onChange={(e) => setMaxApplicants(e.target.value)}
                  min={1}
                  required
                />
                <Input
                  label="Batas Percobaan Apply"
                  type="number"
                  placeholder="Contoh: 3"
                  value={maxApplyAttempts}
                  onChange={(e) => setMaxApplyAttempts(e.target.value)}
                  min={1}
                  required
                />
              </div>

              {/* Ringkasan Escrow Real-time */}
              <div className="bg-surface-container-low border border-card-border rounded-xl p-3 flex flex-col gap-1 text-xs">
                <span className="text-on-surface-variant font-medium">Ringkasan Penguncian Escrow:</span>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant font-mono">
                    {parseInt(maxApplicants, 10) || 1} Worker × {formatCurrency(parseFloat(compensation) || 0)}
                  </span>
                  <span className="font-bold text-primary font-mono text-sm">
                    Total: {formatCurrency((parseFloat(compensation) || 0) * (parseInt(maxApplicants, 10) || 1))}
                  </span>
                </div>
              </div>
            </div>

            {/* Location Picker Map */}
            <div className="flex flex-col gap-3">
              <label className="font-semibold text-on-surface flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                Titik Lokasi Tugas
              </label>
              
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <Input 
                    type="text" 
                    placeholder="Cari lokasi (misal: UGM, Monas)" 
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
                  className="whitespace-nowrap h-[44px]"
                  onClick={handleSearchLocation}
                  disabled={searching}
                  icon={<Search className="w-4 h-4" />}
                >
                  Cari
                </Button>
              </div>
              
              <div className="text-xs text-on-surface-variant">
                Atau geser pin pada peta untuk memilih lokasi.
              </div>

              <div className="flex-grow h-[260px] md:h-auto min-h-[220px] relative rounded-xl overflow-hidden border border-card-border shadow-xs">
                <MapPickerWrapper
                  center={mapCenter || { latitude: coords.latitude, longitude: coords.longitude }}
                  onLocationSelect={handleLocationSelect}
                />
              </div>

              {lat && lng ? (
                <span className="text-xs text-primary font-mono font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Koordinat Terpilih: {lat.toFixed(6)}, {lng.toFixed(6)}
                </span>
              ) : (
                <span className="text-xs text-error font-medium flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Silakan klik titik di peta untuk menandai lokasi.
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-card-border pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => router.back()}
            >
              Batal
            </Button>
            
            <Button type="submit" variant="primary" size="sm" disabled={loading}>
              {loading ? "Memproses..." : "Posting Tugas Sekarang"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

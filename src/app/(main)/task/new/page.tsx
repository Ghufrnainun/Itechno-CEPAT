"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils/format";
import MapPickerWrapper from "@/features/task/components/MapPickerWrapper";
import { renderIcon } from "@/lib/icon-map";
import {
  ShieldCheck,
  MapPin,
  Search,
  Check,
  X,
  ArrowRight,
  Plus,
  Minus,
  Navigation,
  AlertTriangle,
  Wallet,
  CheckCircle2,
  ChevronDown,
  Calendar,
  Clock,
} from "lucide-react";

// Preset Task Templates with clean professional labels (no raw emojis)
const TASK_TEMPLATES = [
  {
    id: "photo",
    label: "Foto Produk / Katalog",
    title: "Foto Katalog 15 Menu Makanan & Minuman",
    description:
      "Dibutuhkan worker untuk mengambil foto resolusi tinggi 15 menu makanan dan minuman di restoran. Hasil foto dikirim dalam format JPEG/PNG dengan pencahayaan jelas.",
    duration: "2",
    compensation: "75000",
    maxApplicants: "1",
    categoryHint: "Desain",
  },
  {
    id: "delivery",
    label: "Pengantaran Dokumen",
    title: "Pengantaran Berkas Dokumen Penting (Sleman - Kota)",
    description:
      "Ambil berkas map dokumen di lokasi penjemputan dan antarkan ke alamat tujuan dengan aman dan tepat waktu. Tanda tangan penerima wajib difoto sebagai bukti serah terima.",
    duration: "1",
    compensation: "35000",
    maxApplicants: "1",
    categoryHint: "Logistik",
  },
  {
    id: "cleaning",
    label: "Kebersihan & Tata Toko",
    title: "Bantu Bersihkan & Tata Etalase Toko",
    description:
      "Membantu menata barang dagangan di etalase toko, membersihkan rak display, dan menyapu area kasir toko sebelum jam operasional dimulai.",
    duration: "3",
    compensation: "85000",
    maxApplicants: "1",
    categoryHint: "Fisik",
  },
  {
    id: "data",
    label: "Input Data & Spreadsheet",
    title: "Input Data Rekap Penjualan ke Google Spreadsheet",
    description:
      "Memasukkan 50 data nota manual ke dalam spreadsheet Google Sheets sesuai template dan kolom yang telah disediakan dengan teliti.",
    duration: "2",
    compensation: "50000",
    maxApplicants: "1",
    categoryHint: "Data",
  },
  {
    id: "survey",
    label: "Survei Lapangan",
    title: "Survei Ketersediaan Produk di 3 Minimarket",
    description:
      "Kunjungi 3 minimarket terdekat untuk mencatat ketersediaan dan harga produk tertentu serta ambil foto bukti rak pajangan produk.",
    duration: "2",
    compensation: "60000",
    maxApplicants: "1",
    categoryHint: "Survei",
  },
];

// Compensation Quick Chips
const COMPENSATION_PRESETS = [25000, 50000, 75000, 100000, 150000, 200000];

// Duration Quick Chips (explicit hour values)
const DURATION_PRESETS = [
  { label: "30 Menit", value: "0.5" },
  { label: "1 Jam", value: "1" },
  { label: "2 Jam", value: "2" },
  { label: "3 Jam", value: "3" },
  { label: "4 Jam", value: "4" },
  { label: "6 Jam", value: "6" },
  { label: "8 Jam", value: "8" },
  { label: "12 Jam", value: "12" },
  { label: "24 Jam", value: "24" },
];

export default function NewTaskPage() {
  const router = useRouter();
  const { coords } = useGeolocation();
  const { showToast } = useToast();

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [duration, setDuration] = useState("2");
  const [compensation, setCompensation] = useState("75000");
  const [maxApplicants, setMaxApplicants] = useState("1");
  const [maxApplyAttempts, setMaxApplyAttempts] = useState("3");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>("");
  const [addressLoading, setAddressLoading] = useState(false);

  // Scheduling State
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");

  // Search & Map State
  const [searchLocation, setSearchLocation] = useState("");
  const [searching, setSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | null>(null);

  // Data Loading State
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id_category: string; nama_kategori: string; icon?: string | null }[]>([]);
  const [skills, setSkills] = useState<{ id_skill_master: string; nama_skill: string; icon: string | null }[]>([]);
  const [userProfile, setUserProfile] = useState<{ total_balance: number; held_balance: number } | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Skill & Category Dropdown State & Refs
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [skillSearchQuery, setSkillSearchQuery] = useState("");

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const skillDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (skillDropdownRef.current && !skillDropdownRef.current.contains(e.target as Node)) {
        setIsSkillDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Load initial data (categories, skills, current user profile)
  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, skillRes, userRes] = await Promise.all([
          fetch("/api/categories").then((r) => r.json()),
          fetch("/api/skills").then((r) => r.json()),
          fetch("/api/users/me").then((r) => r.json()).catch(() => ({ success: false })),
        ]);

        if (catRes.success) setCategories(catRes.data);
        if (skillRes.success) setSkills(skillRes.data);
        if (userRes.success && userRes.data) {
          setUserProfile({
            total_balance: userRes.data.total_balance || 0,
            held_balance: userRes.data.held_balance || 0,
          });
        }
      } catch (error) {
        console.error("Gagal memuat data:", error);
      }
    }
    loadData();
  }, []);

  // Initialize coordinates from browser geolocation when available
  useEffect(() => {
    if (coords.latitude && coords.longitude && lat === null && lng === null) {
      setLat(coords.latitude);
      setLng(coords.longitude);
      setMapCenter({ latitude: coords.latitude, longitude: coords.longitude });
      reverseGeocode(coords.latitude, coords.longitude);
    }
  }, [coords.latitude, coords.longitude]);

  // Reverse Geocoding helper
  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    setAddressLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      const data = await res.json();
      if (data && data.display_name) {
        setLocationAddress(data.display_name);
      } else {
        setLocationAddress(`Koordinat: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      }
    } catch {
      setLocationAddress(`Koordinat: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    } finally {
      setAddressLoading(false);
    }
  }, []);

  const handleLocationSelect = useCallback((selectedLat: number, selectedLng: number) => {
    setLat(selectedLat);
    setLng(selectedLng);
    reverseGeocode(selectedLat, selectedLng);
  }, [reverseGeocode]);

  const handleUseCurrentLocation = useCallback(() => {
    if (coords.latitude && coords.longitude) {
      setLat(coords.latitude);
      setLng(coords.longitude);
      setMapCenter({ latitude: coords.latitude, longitude: coords.longitude });
      reverseGeocode(coords.latitude, coords.longitude);
      showToast("Peta diarahkan ke lokasi Anda saat ini.");
    } else {
      showToast("Lokasi GPS belum tersedia. Pastikan izin lokasi aktif.");
    }
  }, [coords.latitude, coords.longitude, reverseGeocode, showToast]);

  const handleSearchLocation = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchLocation.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchLocation
        )}&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);
        setMapCenter({ latitude: newLat, longitude: newLng });
        setLat(newLat);
        setLng(newLng);
        setLocationAddress(result.display_name || searchLocation);
        showToast("Lokasi berhasil ditemukan!");
      } else {
        showToast("Lokasi tidak ditemukan. Coba gunakan nama jalan/gedung yang lebih spesifik.");
      }
    } catch {
      showToast("Gagal mencari lokasi. Periksa koneksi internet Anda.");
    } finally {
      setSearching(false);
    }
  }, [searchLocation, showToast]);

  const handleApplyTemplate = useCallback((template: (typeof TASK_TEMPLATES)[0]) => {
    setSelectedTemplateId(template.id);
    setTitle(template.title);
    setDescription(template.description);
    setDuration(template.duration);
    setCompensation(template.compensation);
    setMaxApplicants(template.maxApplicants);

    // Try finding matching category
    if (categories.length > 0) {
      const matchedCat = categories.find((c) =>
        c.nama_kategori.toLowerCase().includes(template.categoryHint.toLowerCase())
      );
      if (matchedCat) {
        setCategoryId(matchedCat.id_category);
      }
    }

    showToast(`Template "${template.label}" diterapkan.`);
  }, [categories, showToast]);

  const toggleSkill = useCallback((id: string) => {
    setSelectedSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  // Financial Escrow Calculations
  const numericCompensation = parseFloat(compensation) || 0;
  const numericApplicants = parseInt(maxApplicants, 10) || 1;
  const totalEscrow = numericCompensation * numericApplicants;
  const userBalance = userProfile?.total_balance || 0;
  const isBalanceInsufficient = userProfile !== null && userBalance < totalEscrow;
  const remainingBalanceAfterPost = Math.max(0, userBalance - totalEscrow);

  // Schedule Calculation
  const calculatedSchedule = useMemo(() => {
    if (!isScheduled || !scheduledDate) return null;
    try {
      const [hours, minutes] = (scheduledTime || "09:00").split(":").map(Number);
      const [year, month, day] = scheduledDate.split("-").map(Number);
      const startDate = new Date(year, month - 1, day, hours || 9, minutes || 0, 0, 0);

      const durHours = parseFloat(duration) || 1;
      const endDate = new Date(startDate.getTime() + durHours * 60 * 60 * 1000);

      return {
        start: startDate,
        end: endDate,
        startIso: startDate.toISOString(),
        endIso: endDate.toISOString(),
      };
    } catch {
      return null;
    }
  }, [isScheduled, scheduledDate, scheduledTime, duration]);

  // Filter skills for dropdown
  const filteredSkills = useMemo(() => {
    if (!skillSearchQuery.trim()) return skills;
    return skills.filter((s) =>
      s.nama_skill.toLowerCase().includes(skillSearchQuery.toLowerCase())
    );
  }, [skills, skillSearchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast("Judul tugas wajib diisi.");
      return;
    }
    if (!description.trim()) {
      showToast("Deskripsi tugas wajib diisi.");
      return;
    }
    if (!lat || !lng) {
      showToast("Silakan tentukan titik lokasi tugas pada peta.");
      return;
    }
    if (numericCompensation < 1000) {
      showToast("Kompensasi minimal adalah Rp1.000.");
      return;
    }

    if (isScheduled) {
      if (!scheduledDate) {
        showToast("Silakan tentukan tanggal pelaksanaan tugas.");
        return;
      }
      if (calculatedSchedule && calculatedSchedule.start.getTime() < Date.now() - 5 * 60 * 1000) {
        showToast("Jadwal pelaksanaan tugas harus berada di masa mendatang.");
        return;
      }
    }

    if (isBalanceInsufficient) {
      showToast("Saldo Anda tidak mencukupi untuk mengunci dana Escrow.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        judul_tugas: title.trim(),
        deskripsi_tugas: description.trim(),
        id_category: categoryId || undefined,
        estimasi_waktu: duration.toLowerCase().includes("jam")
          ? duration
          : `${parseFloat(duration) || 1} Jam`,
        kompensasi: numericCompensation,
        max_applicants: numericApplicants,
        max_apply_attempts: parseInt(maxApplyAttempts, 10) || 3,
        latitude: lat,
        longitude: lng,
        scheduled_at: calculatedSchedule ? calculatedSchedule.startIso : undefined,
        scheduled_end: calculatedSchedule ? calculatedSchedule.endIso : undefined,
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
        showToast(data.message || "Gagal membuat tugas. Periksa saldo atau coba lagi.");
        return;
      }

      showToast("Tugas berhasil diposting. Dana aman terkunci di Escrow.");
      router.push(`/task/${data.data.id_tasks}`);
    } catch {
      showToast("Terjadi gangguan koneksi. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-surface pb-32 lg:pb-16 font-sans text-on-surface">
      {/* ──── Top Navigation & Header (Desktop Only - Clean Mobile Layout) ──── */}
      <div className="hidden md:block border-b border-card-border/80 bg-surface-container-lowest/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-row items-center justify-between gap-4">
          <div>
            <h1 className="font-headline font-extrabold text-xl sm:text-2xl text-on-surface tracking-tight">
              Post Tugas Baru
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Buat dan publikasikan tugas mikro dengan perlindungan dana Escrow
            </p>
          </div>

          {/* Minimalist Escrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-low border border-card-border shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-on-surface whitespace-nowrap">Escrow Protected</span>
              <span className="w-1 h-1 rounded-full bg-card-border" />
              <span className="text-on-surface-variant text-[11px]">
                Dana terkunci aman hingga disetujui
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ──── Main Content Container ──── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        
        {/* Sleek Template Presets Bar */}
        <div className="mb-6 bg-surface-container-lowest border border-card-border/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Template Cepat
              </span>
            </div>
            <span className="text-[11px] text-on-surface-variant hidden sm:inline">
              Klik opsi untuk mengisi formulir otomatis
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar -mx-1 px-1">
            {TASK_TEMPLATES.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className={`px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 flex items-center gap-2 cursor-pointer border min-h-[38px] sm:min-h-[34px] ${
                    isSelected
                      ? "bg-primary text-on-primary border-primary shadow-xs"
                      : "bg-surface-container-low text-on-surface border-card-border hover:border-primary/40 hover:bg-surface-container"
                  }`}
                >
                  <span>{tpl.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ──── Form & Map Grid (7 cols left, 5 cols right) ──── */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ════════ LEFT COLUMN: Task Specifications (7 Columns) ════════ */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Section 1: Informasi Pokok Tugas (Clean Double Bezel) */}
              <div className="p-1 rounded-[1.75rem] bg-gradient-to-b from-card-border/70 to-card-border/30 border border-card-border/60 shadow-xs">
                <div className="bg-surface-container-lowest rounded-[calc(1.75rem-0.25rem)] p-4 sm:p-7 flex flex-col gap-5">
                  <div className="border-b border-card-border/60 pb-3">
                    <h2 className="font-headline font-bold text-base text-on-surface">
                      Detail Tugas
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Judul, deskripsi instruksi pengerjaan, dan kriteria keahlian
                    </p>
                  </div>

                  {/* Judul Tugas */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="task-title" className="text-xs font-semibold text-on-surface">
                        Judul Tugas <span className="text-error">*</span>
                      </label>
                      <span className="text-[11px] font-mono text-on-surface-variant/70">
                        {title.length}/120
                      </span>
                    </div>
                    <input
                      id="task-title"
                      type="text"
                      maxLength={120}
                      placeholder="Contoh: Foto Katalog 15 Menu Makanan & Minuman"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full px-4 py-3 text-sm font-sans bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-xl border border-card-border/90 transition-all duration-150 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:outline-none min-h-[44px]"
                    />
                  </div>

                  {/* Deskripsi Tugas */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="task-description" className="text-xs font-semibold text-on-surface">
                        Deskripsi &amp; Instruksi Kerja <span className="text-error">*</span>
                      </label>
                      <span className="text-[11px] text-on-surface-variant/70">
                        Min. 10 karakter
                      </span>
                    </div>
                    <textarea
                      id="task-description"
                      rows={4}
                      placeholder="Jelaskan instruksi kerja secara runtut, kriteria hasil tugas, perlengkapan yang harus dibawa worker, serta batas waktu serah terima."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      className="w-full px-4 py-3 text-xs sm:text-sm font-sans bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-xl border border-card-border/90 transition-all duration-150 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:outline-none resize-y min-h-[110px]"
                    />
                  </div>

                  {/* Kategori Tugas (Custom Styled Dropdown) */}
                  <div className="flex flex-col gap-1.5 relative" ref={categoryDropdownRef}>
                    <label id="category-label" className="text-xs font-semibold text-on-surface">
                      Kategori Tugas <span className="text-error">*</span>
                    </label>
                    
                    <button
                      type="button"
                      aria-labelledby="category-label"
                      aria-haspopup="listbox"
                      aria-expanded={isCategoryDropdownOpen}
                      onClick={() => {
                        setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                        setIsSkillDropdownOpen(false);
                      }}
                      className={`w-full min-h-[46px] px-4 py-3 bg-surface-container-low border rounded-xl text-xs sm:text-sm font-sans flex justify-between items-center text-left text-on-surface transition-all cursor-pointer shadow-2xs ${
                        isCategoryDropdownOpen
                          ? "border-primary ring-2 ring-primary/20 bg-surface-container-lowest"
                          : "border-card-border/90 hover:border-primary/40 hover:bg-surface-container-lowest"
                      }`}
                    >
                      <span className={`flex items-center gap-2 ${!categoryId ? "text-on-surface-variant/60" : "font-medium"}`}>
                        {(() => {
                          const cat = categories.find((c) => c.id_category === categoryId);
                          if (!cat) return "-- Pilih Kategori Tugas --";
                          return (
                            <>
                              {cat.icon && renderIcon(cat.icon, "w-4 h-4 text-primary shrink-0")}
                              <span>{cat.nama_kategori}</span>
                            </>
                          );
                        })()}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-on-surface-variant transition-transform duration-200 ${
                          isCategoryDropdownOpen ? "rotate-180 text-primary" : ""
                        }`}
                      />
                    </button>

                    {/* Custom Floating Category Menu */}
                    {isCategoryDropdownOpen && (
                      <div
                        role="listbox"
                        className="absolute top-[76px] left-0 right-0 z-30 bg-surface-container-lowest border border-card-border rounded-2xl shadow-xl p-2 flex flex-col gap-1 animate-in fade-in-50 zoom-in-95 duration-150"
                      >
                        <div className="max-h-56 overflow-y-auto divide-y divide-card-border/30 custom-scrollbar flex flex-col">
                          {categories.map((c) => {
                            const isSelected = c.id_category === categoryId;
                            return (
                              <button
                                key={c.id_category}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                onClick={() => {
                                  setCategoryId(c.id_category);
                                  setIsCategoryDropdownOpen(false);
                                }}
                                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer text-left min-h-[40px] ${
                                  isSelected
                                    ? "bg-primary/10 text-primary font-bold"
                                    : "text-on-surface hover:bg-surface-container-low"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  {c.icon && renderIcon(c.icon, `w-4 h-4 shrink-0 ${isSelected ? "text-primary" : "text-on-surface-variant"}`)}
                                  <span>{c.nama_kategori}</span>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-primary shrink-0 ml-2" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Keahlian / Skills Selector */}
                  <div className="flex flex-col gap-2 relative" ref={skillDropdownRef}>
                    <div className="flex items-center justify-between">
                      <label id="skills-label" className="text-xs font-semibold text-on-surface">
                        Keahlian yang Dibutuhkan (Opsional)
                      </label>
                      <span className="text-[11px] text-on-surface-variant">
                        {selectedSkills.length} dipilih
                      </span>
                    </div>

                    {/* Skill Trigger Button */}
                    <button
                      type="button"
                      aria-labelledby="skills-label"
                      aria-haspopup="listbox"
                      aria-expanded={isSkillDropdownOpen}
                      onClick={() => {
                        setIsSkillDropdownOpen(!isSkillDropdownOpen);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className="w-full min-h-[46px] px-4 py-2.5 bg-surface-container-low border border-card-border/90 rounded-xl text-xs sm:text-sm font-sans flex justify-between items-center text-left text-on-surface hover:border-primary/40 hover:bg-surface-container-lowest transition-all cursor-pointer shadow-2xs"
                    >
                      <span className={selectedSkills.length === 0 ? "text-on-surface-variant/60" : "font-medium"}>
                        {selectedSkills.length > 0
                          ? `${selectedSkills.length} Keahlian Terpilih`
                          : "Pilih keahlian yang relevan..."}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-on-surface-variant transition-transform duration-200 ${
                          isSkillDropdownOpen ? "rotate-180 text-primary" : ""
                        }`}
                      />
                    </button>

                    {/* Skill Dropdown Panel */}
                    {isSkillDropdownOpen && (
                      <div className="absolute top-[76px] left-0 right-0 z-30 bg-surface-container-lowest border border-card-border rounded-2xl shadow-xl p-3 flex flex-col gap-2 animate-in fade-in-50 zoom-in-95 duration-150">
                        {/* Search in skills */}
                        <div className="relative flex items-center">
                          <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Cari keahlian..."
                            value={skillSearchQuery}
                            onChange={(e) => setSkillSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-xs bg-surface-container-low rounded-lg border border-card-border focus:outline-none focus:border-primary min-h-[38px]"
                          />
                        </div>

                        <div className="max-h-48 overflow-y-auto divide-y divide-card-border/30 custom-scrollbar flex flex-col">
                          {filteredSkills.map((s) => {
                            const isSelected = selectedSkills.includes(s.id_skill_master);
                            return (
                              <button
                                key={s.id_skill_master}
                                type="button"
                                onClick={() => toggleSkill(s.id_skill_master)}
                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left min-h-[38px] ${
                                  isSelected
                                    ? "bg-primary/10 text-primary font-bold"
                                    : "text-on-surface hover:bg-surface-container-low"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  {renderIcon(
                                    s.icon,
                                    `w-4 h-4 shrink-0 ${
                                      isSelected ? "text-primary" : "text-on-surface-variant"
                                    }`
                                  )}
                                  <span>{s.nama_skill}</span>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                              </button>
                            );
                          })}
                          {filteredSkills.length === 0 && (
                            <span className="text-xs text-on-surface-variant italic p-4 text-center">
                              Tidak ada keahlian yang cocok.
                            </span>
                          )}
                        </div>

                        <div className="pt-2 border-t border-card-border flex justify-end">
                          <button
                            type="button"
                            onClick={() => setIsSkillDropdownOpen(false)}
                            className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold cursor-pointer min-h-[36px]"
                          >
                            Selesai
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Selected Skill Tags Badges */}
                    {selectedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {selectedSkills.map((id) => {
                          const s = skills.find((sk) => sk.id_skill_master === id);
                          if (!s) return null;
                          return (
                            <div
                              key={id}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-low border border-card-border text-on-surface rounded-full text-xs font-medium transition-all"
                            >
                              <span>{s.nama_skill}</span>
                              <button
                                type="button"
                                aria-label={`Hapus keahlian ${s.nama_skill}`}
                                onClick={() => toggleSkill(id)}
                                className="text-on-surface-variant hover:text-error transition-colors flex items-center justify-center cursor-pointer ml-0.5 w-4 h-4"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Anggaran & Ketentuan Pelamar (Double Bezel) */}
              <div className="p-1 rounded-[1.75rem] bg-gradient-to-b from-card-border/70 to-card-border/30 border border-card-border/60 shadow-xs">
                <div className="bg-surface-container-lowest rounded-[calc(1.75rem-0.25rem)] p-4 sm:p-7 flex flex-col gap-6">
                  <div className="border-b border-card-border/60 pb-3">
                    <h2 className="font-headline font-bold text-base text-on-surface">
                      Kompensasi &amp; Batas Pelamar
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Besaran bayaran per worker, estimasi durasi, dan alokasi slot
                    </p>
                  </div>

                  {/* Kompensasi Section with Quick Presets */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="compensation-input" className="text-xs font-semibold text-on-surface">
                      Kompensasi per Worker <span className="text-error">*</span>
                    </label>

                    <div className="relative flex items-center">
                      <span className="absolute left-4 font-mono font-bold text-on-surface-variant text-sm pointer-events-none">
                        Rp
                      </span>
                      <input
                        id="compensation-input"
                        type="number"
                        min={1000}
                        step={1000}
                        placeholder="Contoh: 75000"
                        value={compensation}
                        onChange={(e) => setCompensation(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3 text-sm sm:text-base font-mono font-bold bg-surface-container-low text-on-surface rounded-xl border border-card-border/90 transition-all duration-150 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:outline-none min-h-[46px]"
                      />
                    </div>

                    {/* Quick Compensation Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 custom-scrollbar -mx-1 px-1">
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant/70 tracking-wider shrink-0 mr-1">
                        Preset:
                      </span>
                      {COMPENSATION_PRESETS.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCompensation(val.toString())}
                          className={`px-3 py-1.5 sm:py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer border whitespace-nowrap min-h-[36px] sm:min-h-[32px] ${
                            numericCompensation === val
                              ? "bg-primary/10 text-primary border-primary/40 font-bold"
                              : "bg-surface-container-low text-on-surface-variant border-card-border hover:border-outline-variant hover:text-on-surface"
                          }`}
                        >
                          {formatCurrency(val)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Estimasi Durasi Section */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="duration-input" className="text-xs font-semibold text-on-surface">
                      Estimasi Durasi Pengerjaan <span className="text-error">*</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-grow">
                        <input
                          id="duration-input"
                          type="number"
                          min={0.5}
                          step={0.5}
                          placeholder="Contoh: 2"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          required
                          className="w-full px-4 py-3 text-sm font-sans bg-surface-container-low text-on-surface rounded-xl border border-card-border/90 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:outline-none min-h-[46px]"
                        />
                      </div>
                      <span className="text-xs font-semibold text-on-surface-variant px-4 py-3 rounded-xl bg-surface-container-low border border-card-border shrink-0 min-h-[46px] flex items-center justify-center">
                        Jam
                      </span>
                    </div>

                    {/* Duration Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 custom-scrollbar -mx-1 px-1">
                      {DURATION_PRESETS.map((dp) => (
                        <button
                          key={dp.value}
                          type="button"
                          onClick={() => setDuration(dp.value)}
                          className={`px-3 py-1.5 sm:py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border whitespace-nowrap min-h-[36px] sm:min-h-[32px] ${
                            duration === dp.value
                              ? "bg-primary/10 text-primary border-primary/40 font-bold"
                              : "bg-surface-container-low text-on-surface-variant border-card-border hover:border-outline-variant hover:text-on-surface"
                          }`}
                        >
                          {dp.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dual Steppers: Kuota Worker & Batas Percobaan Apply */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    
                    {/* Stepper 1: Kuota Worker */}
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-card-border/90 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-on-surface">
                          Kuota Worker
                        </label>
                        <span className="text-[10px] font-mono text-on-surface-variant bg-surface px-1.5 py-0.5 rounded border border-card-border">
                          Slot
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant leading-tight">
                        Jumlah worker yang dapat diterima
                      </p>

                      <div className="flex items-center justify-between bg-surface-container-lowest border border-card-border rounded-xl p-1 mt-1">
                        <button
                          type="button"
                          aria-label="Kurangi kuota worker"
                          onClick={() => setMaxApplicants(String(Math.max(1, numericApplicants - 1)))}
                          disabled={numericApplicants <= 1}
                          className="w-11 h-11 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container-low disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-mono font-bold text-base text-on-surface">
                          {numericApplicants} <span className="text-xs font-normal text-on-surface-variant">Worker</span>
                        </span>
                        <button
                          type="button"
                          aria-label="Tambah kuota worker"
                          onClick={() => setMaxApplicants(String(numericApplicants + 1))}
                          className="w-11 h-11 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stepper 2: Batas Percobaan Apply */}
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-card-border/90 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-on-surface">
                          Batas Percobaan Apply
                        </label>
                        <span className="text-[10px] font-mono text-on-surface-variant bg-surface px-1.5 py-0.5 rounded border border-card-border">
                          Maksimal
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant leading-tight">
                        Batas percobaan melamar per worker
                      </p>

                      <div className="flex items-center justify-between bg-surface-container-lowest border border-card-border rounded-xl p-1 mt-1">
                        <button
                          type="button"
                          aria-label="Kurangi batas percobaan apply"
                          onClick={() =>
                            setMaxApplyAttempts(
                              String(Math.max(1, (parseInt(maxApplyAttempts, 10) || 3) - 1))
                            )
                          }
                          disabled={(parseInt(maxApplyAttempts, 10) || 3) <= 1}
                          className="w-11 h-11 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container-low disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-mono font-bold text-base text-on-surface">
                          {maxApplyAttempts} <span className="text-xs font-normal text-on-surface-variant">Kali</span>
                        </span>
                        <button
                          type="button"
                          aria-label="Tambah batas percobaan apply"
                          onClick={() =>
                            setMaxApplyAttempts(String((parseInt(maxApplyAttempts, 10) || 3) + 1))
                          }
                          className="w-11 h-11 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Section 2.5: Penjadwalan Tugas (Scheduling Section) */}
                  <div className="pt-2 border-t border-card-border/60 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <div>
                          <label htmlFor="scheduling-toggle" className="text-xs font-semibold text-on-surface block cursor-pointer">
                            Jadwalkan Waktu Tugas
                          </label>
                          <span className="text-[11px] text-on-surface-variant">
                            Tentukan tanggal &amp; jam spesifik tugas harus dikerjakan
                          </span>
                        </div>
                      </div>

                      {/* Custom Toggle Switch */}
                      <button
                        id="scheduling-toggle"
                        type="button"
                        role="switch"
                        aria-checked={isScheduled}
                        onClick={() => setIsScheduled(!isScheduled)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          isScheduled ? "bg-primary" : "bg-card-border"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            isScheduled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Collapsible Scheduling Controls */}
                    {isScheduled && (
                      <div className="p-4 rounded-2xl bg-surface-container-low border border-card-border/90 flex flex-col gap-3 animate-in fade-in-50 duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          
                          {/* Date Picker */}
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="scheduled-date" className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-primary" />
                              Tanggal Pelaksanaan <span className="text-error">*</span>
                            </label>
                            <input
                              id="scheduled-date"
                              type="date"
                              min={new Date().toISOString().split("T")[0]}
                              value={scheduledDate}
                              onChange={(e) => setScheduledDate(e.target.value)}
                              required={isScheduled}
                              className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-surface-container-lowest text-on-surface rounded-xl border border-card-border/90 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none min-h-[42px]"
                            />
                          </div>

                          {/* Time Picker */}
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor="scheduled-time" className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              Jam Mulai <span className="text-error">*</span>
                            </label>
                            <input
                              id="scheduled-time"
                              type="time"
                              value={scheduledTime}
                              onChange={(e) => setScheduledTime(e.target.value)}
                              required={isScheduled}
                              className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans bg-surface-container-lowest text-on-surface rounded-xl border border-card-border/90 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none min-h-[42px]"
                            />
                          </div>

                        </div>

                        {/* Calculated Estimated Completion Banner */}
                        {calculatedSchedule && (
                          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                              <span className="text-on-surface font-medium">
                                Estimasi Selesai:
                              </span>
                            </div>
                            <span className="font-mono font-bold text-primary">
                              {calculatedSchedule.end.toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              WIB ({duration} Jam)
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* ════════ RIGHT COLUMN: Location Radar & Smart Escrow Ledger (5 Columns) ════════ */}
            <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-20">
              
              {/* Section 3: Titik Lokasi Tugas & Radar Map (Double Bezel) */}
              <div className="p-1 rounded-[1.75rem] bg-gradient-to-b from-card-border/70 to-card-border/30 border border-card-border/60 shadow-xs">
                <div className="bg-surface-container-lowest rounded-[calc(1.75rem-0.25rem)] p-4 sm:p-6 flex flex-col gap-4">
                  <div className="border-b border-card-border/60 pb-3">
                    <h2 className="font-headline font-bold text-base text-on-surface">
                      Lokasi Tugas
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Pusat radar pencarian worker terdekat dalam radius 2 km
                    </p>
                  </div>

                  {/* Location Search Bar & GPS Trigger */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-grow">
                        <Search className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Cari gedung, jalan, atau area..."
                          value={searchLocation}
                          onChange={(e) => setSearchLocation(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSearchLocation();
                            }
                          }}
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-sans bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-xl border border-card-border/90 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:outline-none min-h-[44px]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSearchLocation()}
                        disabled={searching || !searchLocation.trim()}
                        className="px-4 py-2.5 bg-surface-container-low hover:bg-surface-container border border-card-border text-on-surface rounded-xl text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer shrink-0 min-h-[44px]"
                      >
                        {searching ? "Mencari..." : "Cari"}
                      </button>
                    </div>

                    {/* Quick GPS button */}
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold border border-card-border transition-all cursor-pointer min-h-[42px]"
                    >
                      <Navigation className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Gunakan Titik GPS Saya Saat Ini</span>
                    </button>
                  </div>

                  {/* Leaflet Map Frame */}
                  <div className="h-[260px] sm:h-[280px] w-full relative rounded-2xl overflow-hidden border border-card-border shadow-inner bg-surface-container-low">
                    <MapPickerWrapper
                      center={mapCenter || { latitude: coords.latitude || -7.7956, longitude: coords.longitude || 110.3695 }}
                      onLocationSelect={handleLocationSelect}
                    />

                    {/* Floating Radius Badge (Top-Right, away from zoom controls) */}
                    <div className="absolute top-3 right-3 z-[400] pointer-events-none">
                      <span className="bg-surface-container-lowest/95 backdrop-blur-md border border-card-border/90 rounded-lg px-2.5 py-1 text-[10px] text-primary font-mono font-bold shadow-xs">
                        Radius 2 km
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-on-surface-variant/80 -mt-1 leading-relaxed">
                    Klik titik pada peta atau geser pin untuk menentukan koordinat lokasi tugas.
                  </p>

                  {/* Resolved Address Badge */}
                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-card-border/80 flex items-start gap-2.5">
                    <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${lat && lng ? "text-primary" : "text-error"}`} />
                    <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-on-surface">
                          {lat && lng ? "Lokasi Terpilih:" : "Lokasi Belum Ditentukan"}
                        </span>
                        {addressLoading && (
                          <span className="text-[10px] text-primary animate-pulse font-mono">
                            Memperbarui...
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant font-sans line-clamp-2 leading-relaxed break-words">
                        {locationAddress || (lat && lng ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "Silakan klik titik di peta")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Smart Escrow Financial Ledger (Double Bezel) */}
              <div className="p-1 rounded-[1.75rem] bg-gradient-to-b from-card-border/70 to-card-border/30 border border-card-border/60 shadow-sm">
                <div className="bg-surface-container-lowest rounded-[calc(1.75rem-0.25rem)] p-4 sm:p-6 flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-card-border/60 pb-3">
                    <div>
                      <h3 className="font-headline font-bold text-sm text-on-surface">
                        Rincian Penguncian Escrow
                      </h3>
                      <span className="text-[11px] text-on-surface-variant">
                        Transparansi dana &amp; saldo
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold border border-emerald-500/20">
                      Bebas Biaya
                    </span>
                  </div>

                  {/* Financial Math Ledger */}
                  <div className="flex flex-col gap-2.5 text-xs font-sans">
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span>Kompensasi per Worker</span>
                      <span className="font-mono font-medium text-on-surface">
                        {formatCurrency(numericCompensation)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span>Jumlah Kuota Worker</span>
                      <span className="font-mono font-medium text-on-surface">
                        {numericApplicants} Orang
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span>Biaya Layanan Platform</span>
                      <span className="font-mono font-bold text-emerald-600">
                        Rp0 (Gratis)
                      </span>
                    </div>

                    <div className="border-t border-dashed border-card-border my-1" />

                    <div className="flex items-center justify-between text-sm font-bold">
                      <span className="text-on-surface">Total Dana Dikunci (Escrow)</span>
                      <span className="font-mono text-primary text-base sm:text-lg">
                        {formatCurrency(totalEscrow)}
                      </span>
                    </div>
                  </div>

                  {/* User Balance Check Widget */}
                  {userProfile && (
                    <div
                      className={`p-3.5 rounded-xl border flex flex-col gap-2 ${
                        isBalanceInsufficient
                          ? "bg-error/10 border-error/30 text-error"
                          : "bg-surface-container-low border-card-border/80 text-on-surface"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Wallet className="w-3.5 h-3.5" />
                          Saldo Akun Saat Ini:
                        </span>
                        <span className="font-mono font-bold">
                          {formatCurrency(userBalance)}
                        </span>
                      </div>

                      {isBalanceInsufficient ? (
                        <div className="flex flex-col gap-2 pt-1 border-t border-error/20">
                          <div className="flex items-start gap-1.5 text-xs text-error font-medium">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>
                              Saldo Anda kurang {formatCurrency(totalEscrow - userBalance)} untuk mengunci Escrow tugas ini.
                            </span>
                          </div>
                          <Link
                            href="/wallet"
                            className="w-full py-2.5 px-3 rounded-lg bg-error text-on-error text-xs font-bold text-center hover:opacity-90 transition-opacity min-h-[40px] flex items-center justify-center"
                          >
                            Top Up Saldo Sekarang ➔
                          </Link>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1 border-t border-card-border/60">
                          <span>Sisa Saldo Setelah Posting:</span>
                          <span className="font-mono font-medium text-emerald-600">
                            {formatCurrency(remainingBalanceAfterPost)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Escrow Guarantee Bullet Checklist */}
                  <div className="flex flex-col gap-2 text-[11px] text-on-surface-variant bg-surface-container-low/70 rounded-xl p-3 border border-card-border/60">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Dana hanya dicairkan setelah hasil kerja disetujui.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Pengembalian otomatis 100% jika tugas dibatalkan atau kedaluwarsa.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Worker terverifikasi dengan rekam jejak penilaian terpercaya.</span>
                    </div>
                  </div>

                  {/* Submit Button (CTA with Island Architecture) */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading || isBalanceInsufficient || !lat || !lng}
                      className="group w-full py-3.5 px-6 rounded-2xl bg-primary text-on-primary font-headline font-bold text-sm sm:text-base flex items-center justify-between hover:bg-primary-container shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer min-h-[48px]"
                    >
                      <span className="flex items-center gap-2">
                        {loading ? "Memproses Escrow..." : "Posting Tugas & Kunci Escrow"}
                      </span>

                      {/* Nested Button-in-Button Trailing Icon Pill */}
                      <span className="w-8 h-8 rounded-xl bg-on-primary/15 flex items-center justify-center group-hover:translate-x-1 transition-transform shrink-0">
                        <ArrowRight className="w-4 h-4 text-on-primary" />
                      </span>
                    </button>

                    <p className="text-center text-[11px] text-on-surface-variant/80 mt-2.5">
                      Dengan memposting tugas, Anda menyetujui ketentuan layanan &amp; escrow kami.
                    </p>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </form>
      </div>

    </div>
  );
}

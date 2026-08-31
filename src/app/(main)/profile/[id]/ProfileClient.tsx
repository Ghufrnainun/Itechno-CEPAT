"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useCurrentRole } from "@/app/(main)/layout";
import { Button } from "@/components/ui/Button";
import { RatingStars } from "@/components/ui/RatingStars";
import { Modal } from "@/components/ui/Modal";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Camera,
  CheckCircle2,
  GraduationCap,
  Star,
  Wallet,
  Edit3,
  User,
  MessageSquare,
  Mail,
  Lock,
  Award,
  ExternalLink,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  ShieldCheck,
  Briefcase,
  Share2,
  Copy,
  Check,
  MessageCircle,
  History,
  Phone,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewData {
  id_reviews: string;
  rating: number;
  comment: string | null;
  created_at: string;
  rater: {
    id_user: string;
    nama_lengkap: string;
    avatar_url: string | null;
  };
  task?: {
    judul_tugas: string;
  };
}

export interface UserSkill {
  id_skill_master: string;
  nama_skill: string;
  deskripsi_pengalaman: string | null;
  certificate_url: string | null;
}

export interface PortfolioItem {
  id_portfolio: string;
  title: string;
  description: string | null;
  image_url: string;
  created_at: string;
}

interface ProfileClientProps {
  initialData: any;
}

export default function ProfileClient({ initialData }: ProfileClientProps) {
  const router = useRouter();
  const params = useParams();
  const { user } = useCurrentRole();
  const userId = (params?.id as string) || "me";
  const targetProfileId = initialData?.id_user || (userId !== "me" ? userId : user?.id_user);
  const isCurrentUser =
    userId === "me" ||
    Boolean(user?.id_user && (userId === user.id_user || initialData?.id_user === user.id_user)) ||
    Boolean(user?.email && initialData?.email && user.email === initialData.email);

  // Profile data states
  const [name, setName] = useState(initialData?.nama_lengkap || "Pengguna CEPAT");
  const [univ, setUniv] = useState(initialData?.pendidikan_terakhir || "");
  const [bio, setBio] = useState(initialData?.bio || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.no_telpon || initialData?.no_hp || "");
  const [alamat, setAlamat] = useState(initialData?.alamat || "");
  const [roleName, setRoleName] = useState(initialData?.role?.nama_role || "Pekerja");
  const [tagline, setTagline] = useState(initialData?.tagline || "");
  const [isVerified, setIsVerified] = useState(initialData?.is_verified || false);
  const [rating, setRating] = useState(initialData?.rating_avg || 0);
  const [completedCount, setCompletedCount] = useState(initialData?.total_completed || 0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData?.avatar_url || null);

  const [skills, setSkills] = useState<UserSkill[]>(
    initialData?.skills_user?.map((su: any) => ({
      id_skill_master: su.skills_master?.id_skill_master || su.id_skills_master || "",
      nama_skill: su.skills_master?.nama_skill || su.nama_skill || "Keahlian",
      deskripsi_pengalaman: su.deskripsi_pengalaman || "",
      certificate_url: su.certificate_url || "",
    })) || initialData?.skills || []
  );
  const [availableSkills, setAvailableSkills] = useState<{ id_skill_master: string; nama_skill: string }[]>([]);

  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "portfolio">("overview");

  // Portfolio state
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [isAddPortfolioOpen, setIsAddPortfolioOpen] = useState(false);
  const [previewPortfolio, setPreviewPortfolio] = useState<PortfolioItem | null>(null);

  // Edit profile modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUniv, setEditUniv] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAlamat, setEditAlamat] = useState("");
  const [editTagline, setEditTagline] = useState("");
  const [editSkills, setEditSkills] = useState<UserSkill[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Add Portfolio states
  const [newPortfolioTitle, setNewPortfolioTitle] = useState("");
  const [newPortfolioDesc, setNewPortfolioDesc] = useState("");
  const [newPortfolioFile, setNewPortfolioFile] = useState<File | null>(null);
  const [isSubmittingPortfolio, setIsSubmittingPortfolio] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeletingPortfolio, setIsDeletingPortfolio] = useState(false);

  // Reviews from API
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const showFeedback = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text: string, fieldName: string, label: string) => {
    if (!text || text === "-" || text === "[Disembunyikan]") return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      showFeedback(`${label} berhasil disalin!`);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const getWhatsAppUrl = (phoneStr: string, targetName: string) => {
    if (!phoneStr || phoneStr === "-" || phoneStr === "[Disembunyikan]") return null;
    let cleanNumber = phoneStr.replace(/\D/g, "");
    if (cleanNumber.startsWith("0")) {
      cleanNumber = "62" + cleanNumber.slice(1);
    }
    const text = encodeURIComponent(`Halo ${targetName}, saya melihat profil Anda di platform CEPAT.`);
    return `https://wa.me/${cleanNumber}?text=${text}`;
  };

  // Sync state if initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.nama_lengkap || "Pengguna CEPAT");
      setUniv(initialData.pendidikan_terakhir || "");
      setBio(initialData.bio || "");
      setEmail(initialData.email || "");
      setPhone(initialData.no_telpon || initialData.no_hp || "");
      setAlamat(initialData.alamat || "");
      setRating(
        typeof initialData.rating_avg === "number" && initialData.rating_avg > 0
          ? Number(initialData.rating_avg.toFixed(1))
          : 0
      );
      setCompletedCount(initialData.total_completed || 0);
      setAvatarUrl(initialData.avatar_url || null);
      setRoleName(initialData.role?.nama_role === "Requester" ? "Pemberi Tugas" : "Pekerja");
      setTagline(initialData.tagline || "");
      setIsVerified(initialData.is_verified || false);
      setSkills(
        initialData.skills_user?.map((su: any) => ({
          id_skill_master: su.skills_master?.id_skill_master || su.id_skills_master || "",
          nama_skill: su.skills_master?.nama_skill || su.nama_skill || "Keahlian",
          deskripsi_pengalaman: su.deskripsi_pengalaman || "",
          certificate_url: su.certificate_url || "",
        })) || initialData?.skills || []
      );
    }
  }, [initialData]);

  // Load available skills master
  useEffect(() => {
    fetch("/api/skills")
      .then((res) => (res.ok ? res.json() : { success: false, data: [] }))
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setAvailableSkills(data.data);
        }
      })
      .catch((err) => console.error("Gagal memuat master skills:", err));
  }, []);

  // Sync / Fetch user profile from API if initialData not complete
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const endpoint = isCurrentUser ? "/api/users/me" : `/api/users/${userId}`;
        const res = await fetch(endpoint);
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));

        if (data.success && data.data) {
          const u = data.data;
          setName(u.nama_lengkap || "Pengguna CEPAT");
          setUniv(u.pendidikan_terakhir || "");
          setBio(u.bio || "");
          setEmail(u.email || "");
          setPhone(u.no_hp || u.no_telpon || "");
          setAlamat(u.alamat || "");
          setRating(typeof u.rating_avg === "number" && u.rating_avg > 0 ? Number(u.rating_avg.toFixed(1)) : 0);
          setCompletedCount(u.total_completed || 0);
          setAvatarUrl(u.avatar_url || null);
          setRoleName(u.role?.nama_role === "Requester" ? "Pemberi Tugas" : "Pekerja");
          setTagline(u.tagline || "");
          setIsVerified(u.is_verified || false);
          setSkills(
            u.skills_user?.map((su: any) => ({
              id_skill_master: su.skills_master?.id_skill_master || su.id_skills_master,
              nama_skill: su.skills_master?.nama_skill || su.nama_skill || "Keahlian",
              deskripsi_pengalaman: su.deskripsi_pengalaman,
              certificate_url: su.certificate_url,
            })) || u.skills || []
          );
        }
      } catch (err) {
        console.error("Gagal memuat profil pengguna:", err);
      }
    }

    if (!initialData) {
      fetchUserProfile();
    }
  }, [userId, isCurrentUser, initialData]);

  // Load Reviews
  useEffect(() => {
    async function loadReviews() {
      try {
        setLoadingReviews(true);
        const targetId = isCurrentUser ? "me" : targetProfileId || userId;
        const res = await fetch(`/api/reviews/user/${targetId}`);
        if (!res.ok) {
          setReviews([]);
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (data.success && Array.isArray(data.data)) {
          setReviews(data.data);
          if (data.data.length > 0) {
            const avg = data.data.reduce((acc: number, r: ReviewData) => acc + r.rating, 0) / data.data.length;
            setRating(Number(avg.toFixed(1)));
          }
        }
      } catch (err) {
        console.error("Gagal load reviews:", err);
      } finally {
        setLoadingReviews(false);
      }
    }

    loadReviews();
  }, [userId, isCurrentUser, targetProfileId]);

  // Load Portfolio
  useEffect(() => {
    async function loadPortfolio() {
      try {
        setLoadingPortfolio(true);
        const targetId = isCurrentUser ? user?.id_user || initialData?.id_user : targetProfileId || userId;
        if (!targetId || targetId === "me") return;
        const res = await fetch(`/api/portfolio?user_id=${targetId}`);
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (data.success && Array.isArray(data.data)) {
          setPortfolio(data.data);
        }
      } catch (err) {
        console.error("Gagal load portfolio:", err);
      } finally {
        setLoadingPortfolio(false);
      }
    }
    loadPortfolio();
  }, [userId, isCurrentUser, targetProfileId, user?.id_user, initialData?.id_user]);

  // Rating breakdown stats
  const ratingStats = useMemo(() => {
    const total = reviews.length;
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[rounded] = (counts[rounded] || 0) + 1;
    });

    return {
      total,
      breakdown: [5, 4, 3, 2, 1].map((stars) => ({
        stars,
        count: counts[stars],
        pct: total > 0 ? Math.round((counts[stars] / total) * 100) : 0,
      })),
    };
  }, [reviews]);

  // Avatar Upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showFeedback("Hanya file gambar yang diperbolehkan.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showFeedback("Ukuran gambar maksimal 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/users/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAvatarUrl(data.avatar_url);
        showFeedback("Foto profil berhasil diperbarui!");
      } else {
        showFeedback(data.message || "Gagal mengunggah foto profil.");
      }
    } catch (err) {
      console.error("Gagal upload avatar:", err);
      showFeedback("Terjadi kesalahan koneksi.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenEdit = () => {
    setEditName(name);
    setEditUniv(univ);
    setEditBio(bio);
    setEditPhone(phone === "-" ? "" : phone);
    setEditAlamat(alamat === "-" ? "" : alamat);
    setEditTagline(tagline);
    setEditSkills(skills);
    setIsEditOpen(true);
  };

  const handleAddPortfolio = async () => {
    if (!newPortfolioTitle.trim() || !newPortfolioFile) {
      showFeedback("Judul dan gambar portofolio wajib diisi.");
      return;
    }

    setIsSubmittingPortfolio(true);
    try {
      const formData = new FormData();
      formData.append("file", newPortfolioFile);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.success) {
        showFeedback("Gagal mengunggah gambar portofolio.");
        setIsSubmittingPortfolio(false);
        return;
      }

      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newPortfolioTitle,
          description: newPortfolioDesc,
          image_url: uploadData.url,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPortfolio([data.data, ...portfolio]);
        setIsAddPortfolioOpen(false);
        setNewPortfolioTitle("");
        setNewPortfolioDesc("");
        setNewPortfolioFile(null);
        showFeedback("Portofolio berhasil ditambahkan!");
      } else {
        showFeedback("Gagal menambahkan portofolio.");
      }
    } catch (e) {
      showFeedback("Terjadi kesalahan.");
    } finally {
      setIsSubmittingPortfolio(false);
    }
  };

  const executeDeletePortfolio = async () => {
    if (!deleteConfirmId) return;
    setIsDeletingPortfolio(true);
    try {
      const res = await fetch(`/api/portfolio?id=${deleteConfirmId}`, { method: "DELETE" });
      if (res.ok) {
        setPortfolio(portfolio.filter((p) => p.id_portfolio !== deleteConfirmId));
        setPreviewPortfolio(null);
        showFeedback("Portofolio dihapus.");
      } else {
        showFeedback("Gagal menghapus portofolio.");
      }
    } catch (e) {
      showFeedback("Terjadi kesalahan sistem.");
    } finally {
      setIsDeletingPortfolio(false);
      setDeleteConfirmId(null);
    }
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_lengkap: editName,
          pendidikan_terakhir: editUniv,
          bio: editBio,
          no_telpon: editPhone,
          alamat: editAlamat,
          tagline: editTagline,
        }),
      });

      await fetch("/api/users/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: editSkills }),
      });

      if (res.ok) {
        setName(editName);
        setUniv(editUniv);
        setBio(editBio);
        setPhone(editPhone || "-");
        setAlamat(editAlamat || "-");
        setTagline(editTagline || "");
        setSkills(editSkills);
        setIsEditOpen(false);
        showFeedback("Profil berhasil diperbarui!");
      }
    } catch (err: any) {
      console.error("Gagal update profil:", err);
      showFeedback(err.message || "Gagal menyimpan perubahan.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: idLocale,
      });
    } catch {
      return "baru saja";
    }
  };

  const waUrl = getWhatsAppUrl(phone, name);

  return (
    <div className="flex-1 bg-surface font-sans overflow-y-auto min-h-screen pb-28 lg:pb-12">
      {/* Toast Floating Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[100000] bg-on-surface text-surface px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-2xl border border-white/10 flex items-center gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN PROFILE CONTAINER (Clean, focused card without decorative banner waste) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 flex flex-col gap-6">
        {/* ───────────── IDENTITY & REPUTATION CARD ───────────── */}
        <div className="bg-surface-container-lowest border border-card-border rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            {/* Avatar + Info */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary flex items-center justify-center font-bold text-2xl sm:text-3xl shadow-sm overflow-hidden shrink-0 group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-headline tracking-tight">{name.substring(0, 2).toUpperCase()}</span>
                )}

                {isCurrentUser && (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                      id="avatar-upload-input"
                    />
                    <label
                      htmlFor="avatar-upload-input"
                      className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                      title="Ganti Foto Profil"
                    >
                      <Camera className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-semibold">Ubah</span>
                    </label>
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 text-white">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-headline text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                    {name}
                  </h1>
                  {isVerified && (
                    <div title="Akun Terverifikasi CEPAT">
                      <CheckCircle2 className="w-4.5 h-4.5 text-primary fill-primary/20 shrink-0" />
                    </div>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-mono font-bold uppercase tracking-wider border border-primary/20">
                    {roleName}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-1 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-primary shrink-0" />
                  <span>{univ || "Mahasiswa Aktif"}</span>
                </p>

                {tagline && (
                  <p className="text-xs text-on-surface-variant/80 font-medium mt-1 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{tagline}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {isCurrentUser ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Wallet className="w-3.5 h-3.5 text-primary" />}
                    onClick={() => router.push("/wallet")}
                    className="flex-1 sm:flex-initial min-h-[40px] text-xs font-bold"
                  >
                    Dompet
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Edit3 className="w-3.5 h-3.5" />}
                    onClick={handleOpenEdit}
                    className="flex-1 sm:flex-initial min-h-[40px] text-xs font-bold"
                  >
                    Edit Profil
                  </Button>
                </>
              ) : (
                <>
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs min-h-[40px] shadow-2xs transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  {email && email !== "[Disembunyikan]" && (
                    <a
                      href={`mailto:${email}`}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-low border border-card-border hover:border-primary/40 active:scale-95 text-on-surface font-bold text-xs min-h-[40px] transition-all"
                    >
                      <Mail className="w-4 h-4 text-primary" />
                      <span>Email</span>
                    </a>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Share2 className="w-3.5 h-3.5" />}
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.share) {
                        navigator.share({ title: name, url: window.location.href });
                      } else {
                        copyToClipboard(window.location.href, "share", "Link profil");
                      }
                    }}
                    className="min-h-[40px] text-xs font-bold"
                  >
                    Bagikan
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* ───────────── ESSENTIAL REPUTATION METRICS (2 Clean Cards) ───────────── */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-5 border-t border-card-border/80">
            {/* Stat 1: Rating */}
            <div className="p-4 rounded-xl bg-surface-container-low/70 border border-card-border flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-on-surface-variant block mb-1">
                  Reputasi Rating
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-on-surface tabular-nums">
                    {rating > 0 ? rating.toFixed(1) : "-"}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">/ 5.0</span>
                </div>
                <span className="text-[11px] text-on-surface-variant font-medium">
                  {reviews.length > 0 ? `${reviews.length} ulasan klien` : "Belum ada ulasan"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
              </div>
            </div>

            {/* Stat 2: Completed Tasks */}
            <div className="p-4 rounded-xl bg-surface-container-low/70 border border-card-border flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-on-surface-variant block mb-1">
                  Tugas Diselesaikan
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-on-surface tabular-nums">
                    {completedCount}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">pekerjaan</span>
                </div>
                <span className="text-[11px] text-on-surface-variant font-medium">
                  {completedCount > 0 ? "Telah terverifikasi selesai" : "Belum ada riwayat"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* ───────────── PROFILE TABS (3 Core Tabs) ───────────── */}
        <div>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "overview" | "reviews" | "portfolio")}
            variant="pill"
          >
            <TabsList className="w-fit flex-nowrap overflow-x-auto p-1 bg-surface-container-low rounded-2xl border border-card-border">
              <TabsTrigger value="overview">
                <User className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span>Tentang &amp; Keahlian</span>
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <MessageSquare className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span>Ulasan ({reviews.length})</span>
              </TabsTrigger>
              <TabsTrigger value="portfolio">
                <Briefcase className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span>Portofolio ({portfolio.length})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* ───────────── TAB CONTENT ───────────── */}
        <div className="mt-1">
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Left 2 Cols: Bio & Skills */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                {/* Bio Card */}
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-card-border">
                  <h3 className="font-headline text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Tentang Saya
                  </h3>
                  <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                    {bio || "Pengguna ini belum menambahkan deskripsi profil."}
                  </p>
                </div>

                {/* Skills List */}
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-card-border">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-card-border">
                    <h3 className="font-headline text-base font-bold text-on-surface flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      Keahlian Terverifikasi ({skills.length})
                    </h3>
                    {isCurrentUser && (
                      <Button variant="ghost" size="sm" onClick={handleOpenEdit} className="text-xs text-primary font-bold">
                        Kelola
                      </Button>
                    )}
                  </div>

                  {skills.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {skills.map((skillObj, idx) => {
                        if (!skillObj.nama_skill) return null;
                        return (
                          <div
                            key={idx}
                            className="p-3.5 bg-surface-container-low/70 rounded-xl border border-card-border flex flex-col justify-between gap-2"
                          >
                            <div>
                              <div className="inline-flex items-center gap-1.5 bg-primary/10 px-2.5 py-0.5 rounded-full text-xs font-bold text-primary capitalize mb-1 border border-primary/15">
                                <Sparkles className="w-3 h-3" />
                                <span>{skillObj.nama_skill}</span>
                              </div>
                              {skillObj.deskripsi_pengalaman && (
                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                  {skillObj.deskripsi_pengalaman}
                                </p>
                              )}
                            </div>
                            {skillObj.certificate_url && (
                              <a
                                href={skillObj.certificate_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline font-mono"
                              >
                                <span>Lihat Sertifikat</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-surface-container-low rounded-xl border border-dashed border-card-border">
                      <p className="text-xs text-on-surface-variant font-medium">Belum ada keahlian yang ditambahkan.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Col: Contact & Shortcuts */}
              <div className="flex flex-col gap-6">
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-card-border">
                  <h3 className="font-headline text-base font-bold text-on-surface mb-4 flex items-center gap-2 pb-3 border-b border-card-border">
                    <Mail className="w-4 h-4 text-primary" />
                    Informasi Kontak
                  </h3>

                  <div className="flex flex-col gap-3 font-sans text-xs">
                    {/* Email */}
                    <div className="p-3 rounded-xl bg-surface-container-low/60 border border-card-border flex items-center justify-between">
                      <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                        <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider font-bold">
                          Email
                        </span>
                        <span className="font-medium text-on-surface truncate">{email || "-"}</span>
                      </div>
                      {email && email !== "[Disembunyikan]" && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(email, "email", "Email")}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary transition-colors shrink-0"
                          title="Salin Email"
                        >
                          {copiedField === "email" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="p-3 rounded-xl bg-surface-container-low/60 border border-card-border flex items-center justify-between">
                      <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                        <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider font-bold">
                          No. WhatsApp / HP
                        </span>
                        <span className="font-medium text-on-surface truncate">{phone || "-"}</span>
                      </div>
                      {phone && phone !== "[Disembunyikan]" && phone !== "-" && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(phone, "phone", "No. Telepon")}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary transition-colors"
                            title="Salin No. Telepon"
                          >
                            {copiedField === "phone" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                              title="Buka WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    <div className="p-3 rounded-xl bg-surface-container-low/60 border border-card-border">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider font-bold">
                          Domisili / Alamat
                        </span>
                        <span className="font-medium text-on-surface leading-relaxed">{alamat || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shortcuts & Security info */}
                {isCurrentUser && (
                  <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-card-border flex flex-col gap-2">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider font-mono mb-1">
                      Menu Pintas
                    </span>
                    <Link
                      href="/history/riwayat"
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors text-xs font-semibold text-on-surface"
                    >
                      <span className="flex items-center gap-2">
                        <History className="w-4 h-4 text-primary" />
                        Riwayat Transaksi &amp; Tugas
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-on-surface-variant" />
                    </Link>
                    <Link
                      href="/wallet"
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors text-xs font-semibold text-on-surface"
                    >
                      <span className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-primary" />
                        Dompet &amp; Penarikan Saldo
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-on-surface-variant" />
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "reviews" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Star Rating Breakdown */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-card-border h-fit">
                <h3 className="font-headline text-base font-bold text-on-surface mb-4">Ringkasan Ulasan</h3>
                <div className="flex items-baseline gap-3 mb-5">
                  <span className="font-mono text-4xl sm:text-5xl font-black text-on-surface tabular-nums">
                    {rating.toFixed(1)}
                  </span>
                  <div className="flex flex-col">
                    <RatingStars rating={rating} size="sm" showScore={false} />
                    <span className="text-xs text-on-surface-variant mt-1 font-mono">
                      Dari {reviews.length} ulasan
                    </span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-card-border pt-4">
                  {ratingStats.breakdown.map((item) => (
                    <div key={item.stars} className="flex items-center gap-2.5 text-xs">
                      <span className="w-6 font-mono font-bold text-on-surface flex items-center gap-0.5">
                        {item.stars}★
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-300"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-mono text-xs text-on-surface-variant tabular-nums">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review List */}
              <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-card-border">
                <h3 className="font-headline text-base font-bold text-on-surface mb-4 pb-3 border-b border-card-border">
                  Semua Ulasan ({reviews.length})
                </h3>

                {loadingReviews ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <span className="text-xs font-medium">Memuat ulasan...</span>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-on-surface-variant text-center bg-surface-container-low/50 rounded-xl border border-card-border/60 border-dashed">
                    <MessageSquare className="w-8 h-8 text-on-surface-variant/30" />
                    <p className="text-xs font-medium">Belum ada ulasan yang diterima.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {reviews.map((rev) => (
                      <div
                        key={rev.id_reviews}
                        className="p-4 bg-surface-container-low/60 rounded-xl border border-card-border"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-primary/10 text-primary font-bold rounded-lg flex items-center justify-center text-xs uppercase font-mono">
                              {rev.rater?.nama_lengkap?.substring(0, 2) || "AN"}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-on-surface">
                                {rev.rater?.nama_lengkap || "Pengguna CEPAT"}
                              </span>
                              <span className="text-[10px] text-on-surface-variant font-mono">
                                {formatTime(rev.created_at)}
                              </span>
                            </div>
                          </div>
                          <RatingStars rating={rev.rating} size="sm" showScore={false} />
                        </div>
                        {rev.comment && (
                          <p className="text-xs text-on-surface leading-relaxed pl-10.5">
                            &ldquo;{rev.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "portfolio" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-5"
            >
              {isCurrentUser && (
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setIsAddPortfolioOpen(true)}
                    className="text-xs font-bold"
                  >
                    Tambah Portofolio
                  </Button>
                </div>
              )}

              {loadingPortfolio ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : portfolio.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {portfolio.map((item) => (
                    <div
                      key={item.id_portfolio}
                      className="group rounded-xl overflow-hidden cursor-pointer border border-card-border bg-surface-container-lowest shadow-2xs hover:border-primary/40 transition-all flex flex-col"
                      onClick={() => setPreviewPortfolio(item)}
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-surface-container-low">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <div className="p-3.5 flex flex-col flex-1 justify-between">
                        <h4 className="font-headline font-bold text-xs text-on-surface truncate group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[10px] text-on-surface-variant font-mono mt-1">
                          {new Date(item.created_at).toLocaleDateString("id-ID", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-surface-container-lowest rounded-2xl border border-dashed border-card-border flex flex-col items-center justify-center gap-2">
                  <Briefcase className="w-10 h-10 text-on-surface-variant/30" />
                  <h3 className="text-xs font-bold text-on-surface">Belum Ada Karya Portofolio</h3>
                  <p className="text-xs text-on-surface-variant max-w-sm">
                    {isCurrentUser
                      ? "Unggah hasil karya atau bukti pekerjaan Anda untuk meyakinkan pemberi tugas."
                      : "Pekerja ini belum menambahkan karya portofolio."}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* ───────────── EDIT PROFILE MODAL ───────────── */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Profil Saya">
        <div className="flex flex-col gap-4 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar text-xs">
          <div>
            <label className="font-semibold text-on-surface block mb-1">Nama Lengkap</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full p-2.5 bg-surface-container-low border border-card-border rounded-lg text-on-surface text-xs focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-on-surface block mb-1">Asal Kampus / Instansi</label>
            <input
              type="text"
              value={editUniv}
              onChange={(e) => setEditUniv(e.target.value)}
              placeholder="Contoh: Universitas Diponegoro"
              className="w-full p-2.5 bg-surface-container-low border border-card-border rounded-lg text-on-surface text-xs focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-on-surface block mb-1">Tagline Profesi Singkat</label>
            <input
              type="text"
              value={editTagline}
              onChange={(e) => setEditTagline(e.target.value)}
              placeholder="Contoh: Spesialis Desain Grafis & Fotografi"
              className="w-full p-2.5 bg-surface-container-low border border-card-border rounded-lg text-on-surface text-xs focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-on-surface block mb-1">Bio / Deskripsi Profil</label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              rows={3}
              placeholder="Ceritakan latar belakang, pengalaman, dan kesiapan kerja Anda..."
              className="w-full p-2.5 bg-surface-container-low border border-card-border rounded-lg text-on-surface text-xs focus:border-primary focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-on-surface block mb-1">No. WhatsApp / HP</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full p-2.5 bg-surface-container-low border border-card-border rounded-lg text-on-surface text-xs focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="font-semibold text-on-surface block mb-1">Domisili / Alamat</label>
              <input
                type="text"
                value={editAlamat}
                onChange={(e) => setEditAlamat(e.target.value)}
                placeholder="Contoh: Tembalang, Semarang"
                className="w-full p-2.5 bg-surface-container-low border border-card-border rounded-lg text-on-surface text-xs focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Edit Skills list */}
          <div className="border-t border-card-border pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-on-surface">Keahlian Saya</label>
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const item = availableSkills.find((s) => s.id_skill_master === val);
                  if (item && !editSkills.some((s) => s.id_skill_master === val)) {
                    setEditSkills([
                      ...editSkills,
                      {
                        id_skill_master: item.id_skill_master,
                        nama_skill: item.nama_skill,
                        deskripsi_pengalaman: "",
                        certificate_url: "",
                      },
                    ]);
                  }
                  e.target.value = "";
                }}
                className="text-xs bg-surface-container-low border border-card-border rounded-lg p-1.5 text-on-surface"
              >
                <option value="">+ Tambah Keahlian</option>
                {availableSkills
                  .filter((s) => !editSkills.some((es) => es.id_skill_master === s.id_skill_master))
                  .map((s) => (
                    <option key={s.id_skill_master} value={s.id_skill_master}>
                      {s.nama_skill}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-2">
              {editSkills.map((sk, idx) => (
                <div key={idx} className="p-2.5 bg-surface-container-low rounded-lg border border-card-border flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">{sk.nama_skill}</span>
                    <button
                      type="button"
                      onClick={() => setEditSkills(editSkills.filter((_, i) => i !== idx))}
                      className="text-error hover:bg-error-container/20 p-1 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Pengalaman singkat..."
                    value={sk.deskripsi_pengalaman || ""}
                    onChange={(e) => {
                      const updated = [...editSkills];
                      updated[idx].deskripsi_pengalaman = e.target.value;
                      setEditSkills(updated);
                    }}
                    className="p-1.5 bg-surface-container-lowest border border-card-border rounded text-[11px] text-on-surface"
                  />
                  <input
                    type="url"
                    placeholder="Link sertifikat / portofolio (opsional)..."
                    value={sk.certificate_url || ""}
                    onChange={(e) => {
                      const updated = [...editSkills];
                      updated[idx].certificate_url = e.target.value;
                      setEditSkills(updated);
                    }}
                    className="p-1.5 bg-surface-container-lowest border border-card-border rounded text-[11px] text-on-surface font-mono"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-card-border">
            <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(false)}>
              Batal
            </Button>
            <Button size="sm" onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan Profil"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ───────────── ADD PORTFOLIO MODAL ───────────── */}
      <Modal isOpen={isAddPortfolioOpen} onClose={() => setIsAddPortfolioOpen(false)} title="Tambah Portofolio">
        <div className="flex flex-col gap-3.5 text-xs">
          <div>
            <label className="font-semibold text-on-surface block mb-1">Judul Karya / Pekerjaan *</label>
            <input
              type="text"
              placeholder="Contoh: Desain Banner Kuliner UMKM"
              value={newPortfolioTitle}
              onChange={(e) => setNewPortfolioTitle(e.target.value)}
              className="w-full p-2.5 bg-surface-container-low border border-card-border rounded-lg text-on-surface text-xs focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="font-semibold text-on-surface block mb-1">Deskripsi Singkat</label>
            <textarea
              placeholder="Jelaskan peran Anda dalam proyek ini..."
              rows={3}
              value={newPortfolioDesc}
              onChange={(e) => setNewPortfolioDesc(e.target.value)}
              className="w-full p-2.5 bg-surface-container-low border border-card-border rounded-lg text-on-surface text-xs focus:border-primary focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="font-semibold text-on-surface block mb-1">Upload Bukti Gambar / Foto *</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewPortfolioFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-on-surface-variant file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-card-border">
            <Button variant="secondary" size="sm" onClick={() => setIsAddPortfolioOpen(false)}>
              Batal
            </Button>
            <Button size="sm" onClick={handleAddPortfolio} disabled={isSubmittingPortfolio}>
              {isSubmittingPortfolio ? "Mengunggah..." : "Tambah Portofolio"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ───────────── PREVIEW PORTFOLIO MODAL ───────────── */}
      {previewPortfolio && (
        <Modal
          isOpen={!!previewPortfolio}
          onClose={() => {
            setPreviewPortfolio(null);
            setDeleteConfirmId(null);
          }}
          title={previewPortfolio.title}
        >
          <div className="flex flex-col gap-3">
            <div className="rounded-xl overflow-hidden bg-surface-container-low max-h-[350px]">
              <img
                src={previewPortfolio.image_url}
                alt={previewPortfolio.title}
                className="w-full h-full object-contain"
              />
            </div>
            {previewPortfolio.description && (
              <p className="text-xs text-on-surface-variant leading-relaxed">{previewPortfolio.description}</p>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-card-border">
              <span className="text-[10px] text-on-surface-variant font-mono">
                Diunggah pada{" "}
                {new Date(previewPortfolio.created_at).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              {isCurrentUser && (
                <div>
                  {deleteConfirmId === previewPortfolio.id_portfolio ? (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-xs"
                      >
                        Batal
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={executeDeletePortfolio}
                        disabled={isDeletingPortfolio}
                        className="text-xs text-error border-error/40 hover:bg-error-container/20"
                      >
                        {isDeletingPortfolio ? "Menghapus..." : "Yakin Hapus"}
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(previewPortfolio.id_portfolio)}
                      className="text-xs text-error font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Portofolio</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

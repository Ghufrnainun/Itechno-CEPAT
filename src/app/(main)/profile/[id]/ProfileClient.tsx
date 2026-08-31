"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useCurrentRole } from "@/app/(main)/layout";
import { SdgBadge } from "@/components/ui/SdgBadge";
import { Button } from "@/components/ui/Button";
import { RatingStars } from "@/components/ui/RatingStars";
import { Modal } from "@/components/ui/Modal";
import { BadgeDisplay, BadgeProps } from "@/components/ui/BadgeDisplay";
import { StreakCalendar } from "@/components/ui/StreakCalendar";
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
  Globe,
  Trophy,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  ShieldCheck,
  Briefcase,
  TrendingUp,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Phone,
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

  // Profile data states initialized with initialData (if provided by SSR)
  const [name, setName] = useState(initialData?.nama_lengkap || "Pengguna CEPAT");
  const [univ, setUniv] = useState(initialData?.pendidikan_terakhir || "");
  const [bio, setBio] = useState(initialData?.bio || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.no_telpon || initialData?.no_hp || "");
  const [alamat, setAlamat] = useState(initialData?.alamat || "");
  const [roleName, setRoleName] = useState(initialData?.role?.nama_role || "Worker");
  const [skills, setSkills] = useState<UserSkill[]>(
    initialData?.skills_user?.map((su: any) => ({
      id_skill_master: su.skills_master?.id_skill_master || su.id_skills_master || "",
      nama_skill: su.skills_master?.nama_skill || su.nama_skill || "Keahlian",
      deskripsi_pengalaman: su.deskripsi_pengalaman || "",
      certificate_url: su.certificate_url || "",
    })) || initialData?.skills || []
  );
  const [availableSkills, setAvailableSkills] = useState<{ id_skill_master: string; nama_skill: string }[]>([]);

  const [rating, setRating] = useState(initialData?.rating_avg || 0);
  const [completedCount, setCompletedCount] = useState(initialData?.total_completed || 0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData?.avatar_url || null);
  
  // Gamification states
  const [xp, setXp] = useState(initialData?.xp || 0);
  const [level, setLevel] = useState(initialData?.level || 1);
  const [badges, setBadges] = useState<{ badge: BadgeProps }[]>(initialData?.user_badges || []);
  const [streak, setStreak] = useState(initialData?.user_streak?.current_streak || 0);
  const [tagline, setTagline] = useState(initialData?.tagline || "");
  const [isVerified, setIsVerified] = useState(initialData?.is_verified || false);

  const [hasApiData, setHasApiData] = useState(!!initialData);
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "sdg" | "portfolio">("overview");

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
      setRating(typeof initialData.rating_avg === 'number' && initialData.rating_avg > 0 ? Number(initialData.rating_avg.toFixed(1)) : 0);
      setCompletedCount(initialData.total_completed || 0);
      setAvatarUrl(initialData.avatar_url || null);
      setRoleName(initialData.role?.nama_role || "Worker");
      setXp(initialData.xp || 0);
      setLevel(initialData.level || 1);
      setBadges(initialData.user_badges || []);
      setStreak(initialData.user_streak?.current_streak || 0);
      setTagline(initialData.tagline || "");
      setIsVerified(initialData.is_verified || false);
      setSkills(
        initialData.skills_user?.map((su: any) => ({
          id_skill_master: su.skills_master?.id_skill_master || su.id_skills_master || "",
          nama_skill: su.skills_master?.nama_skill || su.nama_skill || "Keahlian",
          deskripsi_pengalaman: su.deskripsi_pengalaman || "",
          certificate_url: su.certificate_url || "",
        })) || initialData.skills || []
      );
      setHasApiData(true);
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

  // Sync / Fetch user profile from API if initialData not complete or on client update
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
          setRating(typeof u.rating_avg === 'number' && u.rating_avg > 0 ? Number(u.rating_avg.toFixed(1)) : 0);
          setCompletedCount(u.total_completed || 0);
          setAvatarUrl(u.avatar_url || null);
          setRoleName(u.role?.nama_role || "Worker");
          setXp(u.xp || 0);
          setLevel(u.level || 1);
          setBadges(u.user_badges || []);
          setStreak(u.user_streak?.current_streak || 0);
          setTagline(u.tagline || "");
          setIsVerified(u.is_verified || false);
          setSkills(u.skills_user?.map((su: any) => ({
            id_skill_master: su.skills_master?.id_skill_master || su.id_skills_master,
            nama_skill: su.skills_master?.nama_skill || su.nama_skill || "Keahlian",
            deskripsi_pengalaman: su.deskripsi_pengalaman,
            certificate_url: su.certificate_url,
          })) || u.skills || []);
          setHasApiData(true);
        }
      } catch (err) {
        console.error("Gagal memuat profil pengguna:", err);
      }
    }

    if (!initialData) {
      fetchUserProfile();
    }
  }, [userId, isCurrentUser, initialData]);

  // Load Reviews for this profile
  useEffect(() => {
    async function loadReviews() {
      try {
        setLoadingReviews(true);
        const targetId = isCurrentUser ? "me" : (targetProfileId || userId);
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
        const targetId = isCurrentUser ? (user?.id_user || initialData?.id_user) : (targetProfileId || userId);
        if (!targetId || targetId === "me") return; // Need actual ID for DB
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

  // Calculate Rating Distribution
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

  // Handle Avatar Upload
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

  const handleDeletePortfolio = (id: string) => {
    setDeleteConfirmId(id);
  };

  const executeDeletePortfolio = async () => {
    if (!deleteConfirmId) return;
    setIsDeletingPortfolio(true);
    try {
      const res = await fetch(`/api/portfolio?id=${deleteConfirmId}`, { method: "DELETE" });
      if (res.ok) {
        setPortfolio(portfolio.filter(p => p.id_portfolio !== deleteConfirmId));
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

      // Save skills
      await fetch('/api/users/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      {/* PREMIUM HERO COVER / BANNER */}
      <div className="h-44 sm:h-52 md:h-64 w-full bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 relative overflow-hidden">
        {/* Subtle mesh background textures */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(52,211,153,0.22),transparent_45%),radial-gradient(circle_at_85%_75%,rgba(16,185,129,0.18),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

        {/* Top Badges Floating Ribbon */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-8 flex items-center gap-2.5">
          {email && (univ || phone || completedCount > 0) ? (
            <div className="bg-surface-container-lowest/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-card-border/80 text-on-surface text-[11px] font-mono font-bold flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>Akun Terverifikasi</span>
            </div>
          ) : (
            <div className="bg-surface-container-lowest/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-card-border/80 text-on-surface-variant text-[11px] font-mono font-medium flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <span>Profil Belum Lengkap</span>
            </div>
          )}
        </div>
      </div>

      {/* MAIN PROFILE CONTAINER */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* HEADER & IDENTITY BAR */}
        <div className="relative -mt-16 sm:-mt-20 md:-mt-24 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-card-border">
          
          {/* Identity & Avatar Section */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            
            {/* Double-Bezel High-End Avatar Frame */}
            <div className="p-1.5 rounded-3xl bg-surface-container-lowest border-2 border-card-border shadow-lg shrink-0 w-fit">
              <div
                className={cn(
                  "w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary flex items-center justify-center font-bold text-3xl sm:text-4xl md:text-5xl shadow-inner relative overflow-hidden group",
                  isCurrentUser && "cursor-pointer"
                )}
              >
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
                      id="avatar-upload-main"
                    />
                    <label
                      htmlFor="avatar-upload-main"
                      className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer text-white"
                      title="Ganti Foto Profil"
                    >
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[11px] font-semibold">Ubah Foto</span>
                    </label>
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-10 text-white">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Name, University, Role, Tagline details */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">
                  {name}
                </h1>
                {isVerified && (
                  <div title="Akun Terverifikasi CEPAT">
                    <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20 shrink-0" />
                  </div>
                )}
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-mono font-bold uppercase tracking-wider border border-primary/20">
                  {roleName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/40 text-secondary text-[10px] font-mono font-bold uppercase tracking-wider border border-secondary/20">
                  Level {level}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 mt-2 text-xs sm:text-sm">
                <p className="text-on-surface-variant font-medium flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-primary shrink-0" />
                  <span>{univ || "Mahasiswa Aktif"}</span>
                </p>
                
                {tagline && (
                  <>
                    <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-on-surface-variant/40 shrink-0" />
                    <p className="text-on-surface-variant font-medium flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-primary shrink-0" />
                      <span>{tagline}</span>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            {isCurrentUser ? (
              <>
                <Button
                  variant="secondary"
                  size="md"
                  icon={<Wallet className="w-4 h-4 text-primary" />}
                  onClick={() => router.push("/wallet")}
                  className="flex-1 sm:flex-initial min-h-[44px] text-xs font-bold shadow-xs hover:border-primary/40"
                >
                  Dompet Poin
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  icon={<Edit3 className="w-4 h-4" />}
                  onClick={handleOpenEdit}
                  className="flex-1 sm:flex-initial min-h-[44px] text-xs font-bold shadow-sm"
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
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs min-h-[44px] shadow-sm transition-all"
                  >
                    <MessageCircle className="w-4 h-4 fill-white/20" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {email && email !== "[Disembunyikan]" && (
                  <a
                    href={`mailto:${email}`}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-card-border hover:border-primary/40 active:scale-95 text-on-surface font-bold text-xs min-h-[44px] shadow-xs transition-all"
                  >
                    <Mail className="w-4 h-4 text-primary" />
                    <span>Kirim Email</span>
                  </a>
                )}
                <Button
                  variant="secondary"
                  size="md"
                  icon={<Share2 className="w-4 h-4" />}
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.share) {
                      navigator.share({ title: name, url: window.location.href });
                    } else {
                      copyToClipboard(window.location.href, "share", "Link profil");
                    }
                  }}
                  className="flex-1 sm:flex-initial min-h-[44px] text-xs font-bold shadow-xs"
                >
                  Bagikan
                </Button>
              </>
            )}
          </div>
        </div>

        {/* METRICS RIBBON (BENTO STAT BAR) */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 md:gap-4 mt-6">
          {/* Stat 1: Rating Score */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-card-border shadow-xs hover:border-primary/30 transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Reputasi Rating</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 group-hover:scale-110 transition-transform">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              {rating > 0 || reviews.length > 0 ? (
                <>
                  <span className="font-mono text-2xl sm:text-3xl font-black text-on-surface tabular-nums">
                    {rating > 0 ? rating.toFixed(1) : '-'}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">/ 5.0</span>
                </>
              ) : (
                <>
                  <span className="font-mono text-2xl sm:text-3xl font-black text-on-surface-variant tabular-nums">
                    -
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">Belum ada rating</span>
                </>
              )}
            </div>
          </div>

          {/* Stat 2: Completed Tasks */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-card-border shadow-xs hover:border-primary/30 transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Tugas Selesai</span>
              <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl sm:text-3xl font-black text-on-surface tabular-nums">
                {completedCount > 0 ? completedCount : '-'}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                {completedCount > 0 ? 'pekerjaan' : 'Belum ada task'}
              </span>
            </div>
          </div>

          {/* Stat 3: Total Reviews */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-card-border shadow-xs hover:border-primary/30 transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Total Ulasan</span>
              <div className="p-2 rounded-xl bg-secondary-container/40 text-secondary group-hover:scale-110 transition-transform">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl sm:text-3xl font-black text-on-surface tabular-nums">
                {reviews.length > 0 ? reviews.length : '-'}
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                {reviews.length > 0 ? 'ulasan klien' : 'Belum ada ulasan'}
              </span>
            </div>
          </div>

          {/* Stat 4: Escrow Trust Rating */}
          {(() => {
            const hasReviews = reviews.length > 0;
            const positiveReviews = reviews.filter((r) => r.rating >= 4).length;
            const trustScorePercent = hasReviews
              ? Math.round((positiveReviews / reviews.length) * 100)
              : completedCount > 0
                ? Math.min(100, Math.round(((rating || 5) / 5) * 100))
                : null;

            return (
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-card-border shadow-xs hover:border-primary/30 transition-all flex flex-col justify-between group">
                <div className="flex items-center justify-between text-on-surface-variant mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Trust Score</span>
                  <div className={cn(
                    "p-2 rounded-xl group-hover:scale-110 transition-transform",
                    trustScorePercent !== null && trustScorePercent >= 75
                      ? "bg-emerald-500/10 text-emerald-600"
                      : trustScorePercent !== null
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-surface-container text-on-surface-variant"
                  )}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  {trustScorePercent !== null ? (
                    <>
                      <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-600 tabular-nums">
                        {trustScorePercent}%
                      </span>
                      <span className="text-xs text-on-surface-variant font-medium">
                        {trustScorePercent >= 80 ? 'Sangat Aman' : trustScorePercent >= 60 ? 'Cukup Aman' : 'Perlu Evaluasi'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-mono text-2xl sm:text-3xl font-black text-on-surface-variant tabular-nums">
                        -
                      </span>
                      <span className="text-xs text-on-surface-variant font-medium">Belum ada data</span>
                    </>
                  )}
                </div>
              </div>
            );
          })()}
        </section>

        {/* INTERACTIVE MOTION NAVIGATION TABS */}
        <div className="mt-8">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "overview" | "reviews" | "sdg" | "portfolio")}
            variant="pill"
          >
            <TabsList className="w-fit flex-nowrap overflow-x-auto p-1 bg-surface-container-low rounded-2xl border border-card-border">
              <TabsTrigger value="overview">
                <User className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span>Tentang &amp; Keahlian</span>
              </TabsTrigger>
              <TabsTrigger value="portfolio">
                <Briefcase className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span>Portofolio ({portfolio.length})</span>
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <MessageSquare className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span>Ulasan ({reviews.length})</span>
              </TabsTrigger>
              <TabsTrigger value="sdg">
                <Globe className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span>Dampak SDG 8</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* TAB CONTENT PANELS */}
        <div className="mt-6">
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Left 2 Cols: Bio, Skills, Gamification */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* Bio Card */}
                <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-7 shadow-xs border border-card-border">
                  <h3 className="font-headline text-base font-bold text-on-surface mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Tentang Saya
                  </h3>
                  <p className="font-body-sm text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                    {bio || "Pengguna ini belum menambahkan deskripsi profil."}
                  </p>
                </div>

                {/* Skills Master Card */}
                <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-7 shadow-xs border border-card-border">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {skills.map((skillObj, idx) => {
                        if (!skillObj.nama_skill) return null;
                        return (
                          <div
                            key={idx}
                            className="flex flex-col justify-between gap-2.5 p-4 bg-surface-container-low/70 rounded-2xl border border-card-border hover:border-primary/30 transition-all"
                          >
                            <div>
                              <div className="inline-flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full text-xs font-bold text-primary capitalize mb-2 border border-primary/15">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>{skillObj.nama_skill}</span>
                              </div>

                              {skillObj.deskripsi_pengalaman && (
                                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                                  {skillObj.deskripsi_pengalaman}
                                </p>
                              )}
                            </div>

                            {skillObj.certificate_url && (
                              <a
                                href={skillObj.certificate_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline mt-1 font-mono"
                              >
                                <span>Lihat Portofolio / Sertifikat</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-surface-container-low rounded-2xl border border-dashed border-card-border flex flex-col items-center justify-center gap-2">
                      <Award className="w-8 h-8 text-on-surface-variant/30" />
                      <p className="text-xs text-on-surface-variant font-medium">Belum ada keahlian yang ditambahkan.</p>
                    </div>
                  )}
                </div>

                {/* Achievement / Gamification Section */}
                <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-7 shadow-xs border border-card-border">
                  <h3 className="font-headline text-base font-bold text-on-surface mb-5 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    Pencapaian & Peringkat
                  </h3>
                  
                  <div className="flex items-center justify-between mb-5 bg-gradient-to-br from-primary/5 via-primary/10 to-surface-container-low p-5 rounded-2xl border border-primary/15">
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 font-mono">Level Saat Ini</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-primary font-mono tabular-nums">{level}</span>
                        <span className="text-sm font-bold text-on-surface font-mono">{xp} XP</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 font-mono">Streak Aktif</p>
                      <div className="flex items-center justify-end gap-1.5 text-amber-600 font-bold">
                        <span className="text-xl font-black font-mono">🔥 {streak} Hari</span>
                      </div>
                    </div>
                  </div>

                  {/* Streak Calendar Heatmap */}
                  <div className="mb-5">
                    <StreakCalendar />
                  </div>

                  <h4 className="font-headline text-xs font-bold text-on-surface mb-3 flex items-center gap-2">
                    Lencana Terkumpul ({badges.length})
                  </h4>
                  {badges.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                      {badges.map((b, i) => (
                        <BadgeDisplay key={i} badge={b.badge} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-surface-container-low rounded-2xl border border-dashed border-card-border">
                      <p className="text-xs text-on-surface-variant font-medium">Belum ada lencana yang diraih.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Col: Interactive Contact Info & Security Guarantee */}
              <div className="flex flex-col gap-6">
                
                {/* Contact Card */}
                <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-card-border">
                  <h3 className="font-headline text-base font-bold text-on-surface mb-4 flex items-center gap-2 pb-3 border-b border-card-border">
                    <Mail className="w-4 h-4 text-primary" />
                    Informasi Kontak
                  </h3>

                  <div className="flex flex-col gap-4 font-sans text-xs">
                    {/* Email Row */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low/60 border border-card-border group">
                      <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                        <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider font-bold flex items-center gap-1">
                          Email
                          <Lock className="w-3 h-3 text-outline-variant" />
                        </span>
                        <span className="font-medium text-on-surface truncate">{email || "-"}</span>
                      </div>
                      {email && email !== "[Disembunyikan]" && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(email, "email", "Email")}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                          title="Salin Email"
                        >
                          {copiedField === "email" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>

                    {/* Phone / WA Row */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low/60 border border-card-border group">
                      <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                        <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider font-bold flex items-center gap-1">
                          No. Telepon / WhatsApp
                        </span>
                        <span className="font-medium text-on-surface truncate">{phone || "-"}</span>
                      </div>
                      {phone && phone !== "[Disembunyikan]" && phone !== "-" && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(phone, "phone", "No. Telepon")}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
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

                    {/* Location Row */}
                    <div className="p-3 rounded-xl bg-surface-container-low/60 border border-card-border">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider font-bold">
                          Domisili Kampus / Alamat
                        </span>
                        <span className="font-medium text-on-surface leading-relaxed">{alamat || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Safety Guarantee Banner */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-surface-container-lowest border border-primary/20 flex items-start gap-3.5 shadow-xs">
                  <div className="p-2 rounded-xl bg-primary text-on-primary shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-headline text-xs font-bold text-on-surface mb-1">Jaminan Escrow CEPAT</h4>
                    <p className="font-body-sm text-[11px] text-on-surface-variant leading-relaxed">
                      Seluruh transaksi freelance di platform CEPAT terproteksi rekening penampung (escrow otomatis) hingga tugas dinyatakan selesai &amp; disetujui.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "portfolio" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              {isCurrentUser && (
                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    size="md"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => setIsAddPortfolioOpen(true)}
                    className="text-xs font-bold shadow-sm"
                  >
                    Tambah Portofolio
                  </Button>
                </div>
              )}

              {loadingPortfolio ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="w-7 h-7 text-primary animate-spin" />
                </div>
              ) : portfolio.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {portfolio.map((item) => (
                    <div 
                      key={item.id_portfolio} 
                      className="group rounded-2xl overflow-hidden cursor-pointer border border-card-border bg-surface-container-lowest shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col"
                      onClick={() => setPreviewPortfolio(item)}
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-surface-container-low">
                        <img 
                          src={item.image_url} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <span className="text-white text-xs font-bold flex items-center gap-1.5">
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Lihat Detail</span>
                          </span>
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-1 justify-between">
                        <h4 className="font-headline font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">{item.title}</h4>
                        <p className="text-[11px] text-on-surface-variant font-mono mt-1">
                          {new Date(item.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-dashed border-card-border flex flex-col items-center justify-center gap-3">
                  <Briefcase className="w-12 h-12 text-on-surface-variant/30" />
                  <h3 className="text-sm font-bold text-on-surface">Belum Ada Karya Portofolio</h3>
                  <p className="text-xs text-on-surface-variant max-w-sm">
                    {isCurrentUser 
                      ? "Unggah hasil karya atau bukti pekerjaan Anda untuk menarik perhatian pemberi tugas." 
                      : "Pekerja ini belum mengunggah karya portofolio apapun."}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "reviews" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Left Column: Star Rating Distribution Breakdown */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-card-border h-fit">
                <h3 className="font-headline text-base font-bold text-on-surface mb-4">Ringkasan Ulasan</h3>
                
                <div className="flex items-baseline gap-3 mb-5">
                  <span className="font-mono text-4xl sm:text-5xl font-black text-on-surface tabular-nums">
                    {rating.toFixed(1)}
                  </span>
                  <div className="flex flex-col">
                    <RatingStars rating={rating} size="sm" showScore={false} />
                    <span className="text-xs text-on-surface-variant mt-1 font-mono">
                      Dari total {reviews.length} ulasan
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 border-t border-card-border pt-5">
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

              {/* Right Column: Review List */}
              <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-card-border">
                <h3 className="font-headline text-base font-bold text-on-surface mb-5 pb-3 border-b border-card-border">
                  Semua Ulasan Klien ({reviews.length})
                </h3>

                {loadingReviews ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
                    <Loader2 className="w-7 h-7 text-primary animate-spin" />
                    <span className="text-xs font-medium">Memuat ulasan...</span>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-on-surface-variant text-center bg-surface-container-low/50 rounded-2xl border border-card-border/60 border-dashed">
                    <MessageSquare className="w-10 h-10 text-on-surface-variant/30" />
                    <p className="text-xs font-medium">Belum ada ulasan yang diterima.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((rev) => (
                      <div
                        key={rev.id_reviews}
                        className="p-4 sm:p-5 bg-surface-container-low/60 rounded-2xl border border-card-border hover:border-primary/20 transition-all"
                      >
                        <div className="flex justify-between items-start mb-2.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 text-primary font-bold rounded-xl flex items-center justify-center text-xs uppercase border border-primary/20 font-mono shrink-0">
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
                          <p className="font-body-sm text-xs sm:text-sm text-on-surface leading-relaxed pl-13">
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

          {activeTab === "sdg" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-7 shadow-xs border border-card-border">
                <h3 className="font-headline text-base font-bold text-on-surface mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  Kontribusi Nyata Terhadap SDG 8
                </h3>
                <p className="font-body-sm text-xs sm:text-sm text-on-surface-variant mb-5 leading-relaxed">
                  Platform CEPAT dirancang untuk mendukung tujuan pembangunan berkelanjutan PBB (SDG 8: Decent Work and Economic Growth) dengan memberdayakan mahasiswa dan UMKM lokal melalui pekerjaan mikro yang layak, transparan, dan terukur.
                </p>
                <div className="mt-2">
                  <SdgBadge />
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-7 shadow-xs border border-card-border flex flex-col justify-between">
                <div>
                  <h3 className="font-headline text-base font-bold text-on-surface mb-3.5 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Indikator Dampak Lokal
                  </h3>
                  <ul className="space-y-3 text-xs text-on-surface-variant font-sans">
                    <li className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low border border-card-border">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>Kompensasi adil dan transparan tanpa potongan tersembunyi</span>
                    </li>
                    <li className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low border border-card-border">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>Jarak pengerjaan fleksibel di sekitar radius kampus (hemat waktu &amp; emisi)</span>
                    </li>
                    <li className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low border border-card-border">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>Sistem reputasi peer-to-peer membangun portofolio profesional mahasiswa</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Profil Pengguna">
        <div className="flex flex-col gap-4 max-h-[72dvh] overflow-y-auto custom-scrollbar pr-1 font-sans text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-on-surface">Nama Lengkap</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-surface-container-low border border-card-border rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:bg-surface-container-lowest focus:outline-none min-h-[42px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-on-surface">Tagline / Pekerjaan Utama</label>
            <input
              type="text"
              value={editTagline}
              onChange={(e) => setEditTagline(e.target.value)}
              className="w-full bg-surface-container-low border border-card-border rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:bg-surface-container-lowest focus:outline-none min-h-[42px]"
              placeholder="Contoh: Frontend Developer & UI Designer"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-on-surface">Pendidikan Terakhir / Universitas</label>
            <input
              type="text"
              value={editUniv}
              onChange={(e) => setEditUniv(e.target.value)}
              className="w-full bg-surface-container-low border border-card-border rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:bg-surface-container-lowest focus:outline-none min-h-[42px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-on-surface">Bio / Deskripsi Singkat</label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              className="w-full bg-surface-container-low border border-card-border rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:bg-surface-container-lowest focus:outline-none min-h-[85px] leading-relaxed"
              placeholder="Ceritakan keahlian atau kesiapan kerja Anda..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-on-surface">No. Telepon / WA</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full bg-surface-container-low border border-card-border rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:bg-surface-container-lowest focus:outline-none min-h-[42px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-on-surface">Alamat / Area Kampus</label>
              <input
                type="text"
                value={editAlamat}
                onChange={(e) => setEditAlamat(e.target.value)}
                className="w-full bg-surface-container-low border border-card-border rounded-xl p-3 text-xs text-on-surface focus:border-primary focus:bg-surface-container-lowest focus:outline-none min-h-[42px]"
              />
            </div>
          </div>

          {/* Skill Edit Section */}
          <div className="flex flex-col gap-3 mt-3 pt-4 border-t border-card-border">
            <div className="flex justify-between items-center">
              <div>
                <label className="font-bold text-on-surface text-sm">Keahlian &amp; Portofolio</label>
                <p className="text-[11px] text-on-surface-variant">Tambahkan keahlian yang relevan untuk menarik requester.</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (availableSkills.length > 0) {
                    setEditSkills([
                      ...editSkills,
                      {
                        id_skill_master: availableSkills[0].id_skill_master,
                        nama_skill: availableSkills[0].nama_skill,
                        deskripsi_pengalaman: "",
                        certificate_url: "",
                      },
                    ]);
                  }
                }}
              >
                Tambah
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              {editSkills.map((skill, idx) => (
                <div key={idx} className="flex flex-col gap-2.5 p-4 border border-card-border rounded-2xl bg-surface-container-low relative">
                  <button
                    type="button"
                    onClick={() => setEditSkills(editSkills.filter((_, i) => i !== idx))}
                    className="absolute top-3 right-3 text-on-surface-variant hover:text-error transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-error-container/30 cursor-pointer"
                    title="Hapus Keahlian"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col gap-1 pr-8">
                    <label className="font-semibold text-on-surface-variant">Pilih Bidang Keahlian</label>
                    <select
                      value={skill.id_skill_master}
                      onChange={(e) => {
                        const newSkills = [...editSkills];
                        const selectedMaster = availableSkills.find((s) => s.id_skill_master === e.target.value);
                        if (selectedMaster) {
                          newSkills[idx].id_skill_master = selectedMaster.id_skill_master;
                          newSkills[idx].nama_skill = selectedMaster.nama_skill;
                        }
                        setEditSkills(newSkills);
                      }}
                      className="p-2.5 border border-card-border rounded-xl bg-surface-container-lowest text-xs text-on-surface font-medium outline-none focus:border-primary capitalize min-h-[40px]"
                    >
                      {availableSkills.map((cat) => (
                        <option key={cat.id_skill_master} value={cat.id_skill_master}>
                          {cat.nama_skill}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-on-surface-variant">Pengalaman Singkat</label>
                    <textarea
                      value={skill.deskripsi_pengalaman || ""}
                      onChange={(e) => {
                        const newSkills = [...editSkills];
                        newSkills[idx].deskripsi_pengalaman = e.target.value;
                        setEditSkills(newSkills);
                      }}
                      className="p-2.5 border border-card-border rounded-xl bg-surface-container-lowest text-xs min-h-[60px] outline-none focus:border-primary resize-y"
                      placeholder="Ceritakan pengalaman atau proyek terkait skill ini..."
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-on-surface-variant">Link Sertifikat / Drive (Opsional)</label>
                    <input
                      type="url"
                      value={skill.certificate_url || ""}
                      onChange={(e) => {
                        const newSkills = [...editSkills];
                        newSkills[idx].certificate_url = e.target.value;
                        setEditSkills(newSkills);
                      }}
                      className="p-2.5 border border-card-border rounded-xl bg-surface-container-lowest text-xs outline-none focus:border-primary min-h-[40px]"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                </div>
              ))}

              {editSkills.length === 0 && (
                <div className="text-center p-5 bg-surface-container-low border border-card-border/60 border-dashed rounded-2xl">
                  <p className="text-xs text-on-surface-variant">Belum ada keahlian yang ditambahkan.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-4 pt-3.5 border-t border-card-border">
          <Button variant="secondary" size="md" onClick={() => setIsEditOpen(false)}>
            Batal
          </Button>
          <Button variant="primary" size="md" onClick={handleSaveEdit} disabled={isSaving}>
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </Modal>

      {/* ADD PORTFOLIO MODAL */}
      <Modal isOpen={isAddPortfolioOpen} onClose={() => setIsAddPortfolioOpen(false)} title="Tambah Portofolio">
        <div className="flex flex-col gap-4 max-h-[72dvh] overflow-y-auto custom-scrollbar font-sans text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-on-surface">Judul Proyek</label>
            <input
              type="text"
              value={newPortfolioTitle}
              onChange={(e) => setNewPortfolioTitle(e.target.value)}
              className="w-full bg-surface-container-low border border-card-border rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none min-h-[42px]"
              placeholder="Contoh: Pembuatan Website E-Commerce Kampus"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-on-surface">Deskripsi</label>
            <textarea
              value={newPortfolioDesc}
              onChange={(e) => setNewPortfolioDesc(e.target.value)}
              className="w-full bg-surface-container-low border border-card-border rounded-xl p-3 text-on-surface focus:border-primary focus:outline-none min-h-[85px] leading-relaxed"
              placeholder="Ceritakan peran Anda dan tantangan yang diselesaikan..."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-bold text-on-surface">Unggah Gambar</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewPortfolioFile(e.target.files?.[0] || null)}
              className="w-full bg-surface-container-low border border-card-border rounded-xl p-2.5 text-on-surface file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-4 pt-3.5 border-t border-card-border">
          <Button variant="secondary" size="md" onClick={() => setIsAddPortfolioOpen(false)}>
            Batal
          </Button>
          <Button variant="primary" size="md" onClick={handleAddPortfolio} disabled={isSubmittingPortfolio}>
            {isSubmittingPortfolio ? "Mengunggah..." : "Tambahkan"}
          </Button>
        </div>
      </Modal>

      {/* PORTFOLIO PREVIEW MODAL */}
      <Modal isOpen={!!previewPortfolio} onClose={() => setPreviewPortfolio(null)} title="Detail Portofolio">
        {previewPortfolio && (
          <div className="flex flex-col gap-4 font-sans text-xs">
            <img src={previewPortfolio.image_url} alt={previewPortfolio.title} className="w-full rounded-2xl max-h-96 object-contain bg-surface-container-low border border-card-border" />
            <div>
              <h3 className="font-headline font-bold text-lg text-on-surface mb-1">{previewPortfolio.title}</h3>
              <p className="text-on-surface-variant font-medium text-xs mb-3 font-mono">
                Diunggah pada {new Date(previewPortfolio.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-on-surface leading-relaxed whitespace-pre-wrap">
                {previewPortfolio.description || "Tidak ada deskripsi tambahan."}
              </p>
            </div>
            
            {isCurrentUser && (
              <div className="flex justify-end pt-3 mt-2 border-t border-card-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-error border-error/30 hover:bg-error/10 hover:border-error hover:text-error"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => handleDeletePortfolio(previewPortfolio.id_portfolio)}
                >
                  Hapus Portofolio
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Hapus Portofolio?">
        <div className="flex flex-col gap-4 font-sans text-sm text-on-surface">
          <p>
            Apakah Anda yakin ingin menghapus karya portofolio ini? 
            Data yang telah dihapus tidak dapat dikembalikan.
          </p>
          <div className="flex items-center justify-end gap-2.5 mt-2 pt-4 border-t border-card-border">
            <Button variant="secondary" size="md" onClick={() => setDeleteConfirmId(null)} disabled={isDeletingPortfolio}>
              Batal
            </Button>
            <Button 
              variant="outline" 
              size="md" 
              onClick={executeDeletePortfolio} 
              disabled={isDeletingPortfolio}
              className="bg-error text-on-error border-error hover:bg-error/90 hover:text-on-error"
            >
              {isDeletingPortfolio ? "Menghapus..." : "Ya, Hapus"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

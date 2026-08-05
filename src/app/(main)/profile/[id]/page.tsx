"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { SKILL_CATEGORIES } from "@/constants/skills";
import { SdgBadge } from "@/components/ui/SdgBadge";
import { Button } from "@/components/ui/Button";
import { RatingStars } from "@/components/ui/RatingStars";
import { Modal } from "@/components/ui/Modal";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

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

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = (params?.id as string) || "budi";

  // Local storage profile values or defaults
  const [name, setName] = useState("Pengguna CEPAT");
  const [univ, setUniv] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [alamat, setAlamat] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hasApiData, setHasApiData] = useState(false);

  // Edit profile states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUniv, setEditUniv] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAlamat, setEditAlamat] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Reviews from API
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);

  // Load from API & local storage
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch(`/api/users/${userId === 'me' ? 'me' : userId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            if (json.data.nama_lengkap) setName(json.data.nama_lengkap);
            if (json.data.pendidikan_terakhir) setUniv(json.data.pendidikan_terakhir);
            if (json.data.bio) setBio(json.data.bio);
            if (json.data.email) setEmail(json.data.email);
            if (json.data.no_telpon) setPhone(json.data.no_telpon);
            if (json.data.alamat) setAlamat(json.data.alamat);
            if (json.data.rating_avg !== undefined) setRating(json.data.rating_avg);
            if (json.data.total_completed !== undefined) setCompletedCount(json.data.total_completed);
            if (json.data.avatar_url) setAvatarUrl(json.data.avatar_url);
            
            // Handle skills
            if (json.data.skills_user && Array.isArray(json.data.skills_user)) {
              const apiSkills = json.data.skills_user.map((su: any) => su.skills_master?.nama_skill).filter(Boolean);
              if (apiSkills.length > 0) {
                setSkills(apiSkills);
              }
            }

            setHasApiData(true);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    const savedName = localStorage.getItem("cepat_user_name");
    const savedUniv = localStorage.getItem("cepat_user_univ");
    const savedBio = localStorage.getItem("cepat_user_bio");
    const savedSkills = localStorage.getItem("cepat_user_skills");

    if (savedName) setName(savedName);
    if (savedUniv) setUniv(savedUniv);
    if (savedBio) setBio(savedBio);
    if (savedSkills) {
      try {
        setSkills(JSON.parse(savedSkills));
      } catch (e) {
        console.error(e);
      }
    }

    loadUser();
  }, []);

  // Fetch Reviews from Backend API
  useEffect(() => {
    async function fetchReviews() {
      try {
        setLoadingReviews(true);
        const res = await fetch(`/api/reviews/user/${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setReviews(data.data);
            if (data.data.length > 0) {
              const avg = data.data.reduce((acc: number, r: ReviewData) => acc + r.rating, 0) / data.data.length;
              setRating(Math.round(avg * 10) / 10);
            }
          }
        }
      } catch (err) {
        console.warn("Error fetching reviews:", err);
      } finally {
        setLoadingReviews(false);
      }
    }

    fetchReviews();
  }, [userId]);

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: idLocale });
    } catch {
      return dateStr;
    }
  };

  const handleOpenEdit = () => {
    setEditName(name);
    setEditUniv(univ);
    setEditBio(bio);
    setEditPhone(phone);
    setEditAlamat(alamat);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: editName,
          bio: editBio,
          pendidikan_terakhir: editUniv,
          no_telpon: editPhone,
          alamat: editAlamat
        })
      });
      if (res.ok) {
        setName(editName);
        setBio(editBio);
        setUniv(editUniv);
        setPhone(editPhone);
        setAlamat(editAlamat);
        setIsEditOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      // Simulate upload delay
      await new Promise(r => setTimeout(r, 1000));
      // Generate a deterministic adorable avatar based on the file name
      const newAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(file.name + Date.now())}`;
      
      // Update via API
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: newAvatar })
      });
      
      if (res.ok) {
        setAvatarUrl(newAvatar);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-surface-container-lowest font-sans pb-20 lg:pb-8">
      {/* Banner / Cover Image */}
      <div className="h-40 md:h-56 w-full bg-gradient-to-br from-primary via-teal-700 to-emerald-900 relative">
        <div className="absolute inset-0 bg-black/10"></div>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_1px,transparent_1px)] bg-[length:24px_24px]"></div>
      </div>

      {/* Profile Info Section (Overlapping Banner) */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 relative -mt-16 md:-mt-20">
        <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/60 p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-5">
            {/* Avatar */}
            <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-primary text-on-primary flex items-center justify-center font-bold text-4xl md:text-5xl shadow-md shrink-0 overflow-hidden relative group hover:scale-105 transition-transform duration-300 ${userId === 'me' ? 'cursor-pointer' : ''}`}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                name.substring(0, 2).toUpperCase()
              )}
              {userId === 'me' && (
                <>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarChange}
                    id="avatar-upload"
                  />
                  <label 
                    htmlFor="avatar-upload"
                    className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-white text-3xl" aria-hidden="true">photo_camera</span>
                  </label>
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                      <div className="w-8 h-8 rounded-full border-4 border-white border-t-transparent animate-spin"></div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Basic Info */}
            <div className="flex flex-col mb-1">
              <h1 className="font-headline-md text-2xl md:text-3xl font-bold text-on-surface flex items-center gap-2">
                {name}
                <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">verified</span>
              </h1>
              <p className="text-on-surface-variant font-medium mt-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">school</span>
                {univ}
              </p>
            </div>
          </div>

          {/* Stats & Actions */}
          <div className="flex flex-wrap items-center gap-4 md:mb-1">
            <div className="flex flex-col items-center p-3 bg-surface-container-low rounded-xl min-w-[100px] border border-outline-variant/50 relative hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <span className="text-xl font-bold text-on-surface flex items-center gap-1">
                {rating} 
                <span className="material-symbols-outlined text-amber-500 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">star</span>
              </span>
              <span className="text-xs text-on-surface-variant font-medium mt-0.5">Rating</span>
            </div>
            
            <div className="flex flex-col items-center p-3 bg-surface-container-low rounded-xl min-w-[100px] border border-outline-variant/50 relative hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <span className="text-xl font-bold text-on-surface">{completedCount}</span>
              <span className="text-xs text-on-surface-variant font-medium mt-0.5">Tugas Selesai</span>
            </div>

            <Button variant="primary" className="h-full py-4 px-6 rounded-xl font-bold shadow-xs hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all duration-300" onClick={handleOpenEdit}>
              <span className="material-symbols-outlined text-[20px] mr-2" aria-hidden="true">edit</span>
              Edit Profil
            </Button>
          </div>
        </div>

        {/* Content Tabs / Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pb-12">
          {/* Main Left Column (Bio & Reviews) */}
          <div className="md:col-span-2 flex flex-col gap-6">
            {/* Bio Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/60">
              <h3 className="text-lg font-bold text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]" aria-hidden="true">person</span>
                Tentang Saya
              </h3>
              <p className="text-on-surface-variant leading-relaxed text-sm">
                {bio}
              </p>
            </div>

            {/* Reviews Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/60">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/40">
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]" aria-hidden="true">rate_review</span>
                  Ulasan ({reviews.length})
                </h3>
              </div>
              
              {loadingReviews ? (
                <div className="py-8 flex flex-col items-center justify-center gap-3 text-on-surface-variant" aria-live="polite">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span className="text-sm font-medium">Memuat ulasan...</span>
                </div>
              ) : reviews.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-on-surface-variant text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30 border-dashed">
                  <span className="material-symbols-outlined text-[48px] text-primary/30" aria-hidden="true">reviews</span>
                  <p className="text-sm font-medium">Belum ada ulasan.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id_reviews} className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary/10 text-primary font-bold rounded-full flex items-center justify-center text-xs uppercase border border-primary/20">
                            {rev.rater?.nama_lengkap?.substring(0,2) || "AN"}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-on-surface">
                              {rev.rater?.nama_lengkap || "Pengguna CEPAT"}
                            </span>
                            <span className="text-[11px] text-on-surface-variant/80 font-mono">
                              {formatTime(rev.created_at)}
                            </span>
                          </div>
                        </div>
                        <RatingStars rating={rev.rating} size="sm" showScore={false} />
                      </div>
                      {rev.comment && (
                        <p className="text-sm text-on-surface-variant mt-2 pl-12">&quot;{rev.comment}&quot;</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Skills & Extra Info) */}
          <div className="flex flex-col gap-6">
            {/* Personal Info Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/60">
              <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2 pb-2 border-b border-outline-variant/40">
                <span className="material-symbols-outlined text-primary text-[20px]" aria-hidden="true">contact_mail</span>
                Informasi Pribadi
              </h3>
              
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider flex items-center gap-1">
                    Email
                    <span className="material-symbols-outlined text-[14px] text-outline" title="Tidak dapat diedit" aria-hidden="true">lock</span>
                  </span>
                  <span className="text-sm font-medium text-on-surface">{email || "-"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">No. Telepon</span>
                  <span className="text-sm font-medium text-on-surface">{phone || "-"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Alamat</span>
                  <span className="text-sm font-medium text-on-surface">{alamat || "-"}</span>
                </div>
              </div>
            </div>

            {/* Skills Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/60">
              <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center justify-between pb-2 border-b border-outline-variant/40">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]" aria-hidden="true">military_tech</span>
                  Keahlian
                </span>
              </h3>
              
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skillVal) => {
                    const skillInfo = SKILL_CATEGORIES.find((s) => s.value === skillVal);
                    if (!skillInfo) return null;
                    return (
                      <div
                        key={skillVal}
                        className="inline-flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full text-xs font-bold text-primary hover:scale-105 hover:bg-primary/15 transition-all cursor-default"
                      >
                        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{skillInfo.icon}</span>
                        <span>{skillInfo.label}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center justify-center text-center gap-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30 border-dashed">
                  <span className="material-symbols-outlined text-[32px] text-primary/30" aria-hidden="true">military_tech</span>
                  <p className="text-xs text-on-surface-variant font-medium">Belum ada keahlian ditambahkan.</p>
                </div>
              )}
            </div>

            {/* SDG Impact Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/60 overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                <span className="material-symbols-outlined text-[100px]" aria-hidden="true">public</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-3 flex items-center gap-2 relative z-10">
                <span className="material-symbols-outlined text-primary text-[20px]" aria-hidden="true">public</span> 
                Dampak SDG 8
              </h3>
              <p className="text-sm text-on-surface-variant mb-4 relative z-10 leading-relaxed">
                Setiap tugas selesai berkontribusi pada penyediaan lapangan kerja layak dan pertumbuhan ekonomi lokal.
              </p>
              <div className="relative z-10">
                <SdgBadge />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Profil">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-on-surface">Nama Lengkap</label>
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="p-2 border border-outline-variant rounded-md bg-surface text-on-surface outline-none focus:border-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-on-surface">Pendidikan Terakhir</label>
            <input type="text" value={editUniv} onChange={e => setEditUniv(e.target.value)} className="p-2 border border-outline-variant rounded-md bg-surface text-on-surface outline-none focus:border-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-on-surface">Bio</label>
            <textarea value={editBio} onChange={e => setEditBio(e.target.value)} className="p-2 border border-outline-variant rounded-md bg-surface text-on-surface min-h-[100px] outline-none focus:border-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-on-surface">No. Telepon</label>
            <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="p-2 border border-outline-variant rounded-md bg-surface text-on-surface outline-none focus:border-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-on-surface">Alamat</label>
            <input type="text" value={editAlamat} onChange={e => setEditAlamat(e.target.value)} className="p-2 border border-outline-variant rounded-md bg-surface text-on-surface outline-none focus:border-primary" />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
            <Button variant="primary" onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

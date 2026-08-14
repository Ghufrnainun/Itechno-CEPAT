"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCurrentRole } from "@/app/(main)/layout";
import { SdgBadge } from "@/components/ui/SdgBadge";
import Image from "next/image";
import { renderIcon } from "@/lib/icon-map";
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

export interface UserSkill {
  id_skill_master: string;
  nama_skill: string;
  deskripsi_pengalaman: string | null;
  certificate_url: string | null;
  icon?: string | null;
}

interface ProfileClientProps {
  initialData: any;
}

export default function ProfileClient({ initialData }: ProfileClientProps) {
  const router = useRouter();
  const params = useParams();
  const { user } = useCurrentRole();
  const userId = (params?.id as string) || "budi";
  const isCurrentUser = userId === "me" || (user?.id_user && userId === user.id_user);

  // Local storage profile values or defaults
  const [name, setName] = useState(initialData?.nama_lengkap || "Pengguna CEPAT");
  const [univ, setUniv] = useState(initialData?.pendidikan_terakhir || "");
  const [bio, setBio] = useState(initialData?.bio || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.no_telpon || "");
  const [alamat, setAlamat] = useState(initialData?.alamat || "");
  const [skills, setSkills] = useState<UserSkill[]>(initialData?.skills_user?.map((su: any) => ({
    id_skill_master: su.id_skills_master || "",
    nama_skill: su.skills_master?.nama_skill || "",
    deskripsi_pengalaman: su.deskripsi_pengalaman || "",
    certificate_url: su.certificate_url || "",
    icon: su.skills_master?.icon || null,
  })) || []);
  const [availableSkills, setAvailableSkills] = useState<{ id_skill_master: string; nama_skill: string }[]>([]);

  const [rating, setRating] = useState(initialData?.rating_avg || 0);
  const [completedCount, setCompletedCount] = useState(initialData?.total_completed || 0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData?.avatar_url || null);
  const [hasApiData, setHasApiData] = useState(!!initialData);

  // Edit profile states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUniv, setEditUniv] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAlamat, setEditAlamat] = useState("");
  const [editSkills, setEditSkills] = useState<UserSkill[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);


  // Reviews from API
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);

  // Load from API & local storage
  useEffect(() => {
    async function loadUser() {
      if (initialData) return;
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
              const apiSkills = json.data.skills_user
                .map((su: any) => ({
                  id_skill_master: su.id_skills_master || "",
                  nama_skill: su.skills_master?.nama_skill || "",
                  deskripsi_pengalaman: su.deskripsi_pengalaman || "",
                  certificate_url: su.certificate_url || "",
                  icon: su.skills_master?.icon || null,
                }))
                .filter((s: UserSkill) => s.id_skill_master);
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

    async function loadAvailableSkills() {
      try {
        const res = await fetch('/api/skills');
        const json = await res.json();
        if (json.success && json.data) {
          setAvailableSkills(json.data);
        }
      } catch (err) {
        console.error("Gagal mengambil master skills", err);
      }
    }

    loadAvailableSkills();
    loadUser();
  }, [userId, initialData]);

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
    setEditSkills([...skills]);
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

      // Save Skills to separate endpoint
      await fetch('/api/users/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: editSkills
        })
      });

      if (res.ok) {
        setName(editName);
        setBio(editBio);
        setUniv(editUniv);
        setPhone(editPhone);
        setAlamat(editAlamat);
        setSkills(editSkills);
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
        <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/60 p-5 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-5">
            {/* Avatar */}
            <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-primary text-on-primary flex items-center justify-center font-bold text-4xl md:text-5xl shadow-md shrink-0 overflow-hidden relative group hover:scale-105 transition-transform duration-300 ${isCurrentUser ? 'cursor-pointer' : ''}`}>
              {avatarUrl ? (
                <Image src={avatarUrl} alt={name} fill className="object-cover" />
              ) : (
                name.substring(0, 2).toUpperCase()
              )}
              {isCurrentUser && (
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
          <div className="flex flex-wrap items-center justify-start gap-3 md:gap-4 md:mb-1 w-full md:w-auto">
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

            {isCurrentUser && (
              <div className="flex items-center gap-3 w-full md:w-auto md:ml-auto mt-2 md:mt-0">
                <Button variant="secondary" className="flex-1 md:flex-none py-4 px-3 md:px-6 rounded-xl font-bold shadow-xs hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all duration-300" onClick={() => router.push("/wallet")}>
                  <span className="material-symbols-outlined text-[20px] mr-1.5 md:mr-2" aria-hidden="true">account_balance_wallet</span>
                  Dompet Poin
                </Button>
                <Button variant="primary" className="flex-1 md:flex-none py-4 px-3 md:px-6 rounded-xl font-bold shadow-xs hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all duration-300" onClick={handleOpenEdit}>
                  <span className="material-symbols-outlined text-[20px] mr-1.5 md:mr-2" aria-hidden="true">edit</span>
                  Edit Profil
                </Button>
              </div>
            )}
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
                <div className="flex flex-col gap-3">
                  {skills.map((skillObj, idx) => {
                    if (!skillObj.nama_skill) return null;
                    return (
                      <div
                        key={idx}
                        className="flex flex-col gap-2 p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30"
                      >
                        <div className="inline-flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full text-[13px] font-bold text-primary w-max hover:bg-primary/15 transition-colors cursor-default capitalize">
                          {renderIcon(skillObj.icon ?? null, "w-4 h-4 shrink-0")}
                          <span>{skillObj.nama_skill}</span>
                        </div>
                        
                        {skillObj.deskripsi_pengalaman && (
                          <p className="text-sm text-on-surface-variant leading-relaxed mt-1">
                            {skillObj.deskripsi_pengalaman}
                          </p>
                        )}
                        
                        {skillObj.certificate_url && !skillObj.certificate_url.toLowerCase().startsWith('javascript:') && (
                          <a
                            href={skillObj.certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline mt-1 w-max bg-primary/5 px-2 py-1 rounded-md"
                          >
                            <span className="material-symbols-outlined text-[14px]">link</span>
                            Lihat Sertifikat
                          </a>
                        )}
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
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
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

          {/* Skill Edit Section */}
          <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-outline-variant">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-on-surface">Keahlian & Sertifikat</label>
              <Button 
                variant="secondary" 
                className="px-2 py-1 text-xs h-auto" 
                onClick={() => {
                  if (availableSkills.length > 0) {
                    setEditSkills([...editSkills, { id_skill_master: availableSkills[0].id_skill_master, nama_skill: availableSkills[0].nama_skill, deskripsi_pengalaman: '', certificate_url: '' }]);
                  }
                }}
              >
                <span className="material-symbols-outlined text-[14px] mr-1">add</span>
                Tambah
              </Button>
            </div>
            
            <div className="flex flex-col gap-3">
              {editSkills.map((skill, idx) => (
                <div key={idx} className="flex flex-col gap-3 p-4 border border-outline-variant rounded-xl bg-surface-container-lowest relative group transition-colors hover:border-primary/50">
                  <button 
                    onClick={() => setEditSkills(editSkills.filter((_, i) => i !== idx))} 
                    className="absolute top-3 right-3 text-on-surface-variant hover:text-red-500 transition-colors w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50"
                    title="Hapus Keahlian"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                  
                  <div className="flex flex-col gap-1.5 pr-8">
                    <label className="text-xs font-bold text-on-surface-variant">Pilih Keahlian</label>
                    <select 
                      value={skill.id_skill_master} 
                      onChange={(e) => {
                        const newSkills = [...editSkills];
                        const selectedMaster = availableSkills.find(s => s.id_skill_master === e.target.value);
                        if (selectedMaster) {
                          newSkills[idx].id_skill_master = selectedMaster.id_skill_master;
                          newSkills[idx].nama_skill = selectedMaster.nama_skill;
                        }
                        setEditSkills(newSkills);
                      }} 
                      className="p-2 border border-outline-variant rounded-md bg-surface text-sm font-medium outline-none focus:border-primary capitalize"
                    >
                      {availableSkills.map(cat => <option key={cat.id_skill_master} value={cat.id_skill_master}>{cat.nama_skill}</option>)}
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Deskripsi (Opsional)</label>
                    <textarea 
                      value={skill.deskripsi_pengalaman || ''} 
                      onChange={(e) => {
                        const newSkills = [...editSkills];
                        newSkills[idx].deskripsi_pengalaman = e.target.value;
                        setEditSkills(newSkills);
                      }} 
                      className="p-2 border border-outline-variant rounded-md bg-surface text-sm min-h-[70px] outline-none focus:border-primary resize-y" 
                      placeholder="Ceritakan pengalaman atau proyek yang pernah kamu kerjakan terkait skill ini..." 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">link</span>
                      Tautan Sertifikat / Portofolio (Opsional)
                    </label>
                    <input 
                      type="url" 
                      value={skill.certificate_url || ''} 
                      onChange={(e) => {
                        const newSkills = [...editSkills];
                        newSkills[idx].certificate_url = e.target.value;
                        setEditSkills(newSkills);
                      }} 
                      className="p-2 border border-outline-variant rounded-md bg-surface text-sm outline-none focus:border-primary" 
                      placeholder="https://..." 
                    />
                  </div>
                </div>
              ))}
              
              {editSkills.length === 0 && (
                <div className="text-center p-4 bg-surface-container-lowest border border-outline-variant/30 border-dashed rounded-xl">
                  <p className="text-sm text-on-surface-variant">Belum ada keahlian ditambahkan.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-outline-variant">
          <Button variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
          <Button variant="primary" onClick={handleSaveEdit} disabled={isSaving}>
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

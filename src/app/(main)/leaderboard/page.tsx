"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Trophy, Star, Medal, User, HelpCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { Modal } from "@/components/ui/Modal";

interface LeaderboardUser {
  id_user: string;
  nama_lengkap: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  total_completed: number;
  rating_avg: number;
  rank?: number;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"current" | "last_month">("current");
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?period=${period}`);
        const json = await res.json();
        if (json.success) {
          setUsers(json.data);
          if (json.currentUser) setCurrentUser(json.currentUser);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, [period]);

  const AvatarIcon = ({ user }: { user: LeaderboardUser }) => {
    if (!user.avatar_url) {
      return (
        <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center font-bold font-mono">
          {user.nama_lengkap.substring(0, 2).toUpperCase()}
        </div>
      );
    }
    return (
      <img
        src={user.avatar_url}
        alt={user.nama_lengkap}
        className="w-full h-full object-cover"
      />
    );
  };

  return (
    <div className="flex-1 flex flex-col p-4 max-w-4xl mx-auto w-full pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-headline font-bold text-xl text-on-surface">Peringkat Pekerja</h1>
            <p className="font-body-sm text-xs text-on-surface-variant">Top worker ITechno Nasional (Direset Setiap Bulan)</p>
          </div>
        </div>
        <button 
          onClick={() => setIsHelpOpen(true)}
          className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
          title="Petunjuk & Aturan Leaderboard"
        >
          <HelpCircle className="w-6 h-6" />
        </button>
      </div>

      <div className="mb-6">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as "current" | "last_month")}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="current" className="flex-1 sm:flex-none font-bold">
              Saat Ini
            </TabsTrigger>
            <TabsTrigger value="last_month" className="flex-1 sm:flex-none font-bold">
              Bulan Lalu
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Top 3 Podium */}
          {users.length >= 3 && (
            <div className="flex justify-center items-end gap-3 md:gap-8 mb-10 pt-12 relative z-10">
              {/* Rank 2 */}
              <div className="flex flex-col items-center group cursor-default hover:-translate-y-2 transition-transform duration-300">
                <div className="relative mb-3">
                  <div className="absolute -inset-2 bg-gradient-to-b from-slate-300 to-slate-500 rounded-full blur-md opacity-30 group-hover:opacity-60 transition-opacity"></div>
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-[3px] border-slate-300 relative z-10 bg-surface shadow-lg">
                    <AvatarIcon user={users[1]} />
                  </div>
                  <div className="absolute -bottom-3 -right-2 bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black text-sm md:text-base shadow-lg border-2 border-surface z-20">2</div>
                </div>
                <div className="text-center w-24 md:w-28 bg-surface-container-low/80 backdrop-blur-sm p-2 rounded-xl border border-card-border shadow-sm group-hover:border-slate-300/50 transition-colors">
                  <p className="font-headline font-bold text-xs text-on-surface truncate">{users[1].nama_lengkap}</p>
                  <p className="font-mono text-[10px] md:text-xs text-primary font-bold mt-1">{users[1].xp} XP</p>
                </div>
              </div>
              
              {/* Rank 1 */}
              <div className="flex flex-col items-center -translate-y-8 md:-translate-y-12 group cursor-default hover:-translate-y-14 transition-transform duration-300 z-20">
                <div className="relative mb-3">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-400 z-30 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse">
                    <Trophy className="w-10 h-10 md:w-12 md:h-12" fill="currentColor" />
                  </div>
                  <div className="absolute -inset-3 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-full blur-lg opacity-40 group-hover:opacity-70 transition-opacity"></div>
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-yellow-400 relative z-10 bg-surface shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                    <AvatarIcon user={users[0]} />
                  </div>
                  <div className="absolute -bottom-4 -right-2 bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-lg shadow-xl border-[3px] border-surface z-20">1</div>
                </div>
                <div className="text-center w-32 md:w-36 bg-gradient-to-b from-surface-container-low to-surface-container border border-yellow-400/30 shadow-lg shadow-yellow-400/10 p-2.5 rounded-xl group-hover:border-yellow-400/60 transition-colors">
                  <p className="font-headline font-black text-sm text-on-surface truncate">{users[0].nama_lengkap}</p>
                  <p className="font-mono text-sm text-primary font-bold mt-1">{users[0].xp} XP</p>
                </div>
              </div>

              {/* Rank 3 */}
              <div className="flex flex-col items-center group cursor-default hover:-translate-y-2 transition-transform duration-300">
                <div className="relative mb-3">
                  <div className="absolute -inset-2 bg-gradient-to-b from-amber-600 to-amber-800 rounded-full blur-md opacity-20 group-hover:opacity-50 transition-opacity"></div>
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-[3px] border-amber-600 relative z-10 bg-surface shadow-lg">
                    <AvatarIcon user={users[2]} />
                  </div>
                  <div className="absolute -bottom-3 -right-2 bg-gradient-to-br from-amber-500 to-amber-700 text-amber-50 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black text-sm md:text-base shadow-lg border-2 border-surface z-20">3</div>
                </div>
                <div className="text-center w-24 md:w-28 bg-surface-container-low/80 backdrop-blur-sm p-2 rounded-xl border border-card-border shadow-sm group-hover:border-amber-600/50 transition-colors">
                  <p className="font-headline font-bold text-xs text-on-surface truncate">{users[2].nama_lengkap}</p>
                  <p className="font-mono text-[10px] md:text-xs text-primary font-bold mt-1">{users[2].xp} XP</p>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard List as Separate Cards */}
          <div className="flex flex-col gap-3">
            {(users.length >= 3 ? users.slice(3) : users).map((user, idx) => {
              const actualRank = users.length >= 3 ? idx + 4 : idx + 1;
              return (
                <div 
                  key={user.id_user} 
                  className="bg-surface-container-low rounded-2xl border border-card-border p-4 flex items-center gap-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all group cursor-default"
                >
                  <div className="w-8 font-mono font-bold text-on-surface-variant text-center group-hover:text-primary transition-colors text-lg">
                    {actualRank}
                  </div>
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-variant flex shrink-0 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                    <AvatarIcon user={user} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline font-bold text-base text-on-surface truncate group-hover:text-primary transition-colors">
                        {user.nama_lengkap}
                      </h3>
                      {currentUser?.id_user === user.id_user && (
                        <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                          Anda
                        </span>
                      )}
                    </div>
                    <div className="flex gap-4 mt-1.5 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1.5 bg-surface-variant/50 px-2 py-0.5 rounded-md"><Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> {user.rating_avg.toFixed(1)}</span>
                      <span className="flex items-center gap-1.5 bg-surface-variant/50 px-2 py-0.5 rounded-md"><Medal className="w-3.5 h-3.5 text-primary" /> Lvl {user.level}</span>
                    </div>
                  </div>
                  <div className="text-right pl-2 border-l border-card-border">
                    <p className="font-mono font-bold text-xl text-primary">{user.xp}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Current User Card */}
      {!isLoading && currentUser && (
        <div className="mt-8 pt-6 border-t border-card-border relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            Peringkat Anda
          </div>
          <div className="bg-gradient-to-r from-primary to-emerald-600 text-on-primary rounded-2xl p-5 shadow-xl shadow-primary/20 flex items-center gap-4 hover:scale-[1.02] transition-transform">
            <div className="w-10 font-mono font-bold text-center text-on-primary/90 text-2xl">
              #{currentUser.rank || "-"}
            </div>
            <div className="w-14 h-14 rounded-full overflow-hidden bg-on-primary/10 flex shrink-0 border-2 border-on-primary/30 shadow-inner">
              <AvatarIcon user={currentUser} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-headline font-bold text-lg truncate">Anda ({currentUser.nama_lengkap})</h3>
              <div className="flex gap-4 mt-1.5 text-xs text-on-primary/90 font-medium">
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 fill-current text-yellow-300" /> {currentUser.rating_avg?.toFixed(1) || "0.0"}</span>
                <span className="flex items-center gap-1.5"><Medal className="w-4 h-4" /> Lvl {currentUser.level || 1}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono font-bold text-3xl drop-shadow-md">{currentUser.xp || 0}</p>
              <p className="text-xs text-on-primary/80 uppercase font-bold tracking-wider mt-1">XP {period === 'current' ? 'SAAT INI' : 'BULAN LALU'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Help / Petunjuk */}
      <Modal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title="Informasi Papan Peringkat" maxWidth="md">
        <div className="space-y-4 text-sm text-on-surface-variant p-2 pb-6">
          <p>
            Papan Peringkat (Leaderboard) beroperasi menggunakan sistem <strong className="text-primary">Periode Bulanan</strong>. 
            Akumulasi poin (XP) Anda akan dihitung mulai dari awal hingga akhir bulan berjalan. Pada bulan berikutnya, perhitungan poin pada Papan Peringkat akan dimulai ulang dari awal untuk memberikan kesempatan yang adil bagi seluruh pekerja.
          </p>

          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
            <h3 className="font-headline font-bold text-on-surface mb-2 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              Kriteria Pemeringkatan
            </h3>
            <p className="mb-2">Posisi Anda di Papan Peringkat ditentukan secara berurutan berdasarkan kriteria berikut:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li><strong>Total Poin (XP)</strong> yang dikumpulkan pada bulan berjalan (Utama).</li>
              <li><strong>Total Pekerjaan Diselesaikan</strong> secara keseluruhan.</li>
              <li><strong>Rata-rata Penilaian (Rating)</strong> dari Klien.</li>
            </ol>
          </div>

          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
            <h3 className="font-headline font-bold text-on-surface mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              Perolehan Poin (XP)
            </h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Penyelesaian pekerjaan (Task) dengan status Sukses.</li>
              <li>Penerimaan ulasan dan penilaian (Rating) yang baik dari Klien.</li>
              <li>Konsistensi aktivitas harian (Daily Streak).</li>
            </ul>
          </div>

          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
            <h3 className="font-headline font-bold text-on-surface mb-2 flex items-center gap-2">
              <Medal className="w-4 h-4 text-primary" />
              Peningkatan Level Akun
            </h3>
            <p>
              Berbeda dengan Papan Peringkat, Level Akun Anda dihitung berdasarkan <strong>Total XP Keseluruhan</strong> yang telah Anda kumpulkan sejak pertama kali bergabung. Semakin tinggi pencapaian level Anda, semakin besar pula dedikasi yang dibutuhkan untuk mencapai level berikutnya. Terus tingkatkan performa Anda untuk mencapai level tertinggi.
            </p>
          </div>

          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
            <h3 className="font-headline font-bold text-on-surface mb-2 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Pencapaian Lencana (Badge)
            </h3>
            <p>
              Lencana merupakan bentuk apresiasi atas pencapaian khusus yang Anda raih secara otomatis setelah memenuhi kriteria tertentu (contoh: menyelesaikan tugas pertama, atau mencapai 100 penyelesaian tugas). Seluruh koleksi Lencana Anda dapat ditinjau melalui halaman Profil.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

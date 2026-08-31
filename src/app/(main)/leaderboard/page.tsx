"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Star, Flame, CheckCircle2, Users, Crown, TrendingUp, HelpCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
  id_user: string;
  nama_lengkap: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  total_completed: number;
  rating_avg: number;
  rank?: number;
  current_streak?: number | null;
  longest_streak?: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Progress XP ke level berikutnya. Target = level^2 * 100 */
function getXPProgress(xp: number, level: number) {
  const currentFloor = (level - 1) ** 2 * 100;
  const nextFloor = level ** 2 * 100;
  const pct = Math.min(100, Math.max(0, ((xp - currentFloor) / (nextFloor - currentFloor)) * 100));
  return { pct, currentFloor, nextFloor };
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

// ─── Components ──────────────────────────────────────────────────────────────

function AvatarIcon({ user, className }: { user: LeaderboardUser; className?: string }) {
  const [err, setErr] = useState(false);
  if (!user.avatar_url || err) {
    return (
      <div className={cn("w-full h-full bg-primary/10 text-primary flex items-center justify-center font-bold font-mono", className)}>
        {user.nama_lengkap.substring(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={user.avatar_url}
      alt={user.nama_lengkap}
      className={cn("w-full h-full object-cover", className)}
      onError={() => setErr(true)}
    />
  );
}

function LevelTag({ level }: { level: number }) {
  return <span className="font-mono text-[10px] font-bold text-on-surface-variant">Lv {level}</span>;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"current" | "last_month">("current");
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?period=${period}`);
        const json = await res.json();
        if (!cancelled && json.success) {
          setUsers(json.data || []);
          if (json.currentUser) {
            setCurrentUser(json.currentUser);
          } else {
            setCurrentUser(null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchLeaderboard();
    return () => {
      cancelled = true;
    };
  }, [period]);

  const currentUserId = currentUser?.id_user;
  const myRank = currentUser?.rank ?? (currentUserId ? users.findIndex((u) => u.id_user === currentUserId) + 1 : 0);
  const myUser = currentUser ?? (currentUserId ? users.find((u) => u.id_user === currentUserId) : undefined);

  const totalWorkers = users.length;
  const totalTasksDone = users.reduce((acc, u) => acc + (u.total_completed || 0), 0);
  const avgRating = users.length
    ? users.reduce((acc, u) => acc + (u.rating_avg || 0), 0) / users.length
    : 0;
  const topXP = users.length ? users[0].xp : 0;

  const podium = [users[1], users[0], users[2]].filter(Boolean) as LeaderboardUser[];

  return (
    <div className="flex-1 flex flex-col p-4 max-w-4xl mx-auto w-full pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-headline font-bold text-xl text-on-surface">Peringkat Pekerja</h1>
            <p className="font-body-sm text-xs text-on-surface-variant">Top worker CEPAT — raih XP & streak tertinggi (Direset Bulanan)</p>
          </div>
        </div>
        <button 
          onClick={() => setIsHelpOpen(true)}
          className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-full transition-colors cursor-pointer"
          title="Petunjuk & Aturan Leaderboard"
        >
          <HelpCircle className="w-6 h-6" />
        </button>
      </div>

      {/* Tabs */}
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
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center bg-surface-container-lowest border border-card-border rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Trophy className="w-7 h-7" />
          </div>
          <h2 className="font-headline font-bold text-base text-on-surface">Belum ada peringkat</h2>
          <p className="font-body-sm text-xs text-on-surface-variant max-w-xs">
            Selesaikan tugas pertamamu buat mulai mengumpulkan XP dan naik peringkat.
          </p>
          <Link
            href="/feed"
            className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-lg hover:bg-primary-container transition-colors"
          >
            Cari Tugas
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4 md:gap-5">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
            <div className="p-3 md:p-3.5 rounded-xl bg-surface-container-lowest border border-card-border shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-on-surface-variant">Total Pekerja</span>
              <span className="font-headline font-bold text-lg md:text-xl text-on-surface mt-1 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary shrink-0" /> {formatNumber(totalWorkers)}
              </span>
            </div>
            <div className="p-3 md:p-3.5 rounded-xl bg-surface-container-lowest border border-card-border shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-on-surface-variant">Tugas Selesai</span>
              <span className="font-headline font-bold text-lg md:text-xl text-on-surface mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" /> {formatNumber(totalTasksDone)}
              </span>
            </div>
            <div className="p-3 md:p-3.5 rounded-xl bg-surface-container-lowest border border-card-border shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-on-surface-variant">Rating Rata-rata</span>
              <span className="font-headline font-bold text-lg md:text-xl text-on-surface mt-1 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" /> {avgRating.toFixed(1)}
              </span>
            </div>
            <div className="p-3 md:p-3.5 rounded-xl bg-surface-container-lowest border border-card-border shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-on-surface-variant">Top XP</span>
              <span className="font-headline font-bold text-lg md:text-xl text-primary mt-1 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 shrink-0" /> {formatNumber(topXP)}
              </span>
            </div>
          </div>

          {/* Podium */}
          {podium.length >= 3 && (
            <div className="flex justify-center items-end gap-2 sm:gap-4 md:gap-6 pt-5 md:pt-6 mb-2">
              {/* Rank 2 */}
              <div className="flex flex-col items-center flex-1 max-w-[110px] sm:max-w-[130px]">
                <div className="relative mb-2">
                  <Link href={`/profile/${podium[0].id_user}`}>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-4 border-slate-300 bg-surface-container-lowest shadow-sm hover:scale-105 transition-transform">
                      <AvatarIcon user={podium[0]} />
                    </div>
                  </Link>
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md ring-2 ring-surface">2</div>
                </div>
                <div className="text-center mt-3 w-full px-1">
                  <Link href={`/profile/${podium[0].id_user}`} className="hover:text-primary transition-colors">
                    <p className="font-headline font-bold text-xs text-on-surface truncate">{podium[0].nama_lengkap}</p>
                  </Link>
                  <p className="font-mono text-[10px] text-primary mt-1 font-bold">{formatNumber(podium[0].xp)} XP</p>
                  <LevelTag level={podium[0].level} />
                </div>
              </div>

              {/* Rank 1 */}
              <div className="flex flex-col items-center flex-1 max-w-[130px] sm:max-w-[150px] -translate-y-2 sm:-translate-y-4">
                <div className="relative mb-2">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-yellow-400">
                    <Crown className="w-8 h-8 drop-shadow-md" fill="currentColor" />
                  </div>
                  <Link href={`/profile/${podium[1].id_user}`}>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-yellow-400 bg-surface-container-lowest shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 transition-transform">
                      <AvatarIcon user={podium[1]} />
                    </div>
                  </Link>
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-surface">1</div>
                </div>
                <div className="text-center mt-3 w-full px-1">
                  <Link href={`/profile/${podium[1].id_user}`} className="hover:text-primary transition-colors">
                    <p className="font-headline font-bold text-sm text-on-surface truncate">{podium[1].nama_lengkap}</p>
                  </Link>
                  <p className="font-mono text-xs text-primary font-bold mt-1">{formatNumber(podium[1].xp)} XP</p>
                  <LevelTag level={podium[1].level} />
                </div>
              </div>

              {/* Rank 3 */}
              <div className="flex flex-col items-center flex-1 max-w-[110px] sm:max-w-[130px]">
                <div className="relative mb-2">
                  <Link href={`/profile/${podium[2].id_user}`}>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-4 border-amber-600 bg-surface-container-lowest shadow-sm hover:scale-105 transition-transform">
                      <AvatarIcon user={podium[2]} />
                    </div>
                  </Link>
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-amber-600 text-amber-100 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md ring-2 ring-surface">3</div>
                </div>
                <div className="text-center mt-3 w-full px-1">
                  <Link href={`/profile/${podium[2].id_user}`} className="hover:text-primary transition-colors">
                    <p className="font-headline font-bold text-xs text-on-surface truncate">{podium[2].nama_lengkap}</p>
                  </Link>
                  <p className="font-mono text-[10px] text-primary mt-1 font-bold">{formatNumber(podium[2].xp)} XP</p>
                  <LevelTag level={podium[2].level} />
                </div>
              </div>
            </div>
          )}

          {/* My Position Card */}
          {myUser && (
            <div className="bg-primary/5 border border-primary/25 rounded-2xl p-3.5 md:p-4 flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden bg-surface-variant flex shrink-0">
                <AvatarIcon user={myUser} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-headline font-bold text-sm text-on-surface truncate">{myUser.nama_lengkap}</p>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-primary text-on-primary text-[9px] font-bold uppercase tracking-wide shrink-0">Kamu</span>
                </div>
                <div className="flex items-center gap-2 md:gap-3 mt-1 text-xs text-on-surface-variant flex-wrap">
                  <span className="font-mono font-bold text-primary">#{myRank || "-"}</span>
                  <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {(myUser.rating_avg || 0).toFixed(1)}</span>
                  <span className="flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3 text-secondary" /> {myUser.total_completed || 0} tugas</span>
                  {myUser.current_streak ? (
                    <span className="flex items-center gap-0.5 text-tertiary"><Flame className="w-3 h-3" /> {myUser.current_streak} hari</span>
                  ) : null}
                </div>
                <div className="mt-2 h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${getXPProgress(myUser.xp || 0, myUser.level || 1).pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant font-mono mt-1">
                  {formatNumber(myUser.xp || 0)} XP · Lv {myUser.level || 1} · {formatNumber(Math.max(0, getXPProgress(myUser.xp || 0, myUser.level || 1).nextFloor - (myUser.xp || 0)))} XP lagi ke Lv {(myUser.level || 1) + 1}
                </p>
              </div>
            </div>
          )}

          {/* Rankings List */}
          <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-card-border shadow-sm">
            <div className="px-4 py-3 border-b border-card-border bg-surface-container-low/60">
              <h2 className="font-headline font-bold text-sm text-on-surface">Semua Pekerja</h2>
            </div>
            {users.map((user, idx) => {
              const rank = user.rank || idx + 1;
              const isMe = currentUser?.id_user === user.id_user;
              const progress = getXPProgress(user.xp, user.level);
              return (
                <div
                  key={user.id_user}
                  className={cn(
                    "flex items-center gap-2.5 md:gap-3 p-3 md:p-3.5 border-b border-card-border last:border-0 transition-colors",
                    isMe ? "bg-primary/5 ring-1 ring-inset ring-primary/25" : idx < 3 ? "bg-surface-container-low/40" : "hover:bg-surface-container-low/40"
                  )}
                >
                  {/* Rank */}
                  <div
                    className={cn(
                      "w-7 h-7 md:w-8 md:h-8 shrink-0 rounded-lg flex items-center justify-center font-mono font-bold text-xs",
                      rank === 1 && "bg-yellow-400/15 text-yellow-600",
                      rank === 2 && "bg-slate-300/20 text-slate-500",
                      rank === 3 && "bg-amber-600/15 text-amber-600",
                      rank > 3 && "text-on-surface-variant/70"
                    )}
                  >
                    {rank}
                  </div>

                  {/* Avatar */}
                  <Link href={`/profile/${user.id_user}`} className="shrink-0">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden bg-surface-variant">
                      <AvatarIcon user={user} />
                    </div>
                  </Link>

                  {/* Name + byline */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Link href={`/profile/${user.id_user}`} className="truncate">
                        <h3 className="font-headline font-bold text-sm text-on-surface truncate hover:text-primary transition-colors">
                          {user.nama_lengkap}
                        </h3>
                      </Link>
                      {isMe && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-primary text-on-primary text-[9px] font-bold uppercase tracking-wide shrink-0">Kamu</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 mt-0.5 text-[11px] text-on-surface-variant flex-wrap">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" /> {user.rating_avg.toFixed(1)}</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-secondary shrink-0" /> {user.total_completed} tugas</span>
                      {user.current_streak ? (
                        <span className="flex items-center gap-1 text-tertiary"><Flame className="w-3 h-3 shrink-0" /> {user.current_streak} hari</span>
                      ) : null}
                    </div>
                    {/* XP Progress */}
                    <div className="mt-1.5 h-1 bg-surface-container rounded-full overflow-hidden max-w-[180px] md:max-w-[220px]">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", isMe ? "bg-primary" : "bg-primary/50")}
                        style={{ width: `${progress.pct}%` }}
                      />
                    </div>
                  </div>

                  {/* XP + Level */}
                  <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                    <p className="font-mono font-bold text-primary text-sm">{formatNumber(user.xp)}</p>
                    <LevelTag level={user.level} />
                  </div>
                </div>
              );
            })}
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
              <Trophy className="w-4 h-4 text-primary" />
              Peningkatan Level Akun
            </h3>
            <p>
              Berbeda dengan Papan Peringkat, Level Akun Anda dihitung berdasarkan <strong>Total XP Keseluruhan</strong> yang telah Anda kumpulkan sejak pertama kali bergabung. Semakin tinggi pencapaian level Anda, semakin besar pula dedikasi yang dibutuhkan untuk mencapai level berikutnya.
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

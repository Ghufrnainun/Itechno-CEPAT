"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Trophy, Star, Medal, User } from "lucide-react";

interface LeaderboardUser {
  id_user: string;
  nama_lengkap: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  total_completed: number;
  rating_avg: number;
  score: number;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/leaderboard");
        const json = await res.json();
        if (json.success) {
          setUsers(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const AvatarIcon = ({ user }: { user: LeaderboardUser }) => {
    const [err, setErr] = useState(false);
    if (!user.avatar_url || err) {
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
        onError={() => setErr(true)}
      />
    );
  };

  return (
    <div className="flex-1 flex flex-col p-4 max-w-4xl mx-auto w-full pb-24 md:pb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 text-primary rounded-xl">
          <Trophy className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-headline font-bold text-xl text-on-surface">Peringkat Pekerja</h1>
          <p className="font-body-sm text-xs text-on-surface-variant">Top worker ITechno Nasional</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Top 3 Podium */}
          {users.length >= 3 && (
            <div className="flex justify-center items-end gap-2 md:gap-6 mb-8 pt-8">
              {/* Rank 2 */}
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-slate-300">
                    <AvatarIcon user={users[1]} />
                  </div>
                  <div className="absolute -bottom-3 -right-2 bg-slate-300 text-slate-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md">2</div>
                </div>
                <div className="text-center w-24">
                  <p className="font-headline font-bold text-xs text-on-surface truncate">{users[1].nama_lengkap}</p>
                  <p className="font-mono text-[10px] text-primary mt-1">{users[1].xp} XP</p>
                </div>
              </div>
              
              {/* Rank 1 */}
              <div className="flex flex-col items-center -translate-y-8">
                <div className="relative mb-2">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400">
                    <Trophy className="w-8 h-8 drop-shadow-md" fill="currentColor" />
                  </div>
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                    <AvatarIcon user={users[0]} />
                  </div>
                  <div className="absolute -bottom-3 -right-2 bg-yellow-400 text-yellow-900 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shadow-md">1</div>
                </div>
                <div className="text-center w-28">
                  <p className="font-headline font-bold text-sm text-on-surface truncate">{users[0].nama_lengkap}</p>
                  <p className="font-mono text-xs text-primary font-bold mt-1">{users[0].xp} XP</p>
                </div>
              </div>

              {/* Rank 3 */}
              <div className="flex flex-col items-center">
                <div className="relative mb-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-amber-600">
                    <AvatarIcon user={users[2]} />
                  </div>
                  <div className="absolute -bottom-3 -right-2 bg-amber-600 text-amber-100 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md">3</div>
                </div>
                <div className="text-center w-24">
                  <p className="font-headline font-bold text-xs text-on-surface truncate">{users[2].nama_lengkap}</p>
                  <p className="font-mono text-[10px] text-primary mt-1">{users[2].xp} XP</p>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard List */}
          <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-card-border shadow-sm">
            {users.map((user, idx) => (
              <div key={user.id_user} className={`flex items-center gap-4 p-4 border-b border-card-border last:border-0 ${idx < 3 ? 'bg-primary/5' : ''}`}>
                <div className="w-8 font-mono font-bold text-on-surface-variant text-center">
                  {idx + 1}
                </div>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-variant flex shrink-0">
                  <AvatarIcon user={user} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline font-bold text-sm text-on-surface truncate">{user.nama_lengkap}</h3>
                  <div className="flex gap-3 mt-1 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {user.rating_avg.toFixed(1)}</span>
                    <span className="flex items-center gap-1"><Medal className="w-3 h-3 text-primary" /> Lvl {user.level}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-primary">{user.xp}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase">XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import KPICard from '@/components/admin/KPICard';
import StatusBadge from '@/components/admin/StatusBadge';
import {
  Users,
  ClipboardList,
  Zap,
  Coins,
  CheckCircle2,
  TrendingUp,
  PieChart as PieIcon,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Skeleton } from '@/components/ui/Skeleton';
import { ADMIN_STATUS_COLORS, ADMIN_PIE_PALETTE } from '@/lib/constants';

interface StatsData {
  totalUsers: number;
  totalTasks: number;
  activeTasks: number;
  totalRevenue: number;
  completionRate: string;
}

interface TrendPoint {
  date: string;
  total: number;
  completed: number;
}

interface StatusDist {
  name: string;
  value: number;
  color?: string;
  status?: string;
}

interface RecentTask {
  id: string;
  judul_tugas: string;
  kompensasi: number;
  status: string;
  kategori: string;
  created_at: string;
  requester: { nama_lengkap: string };
}

function KPISkeleton() {
  return (
    <div className="bg-surface-container-lowest border border-card-border rounded-2xl p-4.5 sm:p-5 shadow-xs space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-3.5 w-24 rounded" />
        <Skeleton className="w-8 h-8 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-28 rounded-lg" />
      <Skeleton className="h-4 w-20 rounded" />
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [distribution, setDistribution] = useState<StatusDist[]>([]);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const safeFetch = (url: string) =>
          fetch(url)
            .then((r) => (r.ok ? r.json().catch(() => ({ success: false })) : { success: false }))
            .catch(() => ({ success: false }));

        const [statsRes, trendsRes, distRes, tasksRes] = await Promise.allSettled([
          safeFetch('/api/admin/stats'),
          safeFetch('/api/admin/stats/trends'),
          safeFetch('/api/admin/stats/status-distribution'),
          safeFetch('/api/admin/tasks?limit=5&page=1'),
        ]);

        if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
          setStats(statsRes.value.data);
        }
        if (trendsRes.status === 'fulfilled' && trendsRes.value?.success) {
          setTrends(trendsRes.value.data);
        }
        if (distRes.status === 'fulfilled' && distRes.value?.success) {
          setDistribution(distRes.value.data);
        }
        if (tasksRes.status === 'fulfilled' && tasksRes.value?.success) {
          setRecentTasks(tasksRes.value.data);
        }
      } catch (err) {
        console.error('[Dashboard] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <AdminTopbar title="Dashboard Overview" />

      <main className="flex-1 px-4 sm:px-8 py-10 lg:py-16 space-y-12 max-w-[1400px] w-full mx-auto font-sans">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-5">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <KPISkeleton key={i} />)
          ) : (
            <>
              <KPICard
                title="Total Users"
                value={stats?.totalUsers ?? 0}
                change="Aktif Database"
                isPositive={true}
                icon={<Users className="w-4 h-4" aria-hidden="true" />}
              />
              <KPICard
                title="Total Tasks"
                value={stats?.totalTasks ?? 0}
                change="Semua Status"
                isPositive={true}
                icon={<ClipboardList className="w-4 h-4" aria-hidden="true" />}
              />
              <KPICard
                title="Active Tasks"
                value={stats?.activeTasks ?? 0}
                change="In Progress"
                isPositive={true}
                icon={<Zap className="w-4 h-4" aria-hidden="true" />}
              />
              <KPICard
                title="Total Volume"
                value={`${(stats?.totalRevenue ?? 0).toLocaleString('id-ID')} PTS`}
                change="Saldo Beredar"
                isPositive={true}
                icon={<Coins className="w-4 h-4" aria-hidden="true" />}
              />
              <KPICard
                title="Completion Rate"
                value={stats?.completionRate ?? '0%'}
                change="Penyelesaian"
                isPositive={true}
                icon={<CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
              />
            </>
          )}
        </div>

        {/* Charts Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {/* Line Chart — Activity Trends */}
          <div className="lg:col-span-2 bg-black/5 ring-1 ring-black/5 p-1.5 rounded-[2rem]">
            <div className="bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,1)] rounded-[calc(2rem-0.375rem)] p-6 sm:p-8 h-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="font-headline font-bold text-lg text-on-surface flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" aria-hidden="true" />
                    Tren Pembuatan &amp; Penyelesaian Task
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Metrik aktivitas mingguan (7 hari terakhir)
                  </p>
                </div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface border border-card-border">
                  7 Hari Terakhir
                </span>
              </div>
              <div className="h-80 w-full">
                {loading ? (
                  <Skeleton className="h-full w-full rounded-lg" />
                ) : trends.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-on-surface-variant">
                    Belum ada data aktivitas.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="date"
                        stroke="var(--color-outline)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis stroke="var(--color-outline)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-surface-container-lowest)',
                          borderColor: 'var(--color-card-border)',
                          borderRadius: '8px',
                          color: 'var(--color-on-surface)',
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Task Dibuat"
                        stroke="var(--primary, #0F766E)"
                        strokeWidth={2.5}
                        dot={{ r: 3.5, fill: 'var(--primary, #0F766E)' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="completed"
                        name="Task Selesai"
                        stroke="var(--secondary-container, #416900)"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 3, fill: 'var(--secondary-container, #416900)' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Donut Chart — Status Distribution */}
          <div className="bg-black/5 ring-1 ring-black/5 p-1.5 rounded-[2rem]">
            <div className="bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,1)] rounded-[calc(2rem-0.375rem)] p-6 sm:p-8 h-full flex flex-col justify-between">
              <div>
                <h2 className="font-headline font-bold text-lg text-on-surface flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-primary" aria-hidden="true" />
                  Distribusi Status Task
                </h2>
                <p className="text-xs text-on-surface-variant mt-1 mb-6">
                  Proporsi status task aktif &amp; selesai
                </p>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                {loading ? (
                  <Skeleton className="w-40 h-40 rounded-full" />
                ) : distribution.length === 0 ? (
                  <p className="text-xs text-on-surface-variant">Belum ada data task.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {distribution.map((entry, index) => {
                          const key = entry.name.toLowerCase();
                          const sliceColor =
                            entry.color ||
                            ADMIN_STATUS_COLORS[key] ||
                            ADMIN_STATUS_COLORS[entry.status || ''] ||
                            ADMIN_PIE_PALETTE[index % ADMIN_PIE_PALETTE.length];
                          return <Cell key={entry.name} fill={sliceColor} />;
                        })}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-surface-container-lowest)',
                          borderColor: 'var(--color-card-border)',
                          borderRadius: '8px',
                          color: 'var(--color-on-surface)',
                          fontSize: '12px',
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '11px', color: 'var(--color-on-surface-variant)', paddingTop: '20px' }}
                        iconType="circle"
                        iconSize={8}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Recent Tasks List */}
        <section className="bg-black/5 ring-1 ring-black/5 p-1.5 rounded-[2rem]">
          <div className="bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,1)] rounded-[calc(2rem-0.375rem)] p-6 sm:p-8 h-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-headline font-bold text-lg text-on-surface">
                  Aktivitas Task Terkini
                </h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  5 task terakhir yang dipublikasikan di platform
                </p>
              </div>
              <a
                href="/admin/tasks"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline hover:text-primary/80 transition-colors"
              >
                Lihat Semua Task
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
              </a>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : recentTasks.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-10">
                Belum ada task yang dibuat.
              </p>
            ) : (
              <div className="divide-y divide-card-border/60">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group py-4 flex items-center justify-between gap-4 hover:bg-black/[0.02] -mx-4 px-4 rounded-xl transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary font-mono text-xs font-bold shrink-0 ring-1 ring-card-border transition-transform group-hover:scale-105">
                        {task.kategori.slice(0, 2)}
                      </div>
                      <div className="truncate">
                        <h4 className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                          {task.judul_tugas}
                        </h4>
                        <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                          oleh{' '}
                          <span className="font-semibold text-on-surface">
                            {task.requester.nama_lengkap}
                          </span>{' '}
                          •{' '}
                          {new Date(task.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 shrink-0">
                      <span className="text-sm font-extrabold text-primary font-mono tabular-nums">
                        +{task.kompensasi} PTS
                      </span>
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

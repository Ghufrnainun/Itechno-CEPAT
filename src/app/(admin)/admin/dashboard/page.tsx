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

const STATUS_COLORS: Record<string, string> = {
  open: 'var(--primary, #0F766E)',
  accepted: 'var(--secondary, #2563EB)',
  assigned: 'var(--secondary, #2563EB)',
  'in progress': 'var(--warning, #D97706)',
  in_progress: 'var(--warning, #D97706)',
  submitted: 'var(--purple, #9333EA)',
  completed: 'var(--success, #16A34A)',
  cancelled: 'var(--outline, #64748B)',
  takedown: 'var(--error, #DC2626)',
};

const PIE_PALETTE = [
  'var(--primary, #0F766E)',
  'var(--secondary, #2563EB)',
  'var(--warning, #D97706)',
  'var(--success, #16A34A)',
  'var(--purple, #9333EA)',
  'var(--error, #DC2626)',
  'var(--outline, #64748B)'
];

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
    <div className="flex-1 flex flex-col min-w-0 bg-surface">
      <AdminTopbar title="Dashboard Overview" />

      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto font-sans">
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
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line Chart — Activity Trends */}
          <div className="lg:col-span-2 bg-surface-container-lowest border border-card-border rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" aria-hidden="true" />
                  Tren Pembuatan &amp; Penyelesaian Task
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Metrik aktivitas mingguan (7 hari terakhir)
                </p>
              </div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant border border-card-border">
                7 Hari Terakhir
              </span>
            </div>
            <div className="h-72 w-full">
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

          {/* Donut Chart — Status Distribution */}
          <div className="bg-surface-container-lowest border border-card-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="font-headline font-bold text-base text-on-surface flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-primary" aria-hidden="true" />
                Distribusi Status Task
              </h2>
              <p className="text-xs text-on-surface-variant mb-2">
                Proporsi status task aktif &amp; selesai
              </p>
            </div>

            <div className="h-60 w-full flex items-center justify-center">
              {loading ? (
                <Skeleton className="w-36 h-36 rounded-full" />
              ) : distribution.length === 0 ? (
                <p className="text-xs text-on-surface-variant">Belum ada data task.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {distribution.map((entry, index) => {
                        const key = entry.name.toLowerCase();
                        const sliceColor =
                          entry.color ||
                          STATUS_COLORS[key] ||
                          STATUS_COLORS[entry.status || ''] ||
                          PIE_PALETTE[index % PIE_PALETTE.length];
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
                      wrapperStyle={{ fontSize: '11px', color: 'var(--color-on-surface-variant)' }}
                      iconType="circle"
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        {/* Recent Tasks List */}
        <section className="bg-surface-container-lowest border border-card-border rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-headline font-bold text-base text-on-surface">
                Aktivitas Task Terkini
              </h2>
              <p className="text-xs text-on-surface-variant">
                5 task terakhir yang dipublikasikan di platform
              </p>
            </div>
            <a
              href="/admin/tasks"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              Lihat Semua Task
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : recentTasks.length === 0 ? (
            <p className="text-xs text-on-surface-variant text-center py-8">
              Belum ada task yang dibuat.
            </p>
          ) : (
            <div className="divide-y divide-card-border">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-surface-container-low px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-md bg-primary/10 text-primary font-mono text-[11px] font-bold shrink-0">
                      {task.kategori.slice(0, 2)}
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-on-surface truncate">
                        {task.judul_tugas}
                      </h4>
                      <p className="text-[11px] text-on-surface-variant truncate">
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

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs font-extrabold text-primary font-mono tabular-nums">
                      +{task.kompensasi} PTS
                    </span>
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

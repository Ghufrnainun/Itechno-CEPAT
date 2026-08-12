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
  color: string;
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
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs animate-pulse">
      <div className="h-3 bg-[#E2E8F0] rounded w-24 mb-3" />
      <div className="h-7 bg-[#E2E8F0] rounded w-20 mb-2" />
      <div className="h-2.5 bg-[#E2E8F0] rounded w-16" />
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
        const [statsRes, trendsRes, distRes, tasksRes] = await Promise.allSettled([
          fetch('/api/admin/stats').then((r) => r.json()),
          fetch('/api/admin/stats/trends').then((r) => r.json()),
          fetch('/api/admin/stats/status-distribution').then((r) => r.json()),
          fetch('/api/admin/tasks?limit=5&page=1').then((r) => r.json()),
        ]);

        if (statsRes.status === 'fulfilled' && statsRes.value.success) {
          setStats(statsRes.value.data);
        }
        if (trendsRes.status === 'fulfilled' && trendsRes.value.success) {
          setTrends(trendsRes.value.data);
        }
        if (distRes.status === 'fulfilled' && distRes.value.success) {
          setDistribution(distRes.value.data);
        }
        if (tasksRes.status === 'fulfilled' && tasksRes.value.success) {
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

      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto font-sans">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <KPISkeleton key={i} />)
          ) : (
            <>
              <KPICard
                title="Total Users"
                value={stats?.totalUsers ?? 0}
                change="dari database"
                isPositive={true}
                icon={<Users className="w-4 h-4" />}
              />
              <KPICard
                title="Total Tasks"
                value={stats?.totalTasks ?? 0}
                change="semua status"
                isPositive={true}
                icon={<ClipboardList className="w-4 h-4" />}
              />
              <KPICard
                title="Active Tasks"
                value={stats?.activeTasks ?? 0}
                change="open/accepted/progress"
                isPositive={true}
                icon={<Zap className="w-4 h-4" />}
              />
              <KPICard
                title="Total Revenue"
                value={`${(stats?.totalRevenue ?? 0).toLocaleString('id-ID')} PTS`}
                change="total saldo user"
                isPositive={true}
                icon={<Coins className="w-4 h-4" />}
              />
              <KPICard
                title="Completion Rate"
                value={stats?.completionRate ?? '0%'}
                change="task selesai / total"
                isPositive={true}
                icon={<CheckCircle2 className="w-4 h-4" />}
              />
            </>
          )}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line Chart — Activity Trends */}
          <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-headline font-bold text-base text-[#0C1F16] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#0F766E]" />
                  Tren Pembuatan & Penyelesaian Task
                </h3>
                <p className="text-xs text-[#64748B]">
                  Metrik aktivitas mingguan (7 hari terakhir)
                </p>
              </div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                7 Hari Terakhir
              </span>
            </div>

            <div className="h-72 w-full">
              {loading ? (
                <div className="h-full bg-[#F8FAFC] rounded-lg animate-pulse" />
              ) : trends.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-[#94A3B8]">
                  Belum ada data aktivitas.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="date"
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E2E8F0',
                        borderRadius: '8px',
                        color: '#0C1F16',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Task Dibuat"
                      stroke="#0F766E"
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: '#0F766E' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      name="Task Selesai"
                      stroke="#346538"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 3, fill: '#346538' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Donut Chart — Status Distribution */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <h3 className="font-headline font-bold text-base text-[#0C1F16] flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#0F766E]" />
                Distribusi Status Task
              </h3>
              <p className="text-xs text-[#64748B] mb-2">
                Proporsi status task aktif & selesai
              </p>
            </div>

            <div className="h-60 w-full flex items-center justify-center">
              {loading ? (
                <div className="w-32 h-32 rounded-full bg-[#F8FAFC] animate-pulse" />
              ) : distribution.length === 0 ? (
                <p className="text-xs text-[#94A3B8]">Belum ada data task.</p>
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
                      {distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E2E8F0',
                        borderRadius: '8px',
                        color: '#0C1F16',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(value) => (
                        <span className="text-xs text-[#64748B] font-medium font-sans">
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Recent Tasks List */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-headline font-bold text-base text-[#0C1F16]">
                Aktivitas Micro-Tasks Terbaru
              </h3>
              <p className="text-xs text-[#64748B]">
                Task yang baru diposting oleh pengguna
              </p>
            </div>
            <a
              href="/admin/tasks"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] hover:underline"
            >
              Lihat Semua Task
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-[#F8FAFC] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentTasks.length === 0 ? (
            <p className="text-xs text-[#94A3B8] text-center py-8">
              Belum ada task yang dibuat.
            </p>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="py-3 flex items-center justify-between gap-4 hover:bg-[#F8FAFC] px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-md bg-[#E6F4F1] text-[#0F766E] font-mono text-[11px] font-bold shrink-0">
                      {task.kategori.slice(0, 2)}
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-[#0C1F16] truncate">
                        {task.judul_tugas}
                      </h4>
                      <p className="text-[11px] text-[#64748B] truncate">
                        oleh{' '}
                        <span className="font-semibold text-[#0C1F16]">
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
                    <span className="text-xs font-extrabold text-[#0F766E] font-mono">
                      +{task.kompensasi} PTS
                    </span>
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

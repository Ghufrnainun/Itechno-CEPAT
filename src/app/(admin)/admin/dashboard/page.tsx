'use client';

import AdminTopbar from '@/components/admin/AdminTopbar';
import KPICard from '@/components/admin/KPICard';
import StatusBadge from '@/components/admin/StatusBadge';
import {
  MOCK_ADMIN_USERS,
  MOCK_ADMIN_TASKS,
  MOCK_CHART_TASK_TRENDS,
  MOCK_CHART_STATUS_DISTRIBUTION,
} from '@/lib/admin/mock-data';
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

export default function AdminDashboardPage() {
  const totalUsers = MOCK_ADMIN_USERS.length;
  const totalTasks = 47;
  const activeTasks = MOCK_ADMIN_TASKS.filter((t) =>
    ['open', 'accepted', 'in_progress'].includes(t.status)
  ).length;
  const totalRevenue = MOCK_ADMIN_USERS.reduce((acc, u) => acc + u.total_balance, 0);
  const completionRate = '82.4%';

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <AdminTopbar title="Dashboard Overview" />

      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto font-sans">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            title="Total Users"
            value={totalUsers * 45}
            change="+14% mgg ini"
            isPositive={true}
            icon={<Users className="w-4 h-4" />}
          />
          <KPICard
            title="Total Tasks"
            value={totalTasks * 3}
            change="+22% mgg ini"
            isPositive={true}
            icon={<ClipboardList className="w-4 h-4" />}
          />
          <KPICard
            title="Active Tasks"
            value={activeTasks * 4}
            change="+8% vs kemarin"
            isPositive={true}
            icon={<Zap className="w-4 h-4" />}
          />
          <KPICard
            title="Total Revenue"
            value={`${totalRevenue.toLocaleString()} PTS`}
            change="+18.5%"
            isPositive={true}
            icon={<Coins className="w-4 h-4" />}
          />
          <KPICard
            title="Completion Rate"
            value={completionRate}
            change="+3.2%"
            isPositive={true}
            icon={<CheckCircle2 className="w-4 h-4" />}
          />
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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_CHART_TASK_TRENDS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={MOCK_CHART_STATUS_DISTRIBUTION}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {MOCK_CHART_STATUS_DISTRIBUTION.map((entry, index) => (
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

          <div className="divide-y divide-[#E2E8F0]">
            {MOCK_ADMIN_TASKS.map((task) => (
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
                      oleh <span className="font-semibold text-[#0C1F16]">{task.requester_name}</span> • {task.created_at}
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
        </div>
      </main>
    </div>
  );
}

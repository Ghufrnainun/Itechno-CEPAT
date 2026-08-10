'use client';

import { useState } from 'react';
import AdminTopbar from '@/components/admin/AdminTopbar';
import DataTable, { Column } from '@/components/admin/DataTable';
import AdminDrawer from '@/components/admin/AdminDrawer';
import StatusBadge from '@/components/admin/StatusBadge';
import { MOCK_ADMIN_TASKS, AdminTask } from '@/lib/admin/mock-data';
import { Search, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function TaskManagementPage() {
  const [tasks, setTasks] = useState<AdminTask[]>(MOCK_ADMIN_TASKS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTask, setSelectedTask] = useState<AdminTask | null>(null);

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.judul_tugas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.requester_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.kategori.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns: Column<AdminTask>[] = [
    {
      header: 'Task Title & Category',
      cell: (task) => (
        <div className="max-w-xs">
          <div className="font-bold text-[#111111] truncate" title={task.judul_tugas}>
            {task.judul_tugas}
          </div>
          <div className="text-[11px] text-[#787774]">{task.kategori}</div>
        </div>
      ),
    },
    {
      header: 'Requester',
      accessorKey: 'requester_name',
      cell: (task) => (
        <div>
          <div className="text-xs font-bold text-[#111111]">{task.requester_name}</div>
          <div className="text-[11px] text-[#787774] font-mono">{task.requester_email}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (task) => <StatusBadge status={task.status} />,
    },
    {
      header: 'Compensation',
      cell: (task) => (
        <span className="text-xs font-extrabold text-[#0F766E] font-mono">
          +{task.kompensasi} PTS
        </span>
      ),
    },
    {
      header: 'Applicants',
      cell: (task) => (
        <span className="text-xs font-medium text-[#2F3437]">
          {task.applicants_count} applicants
        </span>
      ),
    },
    {
      header: 'Created Date',
      accessorKey: 'created_at',
      cell: (task) => <span className="text-xs text-[#787774]">{task.created_at}</span>,
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <AdminTopbar title="Task Management" />

      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#EAEAEA]">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#787774]" />
            <input
              type="text"
              placeholder="Search task by title, category, or requester..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F6F3] text-[#111111] placeholder-[#787774] rounded-md border border-[#EAEAEA] focus:border-[#111111] focus:bg-white outline-none transition-all"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['All', 'open', 'accepted', 'in_progress', 'completed', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-[#111111] text-white'
                    : 'bg-[#F7F6F3] text-[#787774] hover:text-[#111111] hover:bg-[#EAEAEA]'
                }`}
              >
                {st === 'in_progress' ? 'In Progress' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredTasks}
          onRowClick={(task) => setSelectedTask(task)}
          pageSize={5}
          emptyMessage="No micro-tasks found matching your filters"
        />

        {/* Slide-over Task Detail Drawer */}
        <AdminDrawer
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title="Task Details"
          subtitle={`Task ID: ${selectedTask?.id}`}
        >
          {selectedTask && (
            <div className="space-y-6 text-xs">
              {/* Header Title Card */}
              <div className="space-y-2 p-4 rounded-xl bg-[#FBFBFA] border border-[#EAEAEA]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#0F766E]">
                    {selectedTask.kategori}
                  </span>
                  <StatusBadge status={selectedTask.status} />
                </div>
                <h4 className="text-sm font-bold text-[#111111] font-sans leading-snug">
                  {selectedTask.judul_tugas}
                </h4>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-sm font-extrabold text-[#0F766E] font-mono">
                    +{selectedTask.kompensasi} PTS
                  </span>
                  <span className="text-xs text-[#787774]">•</span>
                  <span className="text-xs text-[#787774] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Est. {selectedTask.estimasi_waktu}
                  </span>
                </div>
              </div>

              {/* Task Description */}
              <div className="space-y-1.5">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#787774]">
                  Full Description
                </h5>
                <p className="text-xs text-[#2F3437] leading-relaxed bg-[#F7F6F3] p-3 rounded-md border border-[#EAEAEA]">
                  {selectedTask.deskripsi_tugas}
                </p>
              </div>

              {/* Location & Geo radius */}
              <div className="space-y-1.5">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#787774]">
                  Location & Radius
                </h5>
                <div className="flex items-center gap-2 text-xs text-[#2F3437]">
                  <MapPin className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                  <span>{selectedTask.lokasi_label}</span>
                </div>
              </div>

              {/* People Involved */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Requester */}
                <div className="p-3 rounded-md bg-[#FBFBFA] border border-[#EAEAEA]">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#787774]">
                    Requester
                  </span>
                  <p className="text-xs font-bold text-[#111111]">
                    {selectedTask.requester_name}
                  </p>
                  <p className="text-[11px] text-[#787774] font-mono">{selectedTask.requester_email}</p>
                </div>

                {/* Worker Assigned */}
                <div className="p-3 rounded-md bg-[#FBFBFA] border border-[#EAEAEA]">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#787774]">
                    Worker Assigned
                  </span>
                  <p className="text-xs font-bold text-[#111111]">
                    {selectedTask.worker_assigned || 'None assigned yet'}
                  </p>
                  <p className="text-[11px] text-[#787774]">
                    {selectedTask.applicants_count} applicants in queue
                  </p>
                </div>
              </div>

              {/* Admin Governance Controls */}
              <div className="pt-4 border-t border-[#EAEAEA] space-y-2">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#787774]">
                  Task Moderation Actions
                </h5>
                <div className="flex gap-2">
                  <button
                    onClick={() => alert(`Task '${selectedTask.judul_tugas}' taken down.`)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-md bg-[#FDEBEC] hover:bg-[#F8D2D4] text-[#9F2F2D] border border-[#F8D2D4]/60 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Take Down Task
                  </button>
                  <button
                    onClick={() => alert(`Status for '${selectedTask.judul_tugas}' forced to Completed.`)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-md bg-[#EDF3EC] hover:bg-[#D5E5D3] text-[#346538] border border-[#D5E5D3]/60 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Force Complete
                  </button>
                </div>
              </div>
            </div>
          )}
        </AdminDrawer>
      </main>
    </div>
  );
}

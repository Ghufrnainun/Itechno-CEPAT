'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  X,
  Loader2,
  LayoutDashboard,
  Users,
  ClipboardList,
  Tag,
  Flag,
  Folder,
  ArrowRight,
  User as UserIcon,
  CheckCircle2,
  Clock,
  Sparkles,
  Command,
  CheckCheck,
  Banknote,
  Copy,
  Check,
  Building2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useFCM } from '@/hooks/useFCM';
import { onFcmForegroundMessage } from '@/lib/firebase/client';

interface MenuItem {
  title: string;
  url: string;
  description: string;
  keywords: string[];
  icon: string;
}

interface UserResult {
  id: string;
  nama_lengkap: string;
  email: string;
  username: string;
  avatar_url?: string;
  role: string;
}

interface TaskResult {
  id: string;
  judul_tugas: string;
  kompensasi: number;
  status: string;
  kategori: string;
  kategori_icon?: string;
  requester_name: string;
}

interface CategoryResult {
  id: string;
  nama_kategori: string;
  icon?: string;
  total_tasks: number;
}

interface SearchResults {
  menus: MenuItem[];
  users: UserResult[];
  tasks: TaskResult[];
  categories: CategoryResult[];
}

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any> | null;
  is_read: boolean;
  created_at: string;
}

interface AdminTopbarProps {
  title?: string;
  adminUser?: {
    nama_lengkap?: string;
    email?: string;
    avatar_url?: string;
    username?: string;
  } | null;
}

export default function AdminTopbar({ title = 'Dashboard', adminUser }: AdminTopbarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    menus: [],
    users: [],
    tasks: [],
    categories: [],
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Admin Notifications state
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  // Admin withdrawal modal state
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<AdminNotification | null>(null);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [withdrawalActionLoading, setWithdrawalActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchAbortControllerRef = useRef<AbortController | null>(null);

  const { requestPermission } = useFCM();

  // Fetch admin notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data || []);
        setUnreadCount(json.unreadCount || 0);
      }
    } catch (err) {
      console.error('[AdminTopbar] Notifications fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Listen to FCM foreground messages (requestPermission trigger is moved to bell click)
  useEffect(() => {
    const unsubscribe = onFcmForegroundMessage(() => {
      fetchNotifications();
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [fetchNotifications]);

  // Icon mapper
  const getMenuIcon = (iconName: string) => {
    switch (iconName) {
      case 'LayoutDashboard':
        return <LayoutDashboard className="w-4 h-4 text-[var(--primary)]" />;
      case 'Users':
        return <Users className="w-4 h-4 text-[var(--primary)]" />;
      case 'ClipboardList':
        return <ClipboardList className="w-4 h-4 text-[var(--primary)]" />;
      case 'Tag':
        return <Tag className="w-4 h-4 text-[var(--primary)]" />;
      case 'Flag':
        return <Flag className="w-4 h-4 text-rose-600" />;
      default:
        return <Folder className="w-4 h-4 text-[var(--primary)]" />;
    }
  };

  // Perform search API call
  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults({ menus: [], users: [], tasks: [], categories: [] });
      setLoading(false);
      return;
    }

    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortControllerRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q.trim())}`, {
        signal: controller.signal,
      });
      const json = await res.json();
      if (!controller.signal.aborted && json.success && json.data) {
        setResults(json.data);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.error('[AdminTopbar] Search fetch error:', err);
      }
    } finally {
      if (searchAbortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  // Handle Query Input change
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIndex(0);

    if (!val.trim()) {
      setIsOpen(false);
      setResults({ menus: [], users: [], tasks: [], categories: [] });
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (searchAbortControllerRef.current) searchAbortControllerRef.current.abort();
      setLoading(false);
      return;
    }

    setIsOpen(true);
    setLoading(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(val);
    }, 200);
  };

  // Flat list item representation for keyboard navigation
  const flatItems = useMemo(() => {
    const list: Array<{
      type: 'menu' | 'user' | 'task' | 'category';
      url: string;
      id: string;
    }> = [];

    results.menus.forEach((m) => list.push({ type: 'menu', url: m.url, id: `menu-${m.url}` }));
    results.users.forEach((u) =>
      list.push({
        type: 'user',
        url: `/admin/users?search=${encodeURIComponent(u.nama_lengkap)}`,
        id: `user-${u.id}`,
      })
    );
    results.tasks.forEach((t) =>
      list.push({
        type: 'task',
        url: `/admin/tasks?search=${encodeURIComponent(t.judul_tugas)}`,
        id: `task-${t.id}`,
      })
    );
    results.categories.forEach((c) =>
      list.push({
        type: 'category',
        url: `/admin/categories?search=${encodeURIComponent(c.nama_kategori)}`,
        id: `cat-${c.id}`,
      })
    );

    return list;
  }, [results]);

  // Navigate to target URL
  const navigateTo = (url: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(url);
  };

  const handleNotificationClick = async (notif: AdminNotification) => {
    setIsNotifOpen(false);
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notif.id }),
      });
      fetchNotifications();
    } catch (_) {}

    // Jika ini adalah notifikasi penarikan saldo, buka modal detail penarikan
    if (notif.data?.subType === 'withdrawal') {
      setSelectedWithdrawal(notif);
      setIsWithdrawalModalOpen(true);
      setShowRejectInput(false);
      setRejectionReason('');
      setActionSuccessMsg(null);
      setCopiedAccount(false);
      return;
    }

    const reportId = notif.data?.report_id;
    if (reportId) {
      router.push(`/admin/reports?id=${reportId}`);
    } else if (notif.data?.link) {
      router.push(notif.data.link);
    } else {
      router.push('/admin/reports');
    }
  };

  const handleWithdrawalAction = async (action: 'approve' | 'reject') => {
    if (!selectedWithdrawal) return;
    if (action === 'reject' && !showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    setWithdrawalActionLoading(true);
    try {
      const res = await fetch('/api/admin/withdrawals/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId: selectedWithdrawal.id,
          action,
          rejectionReason: action === 'reject' ? rejectionReason : undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setActionSuccessMsg(
          action === 'approve'
            ? 'Penarikan berhasil disetujui! Saldo user telah dipotong dan notifikasi telah dikirim.'
            : 'Penarikan telah ditolak dan saldo telah dikembalikan ke user.'
        );
        fetchNotifications();
        setSelectedWithdrawal((prev) =>
          prev
            ? {
                ...prev,
                data: {
                  ...prev.data,
                  status: action === 'approve' ? 'completed' : 'rejected',
                  rejection_reason: action === 'reject' ? rejectionReason : undefined,
                },
              }
            : null
        );
      } else {
        alert(json.message || 'Gagal memproses aksi penarikan.');
      }
    } catch (err) {
      console.error('[AdminTopbar] Error processing withdrawal:', err);
      alert('Terjadi kesalahan koneksi server saat memproses penarikan.');
    } finally {
      setWithdrawalActionLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifLoading(true);
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      fetchNotifications();
    } catch (_) {
    } finally {
      setNotifLoading(false);
    }
  };

  // Keyboard navigation & Shortcuts (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
        return;
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (flatItems.length === 0 ? 0 : (prev + 1) % flatItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          flatItems.length === 0 ? 0 : (prev - 1 + flatItems.length) % flatItems.length
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems.length > 0 && flatItems[selectedIndex]) {
          navigateTo(flatItems[selectedIndex].url);
        } else if (query.trim()) {
          navigateTo(`/admin/tasks?search=${encodeURIComponent(query.trim())}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, query]);

  // Click outside listener to close search popup & notification popup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalResultsCount =
    results.menus.length +
    results.users.length +
    results.tasks.length +
    results.categories.length;

  let currentIndexTracker = 0;

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-surface-container-lowest border-b border-card-border shadow-2xs">
      {/* Title / Breadcrumb */}
      <div className="flex items-center gap-3">
        <h1 className="font-headline font-bold text-lg text-on-surface tracking-tight">
          {title}
        </h1>
        <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
          Super Admin
        </span>
      </div>

      {/* Right Tools & Profile */}
      <div className="flex items-center gap-4">
        {/* Global Search Component */}
        <div ref={containerRef} className="relative w-44 sm:w-72 md:w-80 lg:w-96">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-on-surface-variant pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleQueryChange}
              onFocus={() => {
                if (query.trim()) setIsOpen(true);
              }}
              placeholder="Cari menu, user, task..."
              className="w-full pl-9 pr-14 py-1.5 text-xs font-sans bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 rounded-xl border border-card-border focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />

            <div className="absolute right-2.5 flex items-center gap-1">
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
              ) : query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setIsOpen(false);
                    setResults({ menus: [], users: [], tasks: [], categories: [] });
                    inputRef.current?.focus();
                  }}
                  className="p-0.5 rounded-md hover:bg-surface-container text-on-surface-variant transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-on-surface-variant/70 bg-surface-container-lowest border border-card-border rounded shadow-2xs">
                  <Command className="w-2.5 h-2.5" />K
                </kbd>
              )}
            </div>
          </div>

          {/* Search Dropdown Modal */}
          {isOpen && query.trim() !== '' && (
            <div className="absolute top-full right-0 left-0 mt-2 bg-surface-container-lowest rounded-xl border border-card-border shadow-xl overflow-hidden z-50 max-h-[75vh] flex flex-col animate-in fade-in-50 zoom-in-95 duration-150">
              {loading && totalResultsCount === 0 ? (
                <div className="p-6 text-center text-xs text-on-surface-variant flex flex-col items-center gap-2">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <span>Mencari di seluruh database...</span>
                </div>
              ) : totalResultsCount === 0 && !loading ? (
                <div className="p-8 text-center text-xs text-on-surface-variant flex flex-col items-center gap-2">
                  <Folder className="w-8 h-8 text-outline-variant" />
                  <p className="font-medium text-on-surface">Hasil tidak ditemukan</p>
                  <p className="text-[11px] text-on-surface-variant/70">
                    Tidak ada menu, user, task, atau kategori yang cocok dengan &quot;{query}&quot;.
                  </p>
                </div>
              ) : (
                <div className="overflow-y-auto divide-y divide-card-border/40 p-2 space-y-2">
                  {/* Group 1: Menu Admin */}
                  {results.menus.length > 0 && (
                    <div className="space-y-1">
                      <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        Menu & Halaman Admin
                      </div>
                      {results.menus.map((menu) => {
                        const itemIdx = currentIndexTracker++;
                        const isSelected = itemIdx === selectedIndex;
                        return (
                          <div
                            key={menu.url}
                            onClick={() => navigateTo(menu.url)}
                            onMouseEnter={() => setSelectedIndex(itemIdx)}
                            className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected ? 'bg-primary/10 text-[var(--primary)]' : 'hover:bg-surface-container-low text-on-surface'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-1.5 rounded-md bg-surface-container group-hover:bg-surface-container-lowest shrink-0">
                                {getMenuIcon(menu.icon)}
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold truncate">{menu.title}</p>
                                <p className="text-[11px] text-on-surface-variant truncate">{menu.description}</p>
                              </div>
                            </div>
                            <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isSelected ? 'translate-x-1 text-[var(--primary)]' : 'text-on-surface-variant/70'}`} />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Group 2: Pengguna */}
                  {results.users.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--primary)] flex items-center gap-1.5">
                        <Users className="w-3 h-3" />
                        Pengguna (Users)
                      </div>
                      {results.users.map((user) => {
                        const itemIdx = currentIndexTracker++;
                        const isSelected = itemIdx === selectedIndex;
                        const targetUrl = `/admin/users?search=${encodeURIComponent(user.nama_lengkap)}`;
                        return (
                          <div
                            key={user.id}
                            onClick={() => navigateTo(targetUrl)}
                            onMouseEnter={() => setSelectedIndex(itemIdx)}
                            className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected ? 'bg-primary/10 text-[var(--primary)]' : 'hover:bg-surface-container-low text-on-surface'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {user.avatar_url ? (
                                <img
                                  src={user.avatar_url}
                                  alt={user.nama_lengkap}
                                  className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-[var(--primary)]/20"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-primary/10 text-[var(--primary)] flex items-center justify-center font-bold text-xs shrink-0">
                                  {user.nama_lengkap.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="truncate">
                                <p className="text-xs font-bold truncate flex items-center gap-1.5">
                                  <span>{user.nama_lengkap}</span>
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-surface-container text-on-surface-variant rounded border border-card-border">
                                    {user.role}
                                  </span>
                                </p>
                                <p className="text-[11px] text-on-surface-variant truncate">
                                  @{user.username} • {user.email}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isSelected ? 'translate-x-1 text-[var(--primary)]' : 'text-on-surface-variant/70'}`} />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Group 3: Tugas (Tasks) */}
                  {results.tasks.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--primary)] flex items-center gap-1.5">
                        <ClipboardList className="w-3 h-3" />
                        Tugas (Tasks)
                      </div>
                      {results.tasks.map((task) => {
                        const itemIdx = currentIndexTracker++;
                        const isSelected = itemIdx === selectedIndex;
                        const targetUrl = `/admin/tasks?search=${encodeURIComponent(task.judul_tugas)}`;
                        return (
                          <div
                            key={task.id}
                            onClick={() => navigateTo(targetUrl)}
                            onMouseEnter={() => setSelectedIndex(itemIdx)}
                            className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected ? 'bg-primary/10 text-[var(--primary)]' : 'hover:bg-surface-container-low text-on-surface'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-1.5 rounded-md bg-primary/10 text-[var(--primary)] font-mono text-[10px] font-bold shrink-0">
                                {task.kategori.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold truncate">{task.judul_tugas}</p>
                                <p className="text-[11px] text-on-surface-variant truncate">
                                  Oleh: <span className="font-semibold text-on-surface">{task.requester_name}</span> • Status:{' '}
                                  <span className="capitalize">{task.status}</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono text-xs font-extrabold text-primary">
                                Rp {task.kompensasi.toLocaleString('id-ID')}
                              </span>
                              <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-1 text-primary' : 'text-on-surface-variant/70'}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Group 4: Kategori */}
                  {results.categories.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                        <Tag className="w-3 h-3" />
                        Kategori & Skill
                      </div>
                      {results.categories.map((cat) => {
                        const itemIdx = currentIndexTracker++;
                        const isSelected = itemIdx === selectedIndex;
                        const targetUrl = `/admin/categories?search=${encodeURIComponent(cat.nama_kategori)}`;
                        return (
                          <div
                            key={cat.id}
                            onClick={() => navigateTo(targetUrl)}
                            onMouseEnter={() => setSelectedIndex(itemIdx)}
                            className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-1.5 rounded-md bg-surface-container text-primary shrink-0">
                                <Tag className="w-3.5 h-3.5" />
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold truncate">{cat.nama_kategori}</p>
                                <p className="text-[11px] text-on-surface-variant truncate">
                                  {cat.total_tasks} task terdaftar dalam kategori ini
                                </p>
                              </div>
                            </div>
                            <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isSelected ? 'translate-x-1 text-primary' : 'text-on-surface-variant/70'}`} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Footer hint */}
              <div className="px-3 py-2 bg-surface-container-low border-t border-card-border flex items-center justify-between text-[10px] text-on-surface-variant">
                <div className="flex items-center gap-3">
                  <span>
                    <kbd className="px-1 py-0.5 bg-surface-container-lowest border border-outline-variant rounded font-mono font-bold text-on-surface">↑↓</kbd> Navigasi
                  </span>
                  <span>
                    <kbd className="px-1 py-0.5 bg-surface-container-lowest border border-outline-variant rounded font-mono font-bold text-on-surface">↵</kbd> Pilih
                  </span>
                  <span>
                    <kbd className="px-1 py-0.5 bg-surface-container-lowest border border-outline-variant rounded font-mono font-bold text-on-surface">ESC</kbd> Tutup
                  </span>
                </div>
                {totalResultsCount > 0 && (
                  <span className="font-mono font-bold text-primary">
                    {totalResultsCount} Hasil
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Button & Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setIsNotifOpen((prev) => !prev);
              requestPermission();
            }}
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors relative"
            title="Notifikasi Admin"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white font-mono text-[9px] font-extrabold ring-2 ring-surface-container-lowest animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Admin Notification Popup */}
          {isNotifOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-surface-container-lowest rounded-2xl border border-card-border shadow-xl overflow-hidden z-50 flex flex-col animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="p-3.5 bg-surface-container-low border-b border-card-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-xs font-bold text-on-surface">Notifikasi Admin</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-100 text-rose-700">
                      {unreadCount} Baru
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    disabled={notifLoading}
                    className="text-[11px] font-bold text-[var(--primary)] hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Tandai Semua Dibaca
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[#F1F5F9]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-on-surface-variant/70">
                    Belum ada notifikasi atau laporan baru.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 flex items-start gap-3 hover:bg-surface-container-low cursor-pointer transition-colors ${
                        !notif.is_read ? 'bg-primary/10/30 font-semibold' : ''
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg shrink-0 mt-0.5 border ${
                          notif.data?.subType === 'withdrawal'
                            ? notif.data?.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : notif.data?.status === 'rejected'
                              ? 'bg-rose-50 text-rose-600 border-rose-200'
                              : 'bg-amber-50 text-amber-600 border-amber-200'
                            : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}
                      >
                        {notif.data?.subType === 'withdrawal' ? (
                          <Banknote className="w-3.5 h-3.5" />
                        ) : (
                          <Flag className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <p className="text-xs font-bold text-on-surface truncate">
                            {notif.title}
                          </p>
                          {notif.data?.subType === 'withdrawal' && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                                notif.data?.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : notif.data?.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-800 animate-pulse'
                              }`}
                            >
                              {notif.data?.status === 'completed'
                                ? 'Selesai'
                                : notif.data?.status === 'rejected'
                                ? 'Ditolak'
                                : 'Perlu Transfer'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5">
                          {notif.message}
                        </p>
                        <p className="text-[10px] font-mono text-on-surface-variant/70 mt-1">
                          {new Date(notif.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-surface-container-low border-t border-card-border text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifOpen(false);
                    router.push('/admin/reports');
                  }}
                  className="text-xs font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-1"
                >
                  Lihat Semua Halaman Laporan User
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-card-border" />

        {/* Admin User Info */}
        <div className="flex items-center gap-2.5">
          {adminUser?.avatar_url ? (
            <Image
              src={adminUser.avatar_url}
              alt="Admin Profile"
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs ring-2 ring-primary/20 shrink-0">
              {(adminUser?.nama_lengkap || 'Admin').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="hidden lg:flex flex-col">
            <span className="font-sans font-bold text-xs text-on-surface">
              {adminUser?.nama_lengkap || 'Admin ITechno'}
            </span>
            <span className="font-mono text-[10px] text-on-surface-variant">
              {adminUser?.email || 'admin@itechno.id'}
            </span>
          </div>
        </div>
      </div>
    </header>

    {/* Modal Konfirmasi Penarikan Dana (Payout) */}
    {selectedWithdrawal && (
      <Modal
        isOpen={isWithdrawalModalOpen}
        onClose={() => {
          if (!withdrawalActionLoading) {
            setIsWithdrawalModalOpen(false);
            setSelectedWithdrawal(null);
          }
        }}
        title="Konfirmasi Penarikan Dana (Payout)"
      >
        <div className="flex flex-col gap-4 font-sans text-xs">
          {/* Status Banner */}
          {selectedWithdrawal.data?.status === 'completed' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">Penarikan ini sudah disetujui & ditransfer.</span>
            </div>
          )}
          {selectedWithdrawal.data?.status === 'rejected' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800">
              <X className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">
                Penarikan ini telah ditolak. Alasan: {selectedWithdrawal.data?.rejection_reason || '-'}
              </span>
            </div>
          )}
          {actionSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{actionSuccessMsg}</span>
            </div>
          )}

          {/* Nominal Card */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-card-border flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-on-surface-variant uppercase font-mono">
                Nominal yang harus ditransfer
              </span>
              <div className="text-2xl font-extrabold text-on-surface font-mono tabular-nums mt-0.5">
                Rp {(Number(selectedWithdrawal.data?.amount) || 0).toLocaleString('id-ID')}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Banknote className="w-6 h-6" />
            </div>
          </div>

          {/* Detail Pemohon & Rekening */}
          <div className="bg-surface-container-lowest border border-card-border rounded-xl p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between py-1 border-b border-card-border/60">
              <span className="text-on-surface-variant font-medium">Pemohon (User)</span>
              <span className="font-bold text-on-surface">
                {selectedWithdrawal.data?.requester_name || '-'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-card-border/60">
              <span className="text-on-surface-variant font-medium">Tujuan Transfer</span>
              <span className="font-bold text-on-surface flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                {selectedWithdrawal.data?.bank || '-'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-card-border/60">
              <span className="text-on-surface-variant font-medium">Nomor Rekening / E-Wallet</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-on-surface tabular-nums">
                  {selectedWithdrawal.data?.account_number || '-'}
                </span>
                {selectedWithdrawal.data?.account_number && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(String(selectedWithdrawal.data?.account_number));
                      setCopiedAccount(true);
                      setTimeout(() => setCopiedAccount(false), 2000);
                    }}
                    className="p-1 rounded-md hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                    title="Salin Nomor Rekening"
                  >
                    {copiedAccount ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-on-surface-variant font-medium">Atas Nama (a.n)</span>
              <span className="font-bold text-on-surface">
                {selectedWithdrawal.data?.account_name || '-'}
              </span>
            </div>
          </div>

          {/* Input Alasan Penolakan */}
          {showRejectInput && selectedWithdrawal.data?.status === 'pending' && (
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-rose-50/60 border border-rose-200">
              <label className="font-bold text-rose-800 text-[11px]">
                Alasan Penolakan (akan dikirimkan ke notifikasi user):
              </label>
              <input
                type="text"
                placeholder="Contoh: Nomor rekening salah / tidak terdaftar"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-rose-300 text-on-surface text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                autoFocus
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 border-t border-card-border pt-3 mt-1">
            <button
              type="button"
              onClick={() => {
                setIsWithdrawalModalOpen(false);
                setSelectedWithdrawal(null);
              }}
              disabled={withdrawalActionLoading}
              className="px-3.5 py-2 rounded-xl border border-card-border text-on-surface-variant font-bold text-xs hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer"
            >
              Tutup
            </button>

            {selectedWithdrawal.data?.status === 'pending' && !actionSuccessMsg && (
              <>
                <button
                  type="button"
                  onClick={() => handleWithdrawalAction('reject')}
                  disabled={withdrawalActionLoading}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {withdrawalActionLoading ? 'Memproses...' : showRejectInput ? 'Konfirmasi Tolak' : 'Tolak Penarikan'}
                </button>
                <button
                  type="button"
                  onClick={() => handleWithdrawalAction('approve')}
                  disabled={withdrawalActionLoading}
                  className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {withdrawalActionLoading ? 'Memproses...' : 'Tandai Sudah Ditransfer'}
                </button>
              </>
            )}
          </div>
        </div>
      </Modal>
    )}
  </>
  );
}

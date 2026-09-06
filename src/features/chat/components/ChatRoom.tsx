import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { ChatInput } from './ChatInput';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import {
  UploadCloud,
  X,
  Trash2,
  ArrowLeft,
  User,
  MoreVertical,
  MessageSquare,
  Check,
  Ban,
  CheckCheck,
  CheckSquare,
  Search,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface Message {
  id_message: string;
  id_sender: string;
  teks_pesan: string | null;
  image_url: string | null;
  is_read: boolean;
  is_deleted_for_everyone: boolean;
  created_at: string;
  sender: {
    id_user: string;
    nama_lengkap: string;
    avatar_url: string | null;
  };
}

export interface RoomMetadata {
  title: string;
  otherUserName: string;
  otherUserId: string;
  otherUserAvatarUrl?: string | null;
  otherUserLastSeen?: string | Date | null;
}

interface ChatRoomProps {
  roomId: string;
  currentUserId: string;
  onBack: () => void;
  roomInfo?: RoomMetadata;
  onMessageAdded?: () => void;
}

export function ChatRoom({ roomId, currentUserId, onBack, roomInfo, onMessageAdded }: ChatRoomProps) {
  const { showToast } = useToast();
  const [activeInfo, setActiveInfo] = useState<RoomMetadata | undefined>(roomInfo);
  const [isNotFound, setIsNotFound] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFile, setDraggedFile] = useState<File | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<string | Date | null>(roomInfo?.otherUserLastSeen || null);
  const [lastSeenFormatted, setLastSeenFormatted] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (roomInfo) {
      setActiveInfo(roomInfo);
      if (roomInfo.otherUserLastSeen) {
        setLastSeenTimestamp(roomInfo.otherUserLastSeen);
      }
    }
  }, [roomInfo]);

  const otherUserId = activeInfo?.otherUserId || '';
  const otherUserName = activeInfo?.otherUserName || 'Pengguna';
  const otherUserAvatarUrl = activeInfo?.otherUserAvatarUrl;
  const otherUserLastSeen = activeInfo?.otherUserLastSeen;
  const title = activeInfo?.title || 'Detail Tugas';
  
  // Search state
  const [isSearchSidebarOpen, setIsSearchSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  
  // Selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Custom Dialog state
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm' | 'delete_options';
    onConfirm?: () => void;
    onConfirmForEveryone?: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'alert' });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isLoading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setDraggedFile(file);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(id);
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  };

  const searchedMessages = searchQuery.trim() 
    ? messages.filter(m => m.teks_pesan?.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  useEffect(() => {
    // Tick every 30 seconds to recalculate relative time
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Poll the user API every 2 minutes to get fresh last_seen_at
    if (isOnline || !otherUserId) return;
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/users/${otherUserId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.last_seen_at) {
            setLastSeenTimestamp(json.data.last_seen_at);
          }
        }
      } catch (e) {}
    }, 120000); // 2 minutes
    return () => clearInterval(pollInterval);
  }, [otherUserId, isOnline]);

  useEffect(() => {
    setLastSeenTimestamp(otherUserLastSeen || null);
  }, [otherUserLastSeen, otherUserId]);

  useEffect(() => {
    if (!lastSeenTimestamp) {
      setLastSeenFormatted('');
      return;
    }
    const lastSeenDate = new Date(lastSeenTimestamp);
    const now = new Date();
    
    // Formatting Last Seen
    const diffMs = Math.max(0, now.getTime() - lastSeenDate.getTime());
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) {
      setLastSeenFormatted('Terakhir dilihat baru saja');
    } else if (diffMins < 60) {
      setLastSeenFormatted(`Terakhir dilihat ${diffMins} menit yang lalu`);
    } else if (diffHours < 24) {
      setLastSeenFormatted(`Terakhir dilihat ${diffHours} jam yang lalu`);
    } else {
      const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === lastSeenDate.toDateString();
      if (isYesterday) {
        setLastSeenFormatted(`Terakhir dilihat kemarin pukul ${lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      } else {
        setLastSeenFormatted(`Terakhir dilihat pada ${lastSeenDate.toLocaleDateString()} ${lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      }
    }
  }, [lastSeenTimestamp, tick]);

  useEffect(() => {
    let isMounted = true;
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/chat/${roomId}`);
        if (!isMounted) return;
        if (!res.ok) {
          if (res.status === 404 || res.status === 403) {
            setIsNotFound(true);
          }
          return;
        }
        const data = await res.json();
        if (data.success) {
          setMessages(data.data || []);
          if (data.room) {
            const isRequester = data.room.id_requester === currentUserId;
            const other = isRequester ? data.room.worker : data.room.requester;
            setActiveInfo((prev) => prev || {
              title: data.room.task?.judul_tugas || "Detail Tugas",
              otherUserName: other?.nama_lengkap || "Pengguna",
              otherUserId: other?.id_user || "",
              otherUserAvatarUrl: other?.avatar_url,
              otherUserLastSeen: other?.last_seen_at
            });
            if (other?.last_seen_at) {
              setLastSeenTimestamp(other.last_seen_at);
            }
          }
          setTimeout(scrollToBottom, 100);
          fetch(`/api/chat/${roomId}`, { method: 'PUT' })
            .then(() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('chat-unread-updated'));
              }
            })
            .catch(console.error);
        } else {
          setIsNotFound(true);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Gagal mengambil pesan:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchMessages();

    const channel = supabase
      .channel(`room_${roomId}`, {
        config: {
          presence: {
            key: currentUserId || 'anon',
          },
        },
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const isOtherUserOnline = Boolean(otherUserId && Object.keys(state).includes(otherUserId));
        setIsOnline(isOtherUserOnline);
      })
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message'
        },
        async (payload: any) => {
          const newMessageRaw = payload.new as any;
          if (newMessageRaw.id_chat_room !== roomId) return;
          
          setMessages(prev => {
            if (prev.some(m => m.id_message === newMessageRaw.id_message)) return prev;
            
            const newMsg: Message = {
              id_message: newMessageRaw.id_message,
              id_sender: newMessageRaw.id_sender,
              teks_pesan: newMessageRaw.teks_pesan,
              image_url: newMessageRaw.image_url,
              is_read: newMessageRaw.is_read || false,
              is_deleted_for_everyone: newMessageRaw.is_deleted_for_everyone || false,
              created_at: (!newMessageRaw.created_at.includes('Z') && !newMessageRaw.created_at.includes('+'))
                ? newMessageRaw.created_at.replace(' ', 'T') + 'Z'
                : newMessageRaw.created_at,
              sender: {
                id_user: newMessageRaw.id_sender,
                nama_lengkap: newMessageRaw.id_sender === currentUserId ? "Anda" : otherUserName,
                avatar_url: null
              }
            };
            return [...prev, newMsg];
          });
          
          setTimeout(scrollToBottom, 100);

          if (newMessageRaw.id_sender !== currentUserId) {
            fetch(`/api/chat/${roomId}`, { method: 'PUT' })
              .then(() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('chat-unread-updated'));
                }
              })
              .catch(console.error);
          }
          
          if (onMessageAdded) onMessageAdded();
        }
      )
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Message'
        },
        (payload: any) => {
          const updatedMessage = payload.new as any;
          if (updatedMessage.id_chat_room !== roomId) return;
          
          setMessages(prev => {
            if (updatedMessage.deleted_by && Array.isArray(updatedMessage.deleted_by) && updatedMessage.deleted_by.includes(currentUserId)) {
               return prev.filter(m => m.id_message !== updatedMessage.id_message);
            }
            
            return prev.map(m => 
              m.id_message === updatedMessage.id_message 
                ? { 
                    ...m, 
                    is_read: updatedMessage.is_read,
                    is_deleted_for_everyone: updatedMessage.is_deleted_for_everyone,
                    teks_pesan: updatedMessage.teks_pesan,
                    image_url: updatedMessage.image_url
                  } 
                : m
            );
          });
          
          if (onMessageAdded) onMessageAdded();
        }
      )
      .subscribe(async (status: any, err?: any) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
        if (err) console.error('[Realtime] Subscription error:', err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase, currentUserId, otherUserName, otherUserId]);

  const handleSendMessage = async (text: string | null, imageUrl: string | null) => {
    try {
      const res = await fetch(`/api/chat/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teks_pesan: text, image_url: imageUrl })
      });
      const data = await res.json();
      
      if (!data.success) {
        showToast("Gagal mengirim pesan: " + (data.message || "Terjadi kesalahan"));
      } else {
        setMessages(prev => {
          if (prev.some(m => m.id_message === data.data.id_message)) return prev;
          return [...prev, data.data];
        });
        setTimeout(scrollToBottom, 100);
        
        if (onMessageAdded) onMessageAdded();
      }
    } catch (e) {
      console.error(e);
      showToast("Terjadi kesalahan koneksi saat mengirim pesan.");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedMessages.length === 0) return;
    
    const selectedMsgsObjs = messages.filter(m => selectedMessages.includes(m.id_message));
    const allOwnedByMe = selectedMsgsObjs.every(m => m.id_sender === currentUserId);

    const deleteFn = async (type: 'for_me' | 'for_everyone') => {
      setIsActionLoading(true);
      try {
        const res = await fetch(`/api/chat/${roomId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageIds: selectedMessages, type })
        });
        if (res.ok) {
          if (type === 'for_me') {
            setMessages(prev => prev.filter(m => !selectedMessages.includes(m.id_message)));
          } else {
            setMessages(prev => prev.map(m => {
              if (selectedMessages.includes(m.id_message)) {
                return {
                  ...m,
                  is_deleted_for_everyone: true,
                  teks_pesan: null,
                  image_url: null
                };
              }
              return m;
            }));
          }
          if (onMessageAdded) onMessageAdded();
          setIsSelectionMode(false);
          setSelectedMessages([]);
          setDialog(prev => ({ ...prev, isOpen: false }));
        } else {
          setDialog({ isOpen: true, title: "Gagal Menghapus", message: "Terjadi kesalahan saat menghapus pesan. Silakan coba lagi.", type: 'alert' });
        }
      } catch (e) {
        console.error(e);
        setDialog({ isOpen: true, title: "Kesalahan Koneksi", message: "Tidak dapat terhubung ke server. Silakan periksa koneksi Anda.", type: 'alert' });
      } finally {
        setIsActionLoading(false);
      }
    };
    
    if (allOwnedByMe) {
      setDialog({
        isOpen: true,
        title: "Konfirmasi Penghapusan Pesan",
        message: "Hapus pesan ini untuk Anda sendiri atau untuk semua orang?",
        type: 'delete_options',
        onConfirm: () => deleteFn('for_me'),
        onConfirmForEveryone: () => deleteFn('for_everyone')
      });
    } else {
      setDialog({
        isOpen: true,
        title: "Konfirmasi Penghapusan Pesan",
        message: "Pesan ini hanya akan dihapus untuk Anda. Lawan bicara masih dapat melihat pesan yang mereka kirim.",
        type: 'confirm',
        onConfirm: () => deleteFn('for_me'),
      });
    }
  };

  const handleClearChat = async () => {
    setDialog({
      isOpen: true,
      title: "Kosongkan Obrolan",
      message: "Apakah Anda yakin ingin mengosongkan obrolan ini? Tindakan ini bersifat permanen di sisi Anda.",
      type: 'confirm',
      onConfirm: async () => {
        setIsActionLoading(true);
        try {
          const res = await fetch('/api/chat/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'clear', roomIds: [roomId] })
          });
          if (res.ok) {
            setMessages([]);
            setIsMenuOpen(false);
            setDialog(prev => ({ ...prev, isOpen: false }));
            if (onMessageAdded) {
              onMessageAdded();
            }
          } else {
            setDialog({ isOpen: true, title: "Gagal Membersihkan", message: "Terjadi kesalahan saat membersihkan obrolan. Silakan coba lagi.", type: 'alert' });
          }
        } catch (e) {
          console.error(e);
          setDialog({ isOpen: true, title: "Kesalahan Koneksi", message: "Tidak dapat terhubung ke server. Silakan periksa koneksi Anda.", type: 'alert' });
        } finally {
          setIsActionLoading(false);
        }
      }
    });
  };

  const toggleMessageSelection = (id: string) => {
    if (!isSelectionMode) return;
    setSelectedMessages(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  if (isNotFound) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 p-8 bg-surface h-full font-sans">
        <AlertCircle className="w-14 h-14 text-error mb-2" />
        <h2 className="font-headline font-bold text-base text-on-surface">Obrolan tidak ditemukan</h2>
        <p className="font-body-sm text-xs text-on-surface-variant max-w-sm leading-relaxed">
          Ruang obrolan ini mungkin sudah dihapus atau Anda tidak memiliki akses.
        </p>
        <Button onClick={onBack} variant="primary" size="sm" className="mt-2">
          Kembali ke Daftar Obrolan
        </Button>
      </div>
    );
  }

  if (isLoading && !activeInfo) {
    return (
      <div className="flex-1 flex flex-col h-full bg-surface font-sans">
        <div className="h-16 px-4 border-b border-card-border bg-surface-container-lowest flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-xl bg-surface-container-high md:hidden"></div>
          <div className="w-10 h-10 rounded-full bg-surface-container-high shrink-0"></div>
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="w-32 h-3.5 rounded bg-surface-container-high"></div>
            <div className="w-48 h-2.5 rounded bg-surface-container"></div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-surface-container-high"></div>
        </div>
        <div className="flex-1 p-5 flex flex-col justify-center items-center gap-3 overflow-hidden bg-surface/40">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
          <span className="text-xs text-on-surface-variant">Memuat obrolan...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row h-full w-full max-w-full min-w-0 min-h-0 relative overflow-hidden font-sans">
      {/* Main Chat Area */}
      <div 
        className="flex flex-col flex-1 h-full min-w-0 min-h-0 w-full max-w-full bg-surface-container-lowest relative md:border-r border-card-border overflow-hidden"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
      {/* Global Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary flex items-center justify-center backdrop-blur-xs transition-all">
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-primary shadow-xl flex flex-col items-center">
            <UploadCloud className="w-12 h-12 text-primary mb-3" />
            <p className="font-headline text-primary font-bold text-sm">Lepaskan Gambar di Sini</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="h-14 sm:h-16 md:h-[72px] px-3 sm:px-4 md:px-6 border-b border-card-border flex items-center gap-2 sm:gap-3 bg-surface-container-lowest shadow-xs z-10 shrink-0 w-full max-w-full min-w-0">
        {isSelectionMode ? (
          <>
            <button 
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedMessages([]);
              }}
              aria-label="Batalkan pilihan pesan"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center hover:bg-surface-container-low transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5 text-on-surface-variant" />
            </button>
            <div className="flex-1 font-headline font-bold text-xs sm:text-sm text-on-surface truncate">
              {selectedMessages.length} Terpilih
            </div>
            {selectedMessages.length > 0 && (
              <button 
                onClick={handleDeleteSelected}
                disabled={isActionLoading}
                aria-label="Hapus pesan terpilih"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-error hover:bg-error-container/30 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </>
        ) : (
          <>
            <button 
              onClick={onBack}
              aria-label="Kembali ke daftar obrolan"
              className="md:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center hover:bg-surface-container-low transition-colors shrink-0 cursor-pointer -ml-1 sm:ml-0"
            >
              <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
            </button>
            <Link href={otherUserId ? `/profile/${otherUserId}` : '#'} className="flex-1 min-w-0 flex items-center gap-2.5 sm:gap-3 hover:bg-surface-container-low/60 p-1 sm:p-1.5 rounded-xl transition-colors">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden relative border border-primary/20">
                {otherUserAvatarUrl ? (
                  <Image src={otherUserAvatarUrl} alt={otherUserName} fill sizes="40px" className="object-cover" />
                ) : (
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-headline font-bold text-xs sm:text-sm text-on-surface truncate hover:text-primary transition-colors">{otherUserName}</h3>
                {isOnline ? (
                  <span className="text-[11px] sm:text-xs text-primary flex items-center gap-1 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                    Online
                  </span>
                ) : lastSeenFormatted ? (
                  <span className="text-[10px] sm:text-xs text-on-surface-variant flex items-center gap-1 font-mono truncate">
                    {lastSeenFormatted}
                  </span>
                ) : (
                  <span className="text-[10px] sm:text-xs text-on-surface-variant flex items-center gap-1 font-mono truncate">
                    Offline
                  </span>
                )}
              </div>
            </Link>
            
            <div className="flex gap-1 sm:gap-2 text-on-surface-variant shrink-0 relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Menu obrolan"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl hover:bg-surface-container-low flex items-center justify-center transition-colors cursor-pointer"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {isMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsMenuOpen(false)} 
                  />
                  <div className="absolute right-0 top-11 w-52 bg-surface-container-lowest/95 backdrop-blur-md border border-card-border rounded-2xl shadow-xl p-1.5 flex flex-col gap-0.5 z-50 text-xs font-sans animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                    <button 
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer flex items-center gap-2.5" 
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsSearchSidebarOpen(true);
                      }}
                    >
                      <Search className="w-4 h-4 text-on-surface-variant shrink-0" />
                      <span>Cari Pesan</span>
                    </button>
                    <button 
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer flex items-center gap-2.5" 
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsSelectionMode(true);
                      }}
                    >
                      <CheckSquare className="w-4 h-4 text-on-surface-variant shrink-0" />
                      <span>Pilih Pesan</span>
                    </button>
                    <button 
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-error hover:bg-error-container/20 transition-colors cursor-pointer flex items-center gap-2.5" 
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleClearChat();
                      }}
                      disabled={isActionLoading}
                    >
                      <Trash2 className="w-4 h-4 text-error shrink-0" />
                      <span>Kosongkan Obrolan</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-5 flex flex-col gap-2.5 sm:gap-3 custom-scrollbar bg-surface/50 w-full max-w-full">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-primary">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant text-center opacity-70">
            <MessageSquare className="w-12 h-12 text-primary/30 mb-2" />
            <p className="text-xs font-medium">Mulai percakapan tentang tugas ini.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.id_sender === currentUserId;
            const isSelected = selectedMessages.includes(msg.id_message);

            return (
              <div 
                key={msg.id_message} 
                id={`msg-${msg.id_message}`}
                className={`flex w-full max-w-full min-w-0 items-end gap-2 sm:gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} transition-colors duration-300`}
              >
                {isSelectionMode && (
                  <div 
                    className={`flex shrink-0 items-center justify-center p-1.5 sm:p-2 ${msg.is_deleted_for_everyone ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={() => { if (!msg.is_deleted_for_everyone) toggleMessageSelection(msg.id_message) }}
                  >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-on-primary' : 'border-card-border bg-surface-container-low'}`}>
                      {isSelected && <Check className="w-3.5 h-3.5 font-bold" />}
                    </div>
                  </div>
                )}
                
                <div 
                  className={`flex flex-col max-w-[85%] sm:max-w-[70%] md:max-w-[65%] min-w-0 ${isMe ? 'items-end' : 'items-start'} ${isSelectionMode && !msg.is_deleted_for_everyone ? 'cursor-pointer hover:opacity-80' : ''}`}
                  onClick={() => { if (isSelectionMode && !msg.is_deleted_for_everyone) toggleMessageSelection(msg.id_message) }}
                >
                  <div 
                    className={`p-2.5 sm:p-3 rounded-2xl shadow-xs text-xs relative transition-colors duration-200 break-words [overflow-wrap:anywhere] max-w-full overflow-hidden ${
                      isSelected
                        ? 'bg-primary/20 border border-primary text-on-surface'
                        : highlightedMessageId === msg.id_message 
                        ? 'bg-amber-500/20 border border-amber-500/40 text-on-surface' 
                        : msg.is_deleted_for_everyone
                          ? `bg-transparent border border-card-border text-on-surface-variant/70 italic ${isMe ? 'rounded-tr-xs' : 'rounded-tl-xs'}`
                          : isMe 
                            ? 'bg-primary text-on-primary rounded-tr-xs border border-primary/20' 
                            : 'bg-surface-container-lowest text-on-surface rounded-tl-xs border border-card-border'
                    }`}
                  >
                    {msg.is_deleted_for_everyone ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Ban className="w-3.5 h-3.5 shrink-0" />
                        <p>Pesan ini telah dihapus</p>
                      </div>
                    ) : msg.image_url ? (
                      <div className="flex flex-col gap-2 max-w-full">
                        <div className="relative w-full max-w-[240px] sm:max-w-[260px] aspect-square rounded-xl overflow-hidden border border-card-border">
                          <Image 
                            src={msg.image_url} 
                            alt="Lampiran chat" 
                            fill
                            sizes="(max-width: 640px) 240px, 260px"
                            className="object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                            onClick={(e) => {
                              if (!isSelectionMode) window.open(msg.image_url!, '_blank');
                              else e.preventDefault();
                            }}
                          />
                        </div>
                        {msg.teks_pesan && <p className="leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{msg.teks_pesan}</p>}
                      </div>
                    ) : (
                      <p className="leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{msg.teks_pesan}</p>
                    )}
                  </div>
                  
                  {/* Timestamp & Status */}
                  <div className={`flex items-center gap-1 mt-1 text-[10px] sm:text-xs font-mono ${isSelectionMode && isSelected ? 'text-primary font-medium' : 'text-on-surface-variant'}`}>
                    <span className="tabular-nums">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && (
                      <CheckCheck className={`w-3.5 h-3.5 ${msg.is_read ? 'text-emerald-500' : 'text-on-surface-variant/50'}`} />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-1 shrink-0" />
      </div>

      {/* Input Area */}
      <ChatInput 
        onSendMessage={handleSendMessage} 
        disabled={isLoading}
        externalFile={draggedFile}
        onExternalFileConsumed={() => setDraggedFile(null)}
      />
      </div>

      {/* Right Sidebar for Search */}
      {isSearchSidebarOpen && (
        <div className="w-full md:w-80 h-full flex flex-col bg-surface-container-lowest z-50 absolute md:relative right-0 top-0 shadow-xl md:shadow-none border-l border-card-border overflow-hidden">
          <div className="h-14 sm:h-16 md:h-[72px] px-4 sm:px-5 border-b border-card-border flex items-center justify-between bg-surface-container-lowest shrink-0">
            <h3 className="font-headline text-sm font-bold text-on-surface">Cari Pesan</h3>
            <button 
              onClick={() => setIsSearchSidebarOpen(false)}
              aria-label="Tutup pencarian"
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-on-surface-variant" />
            </button>
          </div>
          
          <div className="p-3 border-b border-card-border bg-surface-container-low">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
              <input
                type="text"
                placeholder="Cari dalam chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3.5 bg-surface-container-lowest border border-card-border rounded-xl text-base sm:text-xs text-on-surface focus:outline-none focus:border-primary transition-all font-sans"
                autoFocus
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {!searchQuery.trim() ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-on-surface-variant/70">
                <Search className="w-8 h-8 mb-2" />
                <p className="text-xs">Ketik kata kunci untuk mencari pesan di obrolan ini.</p>
              </div>
            ) : searchedMessages.length === 0 ? (
              <div className="text-center p-4 text-on-surface-variant text-xs font-sans">
                Tidak ada pesan yang cocok dengan &quot;{searchQuery}&quot;
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {searchedMessages.map(msg => (
                  <button
                    key={msg.id_message}
                    onClick={() => scrollToMessage(msg.id_message)}
                    className="flex flex-col text-left p-3 hover:bg-surface-container-low rounded-xl transition-colors border-b border-card-border/40 last:border-0 cursor-pointer"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-primary truncate max-w-[120px]">
                        {msg.id_sender === currentUserId ? "Anda" : otherUserName}
                      </span>
                      <span className="text-xs text-on-surface-variant font-mono tabular-nums">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface line-clamp-2 break-words">{msg.teks_pesan}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Custom Dialog / Modal */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest border border-card-border rounded-2xl p-6 shadow-2xl w-full max-w-sm flex flex-col gap-4 animate-in zoom-in-95 duration-200 font-sans text-xs">
            <div>
              <h3 className="font-headline font-bold text-sm text-on-surface mb-1.5">{dialog.title}</h3>
              <p className="text-on-surface-variant leading-relaxed">{dialog.message}</p>
            </div>
            
            <div className="flex justify-end gap-2.5 mt-2">
              {dialog.type === 'delete_options' ? (
                <div className="flex flex-col gap-2 w-full">
                  <Button 
                    variant="destructive"
                    size="sm"
                    fullWidth
                    onClick={() => { if (dialog.onConfirmForEveryone) dialog.onConfirmForEveryone(); }}
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? "Memproses..." : "Hapus untuk Semua Orang"}
                  </Button>
                  <Button 
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => { if (dialog.onConfirm) dialog.onConfirm(); }}
                    disabled={isActionLoading}
                  >
                    Hapus untuk Saya
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={() => setDialog({ ...dialog, isOpen: false })}
                    disabled={isActionLoading}
                  >
                    Batal
                  </Button>
                </div>
              ) : (
                <>
                  {dialog.type === 'confirm' && (
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => setDialog({ ...dialog, isOpen: false })}
                      disabled={isActionLoading}
                    >
                      Batal
                    </Button>
                  )}
                  <Button 
                    variant={dialog.type === 'confirm' ? 'destructive' : 'primary'}
                    size="sm"
                    onClick={() => {
                      if (dialog.type === 'confirm' && dialog.onConfirm) {
                        dialog.onConfirm();
                      } else {
                        setDialog({ ...dialog, isOpen: false });
                      }
                    }}
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? "Memproses..." : dialog.type === 'confirm' && dialog.title.includes('Kosongkan') ? 'Kosongkan' : dialog.type === 'confirm' ? 'Hapus untuk Saya' : 'Mengerti'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

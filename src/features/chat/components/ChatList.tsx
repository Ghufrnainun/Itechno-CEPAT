import React, { useState } from 'react';
import Image from 'next/image';
import { X, MoreVertical, SquarePen, Search, MessageSquare, Check, User, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChatRoomData {
  id_chat_room: string;
  created_at: string;
  task: {
    judul_tugas: string;
  };
  requester: {
    id_user: string;
    nama_lengkap: string;
    avatar_url: string | null;
  };
  worker: {
    id_user: string;
    nama_lengkap: string;
    avatar_url: string | null;
  };
  messages: {
    id_message: string;
    teks_pesan: string | null;
    image_url: string | null;
    is_deleted_for_everyone: boolean;
    created_at: string;
  }[];
  unreadCount?: number;
}

interface ChatListProps {
  rooms: ChatRoomData[];
  selectedRoomId: string | null;
  currentUserId: string;
  onSelectRoom: (roomId: string | null) => void;
  isLoading: boolean;
  onActionComplete?: () => void;
}

export function ChatList({ rooms, selectedRoomId, currentUserId, onSelectRoom, isLoading, onActionComplete }: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [isSelectionMenuOpen, setIsSelectionMenuOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleAction = async (action: 'mark_read' | 'mark_unread' | 'clear', roomIds?: string[]) => {
    const targetRooms = roomIds || selectedChats;
    if (targetRooms.length === 0) return;
    
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/chat/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, roomIds: targetRooms })
      });
      if (res.ok) {
        setIsSelectionMode(false);
        setSelectedChats([]);
        setIsSelectionMenuOpen(false);
        setIsMenuOpen(false);
        setShowClearConfirm(false);
        if (action === 'clear' && targetRooms.includes(selectedRoomId || '')) {
          onSelectRoom(null);
        }
        if (onActionComplete) {
          onActionComplete();
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('chat-unread-updated'));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredRooms = rooms.filter(room => {
    if (!searchQuery) return true;
    const isRequester = room.requester.id_user === currentUserId;
    const otherUser = isRequester ? room.worker : room.requester;
    const query = searchQuery.toLowerCase();
    return otherUser.nama_lengkap.toLowerCase().includes(query) || 
           room.task.judul_tugas.toLowerCase().includes(query);
  });

  const hasAnyUnread = rooms.some(r => (r.unreadCount || 0) > 0);
  const hasUnreadSelected = selectedChats.some(id => {
    const room = rooms.find(r => r.id_chat_room === id);
    return room && (room.unreadCount || 0) > 0;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full font-sans">
        <div className="p-4 border-b border-card-border flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h2 className="font-headline text-lg font-bold text-on-surface">Daftar Kontak</h2>
          </div>
          <div className="h-9 bg-surface-container rounded-xl animate-pulse"></div>
        </div>
        <div className="flex flex-col gap-3 p-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 items-center animate-pulse">
              <div className="w-11 h-11 rounded-full bg-surface-container shrink-0"></div>
              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-3.5 bg-surface-container rounded-md w-3/4"></div>
                <div className="h-3 bg-surface-container rounded-md w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full font-sans text-xs">
      {/* Header Action & Search */}
      <div className="p-4 border-b border-card-border flex flex-col gap-3 shrink-0 bg-surface-container-lowest">
        {isSelectionMode ? (
          <div className="flex justify-between items-center relative h-[36px]">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedChats([]);
                  setIsSelectionMenuOpen(false);
                }} 
                aria-label="Tutup Pilihan"
                className="w-8 h-8 rounded-xl hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <h2 className="font-headline font-bold text-sm text-on-surface">{selectedChats.length} terpilih</h2>
            </div>
            <button 
              onClick={() => setIsSelectionMenuOpen(!isSelectionMenuOpen)}
              aria-label="Menu Pilihan"
              className="w-8 h-8 rounded-xl hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isSelectionMenuOpen && (
              <div className="absolute right-0 top-9 w-48 bg-surface-container-lowest border border-card-border rounded-xl shadow-xl py-1 z-50">
                {hasUnreadSelected ? (
                  <button className="w-full text-left px-4 py-2 hover:bg-surface-container-low text-on-surface transition-colors cursor-pointer" onClick={() => handleAction('mark_read')}>Tandai dibaca</button>
                ) : (
                  <button className="w-full text-left px-4 py-2 hover:bg-surface-container-low text-on-surface transition-colors cursor-pointer" onClick={() => handleAction('mark_unread')}>Tandai belum dibaca</button>
                )}
                <button className="w-full text-left px-4 py-2 hover:bg-surface-container-low text-error transition-colors cursor-pointer" onClick={() => { setShowClearConfirm(true); setIsSelectionMenuOpen(false); }}>Hapus chat terpilih</button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-between items-center relative h-[36px]">
            <h2 className="font-headline text-lg font-bold text-on-surface tracking-tight">Daftar Kontak</h2>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu Opsi Chat"
              className="w-8 h-8 rounded-xl hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
            >
              <SquarePen className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-9 w-48 bg-surface-container-lowest border border-card-border rounded-xl shadow-xl py-1 z-50">
                <button className="w-full text-left px-4 py-2 hover:bg-surface-container-low text-on-surface transition-colors cursor-pointer" onClick={() => {
                  setIsMenuOpen(false);
                  setIsSelectionMode(true);
                  setSelectedChats([]);
                }}>Pilih obrolan</button>
                {hasAnyUnread ? (
                  <button className="w-full text-left px-4 py-2 hover:bg-surface-container-low text-on-surface transition-colors cursor-pointer" onClick={() => handleAction('mark_read', rooms.map(r => r.id_chat_room))}>Tandai semua dibaca</button>
                ) : (
                  <button className="w-full text-left px-4 py-2 hover:bg-surface-container-low text-on-surface transition-colors cursor-pointer" onClick={() => handleAction('mark_unread', rooms.map(r => r.id_chat_room))}>Tandai semua belum dibaca</button>
                )}
              </div>
            )}
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
          <input 
            type="text" 
            placeholder="Cari pesan atau nama..." 
            className="w-full bg-surface-container-low border border-card-border rounded-xl py-2 pl-9 pr-3.5 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-all font-sans"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full opacity-70">
            <MessageSquare className="w-10 h-10 text-primary/40 mb-2" />
            <p className="font-headline font-bold text-xs text-on-surface">{searchQuery ? "Tidak ada hasil pencarian" : "Belum ada obrolan"}</p>
            <p className="text-on-surface-variant text-[11px] mt-1">{searchQuery ? "Coba gunakan kata kunci lain." : "Riwayat obrolan Anda akan muncul di sini."}</p>
          </div>
        ) : (
          filteredRooms.map(room => {
            const isSelected = selectedRoomId === room.id_chat_room;
            const lastMessage = room.messages[0];
            
            const isRequester = room.requester.id_user === currentUserId;
            const otherUser = isRequester ? room.worker : room.requester;
            
            let displayMessage = "Belum ada pesan";
            let msgTime = "";
            let unread = room.unreadCount || 0;

            if (lastMessage) {
              if (lastMessage.is_deleted_for_everyone) displayMessage = "🚫 Pesan ini telah dihapus";
              else if (lastMessage.image_url) displayMessage = "📷 Mengirim gambar";
              else if (lastMessage.teks_pesan) displayMessage = lastMessage.teks_pesan;
              
              const d = new Date(lastMessage.created_at);
              msgTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            return (
              <div 
                key={room.id_chat_room}
                onClick={() => {
                  if (isSelectionMode) {
                    if (selectedChats.includes(room.id_chat_room)) {
                      setSelectedChats(prev => prev.filter(id => id !== room.id_chat_room));
                    } else {
                      setSelectedChats(prev => [...prev, room.id_chat_room]);
                    }
                  } else {
                    onSelectRoom(room.id_chat_room);
                  }
                }}
                className={`flex items-center p-3 cursor-pointer border-b border-card-border/40 transition-all duration-200 ${
                  isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-surface-container-low/60'
                }`}
              >
                {/* Selection Checkbox */}
                {isSelectionMode && (
                  <div className="mr-3 flex items-center justify-center shrink-0">
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${
                      selectedChats.includes(room.id_chat_room) 
                        ? 'bg-primary border-primary text-on-primary' 
                        : 'border border-card-border bg-surface-container-low'
                    }`}>
                      {selectedChats.includes(room.id_chat_room) && <Check className="w-3 h-3 font-bold" />}
                    </div>
                  </div>
                )}
                
                <div className="relative shrink-0 mr-3">
                  {otherUser.avatar_url ? (
                    <Image src={otherUser.avatar_url} alt="Profile" width={44} height={44} className="w-11 h-11 rounded-full object-cover border border-card-border" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-on-primary text-[9px] font-bold flex items-center justify-center shadow-xs">
                      {unread}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-headline font-bold text-xs text-on-surface truncate">{otherUser.nama_lengkap}</h3>
                    <span className="text-[10px] text-on-surface-variant font-mono tabular-nums shrink-0">{msgTime}</span>
                  </div>
                  <p className={`text-xs truncate ${unread > 0 ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>
                    {displayMessage}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-card-border text-xs">
            <h3 className="font-headline font-bold text-sm text-on-surface mb-1.5">Hapus Obrolan Terpilih?</h3>
            <p className="text-on-surface-variant leading-relaxed mb-6">
              Apakah Anda yakin ingin menghapus {selectedChats.length} obrolan yang dipilih? Pesan hanya akan terhapus untuk Anda.
            </p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setShowClearConfirm(false)} 
              >
                Batal
              </Button>
              <Button 
                variant="destructive"
                size="sm"
                onClick={() => { 
                  handleAction('clear');
                }} 
                disabled={isActionLoading}
              >
                {isActionLoading ? "Menghapus..." : "Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

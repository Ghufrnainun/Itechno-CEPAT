"use client";

import React, { useState } from 'react';
import {
  X,
  MoreVertical,
  Edit,
  Search,
  MessageSquare,
  Check,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

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
      <div className="flex flex-col h-full bg-surface-container-lowest">
        <div className="p-4 border-b border-card-border flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h2 className="font-headline text-base font-bold text-on-surface">Daftar Kontak</h2>
          </div>
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
        <div className="flex flex-col gap-3 p-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-3 items-center">
              <Skeleton variant="circular" className="w-11 h-11 shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-surface-container-lowest">
      {/* Header Action & Search */}
      <div className="p-4 border-b border-card-border flex flex-col gap-3 shrink-0">
        {isSelectionMode ? (
          <div className="flex justify-between items-center relative h-[36px]">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedChats([]);
                  setIsSelectionMenuOpen(false);
                }} 
                className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <h2 className="font-headline text-sm font-bold text-on-surface">{selectedChats.length} terpilih</h2>
            </div>
            <button 
              onClick={() => setIsSelectionMenuOpen(!isSelectionMenuOpen)}
              className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isSelectionMenuOpen && (
              <div className="absolute right-0 top-9 w-48 bg-surface-container-lowest border border-card-border rounded-xl shadow-lg py-1 z-50 font-sans text-xs">
                {hasUnreadSelected ? (
                  <button className="w-full text-left px-4 py-2 hover:bg-surface-container-low text-on-surface font-medium transition-colors" onClick={() => handleAction('mark_read')}>Tandai dibaca</button>
                ) : (
                  <button className="w-full text-left px-4 py-2 hover:bg-surface-container-low text-on-surface font-medium transition-colors" onClick={() => handleAction('mark_unread')}>Tandai belum dibaca</button>
                )}
                <button className="w-full text-left px-4 py-2 hover:bg-error-container/30 text-error font-medium transition-colors" onClick={() => { setShowClearConfirm(true); setIsSelectionMenuOpen(false); }}>Hapus chat terpilih</button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-between items-center relative h-[36px]">
            <h2 className="font-headline text-base font-bold text-on-surface">Daftar Kontak</h2>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-9 w-48 bg-surface-container-lowest border border-card-border rounded-xl shadow-lg py-1 z-50 font-sans text-xs">
                <button className="w-full text-left px-4 py-2 hover:bg-surface-container-low text-on-surface font-medium transition-colors" onClick={() => {
                  setIsMenuOpen(false);
                  setIsSelectionMode(true);
                  setSelectedChats([]);
                }}>Pilih obrolan</button>
                {hasAnyUnread ? (
                  <button className="w-full text-left px-4 py-2 hover:bg-surface-container-low text-on-surface font-medium transition-colors" onClick={() => handleAction('mark_read', rooms.map(r => r.id_chat_room))}>Tandai semua dibaca</button>
                ) : (
                  <button className="w-full text-left px-4 py-2 hover:bg-surface-container-low text-on-surface font-medium transition-colors" onClick={() => handleAction('mark_unread', rooms.map(r => r.id_chat_room))}>Tandai semua belum dibaca</button>
                )}
              </div>
            )}
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
          <input 
            type="text" 
            placeholder="Cari pesan atau nama..." 
            className="w-full bg-surface-container-low border border-card-border rounded-lg py-2 pl-9 pr-3.5 font-sans text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full opacity-70 gap-2">
            <MessageSquare className="w-10 h-10 text-outline-variant/60" />
            <p className="font-headline font-bold text-sm text-on-surface">{searchQuery ? "Tidak ada hasil pencarian" : "Belum ada obrolan"}</p>
            <p className="font-body-sm text-xs text-on-surface-variant">{searchQuery ? "Coba gunakan kata kunci lain." : "Riwayat obrolan Anda akan muncul di sini."}</p>
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
              if (lastMessage.image_url) displayMessage = "📷 Mengirim gambar";
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
                className={cn(
                  "flex items-center p-3.5 cursor-pointer border-b border-card-border/40 transition-colors duration-150",
                  isSelected ? 'bg-primary/5 border-primary/20' : 'hover:bg-surface-container-low'
                )}
              >
                {/* Selection Checkbox */}
                {isSelectionMode && (
                  <div className="mr-3 flex items-center justify-center shrink-0">
                    <div className={cn(
                      "w-4.5 h-4.5 rounded flex items-center justify-center transition-colors border",
                      selectedChats.includes(room.id_chat_room) 
                        ? 'bg-primary border-primary text-white' 
                        : 'border-card-border'
                    )}>
                      {selectedChats.includes(room.id_chat_room) && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                )}
                
                <div className="relative shrink-0 mr-3">
                  {otherUser.avatar_url ? (
                    <img src={otherUser.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-card-border" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-card-border">
                      <User className="w-5 h-5 text-on-surface-variant" />
                    </div>
                  )}
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-error text-white text-[9px] font-bold flex items-center justify-center border-2 border-surface-container-lowest font-mono tabular-nums">
                      {unread}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-headline text-xs font-bold text-on-surface truncate">{otherUser.nama_lengkap}</h3>
                    <span className="font-mono text-[10px] text-on-surface-variant shrink-0 tabular-nums">{msgTime}</span>
                  </div>
                  <p className={cn("text-xs truncate", unread > 0 ? 'text-on-surface font-semibold' : 'text-on-surface-variant')}>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-xl p-5 shadow-xl border border-card-border">
            <h3 className="font-headline text-sm font-bold text-on-surface mb-1.5">Hapus Obrolan Terpilih?</h3>
            <p className="text-xs text-on-surface-variant mb-5 leading-relaxed">
              Apakah Anda yakin ingin menghapus {selectedChats.length} obrolan yang dipilih? Pesan hanya akan terhapus untuk Anda.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowClearConfirm(false)}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleAction('clear')}
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

import React, { useState } from 'react';

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
      <div className="flex flex-col h-full">
        <div className="p-md border-b border-outline-variant/60 flex flex-col gap-sm">
          <div className="flex justify-between items-center">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Daftar Kontak</h2>
          </div>
          <div className="h-10 bg-surface-container rounded-full animate-pulse"></div>
        </div>
        <div className="flex flex-col gap-sm p-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-md items-center animate-pulse">
              <div className="w-12 h-12 rounded-full bg-surface-container"></div>
              <div className="flex-1 flex flex-col gap-xs">
                <div className="h-4 bg-surface-container rounded w-3/4"></div>
                <div className="h-3 bg-surface-container rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header Action & Search */}
      <div className="p-md border-b border-outline-variant/60 flex flex-col gap-sm shrink-0">
        {isSelectionMode ? (
          <div className="flex justify-between items-center relative h-[40px]">
            <div className="flex items-center gap-md">
              <button 
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedChats([]);
                  setIsSelectionMenuOpen(false);
                }} 
                className="w-8 h-8 rounded-full hover:bg-interaction-bg flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
              </button>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">{selectedChats.length} selected</h2>
            </div>
            <button 
              onClick={() => setIsSelectionMenuOpen(!isSelectionMenuOpen)}
              className="w-8 h-8 rounded-full hover:bg-interaction-bg flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">more_vert</span>
            </button>

            {isSelectionMenuOpen && (
              <div className="absolute right-0 top-10 w-48 bg-white border border-outline-variant/60 rounded-lg shadow-lg py-1 z-50">
                {hasUnreadSelected ? (
                  <button className="w-full text-left px-4 py-2 hover:bg-surface-container text-on-surface font-body-sm transition-colors" onClick={() => handleAction('mark_read')}>Mark as read</button>
                ) : (
                  <button className="w-full text-left px-4 py-2 hover:bg-surface-container text-on-surface font-body-sm transition-colors" onClick={() => handleAction('mark_unread')}>Mark as unread</button>
                )}
                <button className="w-full text-left px-4 py-2 hover:bg-surface-container text-error font-body-sm transition-colors" onClick={() => { setShowClearConfirm(true); setIsSelectionMenuOpen(false); }}>Clear selected chats</button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-between items-center relative h-[40px]">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Daftar Kontak</h2>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-8 h-8 rounded-full hover:bg-interaction-bg flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">edit_square</span>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-10 w-48 bg-white border border-outline-variant/60 rounded-lg shadow-lg py-1 z-50">
                <button className="w-full text-left px-4 py-2 hover:bg-surface-container text-on-surface font-body-sm transition-colors" onClick={() => {
                  setIsMenuOpen(false);
                  setIsSelectionMode(true);
                  setSelectedChats([]);
                }}>Select chats</button>
                {hasAnyUnread ? (
                  <button className="w-full text-left px-4 py-2 hover:bg-surface-container text-on-surface font-body-sm transition-colors" onClick={() => handleAction('mark_read', rooms.map(r => r.id_chat_room))}>Mark all as read</button>
                ) : (
                  <button className="w-full text-left px-4 py-2 hover:bg-surface-container text-on-surface font-body-sm transition-colors" onClick={() => handleAction('mark_unread', rooms.map(r => r.id_chat_room))}>Mark all as unread</button>
                )}
              </div>
            )}
          </div>
        )}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" aria-hidden="true">search</span>
          <input 
            type="text" 
            placeholder="Cari pesan atau nama..." 
            className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-full py-2 pl-10 pr-4 font-body-sm text-body-sm focus:outline-none focus:border-primary transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Contacts */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full opacity-70">
            <span className="material-symbols-outlined text-[48px] text-outline mb-sm" aria-hidden="true">chat_bubble</span>
            <p className="font-body-md font-bold text-on-surface">{searchQuery ? "Tidak ada hasil pencarian" : "Belum ada obrolan"}</p>
            <p className="font-body-sm text-on-surface-variant mt-1">{searchQuery ? "Coba gunakan kata kunci lain." : "Riwayat obrolan Anda akan muncul di sini."}</p>
          </div>
        ) : (
          filteredRooms.map(room => {
            const isSelected = selectedRoomId === room.id_chat_room;
            const lastMessage = room.messages[0];
            
            // Determine the other person in the chat
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
                className={`flex items-center p-md cursor-pointer border-b border-outline-variant/30 transition-all duration-300 ${
                  isSelected ? 'bg-interaction-bg' : 'hover:bg-interaction-bg/50'
                }`}
              >
                {/* Selection Checkbox */}
                {isSelectionMode && (
                  <div className="mr-md flex items-center justify-center shrink-0">
                    <div className={`w-5 h-5 rounded-sm flex items-center justify-center transition-colors ${
                      selectedChats.includes(room.id_chat_room) 
                        ? 'bg-primary border-primary' 
                        : 'border-2 border-outline-variant'
                    }`}>
                      {selectedChats.includes(room.id_chat_room) && <span className="material-symbols-outlined text-[14px] text-white font-bold">check</span>}
                    </div>
                  </div>
                )}
                
                <div className="relative shrink-0 mr-md">
                  {otherUser.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={otherUser.avatar_url} alt="Profile" className="w-12 h-12 rounded-full object-cover border border-outline-variant/30" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/30">
                      <span className="material-symbols-outlined text-on-surface-variant">person</span>
                    </div>
                  )}
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                      {unread}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-body-md text-body-md font-semibold text-on-surface truncate">{otherUser.nama_lengkap}</h3>
                    <span className="font-label-sm text-label-sm text-on-surface-variant flex-shrink-0">{msgTime}</span>
                  </div>
                  <p className={`font-body-sm text-body-sm truncate ${unread > 0 ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>
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
          <div className="bg-surface w-full max-w-sm rounded-xl p-6 shadow-xl animate-scale-in">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">Hapus Obrolan Terpilih?</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              Apakah Anda yakin ingin menghapus {selectedChats.length} obrolan yang dipilih? Pesan hanya akan terhapus untuk Anda.
            </p>
            <div className="flex justify-end gap-sm">
              <button 
                onClick={() => setShowClearConfirm(false)} 
                className="px-4 py-2 font-label-md text-on-surface-variant hover:bg-surface-container rounded-full transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={() => { 
                  handleAction('clear');
                }} 
                disabled={isActionLoading}
                className="px-4 py-2 font-label-md bg-error text-white rounded-full hover:bg-error/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isActionLoading ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

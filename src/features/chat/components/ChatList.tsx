import React from 'react';

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
}

interface ChatListProps {
  rooms: ChatRoomData[];
  selectedRoomId: string | null;
  currentUserId: string;
  onSelectRoom: (roomId: string) => void;
  isLoading: boolean;
}

export function ChatList({ rooms, selectedRoomId, currentUserId, onSelectRoom, isLoading }: ChatListProps) {
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
        <div className="flex justify-between items-center">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Daftar Kontak</h2>
          <button className="w-8 h-8 rounded-full hover:bg-interaction-bg flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">edit_square</span>
          </button>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" aria-hidden="true">search</span>
          <input 
            type="text" 
            placeholder="Cari pesan atau nama..." 
            className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-full py-2 pl-10 pr-4 font-body-sm text-body-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Contacts */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full opacity-70">
            <span className="material-symbols-outlined text-[48px] text-outline mb-sm" aria-hidden="true">chat_bubble</span>
            <p className="font-body-md font-bold text-on-surface">Belum ada obrolan</p>
            <p className="font-body-sm text-on-surface-variant mt-1">Riwayat obrolan Anda akan muncul di sini.</p>
          </div>
        ) : (
          rooms.map(room => {
            const isSelected = selectedRoomId === room.id_chat_room;
            const lastMessage = room.messages[0];
            
            // Determine the other person in the chat
            const isRequester = room.requester.id_user === currentUserId;
            const otherUser = isRequester ? room.worker : room.requester;
            
            let displayMessage = "Belum ada pesan";
            let msgTime = "";
            let unread = 0; // Backend not tracking unread yet, mock as 0
            
            if (lastMessage) {
              if (lastMessage.image_url) displayMessage = "📷 Mengirim gambar";
              else if (lastMessage.teks_pesan) displayMessage = lastMessage.teks_pesan;
              
              const d = new Date(lastMessage.created_at);
              msgTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            return (
              <div 
                key={room.id_chat_room}
                onClick={() => onSelectRoom(room.id_chat_room)}
                className={`flex items-center gap-md p-md cursor-pointer border-b border-outline-variant/30 transition-colors ${
                  isSelected ? 'bg-interaction-bg' : 'hover:bg-interaction-bg/50'
                }`}
              >
                <div className="relative">
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
    </div>
  );
}

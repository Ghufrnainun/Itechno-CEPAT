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
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full text-center">
        <span className="material-symbols-outlined text-[48px] text-outline mb-sm">chat_bubble</span>
        <p className="font-headline-sm text-headline-sm text-on-surface">Belum ada obrolan</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
          Riwayat obrolan Anda dengan pembuat atau pelamar tugas akan muncul di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      {rooms.map(room => {
        const isSelected = selectedRoomId === room.id_chat_room;
        const lastMessage = room.messages[0];
        
        // Determine the other person in the chat
        const isRequester = room.requester.id_user === currentUserId;
        const otherUser = isRequester ? room.worker : room.requester;
        
        let displayMessage = "Belum ada pesan";
        if (lastMessage) {
          if (lastMessage.image_url) displayMessage = "📷 Mengirim gambar";
          else if (lastMessage.teks_pesan) displayMessage = lastMessage.teks_pesan;
        }

        return (
          <div 
            key={room.id_chat_room}
            onClick={() => onSelectRoom(room.id_chat_room)}
            className={`flex items-start gap-md p-md cursor-pointer transition-colors border-b border-outline-variant/30 ${isSelected ? 'bg-surface-container border-l-4 border-l-primary' : 'hover:bg-surface-container-low border-l-4 border-l-transparent'}`}
          >
            <div className="w-12 h-12 rounded-full bg-primary-container shrink-0 overflow-hidden flex items-center justify-center">
              {otherUser.avatar_url ? (
                <img src={otherUser.avatar_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="material-symbols-outlined text-on-primary-container">person</span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-xs">
                <h3 className="font-body-md text-body-md font-bold text-on-surface truncate pr-2">
                  {otherUser.nama_lengkap}
                </h3>
                {lastMessage && (
                  <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">
                    {new Date(lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-xs">
                <span className="font-label-sm text-label-sm text-primary bg-primary-container/30 px-2 py-0.5 rounded-full truncate shrink-0 max-w-[50%]">
                  {room.task.judul_tugas}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate mt-xs">
                {displayMessage}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

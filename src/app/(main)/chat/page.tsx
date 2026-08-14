"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChatList } from "@/features/chat/components/ChatList";
import { ChatRoom } from "@/features/chat/components/ChatRoom";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

function ChatContent() {
  const searchParams = useSearchParams();
  const initialRoomId = searchParams.get('room');
  
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(initialRoomId);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const supabase = createClient();

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/chat');
      const data = await res.json();
      
      if (data.success) {
        setRooms(data.data);
      }
    } catch (error) {
      console.error("Gagal meload daftar chat", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function loadInitialData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const res = await fetch('/api/chat');
        const data = await res.json();
        
        if (data.success) {
          setRooms(data.data);
          
          if (data.data.length > 0) {
            const firstRoom = data.data[0];
            if (firstRoom.requester.id_user === user.id) {
               setCurrentUserId(user.id);
            } else {
               const resMe = await fetch('/api/users/me').catch(() => null);
               if (resMe && resMe.ok) {
                 const resMeData = await resMe.json();
                 if (resMeData.success) {
                   setCurrentUserId(resMeData.data.id_user);
                 }
               }
            }
          }
        }
      } catch (error) {
        console.error("Gagal meload daftar chat", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadInitialData();
  }, [supabase.auth]);

  useEffect(() => {
     if (currentUserId === "") {
        supabase.auth.getUser().then(async ({ data: { user } }) => {
           if (user) {
              const res = await fetch('/api/users/me').catch(() => null);
              if (res && res.ok) {
                 const json = await res.json();
                 if (json.success) setCurrentUserId(json.data.id_user);
              }
           }
        })
     }
  }, [currentUserId, supabase.auth]);

  const selectedRoomInfo = rooms.find(r => r.id_chat_room === selectedRoomId);

  return (
    <div className="flex flex-col h-[100dvh] lg:h-full w-full bg-surface font-sans">
      {/* Page Header */}
      <header className="shrink-0 bg-surface-container-lowest border-b border-card-border px-6 py-5">
        <div>
          <h1 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">Chat</h1>
          <p className="font-body-sm text-xs text-on-surface-variant font-medium mt-1">
            Berkomunikasi langsung dengan pemberi atau penerima tugas terkait detail pekerjaan.
          </p>
        </div>
      </header>

      <div className="flex flex-1 w-full overflow-hidden">
        {/* Left Panel: Contact List */}
        <div 
          className={`w-full md:w-[320px] lg:w-[380px] bg-surface-container-lowest border-r border-card-border flex flex-col flex-shrink-0
            ${selectedRoomId ? 'hidden md:flex' : 'flex'}`}
        >
          <ChatList 
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            currentUserId={currentUserId}
            onSelectRoom={setSelectedRoomId}
            isLoading={isLoading}
            onActionComplete={fetchRooms}
          />
        </div>

        {/* Right Panel: Chat Area */}
        <div 
          className={`flex-1 flex flex-col bg-surface relative
            ${!selectedRoomId ? 'hidden md:flex' : 'flex'}`}
        >
          {!selectedRoomId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 p-8">
              <MessageSquare className="w-16 h-16 text-primary/30 mb-2" />
              <h2 className="font-headline font-bold text-base text-on-surface">Pilih obrolan untuk mulai mengirim pesan</h2>
              <p className="font-body-sm text-xs text-on-surface-variant max-w-sm leading-relaxed">
                Gunakan fitur chat untuk berdiskusi mengenai detail tugas, negosiasi, atau mengabarkan status pekerjaan Anda.
              </p>
            </div>
          ) : selectedRoomInfo ? (
            <ChatRoom 
              roomId={selectedRoomId}
              currentUserId={currentUserId}
              onBack={() => setSelectedRoomId(null)}
              roomInfo={{
                title: selectedRoomInfo.task.judul_tugas,
                otherUserName: selectedRoomInfo.requester.id_user === currentUserId 
                  ? selectedRoomInfo.worker.nama_lengkap 
                  : selectedRoomInfo.requester.nama_lengkap,
                otherUserId: selectedRoomInfo.requester.id_user === currentUserId 
                  ? selectedRoomInfo.worker.id_user 
                  : selectedRoomInfo.requester.id_user,
                otherUserAvatarUrl: selectedRoomInfo.requester.id_user === currentUserId 
                  ? selectedRoomInfo.worker.avatar_url 
                  : selectedRoomInfo.requester.avatar_url
              }}
              onMessageAdded={fetchRooms}
            />
          ) : isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 p-8">
               <AlertCircle className="w-14 h-14 text-error mb-2" />
               <h2 className="font-headline font-bold text-base text-on-surface">Obrolan tidak ditemukan</h2>
               <p className="font-body-sm text-xs text-on-surface-variant max-w-sm leading-relaxed">
                 Ruang obrolan ini mungkin sudah dihapus atau Anda tidak memiliki akses.
               </p>
               <Button 
                 onClick={() => setSelectedRoomId(null)} 
                 variant="primary"
                 size="sm"
                 className="mt-2"
               >
                 Kembali ke Daftar Obrolan
               </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-sans text-on-surface-variant">Memuat chat...</div>}>
      <ChatContent />
    </Suspense>
  )
}

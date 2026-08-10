"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChatList } from "@/features/chat/components/ChatList";
import { ChatRoom } from "@/features/chat/components/ChatRoom";
import { createClient } from "@/lib/supabase/client";

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
            // Find current user id based on first chat room
            const firstRoom = data.data[0];
            if (firstRoom.requester.id_user === user.id) {
               setCurrentUserId(user.id);
            } else {
               // Need API to get real userId, fallback to checking worker
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

  // If currentUserId wasn't set by /api/users/me, let's manually fetch it directly
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
    <div className="flex flex-col h-[100dvh] lg:h-full w-full bg-layout-bg font-sans">
      {/* Page Header */}
      <header className="page-header shrink-0 bg-surface-container-lowest border-b border-outline-variant/30 px-6 py-5">
        <div>
          <h1 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">Chat</h1>
          <p className="font-body-sm text-sm text-on-surface-variant font-medium mt-0.5">
            Berkomunikasi langsung dengan pemberi atau penerima tugas terkait detail pekerjaan.
          </p>
        </div>
      </header>

      <div className="flex flex-1 w-full overflow-hidden">
        {/* Left Panel: Contact List */}
        <div 
          className={`w-full md:w-[320px] lg:w-[380px] bg-white border-r border-outline-variant/60 flex flex-col flex-shrink-0
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
          className={`flex-1 flex flex-col bg-layout-bg relative
            ${!selectedRoomId ? 'hidden md:flex' : 'flex'}`}
        >
          {!selectedRoomId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-md p-xl">
              <span className="material-symbols-outlined text-[64px] text-outline-variant" aria-hidden="true">forum</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Pilih obrolan untuk mulai mengirim pesan</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
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
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-xl text-center">Memuat chat...</div>}>
      <ChatContent />
    </Suspense>
  )
}

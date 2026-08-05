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
               const { data: userData } = await supabase.auth.getUser();
               // Wait, user.id is auth id, not the id_user from prisma
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
    <div className="flex h-[calc(100vh-64px)] bg-layout-bg font-sans overflow-hidden">
      {/* Left Sidebar: Chat List */}
      <div 
        className={`w-full md:w-[350px] lg:w-[400px] shrink-0 border-r border-outline-variant bg-white flex flex-col h-full
          ${selectedRoomId ? 'hidden md:flex' : 'flex'}`}
      >
        <header className="px-md py-sm border-b border-outline-variant shrink-0 bg-surface">
          <h1 className="font-headline-md text-headline-md font-extrabold text-on-surface">Pesan</h1>
        </header>
        <div className="flex-1 overflow-hidden">
          <ChatList 
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            currentUserId={currentUserId}
            onSelectRoom={setSelectedRoomId}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Right Area: Chat Room */}
      <div 
        className={`flex-1 bg-surface-container-lowest h-full relative
          ${!selectedRoomId ? 'hidden md:flex flex-col items-center justify-center' : 'flex flex-col'}`}
      >
        {!selectedRoomId ? (
          <div className="text-center opacity-60">
            <span className="material-symbols-outlined text-[64px] text-outline mb-sm">forum</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Itechno Chat</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Pilih pesan di samping untuk mulai membalas</p>
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
                : selectedRoomInfo.requester.nama_lengkap
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        )}
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

"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChatList } from "@/features/chat/components/ChatList";
import { ChatRoom } from "@/features/chat/components/ChatRoom";
import { MessageSquare } from "lucide-react";

// Module-level SWR Cache for Chat
let cachedChatRooms: any[] = [];
let cachedCurrentChatUserId = "";
let hasChatLoadedOnce = false;

function ChatContent() {
  const searchParams = useSearchParams();
  const initialRoomId = searchParams.get('room');
  
  const [rooms, setRooms] = useState<any[]>(cachedChatRooms);
  const [isLoading, setIsLoading] = useState(!hasChatLoadedOnce);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(initialRoomId);
  const [currentUserId, setCurrentUserId] = useState<string>(cachedCurrentChatUserId);

  // Synchronize selectedRoomId and the browser URL cleanly without fighting
  const handleSelectRoom = useCallback((roomId: string | null) => {
    setSelectedRoomId(roomId);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (roomId) {
        url.searchParams.set("room", roomId);
        url.searchParams.delete("userId");
      } else {
        url.searchParams.delete("room");
        url.searchParams.delete("userId");
      }
      const newQuery = url.searchParams.toString();
      const newPath = url.pathname + (newQuery ? `?${newQuery}` : "");
      window.history.replaceState(null, "", newPath);
    }
  }, []);

  // Handle browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const room = params.get("room");
      setSelectedRoomId(room);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Load current user profile ID
  useEffect(() => {
    async function loadCurrentUser() {
      if (cachedCurrentChatUserId) {
        setCurrentUserId(cachedCurrentChatUserId);
        return;
      }
      try {
        const resMe = await fetch('/api/users/me');
        if (resMe.ok) {
          const json = await resMe.json();
          if (json.success && json.data?.id_user) {
            setCurrentUserId(json.data.id_user);
            cachedCurrentChatUserId = json.data.id_user;
          }
        }
      } catch (err) {
        console.error("Gagal load profil user:", err);
      }
    }
    loadCurrentUser();
  }, []);

  useEffect(() => {
    const roomParam = searchParams.get('room');
    if (roomParam !== selectedRoomId) {
      setSelectedRoomId(roomParam);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRooms = async () => {
    try {
      if (!hasChatLoadedOnce) setIsLoading(true);
      const res = await fetch('/api/chat');
      const data = await res.json();
      
      if (data.success && Array.isArray(data.data)) {
        setRooms(data.data);
        cachedChatRooms = data.data;
        hasChatLoadedOnce = true;

        // Cek target userId jika membuka chat berdasarkan user target
        const targetUserId = searchParams.get('userId');
        if (targetUserId && !selectedRoomId) {
          const matchedRoom = data.data.find(
            (r: any) => r.worker?.id_user === targetUserId || r.requester?.id_user === targetUserId
          );
          if (matchedRoom) {
            handleSelectRoom(matchedRoom.id_chat_room);
          }
        }
      }
    } catch (error) {
      console.error("Gagal meload daftar chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedRoomInfo = selectedRoomId ? rooms.find(r => r.id_chat_room === selectedRoomId) : undefined;

  return (
    <div className="flex flex-col h-full w-full max-w-full min-h-0 overflow-hidden bg-surface font-sans">
      {/* Page Header (Desktop only - clean native layout on mobile) */}
      <header className="hidden md:block shrink-0 bg-surface-container-lowest border-b border-card-border px-6 py-5">
        <div>
          <h1 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">Chat</h1>
          <p className="font-body-sm text-xs text-on-surface-variant font-medium mt-1">
            Berkomunikasi langsung dengan pemberi atau penerima tugas terkait detail pekerjaan.
          </p>
        </div>
      </header>

      <div className="flex flex-1 w-full max-w-full min-h-0 min-w-0 overflow-hidden">
        {/* Left Panel: Contact List */}
        <div 
          className={`w-full md:w-[320px] lg:w-[380px] bg-surface-container-lowest md:border-r border-card-border flex flex-col flex-shrink-0 min-h-0 min-w-0 max-w-full
            ${selectedRoomId ? 'hidden md:flex' : 'flex h-full pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0'}`}
        >
          <ChatList 
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            currentUserId={currentUserId}
            onSelectRoom={handleSelectRoom}
            isLoading={isLoading}
            onActionComplete={fetchRooms}
          />
        </div>

        {/* Right Panel: Chat Area */}
        <div 
          className={`flex-1 flex flex-col bg-surface relative w-full min-w-0 h-full min-h-0 overflow-hidden
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
          ) : (
            <ChatRoom 
              key={selectedRoomId}
              roomId={selectedRoomId}
              currentUserId={currentUserId}
              onBack={() => handleSelectRoom(null)}
              roomInfo={selectedRoomInfo ? {
                title: selectedRoomInfo.task?.judul_tugas || "Detail Tugas",
                otherUserName: selectedRoomInfo.requester?.id_user === currentUserId 
                  ? selectedRoomInfo.worker?.nama_lengkap || "Pengguna"
                  : selectedRoomInfo.requester?.nama_lengkap || "Pengguna",
                otherUserId: selectedRoomInfo.requester?.id_user === currentUserId 
                  ? selectedRoomInfo.worker?.id_user 
                  : selectedRoomInfo.requester?.id_user,
                otherUserAvatarUrl: selectedRoomInfo.requester?.id_user === currentUserId 
                  ? selectedRoomInfo.worker?.avatar_url 
                  : selectedRoomInfo.requester?.avatar_url,
                otherUserLastSeen: selectedRoomInfo.requester?.id_user === currentUserId 
                  ? selectedRoomInfo.worker?.last_seen_at 
                  : selectedRoomInfo.requester?.last_seen_at
              } : undefined}
              onMessageAdded={fetchRooms}
            />
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

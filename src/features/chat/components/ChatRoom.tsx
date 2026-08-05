import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChatInput } from './ChatInput';

interface Message {
  id_message: string;
  id_sender: string;
  teks_pesan: string | null;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
  sender: {
    id_user: string;
    nama_lengkap: string;
    avatar_url: string | null;
  };
}

interface ChatRoomProps {
  roomId: string;
  currentUserId: string;
  onBack: () => void;
  roomInfo: {
    title: string;
    otherUserName: string;
  };
}

export function ChatRoom({ roomId, currentUserId, onBack, roomInfo }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFile, setDraggedFile] = useState<File | null>(null);
  
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

  useEffect(() => {
    // 1. Fetch initial messages
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/${roomId}`);
        const data = await res.json();
        if (data.success) {
          setMessages(data.data);
          setTimeout(scrollToBottom, 100);
          
          // Mark as read after fetching
          fetch(`/api/chat/${roomId}`, { method: 'PUT' }).catch(console.error);
        }
      } catch (error) {
        console.error("Gagal mengambil pesan:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();

    // 2. Setup Supabase Realtime Subscription
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message'
        },
        async (payload) => {
          console.warn("[Realtime] Received INSERT payload:", payload);
          // New message received via WebSocket!
          const newMessageRaw = payload.new as any;
          
          if (newMessageRaw.id_chat_room !== roomId) return; // Manual filter
          
          setMessages(prev => {
            if (prev.some(m => m.id_message === newMessageRaw.id_message)) return prev;
            
            // Temporary sender object until we refresh or if we can infer
            const newMsg: Message = {
              id_message: newMessageRaw.id_message,
              id_sender: newMessageRaw.id_sender,
              teks_pesan: newMessageRaw.teks_pesan,
              image_url: newMessageRaw.image_url,
              is_read: newMessageRaw.is_read || false,
              created_at: newMessageRaw.created_at,
              sender: {
                id_user: newMessageRaw.id_sender,
                nama_lengkap: newMessageRaw.id_sender === currentUserId ? "Anda" : roomInfo.otherUserName,
                avatar_url: null
              }
            };
            return [...prev, newMsg];
          });
          
          setTimeout(scrollToBottom, 100);

          // If the message is from the other user, mark it as read immediately
          if (newMessageRaw.id_sender !== currentUserId) {
            fetch(`/api/chat/${roomId}`, { method: 'PUT' }).catch(console.error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Message'
        },
        (payload) => {
          console.warn("[Realtime] Received UPDATE payload:", payload);
          const updatedMessage = payload.new as any;
          if (updatedMessage.id_chat_room !== roomId) return; // Manual filter
          setMessages(prev => prev.map(m => 
            m.id_message === updatedMessage.id_message ? { ...m, is_read: updatedMessage.is_read } : m
          ));
        }
      )
      .subscribe((status, err) => {
        console.warn(`[Realtime] Subscription status for room ${roomId}:`, status);
        if (err) console.error('[Realtime] Subscription error:', err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase, currentUserId, roomInfo.otherUserName]);

  const handleSendMessage = async (text: string | null, imageUrl: string | null) => {
    try {
      const res = await fetch(`/api/chat/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teks_pesan: text, image_url: imageUrl })
      });
      const data = await res.json();
      
      if (!data.success) {
        alert("Gagal mengirim pesan: " + data.message);
      } else {
        // Optimistically append the message to the chat so we don't rely solely on WebSocket
        setMessages(prev => {
          if (prev.some(m => m.id_message === data.data.id_message)) return prev;
          return [...prev, data.data];
        });
        setTimeout(scrollToBottom, 100);
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan koneksi.");
    }
  };

  return (
    <div 
      className="flex flex-col h-full bg-surface-container-lowest relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Global Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-primary/10 border-4 border-dashed border-primary flex items-center justify-center pointer-events-none transition-all">
          <div className="bg-surface p-8 border-2 border-primary shadow-[8px_8px_0_var(--color-primary,#16a34a)] flex flex-col items-center">
            <span className="material-symbols-outlined text-[64px] text-primary mb-4">cloud_upload</span>
            <p className="font-heading-md text-primary font-bold">Lepaskan Gambar di Sini</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="h-[72px] px-lg border-b border-outline-variant/60 flex items-center gap-md bg-white shadow-sm z-10 flex-shrink-0">
        <button 
          onClick={onBack}
          className="md:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/30 shrink-0 overflow-hidden">
          <span className="material-symbols-outlined text-on-surface-variant">person</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-body-md text-body-md font-semibold text-on-surface truncate">{roomInfo.otherUserName}</h3>
          <span className="font-label-sm text-label-sm text-primary flex items-center gap-xs">
            <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
            Online
          </span>
        </div>
        <div className="flex gap-sm text-on-surface-variant shrink-0">
          <button className="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer">
            <span className="material-symbols-outlined" aria-hidden="true">call</span>
          </button>
          <button className="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer">
            <span className="material-symbols-outlined" aria-hidden="true">more_vert</span>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-lg flex flex-col gap-sm custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant text-center opacity-70">
            <span className="material-symbols-outlined text-[48px] mb-xs">forum</span>
            <p className="font-body-md text-body-md">Mulai percakapan tentang tugas ini.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.id_sender === currentUserId;

            return (
              <div 
                key={msg.id_message} 
                className={`flex flex-col max-w-[70%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
              >
                <div 
                  className={`p-sm md:p-md rounded-2xl shadow-sm relative group ${
                    isMe 
                      ? 'bg-surface-container text-on-surface rounded-tr-sm border border-outline-variant/40' 
                      : 'bg-white text-on-surface rounded-tl-sm border border-outline-variant/40'
                  }`}
                >
                  {msg.image_url ? (
                    <div className="flex flex-col gap-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={msg.image_url} 
                        alt="Attachment" 
                        className="rounded-lg max-w-[250px] object-cover border border-outline-variant/20 cursor-pointer hover:opacity-90 transition-opacity" 
                        onClick={() => window.open(msg.image_url!, '_blank')}
                      />
                      {msg.teks_pesan && <p className="font-body-sm text-body-sm whitespace-pre-wrap break-words">{msg.teks_pesan}</p>}
                    </div>
                  ) : (
                    <p className="font-body-sm text-body-sm leading-relaxed whitespace-pre-wrap break-words">{msg.teks_pesan}</p>
                  )}
                  
                  <div className={`flex items-center gap-1 mt-1 justify-end ${msg.image_url && !msg.teks_pesan ? 'absolute bottom-2 right-2 bg-black/40 text-white px-2 rounded-full' : 'text-outline'}`}>
                    <span className="text-[10px] font-mono">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && (
                      <span className="material-symbols-outlined text-[14px] text-blue-500" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                        {msg.is_read ? 'done_all' : 'check'}
                      </span>
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
  );
}

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
      <header className="px-md py-sm bg-white border-b border-outline-variant flex items-center gap-md shrink-0 z-10">
        <button 
          onClick={onBack}
          className="md:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface truncate">
            {roomInfo.otherUserName}
          </h2>
          <p className="font-body-sm text-body-sm text-primary truncate">
            {roomInfo.title}
          </p>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-md flex flex-col gap-sm custom-scrollbar">
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
            const showTail = index === messages.length - 1 || messages[index + 1].id_sender !== msg.id_sender;

            return (
              <div 
                key={msg.id_message} 
                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div 
                    className={`px-4 py-2 relative group
                      ${isMe 
                        ? 'bg-primary text-on-primary rounded-2xl rounded-tr-sm' 
                        : 'bg-white border border-outline-variant text-on-surface rounded-2xl rounded-tl-sm shadow-sm'
                      }
                    `}
                  >
                    {msg.image_url && (
                      <div className="mb-2 max-w-full overflow-hidden rounded-lg bg-black/5">
                        <img 
                          src={msg.image_url} 
                          alt="Attachment" 
                          className="max-h-[300px] w-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(msg.image_url!, '_blank')}
                        />
                      </div>
                    )}
                    {msg.teks_pesan && (
                      <p className="font-body-md text-body-md whitespace-pre-wrap break-words">
                        {msg.teks_pesan}
                      </p>
                    )}
                    <div 
                      className={`text-[10px] mt-1 flex items-center justify-end gap-1 font-mono ${isMe ? 'text-on-primary/70' : 'text-on-surface-variant'}`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMe && (
                        <span className="material-symbols-outlined text-[14px]">
                          {msg.is_read ? 'done_all' : 'check'}
                        </span>
                      )}
                    </div>
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

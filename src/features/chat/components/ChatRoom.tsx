import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
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
    otherUserId: string;
    otherUserAvatarUrl?: string | null;
  };
}

export function ChatRoom({ roomId, currentUserId, onBack, roomInfo }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFile, setDraggedFile] = useState<File | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Search state
  const [isSearchSidebarOpen, setIsSearchSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  
  // Selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
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

  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(id);
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  };

  const searchedMessages = searchQuery.trim() 
    ? messages.filter(m => m.teks_pesan?.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

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

  const handleDeleteSelected = async () => {
    if (selectedMessages.length === 0) return;
    if (!confirm("Hapus pesan yang dipilih? Pesan ini akan dihapus permanen.")) return;
    
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/chat/${roomId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds: selectedMessages })
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => !selectedMessages.includes(m.id_message)));
        setIsSelectionMode(false);
        setSelectedMessages([]);
      } else {
        alert("Gagal menghapus pesan.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm("Bersihkan semua pesan dari obrolan ini?")) return;
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/chat/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear', roomIds: [roomId] })
      });
      if (res.ok) {
        setMessages([]);
        setIsMenuOpen(false);
      } else {
        alert("Gagal membersihkan obrolan.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const toggleMessageSelection = (id: string) => {
    if (!isSelectionMode) return;
    setSelectedMessages(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-row h-full w-full relative overflow-hidden">
      {/* Main Chat Area */}
      <div 
        className="flex flex-col flex-1 h-full bg-surface-container-lowest relative border-r border-outline-variant/60"
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
        {isSelectionMode ? (
          <>
            <button 
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedMessages([]);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
            <div className="flex-1 font-headline-sm font-bold text-on-surface">
              {selectedMessages.length} Terpilih
            </div>
            {selectedMessages.length > 0 && (
              <button 
                onClick={handleDeleteSelected}
                disabled={isActionLoading}
                className="w-10 h-10 rounded-full flex items-center justify-center text-error hover:bg-error/10 transition-colors shrink-0 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[24px]">delete</span>
              </button>
            )}
          </>
        ) : (
          <>
            <button 
              onClick={onBack}
              className="md:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <Link href={`/profile/${roomInfo.otherUserId}`} className="flex items-center gap-md hover:bg-surface-container/30 px-2 py-1 rounded-lg transition-colors min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/30 shrink-0 overflow-hidden relative">
                {roomInfo.otherUserAvatarUrl ? (
                  <img src={roomInfo.otherUserAvatarUrl} alt={roomInfo.otherUserName} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-on-surface-variant">person</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-body-md text-body-md font-semibold text-on-surface truncate hover:text-primary transition-colors">{roomInfo.otherUserName}</h3>
                <span className="font-label-sm text-label-sm text-primary flex items-center gap-xs">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                  Online
                </span>
              </div>
            </Link>
            
            <div className="flex-1"></div>
            <div className="flex gap-sm text-on-surface-variant shrink-0 relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined" aria-hidden="true">more_vert</span>
              </button>
              
              {isMenuOpen && (
                <div className="absolute right-0 top-12 w-48 bg-white border border-outline-variant/60 rounded-lg shadow-lg py-1 z-50">
                  <button 
                    className="w-full text-left px-4 py-2 hover:bg-surface-container text-on-surface font-body-sm transition-colors" 
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsSearchSidebarOpen(true);
                    }}
                  >
                    Search chat
                  </button>
                  <button 
                    className="w-full text-left px-4 py-2 hover:bg-surface-container text-on-surface font-body-sm transition-colors" 
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsSelectionMode(true);
                    }}
                  >
                    Select chat
                  </button>
                  <button 
                    className="w-full text-left px-4 py-2 hover:bg-surface-container text-on-surface font-body-sm transition-colors" 
                    onClick={handleClearChat}
                    disabled={isActionLoading}
                  >
                    Clear chat
                  </button>
                </div>
              )}
            </div>
          </>
        )}
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
            const isSelected = selectedMessages.includes(msg.id_message);

            return (
              <div 
                key={msg.id_message} 
                id={`msg-${msg.id_message}`}
                className={`flex flex-col max-w-[70%] ${isMe ? 'self-end items-end' : 'self-start items-start'} transition-colors duration-500`}
                onClick={() => toggleMessageSelection(msg.id_message)}
              >
                {isSelectionMode && (
                  <div className={`absolute ${isMe ? '-left-8' : '-right-8'} top-1/2 -translate-y-1/2`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-white' : 'border-outline-variant'}`}>
                      {isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}
                    </div>
                  </div>
                )}
                <div 
                  className={`p-sm md:p-md rounded-2xl shadow-sm relative group transition-colors duration-500 ${
                    isSelected
                      ? 'bg-primary/20 border-primary'
                      : highlightedMessageId === msg.id_message 
                      ? 'bg-amber-100 border-amber-300' 
                      : isMe 
                        ? 'bg-surface-container text-on-surface rounded-tr-sm border border-outline-variant/40' 
                        : 'bg-white text-on-surface rounded-tl-sm border border-outline-variant/40'
                  } ${isSelectionMode ? 'cursor-pointer hover:opacity-80' : ''}`}
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

      {/* Right Sidebar for Search */}
      {isSearchSidebarOpen && (
        <div className="w-full md:w-80 h-full flex flex-col bg-surface z-50 absolute md:relative right-0 top-0 shadow-[-4px_0_15px_rgba(0,0,0,0.05)] md:shadow-none border-l border-outline-variant/60">
          <div className="h-[72px] px-lg border-b border-outline-variant/60 flex items-center gap-md bg-white shrink-0">
            <button 
              onClick={() => setIsSearchSidebarOpen(false)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Cari Pesan</h3>
          </div>
          
          <div className="p-4 border-b border-outline-variant/60 bg-surface-container-lowest">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input
                type="text"
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-white border border-outline-variant rounded-full text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                autoFocus
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {!searchQuery.trim() ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-on-surface-variant opacity-70">
                <span className="material-symbols-outlined text-[48px] mb-2">search</span>
                <p className="font-body-sm text-sm">Ketik untuk mencari pesan di obrolan ini.</p>
              </div>
            ) : searchedMessages.length === 0 ? (
              <div className="text-center p-4 text-on-surface-variant font-body-sm">
                Tidak ada pesan yang cocok dengan &quot;{searchQuery}&quot;
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {searchedMessages.map(msg => (
                  <button
                    key={msg.id_message}
                    onClick={() => scrollToMessage(msg.id_message)}
                    className="flex flex-col text-left p-3 hover:bg-surface-container rounded-lg transition-colors border-b border-outline-variant/30 last:border-0"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-primary truncate max-w-[120px]">
                        {msg.id_sender === currentUserId ? "Anda" : roomInfo.otherUserName}
                      </span>
                      <span className="text-[10px] text-on-surface-variant shrink-0">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface line-clamp-2 break-words">{msg.teks_pesan}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

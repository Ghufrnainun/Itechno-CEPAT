"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ChatInput } from './ChatInput';
import {
  X,
  Trash2,
  ArrowLeft,
  User,
  MoreVertical,
  Search,
  Check,
  CheckCheck,
  UploadCloud,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/${roomId}`);
        const data = await res.json();
        if (data.success) {
          setMessages(data.data);
          setTimeout(scrollToBottom, 100);
          fetch(`/api/chat/${roomId}`, { method: 'PUT' }).catch(console.error);
        }
      } catch (error) {
        console.error("Gagal mengambil pesan:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

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
          const newMessageRaw = payload.new as any;
          if (newMessageRaw.id_chat_room !== roomId) return;

          setMessages(prev => {
            if (prev.some(m => m.id_message === newMessageRaw.id_message)) return prev;

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

          if (newMessageRaw.id_sender !== currentUserId) {
            fetch(`/api/chat/${roomId}`, { method: 'PUT' }).catch(console.error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, currentUserId, roomInfo.otherUserName]);

  const handleSendMessage = async (text: string | null, imageUrl: string | null) => {
    try {
      const res = await fetch(`/api/chat/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teks_pesan: text,
          image_url: imageUrl
        })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Gagal mengirim pesan");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  const handleClearChat = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus semua pesan di obrolan ini? Tindakan ini tidak dapat dibatalkan.")) return;
    
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
      }
    } catch (e) {
      console.error(e);
      alert("Gagal menghapus pesan");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedMessages.length === 0) return;
    if (!confirm(`Hapus ${selectedMessages.length} pesan terpilih?`)) return;

    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/chat/${roomId}/messages`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds: selectedMessages })
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => !selectedMessages.includes(m.id_message)));
        setSelectedMessages([]);
        setIsSelectionMode(false);
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

  const toggleMessageSelection = (id: string) => {
    if (!isSelectionMode) return;
    setSelectedMessages(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-row h-full w-full relative overflow-hidden bg-surface">
      {/* Main Chat Area */}
      <div 
        className="flex flex-col flex-1 h-full bg-surface-container-lowest relative border-r border-card-border"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary flex items-center justify-center pointer-events-none">
            <div className="bg-surface-container-lowest p-8 border border-primary rounded-xl shadow-lg flex flex-col items-center">
              <UploadCloud className="w-12 h-12 text-primary mb-3" />
              <p className="font-headline font-bold text-primary text-base">Lepaskan Gambar di Sini</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="h-[68px] px-5 border-b border-card-border flex items-center gap-3 bg-surface-container-lowest shadow-xs z-10 shrink-0">
          {isSelectionMode ? (
            <>
              <button 
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedMessages([]);
                }}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex-1 font-headline text-sm font-bold text-on-surface">
                {selectedMessages.length} Pesan Terpilih
              </div>
              {selectedMessages.length > 0 && (
                <button 
                  onClick={handleDeleteSelected}
                  disabled={isActionLoading}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-error hover:bg-error-container/40 transition-colors shrink-0 disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </>
          ) : (
            <>
              <button 
                onClick={onBack}
                className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Link href={`/profile/${roomInfo.otherUserId}`} className="flex items-center gap-3 hover:bg-surface-container-low px-2 py-1.5 rounded-lg transition-colors min-w-0">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-card-border shrink-0 overflow-hidden relative">
                  {roomInfo.otherUserAvatarUrl ? (
                    <img src={roomInfo.otherUserAvatarUrl} alt={roomInfo.otherUserName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-on-surface-variant" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline text-sm font-bold text-on-surface truncate hover:text-primary transition-colors">{roomInfo.otherUserName}</h3>
                  <span className="font-label-sm text-xs text-primary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block shrink-0" />
                    Online
                  </span>
                </div>
              </Link>
              
              <div className="flex-1" />
              <div className="flex gap-1 text-on-surface-variant shrink-0 relative">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="w-10 h-10 rounded-lg hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                
                {isMenuOpen && (
                  <div className="absolute right-0 top-12 w-48 bg-surface-container-lowest border border-card-border rounded-xl shadow-lg py-1 z-50 font-sans text-xs">
                    <button 
                      className="w-full text-left px-4 py-2.5 hover:bg-surface-container-low text-on-surface font-medium transition-colors" 
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsSearchSidebarOpen(true);
                      }}
                    >
                      Cari pesan
                    </button>
                    <button 
                      className="w-full text-left px-4 py-2.5 hover:bg-surface-container-low text-on-surface font-medium transition-colors" 
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsSelectionMode(true);
                      }}
                    >
                      Pilih pesan
                    </button>
                    <button 
                      className="w-full text-left px-4 py-2.5 hover:bg-error-container/30 text-error font-medium transition-colors" 
                      onClick={handleClearChat}
                      disabled={isActionLoading}
                    >
                      Hapus semua chat
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Messages Area */}
        <div
          role="log"
          aria-live="polite"
          className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3 custom-scrollbar bg-surface/40"
        >
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-3 border-primary border-t-transparent animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant text-center opacity-70 gap-2">
              <MessageSquare className="w-10 h-10 text-outline-variant/60" />
              <p className="font-body-md text-sm">Mulai percakapan tentang tugas ini.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.id_sender === currentUserId;
              const isSelected = selectedMessages.includes(msg.id_message);

              return (
                <div 
                  key={msg.id_message} 
                  id={`msg-${msg.id_message}`}
                  className={cn(
                    "flex flex-col max-w-[78%] sm:max-w-[70%]",
                    isMe ? "self-end items-end" : "self-start items-start"
                  )}
                  onClick={() => toggleMessageSelection(msg.id_message)}
                >
                  <div 
                    className={cn(
                      "p-3 rounded-xl shadow-xs relative group transition-colors duration-150",
                      isSelected
                        ? "bg-primary/20 border border-primary"
                        : highlightedMessageId === msg.id_message 
                        ? "bg-amber-100 border border-amber-300" 
                        : isMe 
                          ? "bg-primary text-on-primary rounded-tr-xs" 
                          : "bg-surface-container-lowest text-on-surface rounded-tl-xs border border-card-border",
                      isSelectionMode && "cursor-pointer hover:opacity-80"
                    )}
                  >
                    {msg.image_url ? (
                      <div className="flex flex-col gap-1.5">
                        <img 
                          src={msg.image_url} 
                          alt="Attachment" 
                          className="rounded-lg max-w-[240px] object-cover border border-card-border/40 cursor-pointer hover:opacity-90 transition-opacity" 
                          onClick={() => window.open(msg.image_url!, '_blank')}
                        />
                        {msg.teks_pesan && <p className="font-body-sm text-xs leading-relaxed whitespace-pre-wrap break-words">{msg.teks_pesan}</p>}
                      </div>
                    ) : (
                      <p className="font-body-sm text-xs leading-relaxed whitespace-pre-wrap break-words">{msg.teks_pesan}</p>
                    )}
                    
                    <div className={cn(
                      "flex items-center gap-1 mt-1 justify-end font-mono text-[10px] tabular-nums",
                      isMe ? "text-on-primary/80" : "text-on-surface-variant"
                    )}>
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (
                        msg.is_read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-primary-fixed" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-on-primary/70" />
                        )
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
        <div className="w-full md:w-80 h-full flex flex-col bg-surface-container-lowest z-50 absolute md:relative right-0 top-0 shadow-lg md:shadow-none border-l border-card-border">
          <div className="h-[68px] px-5 border-b border-card-border flex items-center gap-3 bg-surface-container-lowest shrink-0">
            <button 
              onClick={() => setIsSearchSidebarOpen(false)}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-headline text-sm font-bold text-on-surface">Cari Pesan</h3>
          </div>
          
          <div className="p-3.5 border-b border-card-border bg-surface-container-low">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
              <input
                type="text"
                placeholder="Cari kata kunci..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3.5 bg-surface-container-lowest border border-card-border rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                autoFocus
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {!searchQuery.trim() ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-on-surface-variant opacity-70 gap-2">
                <Search className="w-8 h-8 text-outline-variant/60" />
                <p className="font-body-sm text-xs">Ketik untuk mencari pesan di obrolan ini.</p>
              </div>
            ) : searchedMessages.length === 0 ? (
              <div className="text-center p-4 text-on-surface-variant font-body-sm text-xs">
                Tidak ada pesan yang cocok dengan &quot;{searchQuery}&quot;
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {searchedMessages.map(msg => (
                  <button
                    key={msg.id_message}
                    onClick={() => scrollToMessage(msg.id_message)}
                    className="flex flex-col text-left p-3 hover:bg-surface-container-low rounded-lg transition-colors border-b border-card-border/40 last:border-0 cursor-pointer"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-primary truncate max-w-[120px]">
                        {msg.id_sender === currentUserId ? "Anda" : roomInfo.otherUserName}
                      </span>
                      <span className="text-[10px] text-on-surface-variant shrink-0 font-mono tabular-nums">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface line-clamp-2 break-words leading-relaxed">{msg.teks_pesan}</p>
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

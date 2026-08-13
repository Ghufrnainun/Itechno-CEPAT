import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { ChatInput } from './ChatInput';

interface Message {
  id_message: string;
  id_sender: string;
  teks_pesan: string | null;
  image_url: string | null;
  is_read: boolean;
  is_deleted_for_everyone: boolean;
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
  onMessageAdded?: () => void;
}

export function ChatRoom({ roomId, currentUserId, onBack, roomInfo, onMessageAdded }: ChatRoomProps) {
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
  
  // Custom Dialog state
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm' | 'delete_options';
    onConfirm?: () => void;
    onConfirmForEveryone?: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'alert' });
  
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
              is_deleted_for_everyone: newMessageRaw.is_deleted_for_everyone || false,
              // Supabase Realtime often sends timestamp without timezone (missing Z or +) 
              // which causes browsers to parse it as local time instead of UTC.
              created_at: (!newMessageRaw.created_at.includes('Z') && !newMessageRaw.created_at.includes('+'))
                ? newMessageRaw.created_at.replace(' ', 'T') + 'Z'
                : newMessageRaw.created_at,
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
          
          if (onMessageAdded) onMessageAdded();
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
          
          setMessages(prev => {
            // Check if deleted for me
            if (updatedMessage.deleted_by && Array.isArray(updatedMessage.deleted_by) && updatedMessage.deleted_by.includes(currentUserId)) {
               return prev.filter(m => m.id_message !== updatedMessage.id_message);
            }
            
            // Otherwise update properties including tombstone
            return prev.map(m => 
              m.id_message === updatedMessage.id_message 
                ? { 
                    ...m, 
                    is_read: updatedMessage.is_read,
                    is_deleted_for_everyone: updatedMessage.is_deleted_for_everyone,
                    teks_pesan: updatedMessage.teks_pesan,
                    image_url: updatedMessage.image_url
                  } 
                : m
            );
          });
          
          if (onMessageAdded) onMessageAdded();
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
        
        if (onMessageAdded) onMessageAdded();
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan koneksi.");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedMessages.length === 0) return;
    
    const selectedMsgsObjs = messages.filter(m => selectedMessages.includes(m.id_message));
    const allOwnedByMe = selectedMsgsObjs.every(m => m.id_sender === currentUserId);

    const deleteFn = async (type: 'for_me' | 'for_everyone') => {
      setIsActionLoading(true);
      try {
        const res = await fetch(`/api/chat/${roomId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageIds: selectedMessages, type })
        });
        if (res.ok) {
          if (type === 'for_me') {
            setMessages(prev => prev.filter(m => !selectedMessages.includes(m.id_message)));
          } else {
            setMessages(prev => prev.map(m => {
              if (selectedMessages.includes(m.id_message)) {
                return {
                  ...m,
                  is_deleted_for_everyone: true,
                  teks_pesan: null,
                  image_url: null
                };
              }
              return m;
            }));
          }
          if (onMessageAdded) onMessageAdded();
          setIsSelectionMode(false);
          setSelectedMessages([]);
          setDialog(prev => ({ ...prev, isOpen: false }));
        } else {
          setDialog({ isOpen: true, title: "Gagal Menghapus", message: "Terjadi kesalahan saat menghapus pesan. Silakan coba lagi.", type: 'alert' });
        }
      } catch (e) {
        console.error(e);
        setDialog({ isOpen: true, title: "Kesalahan Koneksi", message: "Tidak dapat terhubung ke server. Silakan periksa koneksi Anda.", type: 'alert' });
      } finally {
        setIsActionLoading(false);
      }
    };
    
    if (allOwnedByMe) {
      setDialog({
        isOpen: true,
        title: "Konfirmasi Penghapusan Pesan",
        message: "Hapus pesan ini untuk Anda sendiri atau untuk semua orang?",
        type: 'delete_options',
        onConfirm: () => deleteFn('for_me'),
        onConfirmForEveryone: () => deleteFn('for_everyone')
      });
    } else {
      setDialog({
        isOpen: true,
        title: "Konfirmasi Penghapusan Pesan",
        message: "Pesan ini hanya akan dihapus untuk Anda. Lawan bicara masih dapat melihat pesan yang mereka kirim.",
        type: 'confirm',
        onConfirm: () => deleteFn('for_me'),
      });
    }
  };

  const handleClearChat = async () => {
    setDialog({
      isOpen: true,
      title: "Kosongkan Obrolan",
      message: "Apakah Anda yakin ingin mengosongkan obrolan ini? Tindakan ini bersifat permanen di sisi Anda.",
      type: 'confirm',
      onConfirm: async () => {
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
            setDialog(prev => ({ ...prev, isOpen: false }));
          } else {
            setDialog({ isOpen: true, title: "Gagal Membersihkan", message: "Terjadi kesalahan saat membersihkan obrolan. Silakan coba lagi.", type: 'alert' });
          }
        } catch (e) {
          console.error(e);
          setDialog({ isOpen: true, title: "Kesalahan Koneksi", message: "Tidak dapat terhubung ke server. Silakan periksa koneksi Anda.", type: 'alert' });
        } finally {
          setIsActionLoading(false);
        }
      }
    });
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
                  <Image src={roomInfo.otherUserAvatarUrl} alt={roomInfo.otherUserName} fill className="object-cover" />
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
                className={`flex w-full items-center gap-md ${isMe ? 'flex-row-reverse' : 'flex-row'} transition-colors duration-500`}
              >
                {isSelectionMode && (
                  <div 
                    className={`flex shrink-0 items-center justify-center p-2 ${msg.is_deleted_for_everyone ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={() => { if (!msg.is_deleted_for_everyone) toggleMessageSelection(msg.id_message) }}
                  >
                    <div className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-white' : 'border-outline-variant'}`}>
                      {isSelected && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                    </div>
                  </div>
                )}
                
                <div 
                  className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'} ${isSelectionMode && !msg.is_deleted_for_everyone ? 'cursor-pointer hover:opacity-80' : ''}`}
                  onClick={() => { if (isSelectionMode && !msg.is_deleted_for_everyone) toggleMessageSelection(msg.id_message) }}
                >
                  <div 
                    className={`p-sm md:p-md rounded-2xl shadow-sm relative transition-colors duration-500 ${
                      isSelected
                        ? 'bg-primary/20 border border-primary text-on-surface'
                        : highlightedMessageId === msg.id_message 
                        ? 'bg-amber-100 border border-amber-300 text-on-surface' 
                        : isMe 
                          ? 'bg-surface-container text-on-surface rounded-tr-sm border border-outline-variant/40' 
                          : 'bg-white text-on-surface rounded-tl-sm border border-outline-variant/40'
                    }`}
                  >
                    {msg.is_deleted_for_everyone ? (
                      <div className="flex items-center gap-1 text-on-surface-variant/80 italic font-body-sm text-sm">
                        <span className="material-symbols-outlined text-[16px]">block</span>
                        <p>Pesan ini telah dihapus</p>
                      </div>
                    ) : msg.image_url ? (
                      <div className="flex flex-col gap-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <Image 
                          src={msg.image_url} 
                          alt="Attachment" 
                          width={250}
                          height={250}
                          className="rounded-lg object-cover border border-outline-variant/20 cursor-pointer hover:opacity-90 transition-opacity" 
                          onClick={(e) => {
                            if (!isSelectionMode) window.open(msg.image_url!, '_blank');
                            else e.preventDefault();
                          }}
                        />
                        {msg.teks_pesan && <p className="font-body-sm text-body-sm whitespace-pre-wrap break-words">{msg.teks_pesan}</p>}
                      </div>
                    ) : (
                      <p className="font-body-sm text-body-sm leading-relaxed whitespace-pre-wrap break-words">{msg.teks_pesan}</p>
                    )}
                  </div>
                  
                  {/* Timestamp & Status */}
                  <div className={`flex items-center gap-1 mt-1 text-[11px] ${isSelectionMode && isSelected ? 'text-primary font-medium' : 'text-on-surface-variant'}`}>
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && (
                      <span className={`material-symbols-outlined text-[14px] ${msg.is_read ? 'text-blue-500' : 'text-outline-variant'}`} aria-hidden="true">
                        done_all
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
      
      {/* Custom Dialog / Modal */}
      {dialog.isOpen && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-on-surface/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-xl w-full max-w-sm flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="font-headline-sm font-bold text-on-surface mb-2">{dialog.title}</h3>
              <p className="font-body-md text-on-surface-variant leading-relaxed">{dialog.message}</p>
            </div>
            
            <div className="flex justify-end gap-3 mt-4">
              {dialog.type === 'delete_options' ? (
                <div className="flex flex-col gap-2 w-full">
                  <button 
                    onClick={() => { if (dialog.onConfirmForEveryone) dialog.onConfirmForEveryone(); }}
                    className="w-full px-4 py-2 rounded-lg font-label-md text-white bg-error hover:bg-error/90 transition-colors flex items-center justify-center gap-2"
                    disabled={isActionLoading}
                  >
                    {isActionLoading && <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>}
                    Hapus untuk Semua Orang
                  </button>
                  <button 
                    onClick={() => { if (dialog.onConfirm) dialog.onConfirm(); }}
                    className="w-full px-4 py-2 rounded-lg font-label-md text-white bg-error hover:bg-error/90 transition-colors flex items-center justify-center gap-2"
                    disabled={isActionLoading}
                  >
                    {isActionLoading && <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>}
                    Hapus untuk Saya
                  </button>
                  <button 
                    onClick={() => setDialog({ ...dialog, isOpen: false })}
                    className="w-full px-4 py-2 rounded-lg font-label-md text-primary hover:bg-surface-container transition-colors mt-2"
                    disabled={isActionLoading}
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <>
                  {dialog.type === 'confirm' && (
                    <button 
                      onClick={() => setDialog({ ...dialog, isOpen: false })}
                      className="px-4 py-2 rounded-lg font-label-md text-primary hover:bg-surface-container transition-colors"
                      disabled={isActionLoading}
                    >
                      Batal
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if (dialog.type === 'confirm' && dialog.onConfirm) {
                        dialog.onConfirm();
                      } else {
                        setDialog({ ...dialog, isOpen: false });
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-label-md text-white flex items-center gap-2 transition-colors ${
                      dialog.type === 'confirm' ? 'bg-error hover:bg-error/90' : 'bg-primary hover:bg-primary/90'
                    }`}
                    disabled={isActionLoading}
                  >
                    {isActionLoading && <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>}
                    {dialog.type === 'confirm' && dialog.title.includes('Kosongkan') ? 'Kosongkan' : dialog.type === 'confirm' ? 'Hapus untuk Saya' : 'Mengerti'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

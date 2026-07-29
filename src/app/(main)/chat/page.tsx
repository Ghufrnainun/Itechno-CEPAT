"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useCurrentRole } from "@/app/(main)/layout";
import { Button } from "@/components/ui/Button";

// Dummy data for contacts
const CONTACTS = [
  {
    id: "c1",
    name: "Siti Rahma",
    role: "worker",
    avatar: "https://i.pravatar.cc/150?u=siti",
    lastMessage: "Siap pak, saya berangkat sekarang.",
    time: "10:30",
    unread: 2,
  },
  {
    id: "c2",
    name: "Budi Santoso",
    role: "worker",
    avatar: "https://i.pravatar.cc/150?u=budi",
    lastMessage: "Bisa pakai kamera HP aja ga kak?",
    time: "Kemarin",
    unread: 0,
  },
  {
    id: "c3",
    name: "Waroeng Bu Sri",
    role: "requester",
    avatar: "https://i.pravatar.cc/150?u=waroeng",
    lastMessage: "Hasil fotonya ditunggu ya mas.",
    time: "Kemarin",
    unread: 0,
  }
];

type Message = {
  id: string;
  senderId: string;
  time: string;
  isMe: boolean;
  text?: string;
  imageUrl?: string;
};

// Dummy messages for a specific conversation
const DUMMY_MESSAGES: Message[] = [
  {
    id: "m1",
    senderId: "c1", // from Siti
    text: "Halo pak, saya tertarik dengan tugas foto katalognya.",
    time: "10:15",
    isMe: false,
  },
  {
    id: "m2",
    senderId: "me",
    text: "Halo Siti, kebetulan saya butuh cepat hari ini. Apakah kameranya sudah siap?",
    time: "10:20",
    isMe: true,
  },
  {
    id: "m3",
    senderId: "c1",
    text: "Sudah pak. Ini contoh referensi foto yang pernah saya ambil sebelumnya:",
    time: "10:22",
    isMe: false,
  },
  {
    id: "m4",
    senderId: "c1",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400",
    time: "10:22",
    isMe: false,
  },
  {
    id: "m5",
    senderId: "me",
    text: "Wah bagus sekali. Oke saya tunggu di lokasi jam 1 ya.",
    time: "10:25",
    isMe: true,
  },
  {
    id: "m6",
    senderId: "c1",
    text: "Siap pak, saya berangkat sekarang.",
    time: "10:30",
    isMe: false,
  }
];

export default function ChatPage() {
  const { role } = useCurrentRole();
  const [activeContactId, setActiveContactId] = useState<string>("c1");
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState(DUMMY_MESSAGES);

  const activeContact = CONTACTS.find(c => c.id === activeContactId);

  // Filter contacts based on role to make it more realistic
  // If I am requester, I see workers. If I am worker, I see requesters.
  // We'll just show all for demo purposes, but maybe prioritize some.
  const visibleContacts = CONTACTS;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: "me",
      text: messageInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setMessages([...messages, newMessage]);
    setMessageInput("");
  };

  return (
    <div className="flex flex-col h-[100dvh] lg:h-full w-full bg-layout-bg font-sans">
      {/* Page Header */}
      <header className="page-header shrink-0">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface font-extrabold">Chat</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">
            Berkomunikasi langsung dengan pemberi atau penerima tugas terkait detail pekerjaan.
          </p>
        </div>
      </header>

      <div className="flex flex-1 w-full overflow-hidden">
        {/* Left Panel: Contact List */}
        <div className="w-[320px] md:w-[380px] bg-white border-r border-outline-variant/60 flex flex-col flex-shrink-0">
          {/* Header Action & Search */}
          <div className="p-md border-b border-outline-variant/60 flex flex-col gap-sm">
            <div className="flex justify-between items-center">
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Daftar Kontak</h2>
              <button className="w-8 h-8 rounded-full hover:bg-interaction-bg flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">edit_square</span>
              </button>
            </div>
            <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input 
              type="text" 
              placeholder="Cari pesan atau nama..." 
              className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-full py-2 pl-10 pr-4 font-body-sm text-body-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Contacts */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {visibleContacts.map(contact => (
            <div 
              key={contact.id}
              onClick={() => setActiveContactId(contact.id)}
              className={`flex items-center gap-md p-md cursor-pointer border-b border-outline-variant/30 transition-colors ${
                activeContactId === contact.id ? 'bg-interaction-bg' : 'hover:bg-interaction-bg/50'
              }`}
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full object-cover border border-outline-variant/30" />
                {contact.unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                    {contact.unread}
                  </span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-body-md text-body-md font-semibold text-on-surface truncate">{contact.name}</h3>
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex-shrink-0">{contact.time}</span>
                </div>
                <p className={`font-body-sm text-body-sm truncate ${contact.unread > 0 ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>
                  {contact.lastMessage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel: Chat Area */}
      <div className="flex-1 flex flex-col bg-layout-bg">
        {activeContact ? (
          <>
            {/* Chat Header */}
            <div className="h-[72px] px-lg border-b border-outline-variant/60 flex items-center gap-md bg-white shadow-sm z-10 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activeContact.avatar} alt={activeContact.name} className="w-10 h-10 rounded-full object-cover border border-outline-variant/30" />
              <div className="flex-1">
                <h3 className="font-body-md text-body-md font-semibold text-on-surface">{activeContact.name}</h3>
                <span className="font-label-sm text-label-sm text-primary flex items-center gap-xs">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                  Online
                </span>
              </div>
              <div className="flex gap-sm text-on-surface-variant">
                <button className="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer">
                  <span className="material-symbols-outlined">call</span>
                </button>
                <button className="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors cursor-pointer">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-lg flex flex-col gap-sm custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col max-w-[70%] ${msg.isMe ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <div 
                    className={`p-sm md:p-md rounded-2xl shadow-sm relative group ${
                      msg.isMe 
                        ? 'bg-surface-container text-on-surface rounded-tr-sm border border-outline-variant/40' 
                        : 'bg-white text-on-surface rounded-tl-sm border border-outline-variant/40'
                    }`}
                  >
                    {msg.imageUrl ? (
                      <div className="flex flex-col gap-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={msg.imageUrl} alt="Attachment" className="rounded-lg max-w-[250px] object-cover border border-outline-variant/20" />
                        {msg.text && <p className="font-body-sm text-body-sm">{msg.text}</p>}
                      </div>
                    ) : (
                      <p className="font-body-sm text-body-sm leading-relaxed">{msg.text}</p>
                    )}
                    
                    <div className={`flex items-center gap-1 mt-1 justify-end ${msg.imageUrl && !msg.text ? 'absolute bottom-2 right-2 bg-black/40 text-white px-2 rounded-full' : 'text-outline'}`}>
                      <span className="text-[10px] font-mono">{msg.time}</span>
                      {msg.isMe && (
                        <span className="material-symbols-outlined text-[14px] text-blue-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                          done_all
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-md bg-surface border-t border-outline-variant/60 flex items-center gap-md">
              <button className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
              </button>
              <button className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[24px]">mood</span>
              </button>
              
              <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-sm bg-white rounded-full px-4 py-2 border border-outline-variant/60 focus-within:border-primary transition-colors">
                <input 
                  type="text" 
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Ketik pesan..." 
                  className="flex-1 bg-transparent border-none focus:outline-none font-body-sm text-body-sm"
                />
                <button 
                  type="submit" 
                  disabled={!messageInput.trim()}
                  className={`flex items-center justify-center transition-colors cursor-pointer ${messageInput.trim() ? 'text-primary' : 'text-outline-variant'}`}
                >
                  <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    send
                  </span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-md p-xl">
            <span className="material-symbols-outlined text-[64px] text-outline-variant">forum</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Pilih obrolan untuk mulai mengirim pesan</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
              Gunakan fitur chat untuk berdiskusi mengenai detail tugas, negosiasi, atau mengabarkan status pekerjaan Anda.
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

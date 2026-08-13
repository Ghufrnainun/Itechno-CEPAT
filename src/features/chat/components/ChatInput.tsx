"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import EmojiPicker from 'emoji-picker-react';
import {
  ImagePlus,
  Smile,
  Send,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (text: string | null, imageUrl: string | null) => Promise<void>;
  disabled?: boolean;
  externalFile?: File | null;
  onExternalFileConsumed?: () => void;
}

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

export function ChatInput({ onSendMessage, disabled, externalFile, onExternalFileConsumed }: ChatInputProps) {
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (externalFile) {
      handleFileSelect(externalFile);
      if (onExternalFileConsumed) onExternalFileConsumed();
    }
  }, [externalFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  const handleFileSelect = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      showError("Ukuran gambar melebihi batas maksimal (1 MB).");
      return;
    }
    if (!file.type.startsWith('image/')) {
      showError("Format file tidak didukung. Harap unggah file gambar.");
      return;
    }
    
    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || disabled) return;
    handleFileSelect(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSend = async () => {
    const currentText = text.trim() || null;
    if ((!currentText && !selectedFile) || disabled || isUploading) return;

    try {
      setIsUploading(true);
      let uploadedImageUrl = null;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('chat-images')
          .getPublicUrl(fileName);
          
        uploadedImageUrl = data.publicUrl;
      }

      await onSendMessage(currentText, uploadedImageUrl);
      
      setText("");
      clearSelectedFile();
    } catch (error) {
      console.error("Gagal mengirim pesan/gambar:", error);
      showError("Gagal mengirim pesan. Silakan periksa koneksi Anda.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendForm = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <div className="p-3 sm:p-4 bg-surface-container-lowest border-t border-card-border flex flex-col gap-2 relative">
      {/* Custom Error Alert */}
      {errorMsg && (
        <div className="absolute top-[-44px] left-1/2 -translate-x-1/2 bg-error-container text-error border border-error/25 px-3 py-1.5 font-bold z-50 rounded-lg shadow-sm whitespace-nowrap flex items-center gap-1.5 text-xs animate-in fade-in slide-in-from-bottom-2">
          <AlertCircle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      {/* Image Preview Container */}
      {previewUrl && (
        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-card-border ml-12 shadow-xs">
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          <button
            onClick={clearSelectedFile}
            disabled={isUploading}
            className="absolute top-1 right-1 w-5 h-5 bg-surface-container-lowest/80 rounded-full flex items-center justify-center text-on-surface hover:bg-error hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 w-full z-20">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <button 
          type="button"
          disabled={disabled || isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-50"
          title="Lampirkan Gambar (Maks 1MB)"
        >
          {isUploading ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
          ) : (
            <ImagePlus className="w-4.5 h-4.5" />
          )}
        </button>
        <div className="relative">
          <button 
            type="button"
            disabled={disabled || isUploading}
            onClick={() => setShowEmojiPicker(prev => !prev)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer hidden sm:flex disabled:opacity-50"
            title="Pilih Emoji"
          >
            <Smile className="w-4.5 h-4.5" />
          </button>
          
          {showEmojiPicker && (
            <div className="absolute bottom-12 left-0 z-50 shadow-xl rounded-xl overflow-hidden">
              <EmojiPicker 
                onEmojiClick={(emojiData) => {
                  setText(prev => prev + emojiData.emoji);
                  setShowEmojiPicker(false);
                }}
              />
            </div>
          )}
        </div>

        <form 
          onSubmit={handleSendForm} 
          className="flex-1 flex items-center gap-2 bg-surface-container-low rounded-xl px-3.5 py-2 border border-card-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-surface-container-lowest transition-all min-h-[44px]"
        >
          <input 
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={disabled || isUploading}
            placeholder={isUploading ? "Mengirim pesan..." : (selectedFile ? "Tambah keterangan..." : "Ketik pesan...")}
            className="flex-1 bg-transparent border-none focus:outline-none font-sans text-base sm:text-xs text-on-surface placeholder:text-on-surface-variant/50 disabled:opacity-50 min-h-[28px]"
          />
          <button 
            type="submit" 
            disabled={(!text.trim() && !selectedFile) || disabled || isUploading}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 shrink-0",
              (text.trim() || selectedFile) && !disabled && !isUploading
                ? 'bg-primary text-on-primary cursor-pointer active:scale-95 shadow-xs'
                : 'text-on-surface-variant/40 opacity-50 cursor-not-allowed'
            )}
            title="Kirim"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

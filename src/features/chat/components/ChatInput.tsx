import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (externalFile) {
      handleFileSelect(externalFile);
      if (onExternalFileConsumed) onExternalFileConsumed();
    }
  }, [externalFile]);

  useEffect(() => {
    // Cleanup object URL to avoid memory leaks
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
    // Reset input so the same file can be selected again if removed
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
        // Upload to Supabase Storage "chat_images" bucket
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-md bg-surface border-t border-outline-variant flex flex-col gap-sm relative">
      {/* Custom Error Alert (Orange & Green, Sharp Edges) */}
      {errorMsg && (
        <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 bg-orange-100 border-2 border-orange-500 text-orange-800 px-4 py-2 font-bold z-50 rounded-none shadow-[4px_4px_0_var(--color-primary,green)] animate-in fade-in slide-in-from-bottom-2 whitespace-nowrap flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-600">warning</span>
          {errorMsg}
        </div>
      )}

      {/* Image Preview Container */}
      {previewUrl && (
        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-outline-variant ml-14 shadow-sm">
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          <button
            onClick={clearSelectedFile}
            disabled={isUploading}
            className="absolute top-1 right-1 w-6 h-6 bg-surface/80 rounded-full flex items-center justify-center text-on-surface hover:bg-error hover:text-on-error transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}

      <div className="flex items-end gap-sm w-full z-20">
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
          className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[24px]">
            {isUploading ? 'hourglass_empty' : 'attach_file'}
          </span>
        </button>

        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isUploading}
          placeholder={isUploading ? "Mengirim pesan..." : (selectedFile ? "Tambah keterangan..." : "Ketik pesan...")}
          className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-3 resize-none h-[48px] max-h-[120px] custom-scrollbar focus:outline-none focus:border-primary font-body-md text-on-surface disabled:opacity-50"
          rows={1}
        />

        <button 
          onClick={handleSend}
          disabled={(!text.trim() && !selectedFile) || disabled || isUploading}
          className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
        </button>
      </div>
    </div>
  );
}

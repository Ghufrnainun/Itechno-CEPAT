'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Flag, X, AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReportModal({ isOpen, onClose, onSuccess }: ReportModalProps) {
  const [kategori, setKategori] = useState('Kendala Teknis / Bug');
  const [subjek, setSubjek] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjek.trim() || !deskripsi.trim()) {
      setErrorMsg('Subjek dan deskripsi laporan wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kategori,
          subjek: subjek.trim(),
          deskripsi: deskripsi.trim(),
        }),
      });

      const json = await res.json();

      if (json.success) {
        setSuccessMsg('Laporan Anda berhasil dikirimkan ke Admin!');
        setSubjek('');
        setDeskripsi('');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 2000);
      } else {
        setErrorMsg(json.message || 'Gagal mengirimkan laporan.');
      }
    } catch (err) {
      console.error('[ReportModal] Submit error:', err);
      setErrorMsg('Terjadi kesalahan koneksi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E2E8F0] relative overflow-hidden font-sans animate-in zoom-in-95 duration-200 z-[100000]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-[#0C1F16]">
                Laporkan Masalah ke Admin
              </h3>
              <p className="text-xs text-[#64748B]">
                Sampaikan kendala, bug, atau aduan Anda langsung kepada tim Admin.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0C1F16] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-[#E6F4F1] border border-[#0F766E]/30 text-[#0F766E] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0C1F16] mb-1.5">
              Kategori Laporan <span className="text-rose-500">*</span>
            </label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full px-3 py-2 text-xs font-sans bg-[#F8FAFC] text-[#0C1F16] rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:bg-white outline-none transition-all"
            >
              <option value="Kendala Teknis / Bug">Kendala Teknis / Bug Aplikasi</option>
              <option value="Kendala Transaksi & Poin">Kendala Transaksi & Poin Saldo</option>
              <option value="Pelanggaran Pengguna / Task">Pelanggaran Pengguna / Task Palsu</option>
              <option value="Saran & Masukan">Saran & Masukan Platform</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#0C1F16]">
                Subjek Laporan <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-mono text-[#94A3B8]">
                {subjek.length}/150
              </span>
            </div>
            <input
              type="text"
              value={subjek}
              onChange={(e) => setSubjek(e.target.value)}
              placeholder="Contoh: Gagal tarik saldo atau task tidak merespons..."
              className="w-full px-3 py-2 text-xs font-sans bg-[#F8FAFC] text-[#0C1F16] placeholder-[#94A3B8] rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:bg-white outline-none transition-all"
              maxLength={150}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#0C1F16]">
                Detail Deskripsi Permasalahan <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] font-mono text-[#94A3B8]">
                {deskripsi.length}/2000
              </span>
            </div>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Jelaskan secara detail kronologi kejadian, ID task terkait (jika ada), atau pesan error yang dialami..."
              rows={4}
              maxLength={2000}
              className="w-full px-3 py-2 text-xs font-sans bg-[#F8FAFC] text-[#0C1F16] placeholder-[#94A3B8] rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:bg-white outline-none transition-all resize-none"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-[#64748B] hover:text-[#0C1F16] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold bg-[#0F766E] hover:bg-[#0D645E] text-white rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Kirim Laporan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

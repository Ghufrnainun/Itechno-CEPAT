'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Flag, X, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
      <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-card-border relative overflow-hidden font-sans animate-in zoom-in-95 duration-200 z-[100000]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-card-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error-container/40 text-error flex items-center justify-center shrink-0 border border-error/25">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-on-surface">
                Laporkan Masalah ke Admin
              </h3>
              <p className="text-xs text-on-surface-variant">
                Sampaikan kendala, bug, atau aduan Anda langsung kepada tim Admin.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal laporan"
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-error-container/40 border border-error/25 text-error text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-primary/10 border border-primary/25 text-primary text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1.5">
              Kategori Laporan <span className="text-error">*</span>
            </label>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full px-3 py-2 text-xs font-sans bg-surface-container-low text-on-surface rounded-xl border border-card-border focus:border-primary focus:bg-surface-container-lowest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
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
              <label className="block text-xs font-bold text-on-surface">
                Subjek Laporan <span className="text-error">*</span>
              </label>
              <span className="text-[10px] font-mono text-on-surface-variant/60">
                {subjek.length}/150
              </span>
            </div>
            <input
              type="text"
              value={subjek}
              onChange={(e) => setSubjek(e.target.value)}
              placeholder="Contoh: Gagal tarik saldo atau task tidak merespons..."
              className="w-full px-3 py-2 text-xs font-sans bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 rounded-xl border border-card-border focus:border-primary focus:bg-surface-container-lowest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
              maxLength={150}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-on-surface">
                Detail Deskripsi Permasalahan <span className="text-error">*</span>
              </label>
              <span className="text-[10px] font-mono text-on-surface-variant/60">
                {deskripsi.length}/2000
              </span>
            </div>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Jelaskan secara detail kronologi kejadian, ID task terkait (jika ada), atau pesan error yang dialami..."
              rows={4}
              maxLength={2000}
              className="w-full px-3 py-2 text-xs font-sans bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 rounded-xl border border-card-border focus:border-primary focus:bg-surface-container-lowest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all resize-none"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-card-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              {loading ? 'Mengirim...' : 'Kirim Laporan'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

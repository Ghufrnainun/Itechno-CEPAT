'use client';

import { useState } from 'react';
import { Flag, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/motion/dialog';
import { Label, Input, Select, Textarea } from '@/components/ui/Input';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultCategory?: string;
  defaultSubject?: string;
  taskId?: string;
  taskTitle?: string;
}

export function ReportModal({
  isOpen,
  onClose,
  onSuccess,
  defaultCategory = 'Kendala Teknis / Bug',
  defaultSubject = '',
  taskId,
  taskTitle,
}: ReportModalProps) {
  const initialCategory = taskId ? 'Pelanggaran Pengguna / Task' : defaultCategory;
  const initialSubject = defaultSubject || (taskTitle ? `[Pelanggaran Task] ${taskTitle}` : '');

  const [kategori, setKategori] = useState(initialCategory);
  const [subjek, setSubjek] = useState(initialSubject);
  const [deskripsi, setDeskripsi] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
      const finalDescription = taskId
        ? `[Terkait Task: ${taskTitle || taskId} (ID: ${taskId})]\n\n${deskripsi.trim()}`
        : deskripsi.trim();

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kategori,
          subjek: subjek.trim(),
          deskripsi: finalDescription,
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
        }, 1800);
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth="md" className="overflow-visible">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error-container/40 text-error flex items-center justify-center shrink-0 border border-error/25">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>Laporkan Masalah ke Admin</DialogTitle>
              <DialogDescription>
                Sampaikan kendala, bug, atau aduan Anda langsung kepada tim Admin.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-visible">
          <DialogBody className="overflow-visible">
            {/* Status Alerts */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-error-container/40 border border-error/25 text-error text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 text-primary text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <Label required>Kategori Laporan</Label>
              <Select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
              >
                <option value="Kendala Teknis / Bug">Kendala Teknis / Bug Aplikasi</option>
                <option value="Kendala Transaksi & Poin">Kendala Transaksi & Poin Saldo</option>
                <option value="Pelanggaran Pengguna / Task">Pelanggaran Pengguna / Task Palsu</option>
                <option value="Saran & Masukan">Saran & Masukan Platform</option>
                <option value="Lainnya">Lainnya</option>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label required className="mb-0">Subjek Laporan</Label>
                <span className="text-[10px] font-mono text-on-surface-variant/60">
                  {subjek.length}/150
                </span>
              </div>
              <Input
                type="text"
                value={subjek}
                onChange={(e) => setSubjek(e.target.value)}
                placeholder="Contoh: Gagal tarik saldo atau task tidak merespons..."
                maxLength={150}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label required className="mb-0">Detail Deskripsi Permasalahan</Label>
                <span className="text-[10px] font-mono text-on-surface-variant/60">
                  {deskripsi.length}/2000
                </span>
              </div>
              <Textarea
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Jelaskan secara detail kronologi kejadian, ID task terkait (jika ada), atau pesan error yang dialami..."
                rows={4}
                maxLength={2000}
                required
              />
            </div>
          </DialogBody>

          <DialogFooter>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Send,
  Paperclip,
  UploadCloud,
  Image as ImageIcon,
  X,
  Sparkles,
  Loader2,
} from 'lucide-react';
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
import {
  compressImage,
  formatFileSize,
  CompressImageResult,
} from '@/lib/utils/image-compression';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  counterpartName?: string;
  userRole?: 'requester' | 'worker';
  onSuccess?: () => void;
}

const REQUESTER_REASONS = [
  'Hasil kerja tidak sesuai kesepakatan',
  'Pekerja tidak dapat dihubungi / tidak hadir',
  'Kualitas pekerjaan jauh di bawah standar yang disepakati',
  'Pekerja membatalkan tugas secara sepihak',
  'Pelanggaran etika atau kecurangan',
  'Lainnya',
];

const WORKER_REASONS = [
  'Pemberi tugas menolak menyelesaikan tugas / lepas tanggung jawab',
  'Pemberi tugas tidak dapat dihubungi setelah tugas selesai',
  'Kompensasi atau instruksi diubah sepihak oleh pemberi tugas',
  'Pemberi tugas meminta revisi di luar kesepakatan awal',
  'Pelanggaran etika atau perlakuan tidak pantas',
  'Lainnya',
];

export function DisputeModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  counterpartName,
  userRole = 'requester',
  onSuccess,
}: DisputeModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reasonsList = userRole === 'worker' ? WORKER_REASONS : REQUESTER_REASONS;

  const [reason, setReason] = useState(reasonsList[0]);
  const [description, setDescription] = useState('');
  const [evidenceMode, setEvidenceMode] = useState<'upload' | 'url'>('upload');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  // Sinkronkan reason awal saat modal dibuka atau role berubah
  React.useEffect(() => {
    if (isOpen) {
      setReason(userRole === 'worker' ? WORKER_REASONS[0] : REQUESTER_REASONS[0]);
    }
  }, [isOpen, userRole]);

  // Image Upload & Compression State
  const [compressing, setCompressing] = useState(false);
  const [compressedData, setCompressedData] = useState<CompressImageResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Harap pilih file gambar (JPG, PNG, WebP).');
      return;
    }

    setErrorMsg(null);
    setCompressing(true);

    try {
      // Kompresi gambar di client-side (maksimal 1280px, kualitas 0.75)
      const result = await compressImage(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.75,
        outputFormat: 'image/jpeg',
      });
      setCompressedData(result);
    } catch (err: any) {
      console.error('[DisputeModal] Compression error:', err);
      setErrorMsg('Gagal mengompresi gambar. Coba gunakan gambar lain.');
    } finally {
      setCompressing(false);
    }
  };

  const handleRemoveImage = () => {
    setCompressedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Penjelasan kronologi permasalahan wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let finalEvidenceUrl = evidenceUrl.trim();

      // Jika user mengunggah foto langsung, upload compressed file ke server
      if (evidenceMode === 'upload' && compressedData) {
        const formData = new FormData();
        formData.append('file', compressedData.file);

        const uploadRes = await fetch('/api/upload/dispute-evidence', {
          method: 'POST',
          body: formData,
        });

        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok || !uploadJson.success) {
          throw new Error(uploadJson.message || 'Gagal mengunggah foto bukti ke server.');
        }

        finalEvidenceUrl = uploadJson.data.url;
      }

      const payload: any = {
        taskId,
        reason,
        description: description.trim(),
      };

      if (finalEvidenceUrl) {
        payload.evidence = [
          {
            type: finalEvidenceUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) || finalEvidenceUrl.startsWith('data:image')
              ? 'image'
              : 'text',
            content: finalEvidenceUrl,
          },
        ];
      }

      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setSuccessMsg('Sengketa berhasil diajukan. Mengarahkan ke ruang mediasi...');
        setDescription('');
        setEvidenceUrl('');
        setCompressedData(null);
        if (onSuccess) onSuccess();

        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
          if (json.data?.id_dispute) {
            router.push(`/disputes/${json.data.id_dispute}`);
          } else {
            router.push('/disputes');
          }
        }, 1200);
      } else {
        setErrorMsg(json.message || 'Gagal mengajukan sengketa.');
      }
    } catch (err: any) {
      console.error('[DisputeModal] Error:', err);
      setErrorMsg(err.message || 'Terjadi gangguan saat memproses sengketa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth="md" className="overflow-visible">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/25">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>Ajukan Mediasi Sengketa Tugas</DialogTitle>
              <DialogDescription>
                Buka ruang penyelesaian resmi untuk tugas: <span className="font-semibold text-on-surface">"{taskTitle}"</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-visible">
          <DialogBody className="overflow-visible space-y-4">
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
              <Label required>Alasan Pengajuan Sengketa ({userRole === 'worker' ? 'Sisi Pekerja' : 'Sisi Pemberi Tugas'})</Label>
              <Select value={reason} onChange={(e) => setReason(e.target.value)}>
                {reasonsList.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label required className="mb-0">Kronologi &amp; Penjelasan Kendala</Label>
                <span className="text-[10px] font-mono text-on-surface-variant/60">
                  {description.length}/2000
                </span>
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`Jelaskan secara objektif kronologi dengan ${counterpartName ? counterpartName : 'pihak terkait'}, bukti yang dimiliki, dan solusi yang diharapkan...`}
                rows={4}
                maxLength={2000}
                required
              />
            </div>

            {/* Evidence Section: Upload Compressed Image vs URL */}
            <div className="flex flex-col gap-2 pt-1 border-t border-card-border/60">
              <div className="flex items-center justify-between">
                <Label className="mb-0 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-primary" />
                  <span>Bukti Pendukung (Opsional)</span>
                </Label>

                {/* Switcher Mode */}
                <div className="inline-flex p-0.5 rounded-lg bg-surface-container-low border border-card-border">
                  <button
                    type="button"
                    onClick={() => setEvidenceMode('upload')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      evidenceMode === 'upload'
                        ? 'bg-surface-container-lowest text-primary font-bold shadow-2xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Upload Foto
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvidenceMode('url')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      evidenceMode === 'url'
                        ? 'bg-surface-container-lowest text-primary font-bold shadow-2xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Tautan Link
                  </button>
                </div>
              </div>

              {evidenceMode === 'upload' ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="dispute-evidence-file"
                  />

                  {compressing ? (
                    <div className="p-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 flex items-center justify-center gap-2.5 text-xs text-primary font-medium">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengompresi foto secara otomatis...</span>
                    </div>
                  ) : compressedData ? (
                    <div className="p-3 rounded-2xl bg-surface-container-low border border-card-border flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={compressedData.previewUrl}
                          alt="Pratinjau bukti"
                          className="w-14 h-14 rounded-xl object-cover border border-card-border shrink-0 bg-surface-container-lowest"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-xs text-on-surface truncate">
                            {compressedData.file.name}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] font-mono mt-0.5">
                            {compressedData.sizeReductionPercent > 0 ? (
                              <>
                                <span className="text-on-surface-variant line-through opacity-70">
                                  {formatFileSize(compressedData.originalSize)}
                                </span>
                                <span className="font-bold text-primary">
                                  {formatFileSize(compressedData.compressedSize)}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  Hemat {compressedData.sizeReductionPercent}%
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="font-bold text-primary">
                                  {formatFileSize(compressedData.compressedSize)}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold text-[10px] flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  Ukuran Optimal
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        aria-label="Hapus foto bukti"
                        className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-error transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="dispute-evidence-file"
                      className="p-5 rounded-2xl border-2 border-dashed border-card-border hover:border-primary/50 bg-surface-container-low hover:bg-primary/5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-primary block">
                          Pilih atau Ambil Foto Bukti
                        </span>
                        <span className="text-[11px] text-on-surface-variant">
                          Foto dikompresi otomatis tanpa mengurangi ketajaman detail
                        </span>
                      </div>
                    </label>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <Input
                    type="url"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="https://drive.google.com/... atau tautan berkas online"
                  />
                  <p className="text-[11px] text-on-surface-variant">
                    Salin tautan dokumen atau gambar bukti dari Google Drive / Cloud Storage.
                  </p>
                </div>
              )}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={loading || compressing}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading || compressing}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              {loading ? 'Memproses...' : 'Buka Mediasi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

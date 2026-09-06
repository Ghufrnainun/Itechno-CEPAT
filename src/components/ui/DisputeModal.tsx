'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Send,
  Paperclip,
  UploadCloud,
  X,
  Sparkles,
  Loader2,
  Users,
  UserCheck,
  Copy,
  ChevronRight,
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
import { Avatar } from '@/components/ui/Avatar';
import {
  compressImage,
  formatFileSize,
  CompressImageResult,
} from '@/lib/utils/image-compression';
import { formatCurrency } from '@/lib/utils/format';

export interface AcceptedWorkerItem {
  id_user: string;
  nama_lengkap: string;
  avatar_url?: string | null;
  rating_avg?: number;
  bid_amount?: number | null;
}

interface WorkerDisputeData {
  reason: string;
  description: string;
  evidenceMode: 'upload' | 'url';
  evidenceUrl: string;
  compressedData: CompressImageResult | null;
}

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  counterpartName?: string;
  userRole?: 'requester' | 'worker';
  acceptedWorkers?: AcceptedWorkerItem[];
  existingDisputedWorkerIds?: string[];
  preselectedWorkerId?: string;
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
  acceptedWorkers = [],
  existingDisputedWorkerIds = [],
  preselectedWorkerId,
  onSuccess,
}: DisputeModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMultiWorker = userRole === 'requester' && acceptedWorkers.length > 1;
  const reasonsList = userRole === 'worker' ? WORKER_REASONS : REQUESTER_REASONS;

  // Multi-Worker Selection State
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [activeWorkerTab, setActiveWorkerTab] = useState<string>('');
  
  // Dispute Data per Worker (Map: workerId -> WorkerDisputeData)
  const [workerDisputeMap, setWorkerDisputeMap] = useState<Record<string, WorkerDisputeData>>({});

  // Single Worker State (for worker role or when only 1 worker exists)
  const [singleReason, setSingleReason] = useState(reasonsList[0]);
  const [singleDescription, setSingleDescription] = useState('');
  const [singleEvidenceMode, setSingleEvidenceMode] = useState<'upload' | 'url'>('upload');
  const [singleEvidenceUrl, setSingleEvidenceUrl] = useState('');
  const [singleCompressedData, setSingleCompressedData] = useState<CompressImageResult | null>(null);

  const [compressing, setCompressing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      const defaultReason = userRole === 'worker' ? WORKER_REASONS[0] : REQUESTER_REASONS[0];
      setSingleReason(defaultReason);
      setSingleDescription('');
      setSingleEvidenceUrl('');
      setSingleCompressedData(null);

      if (isMultiWorker) {
        const canPreselect = preselectedWorkerId && !existingDisputedWorkerIds.includes(preselectedWorkerId) && acceptedWorkers.some(w => w.id_user === preselectedWorkerId);
        if (canPreselect) {
          setSelectedWorkerIds([preselectedWorkerId]);
          setActiveWorkerTab(preselectedWorkerId);
        } else {
          setSelectedWorkerIds([]);
          setActiveWorkerTab('');
        }

        const initialMap: Record<string, WorkerDisputeData> = {};
        for (const w of acceptedWorkers) {
          initialMap[w.id_user] = {
            reason: defaultReason,
            description: '',
            evidenceMode: 'upload',
            evidenceUrl: '',
            compressedData: null,
          };
        }
        setWorkerDisputeMap(initialMap);
      }
    }
  }, [isOpen, isMultiWorker, userRole, acceptedWorkers, existingDisputedWorkerIds, preselectedWorkerId]);

  const toggleWorkerSelection = (workerId: string) => {
    if (existingDisputedWorkerIds.includes(workerId)) return;

    setSelectedWorkerIds((prev) => {
      let next: string[];
      if (prev.includes(workerId)) {
        next = prev.filter((id) => id !== workerId);
      } else {
        next = [...prev, workerId];
      }

      if (!next.includes(activeWorkerTab) && next.length > 0) {
        setActiveWorkerTab(next[0]);
      }
      return next;
    });
  };

  const selectAllAvailableWorkers = () => {
    const available = acceptedWorkers
      .filter((w) => !existingDisputedWorkerIds.includes(w.id_user))
      .map((w) => w.id_user);

    setSelectedWorkerIds(available);
    if (available.length > 0 && !available.includes(activeWorkerTab)) {
      setActiveWorkerTab(available[0]);
    }
  };

  const handleUpdateWorkerDispute = (
    workerId: string,
    updates: Partial<WorkerDisputeData>
  ) => {
    setWorkerDisputeMap((prev) => ({
      ...prev,
      [workerId]: {
        ...(prev[workerId] || {
          reason: reasonsList[0],
          description: '',
          evidenceMode: 'upload',
          evidenceUrl: '',
          compressedData: null,
        }),
        ...updates,
      },
    }));
  };

  const handleCopyReasonToAll = () => {
    const current = workerDisputeMap[activeWorkerTab];
    if (!current) return;

    setWorkerDisputeMap((prev) => {
      const next = { ...prev };
      for (const id of selectedWorkerIds) {
        next[id] = {
          ...next[id],
          reason: current.reason,
          description: current.description,
        };
      }
      return next;
    });
    setSuccessMsg('Alasan & kronologi berhasil disalin ke semua pekerja terpilih.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetWorkerId?: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Harap pilih file gambar (JPG, PNG, WebP).');
      return;
    }

    setErrorMsg(null);
    setCompressing(true);

    try {
      const result = await compressImage(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.75,
        outputFormat: 'image/jpeg',
      });

      if (targetWorkerId) {
        handleUpdateWorkerDispute(targetWorkerId, { compressedData: result });
      } else {
        setSingleCompressedData(result);
      }
    } catch (err: any) {
      console.error('[DisputeModal] Compression error:', err);
      setErrorMsg('Gagal mengompresi gambar. Coba gunakan gambar lain.');
    } finally {
      setCompressing(false);
    }
  };

  const handleRemoveImage = (targetWorkerId?: string) => {
    if (targetWorkerId) {
      handleUpdateWorkerDispute(targetWorkerId, { compressedData: null });
    } else {
      setSingleCompressedData(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Multi-worker validation
    if (isMultiWorker) {
      if (selectedWorkerIds.length === 0) {
        setErrorMsg('Pilih minimal 1 pekerja yang ingin diajukan sengketa.');
        return;
      }

      for (const workerId of selectedWorkerIds) {
        const data = workerDisputeMap[workerId];
        const workerInfo = acceptedWorkers.find((w) => w.id_user === workerId);
        const workerName = workerInfo?.nama_lengkap || 'Pekerja';

        if (!data || !data.description.trim()) {
          setErrorMsg(`Kronologi sengketa untuk ${workerName} wajib diisi.`);
          setActiveWorkerTab(workerId);
          return;
        }
      }
    } else {
      if (!singleDescription.trim()) {
        setErrorMsg('Penjelasan kronologi permasalahan wajib diisi.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isMultiWorker) {
        // Upload images for each worker and prepare batch disputes payload
        const disputeItems = [];

        for (const workerId of selectedWorkerIds) {
          const data = workerDisputeMap[workerId];
          let finalEvidenceUrl = data.evidenceUrl.trim();

          if (data.evidenceMode === 'upload' && data.compressedData) {
            const formData = new FormData();
            formData.append('file', data.compressedData.file);

            const uploadRes = await fetch('/api/upload/dispute-evidence', {
              method: 'POST',
              body: formData,
            });
            const uploadJson = await uploadRes.json();
            if (!uploadRes.ok || !uploadJson.success) {
              throw new Error(uploadJson.message || 'Gagal mengunggah foto bukti.');
            }
            finalEvidenceUrl = uploadJson.data.url;
          }

          const evidence = finalEvidenceUrl
            ? [
                {
                  type: (finalEvidenceUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) ? 'image' : 'text') as 'image' | 'text',
                  content: finalEvidenceUrl,
                },
              ]
            : undefined;

          disputeItems.push({
            respondentId: workerId,
            reason: data.reason,
            description: data.description.trim(),
            evidence,
          });
        }

        const res = await fetch('/api/disputes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId,
            disputes: disputeItems,
          }),
        });

        const json = await res.json();
        if (res.ok && json.success) {
          setSuccessMsg(
            `${disputeItems.length} tiket sengketa berhasil dibuka! Mengarahkan ke pusat sengketa...`
          );
          if (onSuccess) onSuccess();

          setTimeout(() => {
            onClose();
            router.push('/disputes');
          }, 1200);
        } else {
          throw new Error(json.message || 'Gagal mengajukan sengketa.');
        }
      } else {
        // Single Worker dispute
        let finalEvidenceUrl = singleEvidenceUrl.trim();

        if (singleEvidenceMode === 'upload' && singleCompressedData) {
          const formData = new FormData();
          formData.append('file', singleCompressedData.file);

          const uploadRes = await fetch('/api/upload/dispute-evidence', {
            method: 'POST',
            body: formData,
          });
          const uploadJson = await uploadRes.json();
          if (!uploadRes.ok || !uploadJson.success) {
            throw new Error(uploadJson.message || 'Gagal mengunggah foto bukti.');
          }
          finalEvidenceUrl = uploadJson.data.url;
        }

        const evidence = finalEvidenceUrl
          ? [
              {
                type: (finalEvidenceUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) ? 'image' : 'text') as 'image' | 'text',
                content: finalEvidenceUrl,
              },
            ]
          : undefined;

        const respondentId =
          userRole === 'requester' && acceptedWorkers.length >= 1
            ? acceptedWorkers[0].id_user
            : undefined;

        const res = await fetch('/api/disputes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId,
            respondentId,
            reason: singleReason,
            description: singleDescription.trim(),
            evidence,
          }),
        });

        const json = await res.json();
        if (res.ok && json.success) {
          setSuccessMsg('Sengketa berhasil diajukan. Mengarahkan ke ruang mediasi...');
          if (onSuccess) onSuccess();

          setTimeout(() => {
            onClose();
            if (json.data?.id_dispute) {
              router.push(`/disputes/${json.data.id_dispute}`);
            } else {
              router.push('/disputes');
            }
          }, 1200);
        } else {
          throw new Error(json.message || 'Gagal mengajukan sengketa.');
        }
      }
    } catch (err: any) {
      console.error('[DisputeModal] Error:', err);
      setErrorMsg(err.message || 'Terjadi gangguan saat memproses sengketa.');
    } finally {
      setLoading(false);
    }
  };

  const activeWorkerData = isMultiWorker ? workerDisputeMap[activeWorkerTab] : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth={isMultiWorker ? 'lg' : 'md'}>
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <DialogBody className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* Alerts */}
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

            {/* ── MULTI-WORKER SELECTION ── */}
            {isMultiWorker && (
              <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-surface-container-low border border-card-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary" />
                    <Label className="mb-0 font-bold text-xs text-on-surface">
                      Pilih Pekerja yang Ingin Disengketakan ({selectedWorkerIds.length}/{acceptedWorkers.length})
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={selectAllAvailableWorkers}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {acceptedWorkers.map((worker) => {
                    const isDisputed = existingDisputedWorkerIds.includes(worker.id_user);
                    const isSelected = selectedWorkerIds.includes(worker.id_user);

                    return (
                      <div
                        key={worker.id_user}
                        onClick={() => !isDisputed && toggleWorkerSelection(worker.id_user)}
                        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                          isDisputed
                            ? 'opacity-50 bg-surface-container-lowest border-card-border cursor-not-allowed'
                            : isSelected
                            ? 'bg-primary/10 border-primary shadow-xs cursor-pointer'
                            : 'bg-surface-container-lowest border-card-border hover:border-card-border/80 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar
                            src={worker.avatar_url}
                            name={worker.nama_lengkap}
                            size="sm"
                            shape="rounded"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-xs text-on-surface truncate">
                              {worker.nama_lengkap}
                            </span>
                            <span className="text-[10px] text-on-surface-variant font-mono">
                              {worker.bid_amount ? formatCurrency(worker.bid_amount) : 'Pekerja Diterima'}
                            </span>
                          </div>
                        </div>

                        {isDisputed ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
                            Sengketa Aktif
                          </span>
                        ) : (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-primary accent-primary cursor-pointer shrink-0"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── MULTI-WORKER TAB NAVIGATION & WORKER-SPECIFIC FORM ── */}
            {isMultiWorker ? (
              selectedWorkerIds.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-surface-container-low border border-dashed border-card-border flex flex-col items-center justify-center gap-2">
                  <Users className="w-8 h-8 text-on-surface-variant/60" />
                  <p className="font-bold text-xs text-on-surface">Silakan pilih pekerja yang ingin dilaporkan</p>
                  <p className="text-[11px] text-on-surface-variant max-w-xs">
                    Centang kotak pada nama pekerja di atas untuk mengisi alasan dan bukti sengketa.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pt-1">
                  {/* Worker Tabs */}
                  <div className="flex items-center justify-between gap-2 flex-wrap border-b border-card-border/70 pb-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                      {selectedWorkerIds.map((id) => {
                        const worker = acceptedWorkers.find((w) => w.id_user === id);
                        const isTabActive = activeWorkerTab === id;
                        const hasDesc = Boolean(workerDisputeMap[id]?.description?.trim());

                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setActiveWorkerTab(id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isTabActive
                                ? 'bg-primary text-on-primary shadow-xs'
                                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-card-border'
                            }`}
                          >
                            <span>{worker?.nama_lengkap}</span>
                            {hasDesc && (
                              <span className={`w-1.5 h-1.5 rounded-full ${isTabActive ? 'bg-white' : 'bg-emerald-500'}`} />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {selectedWorkerIds.length > 1 && (
                      <button
                        type="button"
                        onClick={handleCopyReasonToAll}
                        className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        title="Terapkan alasan & kronologi pekerja ini ke semua pekerja terpilih"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Terapkan ke Semua</span>
                      </button>
                    )}
                  </div>

                  {/* Form fields for the active worker */}
                  {activeWorkerData && (() => {
                    const currentWorker = acceptedWorkers.find((w) => w.id_user === activeWorkerTab);
                    return (
                      <div className="space-y-3.5 animate-in fade-in-50 duration-200">
                        {/* Clear Worker Identification Banner */}
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Avatar src={currentWorker?.avatar_url} name={currentWorker?.nama_lengkap} size="sm" shape="rounded" />
                            <div>
                              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-primary">Melaporkan Pekerja:</span>
                              <h4 className="font-bold text-xs text-on-surface">{currentWorker?.nama_lengkap}</h4>
                            </div>
                          </div>
                          {currentWorker?.bid_amount && (
                            <span className="font-mono text-xs font-bold text-primary bg-surface-container-lowest px-2 py-1 rounded-lg border border-primary/20">
                              {formatCurrency(currentWorker.bid_amount)}
                            </span>
                          )}
                        </div>

                        <div>
                          <Label required>
                            Alasan Sengketa untuk{' '}
                            <span className="text-primary font-bold">
                              {currentWorker?.nama_lengkap}
                            </span>
                          </Label>
                        <Select
                          value={activeWorkerData.reason}
                          onChange={(e) =>
                            handleUpdateWorkerDispute(activeWorkerTab, { reason: e.target.value })
                          }
                        >
                          {reasonsList.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </Select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <Label required className="mb-0">Kronologi &amp; Penjelasan Permasalahan</Label>
                          <span className="text-[10px] font-mono text-on-surface-variant/60">
                            {activeWorkerData.description.length}/2000
                          </span>
                        </div>
                        <Textarea
                          value={activeWorkerData.description}
                          onChange={(e) =>
                            handleUpdateWorkerDispute(activeWorkerTab, { description: e.target.value })
                          }
                          placeholder={`Jelaskan secara objektif kendala spesifik dengan ${
                            acceptedWorkers.find((w) => w.id_user === activeWorkerTab)?.nama_lengkap
                          }, bukti yang dimiliki, dan solusi yang diharapkan...`}
                          rows={3}
                          maxLength={2000}
                          required
                        />
                      </div>

                      {/* Evidence Section for Active Worker */}
                      <div className="flex flex-col gap-2 pt-1 border-t border-card-border/60">
                        <div className="flex items-center justify-between">
                          <Label className="mb-0 flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-primary" />
                            <span>Bukti Pendukung (Opsional)</span>
                          </Label>

                          <div className="inline-flex p-0.5 rounded-lg bg-surface-container-low border border-card-border">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateWorkerDispute(activeWorkerTab, { evidenceMode: 'upload' })
                              }
                              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                                activeWorkerData.evidenceMode === 'upload'
                                  ? 'bg-surface-container-lowest text-primary font-bold shadow-2xs'
                                  : 'text-on-surface-variant hover:text-on-surface'
                              }`}
                            >
                              Upload Foto
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateWorkerDispute(activeWorkerTab, { evidenceMode: 'url' })
                              }
                              className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                                activeWorkerData.evidenceMode === 'url'
                                  ? 'bg-surface-container-lowest text-primary font-bold shadow-2xs'
                                  : 'text-on-surface-variant hover:text-on-surface'
                              }`}
                            >
                              Tautan Link
                            </button>
                          </div>
                        </div>

                        {activeWorkerData.evidenceMode === 'upload' ? (
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, activeWorkerTab)}
                              className="hidden"
                              id={`dispute-evidence-${activeWorkerTab}`}
                            />

                            {compressing ? (
                              <div className="p-3.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 flex items-center justify-center gap-2 text-xs text-primary font-medium">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Mengompresi foto bukti...</span>
                              </div>
                            ) : activeWorkerData.compressedData ? (
                              <div className="p-2.5 rounded-xl bg-surface-container-low border border-card-border flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <img
                                    src={activeWorkerData.compressedData.previewUrl}
                                    alt="Bukti foto"
                                    className="w-12 h-12 rounded-lg object-cover border border-card-border shrink-0 bg-surface-container-lowest"
                                  />
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-semibold text-xs text-on-surface truncate">
                                      {activeWorkerData.compressedData.file.name}
                                    </span>
                                    <div className="flex items-center gap-2 text-[11px] font-mono mt-0.5">
                                      <span className="font-bold text-primary">
                                        {formatFileSize(activeWorkerData.compressedData.compressedSize)}
                                      </span>
                                      <span className="px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-600 font-bold text-[9px] flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5" />
                                        Hemat {activeWorkerData.compressedData.sizeReductionPercent}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(activeWorkerTab)}
                                  className="w-7 h-7 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-error transition-colors cursor-pointer shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <label
                                htmlFor={`dispute-evidence-${activeWorkerTab}`}
                                className="p-4 rounded-xl border-2 border-dashed border-card-border hover:border-primary/50 bg-surface-container-low hover:bg-primary/5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors text-center"
                              >
                                <UploadCloud className="w-4 h-4 text-primary" />
                                <span className="text-xs font-semibold text-primary">
                                  Pilih Foto Bukti Sengketa
                                </span>
                              </label>
                            )}
                          </div>
                        ) : (
                          <Input
                            type="url"
                            value={activeWorkerData.evidenceUrl}
                            onChange={(e) =>
                              handleUpdateWorkerDispute(activeWorkerTab, { evidenceUrl: e.target.value })
                            }
                            placeholder="https://drive.google.com/... atau tautan bukti online"
                          />
                        )}
                      </div>
                    </div>
                  );
                })()}
                </div>
              )
            ) : (
              /* ── SINGLE WORKER / WORKER POV FORM ── */
              <div className="space-y-4">
                <div>
                  <Label required>
                    Alasan Pengajuan Sengketa ({userRole === 'worker' ? 'Sisi Pekerja' : 'Sisi Pemberi Tugas'})
                  </Label>
                  <Select value={singleReason} onChange={(e) => setSingleReason(e.target.value)}>
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
                      {singleDescription.length}/2000
                    </span>
                  </div>
                  <Textarea
                    value={singleDescription}
                    onChange={(e) => setSingleDescription(e.target.value)}
                    placeholder={`Jelaskan secara objektif kronologi dengan ${counterpartName ? counterpartName : 'pihak terkait'}, bukti yang dimiliki, dan solusi yang diharapkan...`}
                    rows={4}
                    maxLength={2000}
                    required
                  />
                </div>

                {/* Evidence Section */}
                <div className="flex flex-col gap-2 pt-1 border-t border-card-border/60">
                  <div className="flex items-center justify-between">
                    <Label className="mb-0 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-primary" />
                      <span>Bukti Pendukung (Opsional)</span>
                    </Label>

                    <div className="inline-flex p-0.5 rounded-lg bg-surface-container-low border border-card-border">
                      <button
                        type="button"
                        onClick={() => setSingleEvidenceMode('upload')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          singleEvidenceMode === 'upload'
                            ? 'bg-surface-container-lowest text-primary font-bold shadow-2xs'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        Upload Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => setSingleEvidenceMode('url')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          singleEvidenceMode === 'url'
                            ? 'bg-surface-container-lowest text-primary font-bold shadow-2xs'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        Tautan Link
                      </button>
                    </div>
                  </div>

                  {singleEvidenceMode === 'upload' ? (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e)}
                        className="hidden"
                        id="single-dispute-evidence-file"
                      />

                      {compressing ? (
                        <div className="p-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 flex items-center justify-center gap-2 text-xs text-primary font-medium">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mengompresi foto secara otomatis...</span>
                        </div>
                      ) : singleCompressedData ? (
                        <div className="p-3 rounded-2xl bg-surface-container-low border border-card-border flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={singleCompressedData.previewUrl}
                              alt="Pratinjau bukti"
                              className="w-14 h-14 rounded-xl object-cover border border-card-border shrink-0 bg-surface-container-lowest"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-xs text-on-surface truncate">
                                {singleCompressedData.file.name}
                              </span>
                              <div className="flex items-center gap-2 text-[11px] font-mono mt-0.5">
                                <span className="font-bold text-primary">
                                  {formatFileSize(singleCompressedData.compressedSize)}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  Hemat {singleCompressedData.sizeReductionPercent}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveImage()}
                            className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-error transition-colors cursor-pointer shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="single-dispute-evidence-file"
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
                        value={singleEvidenceUrl}
                        onChange={(e) => setSingleEvidenceUrl(e.target.value)}
                        placeholder="https://drive.google.com/... atau tautan berkas online"
                      />
                      <p className="text-[11px] text-on-surface-variant">
                        Salin tautan dokumen atau gambar bukti dari Google Drive / Cloud Storage.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
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
              disabled={
                loading ||
                compressing ||
                (isMultiWorker && selectedWorkerIds.length === 0)
              }
              icon={<Send className="w-3.5 h-3.5" />}
            >
              {loading
                ? 'Memproses...'
                : isMultiWorker
                ? selectedWorkerIds.length === 1
                  ? `Ajukan Sengketa (${acceptedWorkers.find((w) => w.id_user === selectedWorkerIds[0])?.nama_lengkap || '1 Pekerja'})`
                  : selectedWorkerIds.length > 1
                  ? `Ajukan Sengketa (${selectedWorkerIds.length} Pekerja)`
                  : 'Pilih Pekerja Terlebih Dahulu'
                : 'Buka Mediasi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

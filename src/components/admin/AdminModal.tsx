'use client';

import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/motion/dialog';
import { Button } from '@/components/ui/Button';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  isLoading?: boolean;
}

export default function AdminModal({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmLabel = 'Simpan Perubahan',
  confirmVariant = 'primary',
  isLoading = false,
}: AdminModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth="md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <DialogBody className="min-h-[220px]">{children}</DialogBody>

        {onConfirm && (
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant={confirmVariant === 'danger' ? 'destructive' : 'primary'}
              size="sm"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : confirmLabel}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

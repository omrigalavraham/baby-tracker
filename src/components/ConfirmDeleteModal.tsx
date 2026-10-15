import React, { useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from './ui';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title = 'למחוק את הרישום?',
  description = 'הרישום יימחק מהיומן ומכל המכשירים המחוברים.',
  confirmText = 'מחיקה',
  cancelText = 'ביטול',
  onConfirm,
  onClose
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 animate-fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div className="absolute inset-0 bg-[#2A2230]/35 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative w-full max-w-sm bg-ground rounded-[32px] p-6 shadow-float text-center space-y-5 animate-toast-in safe-bottom"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-12 mx-auto rounded-full bg-danger-soft text-danger flex items-center justify-center">
          <Trash2 className="w-5 h-5" />
        </div>

        <div className="space-y-1.5">
          <h3 id="confirm-delete-title" className="text-xl font-medium text-ink">
            {title}
          </h3>
          <p className="text-[15px] text-muted leading-relaxed">{description}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="soft" size="md" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

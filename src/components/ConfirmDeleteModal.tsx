import React from 'react';
import { Trash2, AlertCircle, X } from 'lucide-react';

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
  title = 'למחוק פעולה זו מהיומן?',
  description = 'הרישום יימחק לצמיתות מהיומן ומכל המכשירים המחוברים.',
  confirmText = 'כן, מחק עכשיו',
  cancelText = 'ביטול',
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/55 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-rose-100 text-center space-y-4 animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm shadow-rose-100">
          <Trash2 className="w-8 h-8" />
        </div>

        {/* Text */}
        <div className="space-y-1.5 text-center">
          <h3 className="text-lg font-extrabold text-slate-800">
            {title}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          {/* Cancel */}
          <button
            onClick={onClose}
            className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-95"
          >
            {cancelText}
          </button>

          {/* Confirm Delete */}
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all active:scale-95 shadow-md shadow-rose-200 flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>{confirmText}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

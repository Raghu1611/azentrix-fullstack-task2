import React from 'react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', type = 'danger' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          {type === 'danger' ? '⚠️' : 'ℹ️'} {title}
        </h2>
        <p className="text-slate-400 text-sm">{message}</p>
        
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs font-semibold rounded-xl text-slate-300 transition duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition duration-200 text-white shadow-md ${
              type === 'danger' ? 'bg-red-650 hover:bg-red-700' : 'bg-blue-650 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

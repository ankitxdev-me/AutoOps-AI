'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'loading';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextProps {
  toast: {
    success: (msg: string) => string;
    error: (msg: string) => string;
    warning: (msg: string) => string;
    loading: (msg: string) => string;
    dismiss: (id: string) => void;
  };
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, message }]);

      if (type !== 'loading') {
        setTimeout(() => {
          dismiss(id);
        }, 4000);
      }
      return id;
    },
    [dismiss],
  );

  const toast = {
    success: (msg: string) => addToast('success', msg),
    error: (msg: string) => addToast('error', msg),
    warning: (msg: string) => addToast('warning', msg),
    loading: (msg: string) => addToast('loading', msg),
    dismiss,
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast list container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center justify-between p-4 rounded-2xl bg-[#111827]/90 border border-slate-800/80 backdrop-blur-xl shadow-2xl shadow-black/40 transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in"
          >
            <div className="flex items-center space-x-3">
              {t.type === 'success' && (
                <span className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  ✓
                </span>
              )}
              {t.type === 'error' && (
                <span className="w-5 h-5 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-xs">
                  ✕
                </span>
              )}
              {t.type === 'warning' && (
                <span className="w-5 h-5 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                  !
                </span>
              )}
              {t.type === 'loading' && (
                <span className="w-5 h-5 rounded-lg border-2 border-slate-800 border-t-blue-500 animate-spin flex items-center justify-center" />
              )}
              <p className="text-slate-200 text-xs font-medium">{t.message}</p>
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-slate-500 hover:text-slate-350 p-1 font-semibold text-xs ml-4"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}

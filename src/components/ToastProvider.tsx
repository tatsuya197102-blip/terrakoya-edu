'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const getIcon = (type: ToastType) => {
    if (type === 'success') return '✅';
    if (type === 'error') return '❌';
    if (type === 'warning') return '⚠️';
    return 'ℹ️';
  };

  const getColor = (type: ToastType) => {
    if (type === 'success') return 'bg-green-700 border-green-500';
    if (type === 'error') return 'bg-red-700 border-red-500';
    if (type === 'warning') return 'bg-yellow-700 border-yellow-500';
    return 'bg-blue-700 border-blue-500';
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl border text-white shadow-xl pointer-events-auto transition-all duration-300 ${getColor(toast.type)}`}>
            <span>{getIcon(toast.type)}</span>
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
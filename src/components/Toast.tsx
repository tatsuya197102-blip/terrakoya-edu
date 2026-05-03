import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg fixed bottom-4 right-4 flex items-center gap-2 z-50 animate-bounce`}>
      {type === 'success' ? '✓' : '✕'} {message}
    </div>
  );
}

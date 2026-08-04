import { useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  };

  const backgrounds = {
    success: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200 dark:border-green-700/50',
    error: 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-red-200 dark:border-red-700/50',
    info: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-700/50',
    warning: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-amber-200 dark:border-amber-700/50',
  };

  const textColors = {
    success: 'text-green-800 dark:text-green-200',
    error: 'text-red-800 dark:text-red-200',
    info: 'text-blue-800 dark:text-blue-200',
    warning: 'text-amber-800 dark:text-amber-200',
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 flex items-center gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-sm
        max-w-md min-w-[300px] transform transition-all duration-300 ease-out
        hover:scale-105 hover:shadow-2xl animate-slide-in
        ${backgrounds[type]}
      `}
    >
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${textColors[type]} break-words`}>
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        className={`
          flex-shrink-0 ml-2 p-1 rounded-lg transition-colors duration-200
          ${textColors[type]} opacity-60 hover:opacity-100
          hover:bg-white/20 dark:hover:bg-black/20
        `}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Toast container component
export function ToastContainer({ toasts, onRemove }: { toasts: any[], onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="pointer-events-auto transform transition-all duration-300"
          style={{
            animation: `slideIn 0.3s ease-out ${index * 0.1}s both`,
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => onRemove(toast.id)}
            duration={toast.duration}
          />
        </div>
      ))}
    </div>
  );
}

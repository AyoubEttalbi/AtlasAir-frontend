import { useEffect, useState } from 'react';
import './Toast.scss';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export const ToastComponent: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-close after duration
    const duration = toast.duration || 3000;
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(toast.id), 300); // Wait for fade out
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <div
      className={`toast toast-${toast.type} ${isVisible ? 'toast-visible' : ''}`}
      onClick={() => {
        setIsVisible(false);
        setTimeout(() => onClose(toast.id), 300);
      }}
    >
      <div className="toast-content">
        <span className="toast-message">{toast.message}</span>
        <button className="toast-close" aria-label="Close">×</button>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

// Toast hook for easy usage
export const useToast = () => {
  const showToast = (message: string, type: ToastType = 'info', duration?: number) => {
    const toast: Toast = {
      id: `toast-${Date.now()}-${Math.random()}`,
      message,
      type,
      duration,
    };
    toastManager.add(toast);
  };

  return {
    showSuccess: (message: string, duration?: number) => showToast(message, 'success', duration),
    showError: (message: string, duration?: number) => showToast(message, 'error', duration),
    showInfo: (message: string, duration?: number) => showToast(message, 'info', duration),
    showWarning: (message: string, duration?: number) => showToast(message, 'warning', duration),
  };
};

// Global toast manager
class ToastManager {
  private toasts: Toast[] = [];
  private listeners: Array<(toasts: Toast[]) => void> = [];

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  add(toast: Toast) {
    this.toasts = [...this.toasts, toast];
    this.notify();
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.toasts));
  }
}

export const toastManager = new ToastManager();


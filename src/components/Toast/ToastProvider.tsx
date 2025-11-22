import { useState, useEffect } from 'react';
import { ToastContainer, toastManager, Toast } from './Toast';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe((newToasts) => {
      setToasts(newToasts);
    });
    return unsubscribe;
  }, []);

  const handleClose = (id: string) => {
    toastManager.remove(id);
  };

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onClose={handleClose} />
    </>
  );
};


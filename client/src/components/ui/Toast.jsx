/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

// Global toast queue — module-level so showToast works from anywhere
let toastListeners = [];
let toastIdCounter = 0;

export const showToast = (message, type = 'success', duration = 4000) => {
  const id = ++toastIdCounter;
  toastListeners.forEach(fn => fn({ id, message, type, duration }));
  return id;
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  // Register this container as a listener using useEffect (not useState)
  useEffect(() => {
    const listener = (toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, toast.duration);
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(fn => fn !== listener);
    };
  }, []); // Only register once on mount

  const icons = {
    success: <CheckCircle size={16} className="text-emerald-400 shrink-0" />,
    error: <XCircle size={16} className="text-red-400 shrink-0" />,
    info: <Info size={16} className="text-accent-blue shrink-0" />,
  };

  const colors = {
    success: 'border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    error: 'border-red-500/30 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.15)]',
    info: 'border-accent-blue/30 bg-accent-blue/10 shadow-[0_0_20px_rgba(59,130,246,0.15)]',
  };

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.92 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-2xl font-mono text-xs text-white max-w-[320px] ${colors[toast.type] || colors.info}`}
          >
            {icons[toast.type] || icons.info}
            <span className="flex-1 leading-relaxed">{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-white/40 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

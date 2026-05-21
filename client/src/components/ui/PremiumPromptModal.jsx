import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

export const PremiumPromptModal = ({ title, placeholder, defaultValue = '', onConfirm, onClose, type = 'text' }) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef(null);

  useEffect(() => {
    // Autofocus input
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    onConfirm(value);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
      {/* Backdrop blur overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-md z-[99]"
      />

      {/* Floating Dialog Panel */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="w-full max-w-[420px] bg-surface/90 backdrop-blur-3xl border border-white/[0.08] rounded-3xl shadow-2xl z-[100] overflow-hidden relative"
      >
        {/* Subtle accent color top bar */}
        <div className="h-[3px] w-full bg-gradient-to-r from-accent-blue via-violet-500 to-accent-blue" />
        
        {/* Sparkle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-accent-blue/10 blur-3xl pointer-events-none rounded-full" />

        <header className="px-6 pt-6 pb-4 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-accent-blue/10 border border-accent-blue/20 rounded-xl">
              <Sparkles size={14} className="text-accent-blue" />
            </div>
            <h3 className="font-display font-bold text-[0.95rem] text-white tracking-tight leading-none">
              {title}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <X size={16} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="px-6 pb-6 relative z-10">
          <div className="space-y-4">
            <div className="relative">
              <input
                ref={inputRef}
                type={type}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder || "Type here..."}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] focus:border-accent-blue/40 rounded-2xl font-mono text-[0.8rem] text-white placeholder-slate-600 transition-all focus:outline-none focus:ring-1 focus:ring-accent-blue/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:text-white rounded-2xl font-mono text-[0.65rem] text-slate-400 font-bold uppercase tracking-[0.2em] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-accent-blue hover:bg-blue-600 text-white rounded-2xl font-mono text-[0.65rem] font-bold uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_12px_rgba(79,70,229,0.5)] active:scale-[0.98]"
              >
                Confirm
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

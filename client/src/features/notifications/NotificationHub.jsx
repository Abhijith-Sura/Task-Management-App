import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Info, AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const NotificationHub = ({ notifications, onClear, onClose }) => {
  return (
    <>
      {/* Backdrop blur overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
      />

      {/* Floating Side Drawer Panel */}
      <motion.div 
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 220 }}
        className="fixed top-0 right-0 h-full w-[400px] bg-surface/90 backdrop-blur-3xl border-l border-white/[0.08] shadow-2xl z-50 flex flex-col overflow-hidden"
      >
        <header className="p-6 border-b border-white/[0.03] bg-white/[0.01] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-blue/10 border border-accent-blue/20 rounded-xl shadow-glow">
              <Bell size={16} className="text-accent-blue" />
            </div>
            <div>
              <h3 className="font-display font-bold text-[0.9rem] text-white tracking-tight leading-none">Activity Notifications</h3>
              <span className="font-mono text-[0.55rem] text-slate-600 font-bold uppercase tracking-widest mt-1 inline-block">Workspace Activity</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-600 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          <AnimatePresence initial={false}>
            {notifications.map((notif, idx) => (
              <motion.div 
                key={notif._id || idx} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:border-accent-blue/30 transition-all group relative overflow-hidden"
              >
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-9 h-9 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-[0.7rem] font-bold text-accent-blue flex-shrink-0 shadow-sm">
                    {notif.user?.avatar ? (
                      <img src={notif.user.avatar} className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <User size={14} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-display font-bold text-[0.8rem] text-white leading-snug mb-1">
                       <span className="text-accent-blue">{notif.user?.name || 'System'}:</span> {notif.action}
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <div className="px-2 py-0.5 bg-white/[0.03] border border-white/[0.05] rounded-lg">
                        <span className="font-mono text-[0.55rem] text-slate-500 font-bold uppercase tracking-widest">
                          {notif.cardTitle || 'Workspace'}
                        </span>
                      </div>
                      <span className="font-mono text-[0.55rem] text-slate-600 flex items-center gap-1.5 font-bold">
                        <Clock size={10} />
                        {formatDistanceToNow(new Date(notif.createdAt)).toUpperCase()} AGO
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Subtle hover glow */}
                <div className="absolute inset-0 bg-accent-blue/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </AnimatePresence>

          {notifications.length === 0 && (
            <div className="py-20 text-center glass-panel rounded-3xl border-dashed border-white/[0.05] bg-transparent">
              <div className="relative inline-block mb-6">
                <Bell size={32} className="text-slate-800 opacity-20" />
                <div className="absolute inset-0 bg-accent-blue/5 blur-2xl rounded-full" />
              </div>
              <div className="font-display font-bold text-sm text-slate-600 tracking-tight">No Recent Activity</div>
              <p className="font-mono text-[0.55rem] text-slate-700 font-bold uppercase tracking-[0.2em] mt-2">Nothing to report yet</p>
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <footer className="p-6 border-t border-white/[0.03] bg-white/[0.01]">
            <button 
              onClick={onClear}
              className="w-full py-3.5 bg-white/[0.02] border border-white/[0.05] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 rounded-2xl font-mono text-[0.6rem] text-slate-600 font-bold uppercase tracking-[0.3em] transition-all active:scale-95"
            >
              Clear All
            </button>
          </footer>
        )}
      </motion.div>
    </>
  );
};

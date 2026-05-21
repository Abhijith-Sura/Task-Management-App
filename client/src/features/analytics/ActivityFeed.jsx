import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Terminal, Activity, Clock, User, Box, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const ActivityFeed = () => {
  const { data: activityResponse, isLoading } = useQuery({
    queryKey: ['global-activity'],
    queryFn: async () => {
      const { data } = await api.get('/auth/activity');
      return data;
    }
  });

  const activities = activityResponse?.data || [];

  if (isLoading) return <div className="p-10 font-mono text-accent-blue animate-pulse">Loading activities...</div>;

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 overflow-y-auto max-h-full scrollbar-thin">
      <header className="flex justify-between items-end border-b border-border pb-8">
        <div>
          <div className="font-mono text-accent-blue text-[0.8rem] tracking-[0.3em] uppercase mb-2">System Logs</div>
          <h1 className="text-4xl font-bold text-[#FAFAFA] tracking-tight uppercase">Activity Feed</h1>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.05] border border-border rounded-sm">
          <Activity size={16} className="text-green-500 animate-pulse" />
          <span className="font-mono text-[0.65rem] text-[#A1A1AA] uppercase tracking-widest">Live</span>
        </div>
      </header>

      <div className="bg-surface/30 border border-border rounded-sm overflow-hidden flex flex-col h-[70vh]">
        <div className="bg-white/[0.02] p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-accent-blue" />
            <span className="font-mono text-[0.65rem] text-[#FAFAFA] uppercase tracking-[0.2em]">Activity Feed</span>
          </div>
          <span className="font-mono text-[0.55rem] text-[#A1A1AA] uppercase">{activities.length} Events Logged</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {activities.length > 0 ? activities.map((log, idx) => (
            <motion.div 
              key={log._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="group flex items-start gap-6 font-mono"
            >
              <div className="text-[#3F3F46] text-[0.6rem] pt-1 whitespace-nowrap">
                [{new Date(log.createdAt).toLocaleTimeString()}]
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-accent-blue text-xs font-bold uppercase tracking-tighter">[{log.type || 'EVENT'}]</span>
                  <span className="text-[#FAFAFA] text-xs leading-relaxed group-hover:text-accent-blue transition-colors">{log.action}</span>
                </div>
                <div className="flex items-center gap-4 text-[0.6rem] text-[#A1A1AA] uppercase tracking-tight">
                  <div className="flex items-center gap-1">
                    <User size={10} />
                    {log.user?.name || 'User'}
                  </div>
                  {log.boardId && (
                    <div className="flex items-center gap-1">
                      <Box size={10} />
                      {log.boardId?.title || 'System'}
                    </div>
                  )}
                </div>
              </div>
              <ArrowRight size={14} className="text-accent-blue opacity-0 group-hover:opacity-100 transition-all mt-1" />
            </motion.div>
          )) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
              <Activity size={48} />
              <div className="font-mono text-xs uppercase tracking-[0.3em]">No activity detected yet.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

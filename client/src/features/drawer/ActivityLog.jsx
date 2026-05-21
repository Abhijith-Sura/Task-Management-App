import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Activity, Clock, User, MessageSquare, Paperclip } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const ActivityLog = ({ boardId, cardId }) => {
  const { data: activityResponse, isLoading } = useQuery({
    queryKey: cardId ? ['activity', 'card', cardId] : ['activity', 'board', boardId],
    queryFn: async () => {
      const endpoint = cardId ? `/cards/${cardId}/activity` : `/boards/${boardId}/activity`;
      const { data } = await api.get(endpoint);
      return data;
    },
    enabled: !!(boardId || cardId),
    refetchInterval: 5000, 
  });

  const activities = activityResponse?.data || [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-white/[0.05] border border-border rounded-sm" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Activity size={16} className="text-accent-blue" />
        <h3 className="font-mono text-[0.7rem] text-[#FAFAFA] uppercase tracking-[0.2em]">Activity Log</h3>
      </div>

      <div className="space-y-3 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
        {activities.map((item) => (
          <div key={item._id} className="relative pl-8 group">
            <div className={`absolute left-0 top-1 w-6 h-6 bg-background border rounded-full flex items-center justify-center z-10 group-hover:border-accent-blue transition-colors ${
              item.type === 'MOVE' ? 'border-accent-amber/50' :
              item.type === 'CREATE' ? 'border-green-500/50' :
              item.type === 'DELETE' ? 'border-red-500/50' :
              'border-border'
            }`}>
              {item.type === 'COMMENT' ? <MessageSquare size={10} className="text-[#A1A1AA]" /> :
               item.type === 'ATTACHMENT' ? <Paperclip size={10} className="text-[#A1A1AA]" /> :
               <User size={12} className="text-[#A1A1AA]" />}
            </div>
            
            <div className="bg-white/[0.02] border border-border p-3 rounded-sm group-hover:bg-white/[0.04] transition-all">
              <div className="flex justify-between items-start mb-1">
                <span className={`font-mono text-[0.65rem] font-bold uppercase ${
                  item.type === 'MOVE' ? 'text-accent-amber' :
                  item.type === 'CREATE' ? 'text-green-500' :
                  'text-[#FAFAFA]'
                }`}>
                  {item.user?.name || 'SYSTEM'}
                </span>
                <span className="flex items-center gap-1 font-mono text-[0.6rem] text-[#A1A1AA]">
                  <Clock size={10} />
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-xs text-[#A1A1AA] leading-snug">
                <span className="font-mono text-[0.55rem] opacity-50 mr-1">[{item.type}]</span>
                {item.action}
              </p>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="text-center py-8 opacity-40">
            <div className="font-mono text-[0.6rem] uppercase">No activity logged</div>
          </div>
        )}
      </div>
    </div>
  );
};

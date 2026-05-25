import React, { useMemo } from 'react';
import { User, Shield, Activity, Target, Clock, CheckCircle2, ChevronRight, Award, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { motion } from 'framer-motion';

/**
 * Renders the user profile view, displaying user statistics, recent performance,
 * and common tags/labels used in assigned tasks.
 * 
 * @component
 * @returns {JSX.Element} The rendered UserProfile component.
 */
export const UserProfile = () => {
  // Retrieve local user data as fallback
  const localUser = JSON.parse(localStorage.getItem('user') || '{}');

  const { data: profileResponse, isLoading, isError } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/profile');
      return data;
    },
    retry: false
  });

  const { data: mineResponse } = useQuery({
    queryKey: ['my-cards'],
    queryFn: async () => {
      const { data } = await api.get('/cards/mine');
      return data;
    }
  });

  const profileData = profileResponse?.data || {};
  const userData = profileData.user || localUser;
  const stats = profileData.stats || { totalTasks: 0, highPriorityTasks: 0 };
  const assignedTasks = mineResponse?.data || [];

  // Compute aggregated metrics based on user stats and assigned tasks
  const metrics = useMemo(() => {
    return {
      total: stats.totalTasks || 0,
      highPriority: stats.highPriorityTasks || 0,
      completed: assignedTasks.filter(t => t.listId?.title?.toLowerCase().includes('done')).length,
    };
  }, [stats, assignedTasks]);

  // Extract and rank the most commonly used labels from assigned tasks
  const tags = useMemo(() => {
    const labelCounts = {};
    assignedTasks.forEach(task => {
      task.labels?.forEach(label => {
        if (label.text) {
          labelCounts[label.text] = (labelCounts[label.text] || 0) + 1;
        }
      });
    });
    const sorted = Object.entries(labelCounts).sort((a, b) => b[1] - a[1]).map(e => e[0]);
    return sorted.length > 0 ? sorted.slice(0, 6) : ['N/A'];
  }, [assignedTasks]);

  const completionRate = metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0;

  if (isLoading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center h-full space-y-4">
        <Activity className="text-accent-blue animate-spin" size={48} />
        <div className="font-mono text-xs text-accent-blue animate-pulse uppercase tracking-[0.3em]">Loading Profile...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-10 flex flex-col items-center justify-center h-full space-y-4">
        <Shield className="text-red-500" size={48} />
        <div className="font-mono text-sm text-red-500 uppercase">Connection Error</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 scrollbar-thin">
      <header className="flex justify-between items-start border-b border-border pb-10">
        <div className="flex gap-8 items-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-sm bg-accent-blue/10 border-2 border-accent-blue/30 flex items-center justify-center overflow-hidden">
              {userData.avatar ? (
                <img src={userData.avatar} alt={userData.name} className="w-full h-full object-cover opacity-80" />
              ) : (
                <User size={64} className="text-accent-blue/40" />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 p-2 bg-background border border-border rounded-sm shadow-xl">
              <Award size={16} className="text-accent-amber" />
            </div>
          </div>
          
          <div>
            <div className="font-mono text-accent-blue text-[0.8rem] tracking-[0.3em] uppercase mb-1">User ID: {userData._id?.substring(0, 12).toUpperCase() || userData.id?.substring(0, 12).toUpperCase() || 'USER'}</div>
            <h1 className="text-5xl font-bold text-[#FAFAFA] tracking-tighter uppercase mb-3">{userData.name || 'Profile'}</h1>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.05] border border-border rounded-sm">
                <Shield size={14} className="text-green-500" />
                <span className="font-mono text-[0.65rem] text-[#FAFAFA] tracking-widest uppercase">Verified Account</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-accent-blue/10 border border-accent-blue/20 rounded-sm">
                <Zap size={14} className="text-accent-blue" />
                <span className="font-mono text-[0.65rem] text-accent-blue font-bold tracking-widest uppercase">Online</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-surface/50 border border-border rounded-sm text-center min-w-[140px]">
            <div className="font-mono text-[0.55rem] text-[#A1A1AA] uppercase mb-1">Productivity</div>
            <div className="text-2xl font-bold text-accent-blue">{completionRate}%</div>
          </div>
          <div className="p-4 bg-surface/50 border border-border rounded-sm text-center min-w-[140px]">
            <div className="font-mono text-[0.55rem] text-[#A1A1AA] uppercase mb-1">Total Tasks</div>
            <div className="text-2xl font-bold text-[#FAFAFA]">{metrics.total}</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-10">
        <div className="space-y-8">
          <section className="bg-surface/30 border border-border rounded-sm p-6">
            <h3 className="font-mono text-[0.7rem] text-[#FAFAFA] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Activity size={16} className="text-accent-blue" /> Performance
            </h3>
            <div className="space-y-6">
              {[
                { label: 'Assigned', value: metrics.total, percent: 100, color: 'bg-accent-blue' },
                { label: 'High Priority', value: metrics.highPriority, percent: metrics.total > 0 ? (metrics.highPriority / metrics.total) * 100 : 0, color: 'bg-red-500' },
                { label: 'Completed', value: metrics.completed, percent: metrics.total > 0 ? (metrics.completed / metrics.total) * 100 : 0, color: 'bg-green-500' }
              ].map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between font-mono text-[0.6rem] text-[#A1A1AA] mb-2 uppercase">
                    <span>{m.label}</span>
                    <span className="text-[#FAFAFA]">{m.value}</span>
                  </div>
                  <div className="h-1 bg-border rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${m.percent}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={`h-full ${m.color}`} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-surface/30 border border-border rounded-sm p-6">
            <h3 className="font-mono text-[0.7rem] text-[#FAFAFA] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Target size={16} className="text-accent-blue" /> Common Labels
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((skill, idx) => (
                <span key={idx} className="px-3 py-1 bg-white/[0.03] border border-border rounded-sm font-mono text-[0.55rem] text-[#A1A1AA] uppercase tracking-widest">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        </div>

        <div className="col-span-2 space-y-8">
          <section className="bg-surface/30 border border-border rounded-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-white/[0.02] flex justify-between items-center">
              <h3 className="font-mono text-[0.7rem] text-[#FAFAFA] uppercase tracking-[0.2em]">Assigned Tasks</h3>
              <span className="font-mono text-[0.6rem] text-accent-blue uppercase tracking-widest">{assignedTasks.length} Items</span>
            </div>
            <div className="divide-y divide-border">
              {assignedTasks.length > 0 ? assignedTasks.map((task, idx) => (
                <motion.div 
                  key={task._id} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500 animate-pulse' : 'bg-accent-blue'}`} />
                    <div>
                      <div className="font-mono text-sm text-[#FAFAFA] font-bold uppercase group-hover:text-accent-blue transition-colors">{task.title}</div>
                      <div className="font-mono text-[0.6rem] text-[#A1A1AA] uppercase tracking-tighter">List: {task.listId?.title || 'Unknown'} / ID: {task._id.substring(0, 8).toUpperCase()}</div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-[#A1A1AA] opacity-0 group-hover:opacity-100 transition-all" />
                </motion.div>
              )) : (
                <div className="p-12 text-center">
                  <Clock size={32} className="text-[#A1A1AA]/20 mx-auto mb-4" />
                  <div className="font-mono text-xs text-[#A1A1AA] uppercase tracking-widest">No tasks assigned to you.</div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

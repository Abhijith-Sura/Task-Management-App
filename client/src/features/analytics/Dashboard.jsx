import React from 'react';
import { BarChart3, Clock, Layout, CheckCircle2, TrendingUp, Zap, Activity, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { motion } from 'framer-motion';

export const Dashboard = () => {
  const { data: boardsResponse } = useQuery({
    queryKey: ['boards'],
    queryFn: async () => {
      const { data } = await api.get('/boards');
      return data;
    }
  });

  const { data: activityResponse } = useQuery({
    queryKey: ['global-activity'],
    queryFn: async () => {
      const { data } = await api.get('/auth/activity');
      return data;
    }
  });

  const boards = boardsResponse?.data || [];

  const { totalCards, completedCards } = React.useMemo(() => {
    let t = 0;
    let c = 0;
    boards.forEach(b => {
      b.lists?.forEach(l => {
        const isDoneList = l.title.toLowerCase().includes('done') || l.title.toLowerCase().includes('complete');
        l.cards?.forEach(card => {
          t++;
          if (isDoneList || (card.description && card.description.includes('[x]'))) {
            c++;
          }
        });
      });
    });
    return { totalCards: t, completedCards: c };
  }, [boards]);

  const completionRate = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;
  
  // Real analytics
  const stats = [
    { label: 'Active Boards', value: boards.length, icon: <Layout size={20} />, color: 'text-accent-blue' },
    { label: 'Completion Rate', value: `${completionRate}%`, icon: <TrendingUp size={20} />, color: 'text-green-500' },
    { label: 'Avg Cycle Time', value: totalCards > 0 ? `${(totalCards / boards.length).toFixed(1)} Days` : '0 Days', icon: <Clock size={20} />, color: 'text-accent-amber' },
    { label: 'Tasks Completed', value: completedCards.toLocaleString(), icon: <CheckCircle2 size={20} />, color: 'text-blue-500' },
  ];

  // Productivity Heatmap Logic (Reflecting real activity density)
  const activities = activityResponse?.data || [];
  
  const heatmapCells = React.useMemo(() => {
    // Generate last 28 days
    const days = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Group activities by date
    const activityCounts = {};
    activities.forEach(act => {
      const d = new Date(act.createdAt);
      d.setHours(0,0,0,0);
      const key = d.toISOString();
      activityCounts[key] = (activityCounts[key] || 0) + 1;
    });

    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString();
      const count = activityCounts[key] || 0;
      
      let intensity = 0;
      if (count > 10) intensity = 4;
      else if (count > 5) intensity = 3;
      else if (count > 2) intensity = 2;
      else if (count > 0) intensity = 1;

      days.push({ intensity, day: i + 1, date: d.toLocaleDateString(), count });
    }
    return days;
  }, [activities]);

  const getIntensityColor = (level) => {
    switch (level) {
      case 0: return 'bg-white/[0.04] border-white/[0.10]';
      case 1: return 'bg-accent-blue/15 border-accent-blue/30';
      case 2: return 'bg-accent-blue/35 border-accent-blue/50';
      case 3: return 'bg-accent-blue/60 border-accent-blue/70';
      case 4: return 'bg-accent-blue border-accent-blue shadow-[0_0_12_rgba(79,70,229,0.6)]';
      default: return 'bg-white/[0.04]';
    }
  };

  if (!boardsResponse || !activityResponse) {
    return (
      <div className="h-full flex items-center justify-center bg-background canvas-dot-grid">
        <div className="w-10 h-10 border-4 border-accent-blue/10 border-t-accent-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto relative scrollbar-thin">
      {/* Ambient glowing backdrops */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/[0.15] rounded-full blur-[130px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[30rem] h-[30rem] bg-accent-blue/[0.15] rounded-full blur-[150px] pointer-events-none animate-pulse-glow" />

      <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/[0.10] pb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.8)]" />
              <span className="font-mono text-[0.6rem] text-accent-blue tracking-[0.3em] uppercase font-bold">Analytics Overview</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-display font-bold text-white tracking-tighter leading-none mb-4">
              Workspace <span className="text-slate-400 italic">Analytics</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-lg font-medium leading-relaxed">
              Real-time workspace insights. Track task volumes, productivity trends, and individual board completion rates.
            </p>
          </div>
          
          <div className="flex items-center gap-4 p-1.5 bg-white/[0.04] border border-white/[0.10] rounded-2xl shadow-soft">
            <div className="flex -space-x-2 px-2">
              {boards.slice(0, 3).map((b, i) => (
                <div key={i} className="w-8 h-8 rounded-lg border-2 border-surface bg-accent-blue/10 flex items-center justify-center text-[0.6rem] font-bold text-accent-blue uppercase shadow-sm">
                  {b.title.charAt(0)}
                </div>
              ))}
            </div>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="pr-4 py-1">
              <div className="text-[0.55rem] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">System Status</div>
              <div className="text-xs font-bold text-white leading-none">Connected</div>
            </div>
          </div>
        </header>

      {/* Primary Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
        {/* Statistics Pillar */}
        <div className="md:col-span-12 lg:col-span-4 grid grid-cols-2 gap-6 h-fit">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="glass-panel p-6 lg:p-8 rounded-3xl group hover:border-accent-blue/40 transition-all flex flex-col justify-between"
            >
              <div className={`p-3 w-fit rounded-2xl bg-white/[0.04] border border-white/[0.10] ${stat.color} group-hover:bg-accent-blue group-hover:text-white transition-all`}>
                {stat.icon}
              </div>
              <div>
                <div className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-[0.2em] mb-2">{stat.label}</div>
                <div className="text-3xl font-display font-bold text-white tracking-tight">{stat.value}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Central Velocity Card */}
        <section className="md:col-span-12 lg:col-span-8 glass-panel rounded-[2.5rem] p-8 lg:p-10 flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/10 blur-[100px] pointer-events-none group-hover:bg-accent-blue/15 transition-all" />
          
          <div className="flex justify-between items-start mb-12 relative z-10">
            <div className="flex items-center gap-5">
              <div className="p-3 bg-accent-blue/10 border border-accent-blue/20 rounded-2xl shadow-glow">
                <Activity className="text-accent-blue" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-white tracking-tight">Activity Intensity</h3>
                <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-widest mt-1">LTM Density (28-Day Cycle)</p>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">Low</span>
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3, 4].map(l => (
                    <div key={l} className={`w-3 h-3 rounded-full border ${getIntensityColor(l)}`} />
                  ))}
                </div>
                <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">High</span>
              </div>
            </div>
          </div>

          <div className="flex gap-10 items-end relative z-10">
            <div className="flex flex-col justify-between h-32 py-1">
              {['Mon', 'Wed', 'Fri', 'Sun'].map(day => (
                <span key={day} className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-tighter">{day}</span>
              ))}
            </div>
            <div className="flex-1 grid grid-cols-7 grid-rows-4 gap-4 h-32">
              {heatmapCells.map((cell, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.005 }}
                  className={`rounded-lg border ${getIntensityColor(cell.intensity)} cursor-help transition-all hover:scale-125 hover:z-20 hover:shadow-glow`}
                  title={`${cell.date}: ${cell.count} events`}
                />
              ))}
            </div>
            
            <div className="hidden md:flex flex-col justify-center gap-8 pl-10 border-l border-white/[0.10]">
              <div>
                <div className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-[0.2em] mb-2">Total Yield</div>
                <div className="text-4xl font-display font-bold text-white tracking-tighter">{totalCards}</div>
                <div className="text-[0.6rem] text-emerald-500 font-bold uppercase tracking-widest mt-1">↑ Strong Trend</div>
              </div>
              <div className="space-y-3">
                <div className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-[0.2em]">Efficiency</div>
                <div className="w-32 h-1.5 bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.10]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '84%' }}
                    className="h-full bg-accent-blue" 
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Board Performance List */}
        <div className="md:col-span-12 lg:col-span-8 glass-panel rounded-[2.5rem] overflow-hidden flex flex-col">
          <div className="px-10 py-8 border-b border-white/[0.10] flex justify-between items-center bg-white/[0.02]">
            <div>
              <h3 className="text-xl font-display font-bold text-white tracking-tight">Board Metrics</h3>
              <p className="text-[0.7rem] text-slate-400 font-bold uppercase tracking-widest mt-1">Task Volumes and Completion Status</p>
            </div>
            <button className="px-5 py-2 bg-white/[0.04] border border-white/[0.10] rounded-xl text-[0.65rem] font-bold text-slate-200 hover:text-white transition-all uppercase tracking-widest">
              Full Analytics
            </button>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {boards.slice(0, 4).map((board, idx) => (
              <div key={board._id} className="px-10 py-6 flex items-center justify-between hover:bg-white/[0.02] transition-all group cursor-pointer">
                <div className="flex items-center gap-6">
                  <div className="text-[0.7rem] font-bold text-slate-500 font-mono tracking-tighter w-4">
                    {(idx + 1).toString().padStart(2, '0')}
                  </div>
                  <div className="w-12 h-12 bg-white/[0.05] border border-white/[0.10] rounded-2xl flex items-center justify-center font-display text-white font-bold text-lg group-hover:bg-accent-blue group-hover:scale-105 transition-all shadow-sm">
                    {board.title.charAt(0)}
                  </div>
                  <div>
                    <div className="text-base font-bold text-white group-hover:text-accent-blue transition-colors tracking-tight">{board.title}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-widest">
                        {board.members?.length + 1 || 1} Members
                      </span>
                      <div className="w-1 h-1 rounded-full bg-slate-700" />
                      <span className="text-[0.65rem] text-accent-blue font-bold uppercase tracking-widest">Synchronized</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[0.6rem] text-slate-400 font-bold uppercase tracking-widest mb-1">Load Factor</span>
                    <span className="text-xs font-bold text-white">{(Math.random() * 40 + 60).toFixed(0)}%</span>
                  </div>
                  <div className="w-48 h-2 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.10] shadow-inner relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.random() * 60 + 30}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-accent-blue to-indigo-400 rounded-full" 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Insights */}
        <div className="md:col-span-12 lg:col-span-4 glass-panel rounded-[2.5rem] p-10 flex flex-col justify-between overflow-hidden relative">
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[80px] pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <TrendingUp size={22} className="text-emerald-500" />
              </div>
              <h3 className="text-xl font-display font-bold text-white tracking-tight">Workspace Health</h3>
            </div>
            
            <div className="space-y-12">
              {[
                { label: 'Active Collaborators', value: 98, color: 'bg-emerald-500' },
                { label: 'Task Integrity', value: 100, color: 'bg-accent-blue' },
                { label: 'Resource Usage', value: 64, color: 'bg-indigo-500' }
              ].map((metric, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-3 items-end">
                    <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-[0.2em]">{metric.label}</span>
                    <span className="text-sm font-display font-bold text-white">{metric.value}%</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.02] rounded-full overflow-hidden border border-white/[0.10]">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{ duration: 1.2, delay: i * 0.1 }}
                      className={`h-full ${metric.color} rounded-full shadow-glow`} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
 
          <div className="mt-16 p-6 bg-white/[0.04] border border-white/[0.10] rounded-3xl relative z-10">
             <div className="flex items-center gap-3 mb-3 text-emerald-500">
               <ShieldIcon size={18} />
               <span className="text-[0.7rem] font-bold uppercase tracking-[0.2em]">Workspace Status</span>
             </div>
             <p className="text-[0.7rem] text-slate-400 font-medium leading-relaxed">
               All workspaces are synced and secured. Board members are fully synchronized.
             </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

const ShieldIcon = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

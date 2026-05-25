import React from 'react';
import { BarChart3, Clock, Layout, CheckCircle2, TrendingUp, Zap, Activity, Calendar, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * A static dashboard component used for marketing and demonstrations.
 * Showcases the visual style and potential data visualizations of the application.
 *
 * @returns {React.ReactElement} The rendered Demo Dashboard view
 */
export const DemoDashboard = () => {
  // Static Demo Data
  const stats = [
    { label: 'Active Projects', value: '12', icon: <Layout size={20} />, color: 'text-accent-blue' },
    { label: 'Avg Velocity', value: '84%', icon: <TrendingUp size={20} />, color: 'text-green-500' },
    { label: 'Sprint Cycle', value: '14 Days', icon: <Clock size={20} />, color: 'text-accent-amber' },
    { label: 'Tasks Resolved', value: '1,248', icon: <CheckCircle2 size={20} />, color: 'text-blue-500' },
  ];

  const heatmapCells = Array.from({ length: 28 }, (_, i) => ({
    intensity: Math.floor(Math.random() * 5),
    count: Math.floor(Math.random() * 15),
    date: `2024-05-${i + 1}`
  }));

  /**
   * Determines the tailwind class for heatmap cell intensity based on a level (0-4).
   * 
   * @param {number} level - The intensity level (0 to 4)
   * @returns {string} The corresponding tailwind class string for styling
   */
  const getIntensityColor = (level) => {
    switch (level) {
      case 0: return 'bg-white/[0.02] border-white/[0.05]';
      case 1: return 'bg-accent-blue/10 border-accent-blue/20';
      case 2: return 'bg-accent-blue/30 border-accent-blue/40';
      case 3: return 'bg-accent-blue/50 border-accent-blue/60';
      case 4: return 'bg-accent-blue border-accent-blue shadow-[0_0_10px_rgba(59,130,246,0.5)]';
      default: return 'bg-white/[0.02]';
    }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <div className="font-mono text-accent-blue text-[0.8rem] tracking-[0.3em] uppercase mb-2">Project Overview</div>
          <h1 className="text-4xl font-bold text-[#FAFAFA] tracking-tight uppercase">Dashboard Simulation</h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-accent-amber/10 border border-accent-amber/20 rounded-sm">
          <ShieldCheck size={16} className="text-accent-amber" />
          <span className="font-mono text-xs text-accent-amber font-bold tracking-widest uppercase">SANDBOX_MODE_ACTIVE</span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-surface/50 border border-border p-6 rounded-sm group hover:border-accent-blue/30 transition-all">
            <div className={`mb-4 ${stat.color} group-hover:scale-110 transition-transform`}>{stat.icon}</div>
            <div className="font-mono text-[0.6rem] text-[#A1A1AA] uppercase tracking-[0.2em] mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-[#FAFAFA]">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <section className="bg-surface/30 border border-border rounded-sm p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Activity className="text-accent-blue" size={18} />
            <h3 className="font-mono text-[0.7rem] text-[#FAFAFA] uppercase tracking-[0.2em]">Productivity Trends</h3>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map(l => (
              <div key={l} className={`w-3 h-3 rounded-[1px] border ${getIntensityColor(l)}`} />
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 grid grid-cols-7 grid-rows-4 gap-2 h-32">
            {heatmapCells.map((cell, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.01 }}
                className={`rounded-[1px] border ${getIntensityColor(cell.intensity)} cursor-help transition-all hover:border-white/40`}
                title={`${cell.count} activities logged`}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-surface/30 border border-border rounded-sm p-6 space-y-6">
          <h3 className="font-mono text-[0.7rem] text-[#FAFAFA] uppercase tracking-[0.2em]">Simulated Performance</h3>
          {[
            { label: 'Neural Sync', value: 98 },
            { label: 'Data Integrity', value: 100 },
            { label: 'User Retention', value: 74 }
          ].map((item, i) => (
            <div key={i}>
              <div className="flex justify-between font-mono text-[0.6rem] text-[#A1A1AA] mb-2 uppercase">
                <span>{item.label}</span>
                <span>{item.value}%</span>
              </div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-accent-blue" style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-sm p-8 flex flex-col items-center justify-center text-center space-y-6">
          <div className="p-4 bg-accent-blue/10 rounded-full">
            <Zap size={32} className="text-accent-blue animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2 uppercase">Experience the Full Version</h3>
            <p className="text-sm text-[#A1A1AA] font-mono leading-relaxed">This is just a simulation. Create an account to unlock real-time collaboration, infinite boards, and advanced analytics.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, Layout, Activity, ChevronRight, Play, Cpu, Globe, ArrowRight } from 'lucide-react';
import zenithLogo from '../../assets/zenith_logo.png';

/**
 * The main landing page component for the application.
 * Highlights features, provides a hero section, and offers entry points to auth and demo.
 *
 * @param {Object} props - Component props
 * @param {Function} props.onAuthClick - Callback invoked when the user clicks a login/get started button
 * @param {Function} props.onDemoClick - Callback invoked when the user clicks the demo button
 * @returns {React.ReactElement} The rendered Landing Page view
 */
export const LandingPage = ({ onAuthClick, onDemoClick }) => {
  return (
    <div className="min-h-screen bg-background text-[#FAFAFA] font-sans selection:bg-accent-blue selection:text-white overflow-x-hidden">
      {/* Dynamic Background Grid */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0,transparent_100%)]" />
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#FAFAFA 1px, transparent 1px), linear-gradient(90deg, #FAFAFA 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-10 py-8 border-b border-white/[0.05] backdrop-blur-sm bg-background/50 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm flex items-center justify-center border border-white/[0.05] overflow-hidden">
            <img src={zenithLogo} alt="Zenith Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-mono text-xl font-bold tracking-tighter uppercase">Zenith<span className="text-accent-blue">.io</span></span>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="hidden md:flex gap-8 font-mono text-[0.65rem] uppercase tracking-widest text-[#A1A1AA]">
            <a href="#features" className="hover:text-accent-blue transition-colors">Platform</a>
            <a href="#security" className="hover:text-accent-blue transition-colors">Security</a>
            <a href="#demo" className="hover:text-accent-blue transition-colors">Live Demo</a>
          </div>
          <button 
            onClick={onAuthClick}
            className="px-6 py-2 bg-white/[0.05] border border-border rounded-sm font-mono text-[0.7rem] uppercase tracking-widest hover:bg-white/[0.1] transition-all"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-10 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-blue/10 border border-accent-blue/20 rounded-full">
              <span className="flex h-2 w-2 rounded-full bg-accent-blue animate-pulse" />
              <span className="font-mono text-[0.6rem] text-accent-blue uppercase tracking-[0.2em] font-bold">Platform Online</span>
            </div>
            
            <h1 className="text-7xl font-bold tracking-tighter leading-[0.9]">
              Next-Gen <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue via-blue-400 to-indigo-500">Project <br /> Workspace.</span>
            </h1>
            
            <p className="text-[#A1A1AA] text-lg max-w-md font-mono leading-relaxed">
              Orchestrate complex workflows with high-density utility interfaces, real-time activity, and advanced relational workspace hierarchies.
            </p>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={onAuthClick}
                className="group px-8 py-4 bg-accent-blue text-white font-mono text-sm font-bold rounded-sm flex items-center gap-3 hover:bg-blue-600 transition-all uppercase tracking-widest shadow-2xl shadow-accent-blue/20"
              >
                Start Projects
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={onDemoClick}
                className="px-8 py-4 bg-white/[0.05] border border-border text-[#FAFAFA] font-mono text-sm font-bold rounded-sm flex items-center gap-3 hover:bg-white/[0.1] transition-all uppercase tracking-widest"
              >
                View Demo
                <Play size={16} />
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            {/* Mockup UI */}
            <div className="relative bg-surface border border-border rounded-sm shadow-[0_0_100px_-20px_rgba(59,130,246,0.3)] overflow-hidden">
              <div className="flex items-center gap-1.5 p-3 border-b border-border bg-white/[0.02]">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-accent-amber/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                <div className="ml-4 h-4 w-32 bg-white/[0.05] rounded-full" />
              </div>
              <div className="p-8 aspect-video flex gap-4">
                <div className="w-1/3 space-y-4">
                  <div className="h-20 bg-accent-blue/10 border border-accent-blue/20 rounded-sm animate-pulse" />
                  <div className="h-32 bg-white/[0.05] border border-border rounded-sm" />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="h-8 bg-white/[0.05] w-1/2 rounded-sm" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-40 bg-white/[0.03] border border-border rounded-sm" />
                    <div className="h-40 bg-white/[0.03] border border-border rounded-sm" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Stats */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-10 -right-10 p-6 bg-surface/80 border border-border backdrop-blur-md rounded-sm space-y-2 shadow-2xl"
            >
              <div className="font-mono text-[0.5rem] text-accent-blue uppercase tracking-widest">Task Velocity</div>
              <div className="text-xl font-bold">12.8 GB/s</div>
              <div className="h-1 w-20 bg-border rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-accent-blue" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-32 px-10 border-t border-white/[0.05] bg-white/[0.01]">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <div className="font-mono text-accent-blue text-xs uppercase tracking-[0.4em]">Product Modules</div>
            <h2 className="text-5xl font-bold tracking-tight">The Central Network of Productivity.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Layout />, title: "Relational Workspaces", desc: "Organize infinite projects into a logical, hierarchical structure with deep board links." },
              { icon: <Globe />, title: "Real-time Collaboration", desc: "Instant synchronization across all connected devices using high-performance socket layers." },
              { icon: <Cpu />, title: "Advanced Analytics", desc: "Visualize task velocity, impact metrics, and user efficiency with automated reporting." },
              { icon: <Activity />, title: "High-Density UI", desc: "Minimalist, pixel-perfect interface designed for speed, clarity, and information density." },
              { icon: <Shield />, title: "Enterprise Security", desc: "Industry-standard encryption and access controls to keep your mission-critical data isolated." },
              { icon: <ChevronRight />, title: "Command Interface", desc: "Universal search and quick-action palette (Ctrl+K) for navigating at the speed of thought." }
            ].map((f, i) => (
              <div key={i} className="p-8 bg-surface/50 border border-border rounded-sm hover:border-accent-blue/30 transition-all group">
                <div className="p-3 bg-accent-blue/10 border border-accent-blue/20 rounded-sm w-fit mb-6 text-accent-blue group-hover:bg-accent-blue group-hover:text-white transition-all">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 uppercase font-mono tracking-tighter">{f.title}</h3>
                <p className="text-[#A1A1AA] text-sm leading-relaxed font-mono opacity-80">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="relative z-10 py-32 px-10 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <h2 className="text-6xl font-bold tracking-tight uppercase">Ready to <span className="text-accent-blue italic">Get Started</span>?</h2>
          <p className="text-[#A1A1AA] text-lg font-mono">Join the thousands of users managing their most complex projects.</p>
          <button 
            onClick={onAuthClick}
            className="group px-12 py-6 bg-[#FAFAFA] text-background font-mono text-lg font-bold rounded-sm flex items-center gap-4 hover:bg-accent-blue hover:text-white transition-all mx-auto uppercase tracking-widest shadow-2xl"
          >
            Get Started
            <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </footer>
    </div>
  );
};

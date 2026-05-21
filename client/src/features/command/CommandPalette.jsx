import React, { useState, useEffect, useRef } from 'react';
import { Search, Layout, Activity, HardDrive, Settings, Hash, FileText, ChevronRight, Loader2, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

export const CommandPalette = ({ isOpen, onClose, boards, onViewChange, onBoardSelect }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Card Search Query
  const { data: cardResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['global-search', query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const { data } = await api.get(`/cards/search?q=${query}`);
      return data.data || [];
    },
    enabled: query.length >= 2,
  });

  // Command categories
  const commands = [
    { id: 'view-board', label: 'View Boards', icon: <Layout size={16} />, action: () => onViewChange('board') },
    { id: 'view-dashboard', label: 'Analytics Dashboard', icon: <Activity size={16} />, action: () => onViewChange('dashboard') },
    { id: 'view-assets', label: 'File Manager', icon: <HardDrive size={16} />, action: () => onViewChange('assets') },
    { id: 'view-settings', label: 'Account Settings', icon: <Settings size={16} />, action: () => onViewChange('settings') },
  ];

  const filteredBoards = boards.filter(b => b.title.toLowerCase().includes(query.toLowerCase()));
  
  // Combine all searchable items
  const results = [
    ...commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase())),
    ...filteredBoards.map(b => ({
      id: `board-${b._id}`,
      label: b.title,
      sublabel: `Board | ${b.category || 'General'}`,
      icon: <Hash size={16} className="text-accent-blue" />,
      action: () => {
        onBoardSelect(b._id);
        onViewChange('board');
      }
    })),
    ...cardResults.map(c => ({
      id: `card-${c._id}`,
      label: c.title,
      sublabel: `Task | ${c.listTitle || 'Unknown'}`,
      icon: <FileText size={16} className="text-accent-amber" />,
      action: () => {
        onBoardSelect(c.boardId);
        onViewChange('board');
        // Note: Adding a way to auto-open the drawer would be a great follow-up
      }
    }))
  ];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          results[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, results]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-start justify-center pt-[18vh] px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/40 backdrop-blur-2xl"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: -20 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative w-full max-w-2xl glass-panel rounded-[2rem] overflow-hidden shadow-2xl border border-white/[0.05]"
      >
        {/* Search Header */}
        <div className="flex items-center p-6 border-b border-white/[0.03] gap-5 bg-white/[0.01]">
          {isSearching ? (
            <Loader2 size={22} className="text-accent-blue animate-spin" />
          ) : (
            <div className="p-2.5 bg-accent-blue/10 border border-accent-blue/20 rounded-xl shadow-glow">
              <Search className="text-accent-blue" size={20} />
            </div>
          )}
          <input 
            ref={inputRef}
            type="text"
            placeholder="Search Boards, Cards, or Commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none font-display font-bold text-lg text-white placeholder-slate-700 tracking-tight"
          />
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] border border-white/[0.05] rounded-xl font-mono text-[0.6rem] text-slate-500 font-bold tracking-widest">
            <span className="text-slate-400">ESC</span>
            <span className="opacity-30">/</span>
            <span>Close</span>
          </div>
        </div>

        {/* Results Area */}
        <div className="max-h-[45vh] overflow-y-auto scrollbar-none p-3">
          {results.length > 0 ? (
            <div className="space-y-1">
              {results.map((result, idx) => (
                <motion.div
                  key={result.id}
                  initial={false}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => {
                    result.action();
                    onClose();
                  }}
                  className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all relative overflow-hidden ${
                    idx === selectedIndex 
                      ? 'bg-accent-blue/10 border border-accent-blue/20' 
                      : 'hover:bg-white/[0.02] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <div className={`p-3 rounded-xl transition-all ${
                      idx === selectedIndex 
                        ? 'bg-accent-blue text-white shadow-glow' 
                        : 'bg-white/[0.03] text-slate-500'
                    }`}>
                      {result.icon}
                    </div>
                    <div>
                      <div className={`font-display font-bold text-[0.95rem] tracking-tight ${idx === selectedIndex ? 'text-white' : 'text-slate-400'}`}>
                        {result.label}
                      </div>
                      {result.sublabel && (
                        <div className="font-mono text-[0.6rem] text-slate-600 font-bold uppercase tracking-[0.2em] mt-1">
                          {result.sublabel}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {idx === selectedIndex && (
                    <div className="flex items-center gap-3 font-mono text-[0.6rem] text-accent-blue font-bold tracking-widest relative z-10">
                      <span className="animate-pulse">Select</span>
                      <ChevronRight size={14} />
                    </div>
                  )}
                  
                  {idx === selectedIndex && (
                    <motion.div 
                      layoutId="cmd-active"
                      className="absolute inset-0 bg-accent-blue/[0.02] z-0" 
                    />
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="relative inline-block mb-6">
                <Search size={48} className="text-slate-800 opacity-20" />
                <div className="absolute inset-0 bg-accent-blue/10 blur-2xl rounded-full" />
              </div>
              <div className="font-display font-bold text-lg text-slate-600 tracking-tight">No Results Found</div>
              <p className="font-mono text-[0.65rem] text-slate-700 font-bold uppercase tracking-[0.3em] mt-3 leading-relaxed">
                Refine your query to search for boards, <br/> tasks, or custom commands.
              </p>
            </div>
          )}
        </div>

        {/* Premium Footer */}
        <footer className="p-5 border-t border-white/[0.03] bg-white/[0.01] flex justify-between items-center px-8">
          <div className="flex gap-10">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <span className="px-1.5 py-0.5 bg-white/[0.03] border border-white/[0.05] rounded-lg font-mono text-[0.6rem] text-slate-500 font-bold">↑</span>
                <span className="px-1.5 py-0.5 bg-white/[0.03] border border-white/[0.05] rounded-lg font-mono text-[0.6rem] text-slate-500 font-bold">↓</span>
              </div>
              <span className="font-mono text-[0.6rem] text-slate-600 font-bold uppercase tracking-widest">Navigate</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-white/[0.03] border border-white/[0.05] rounded-lg font-mono text-[0.6rem] text-slate-500 font-bold tracking-tighter">RETURN</span>
              <span className="font-mono text-[0.6rem] text-slate-600 font-bold uppercase tracking-widest">Open</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-pulse shadow-glow" />
             <div className="font-mono text-[0.6rem] text-accent-blue uppercase tracking-[0.3em] font-bold">
               Workspace Search <span className="text-slate-600">v1.0.0</span>
             </div>
          </div>
        </footer>
      </motion.div>
    </div>
  );
};

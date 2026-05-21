import React, { useState, useMemo } from 'react';
import { FileText, Image as ImageIcon, File, Search, ExternalLink, Download, Filter, Trash2, HardDrive, Layers } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { motion } from 'framer-motion';

export const AssetManager = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'image', 'document', 'other'

  const { data: assetsResponse, isLoading } = useQuery({
    queryKey: ['user-assets'],
    queryFn: async () => {
      const { data } = await api.get('/users/assets');
      return data;
    }
  });

  const allAssets = assetsResponse?.data || [];

  const filteredAssets = allAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         asset.cardTitle.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'image') return matchesSearch && asset.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    if (filterType === 'document') return matchesSearch && asset.name.match(/\.(pdf|doc|docx|txt)$/i);
    return matchesSearch;
  });

  const getFileIcon = (filename) => {
    if (filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return <ImageIcon size={20} className="text-accent-blue" />;
    if (filename.match(/\.(pdf|doc|docx|txt)$/i)) return <FileText size={20} className="text-accent-amber" />;
    return <File size={20} className="text-[#A1A1AA]" />;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background canvas-dot-grid">
        <div className="w-10 h-10 border-4 border-accent-blue/10 border-t-accent-blue rounded-full animate-spin" />
      </div>
    );
  }

  const totalStorageUsed = allAssets.reduce((acc, curr) => acc + (curr.size || 0), 0);
  const storageLimit = 5 * 1024 * 1024 * 1024; // 5GB Mock Limit
  const storagePercent = (totalStorageUsed / storageLimit) * 100;

  return (
    <div className="h-full overflow-y-auto relative p-12 max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 scrollbar-thin">
      {/* Ambient glowing backdrops */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-blue/[0.15] rounded-full blur-[130px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[30rem] h-[30rem] bg-indigo-500/[0.12] rounded-full blur-[150px] pointer-events-none animate-pulse-glow" />

      <div className="relative z-10 space-y-12">
        <header className="flex justify-between items-end border-b border-white/[0.10] pb-10">
          <div>
            <div className="text-accent-blue text-[0.7rem] font-bold tracking-[0.2em] uppercase mb-3">Workspace Files</div>
            <h1 className="text-5xl font-display font-bold text-white tracking-tight">File Manager</h1>
          </div>
          
          <div className="w-72 space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[0.6rem] font-bold text-slate-500 uppercase tracking-widest">Storage Used</span>
              <span className="text-xs font-display font-bold text-white">{formatSize(totalStorageUsed)} of 5GB</span>
            </div>
            <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.10]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${storagePercent}%` }}
                className="h-full bg-gradient-to-r from-accent-blue to-indigo-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.4)]" 
              />
            </div>
          </div>
        </header>

      {/* Toolbar */}
      <div className="flex gap-6 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent-blue transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search within files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.12] rounded-xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-accent-blue/40 focus:ring-4 focus:ring-accent-blue/5 transition-all placeholder:text-slate-500"
          />
        </div>
        
        <div className="flex bg-white/[0.04] border border-white/[0.12] p-1 rounded-xl">
          {[
            { id: 'all', label: 'All Files' },
            { id: 'image', label: 'Images' },
            { id: 'document', label: 'Documents' }
          ].map(type => (
            <button 
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={`px-6 py-2 text-[0.7rem] font-bold uppercase tracking-wider rounded-lg transition-all ${
                filterType === type.id 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredAssets.map((asset, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-surface border border-white/[0.12] rounded-2xl overflow-hidden group hover:border-accent-blue/55 transition-all flex flex-col shadow-sm hover:shadow-soft"
          >
            <div className="aspect-[4/3] bg-background flex items-center justify-center relative overflow-hidden">
              {asset.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img 
                  src={`http://localhost:5000${asset.url}`} 
                  alt={asset.name}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-20 h-20 bg-white/[0.04] border border-white/[0.10] rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-accent-blue transition-colors">
                  {getFileIcon(asset.name)}
                </div>
              )}
              
              <div className="absolute inset-0 bg-background/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                <a 
                  href={`http://localhost:5000${asset.url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-accent-blue text-white rounded-xl hover:bg-indigo-600 transition-all shadow-lg shadow-accent-blue/20 active:scale-90"
                  title="Open in new tab"
                >
                  <ExternalLink size={20} />
                </a>
                <a 
                  href={`http://localhost:5000${asset.url}`} 
                  download
                  className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all active:scale-90"
                  title="Download File"
                >
                  <Download size={20} />
                </a>
              </div>
            </div>

            <div className="p-6 space-y-4 flex-1">
              <div>
                <div className="text-sm font-bold text-white truncate mb-1.5 group-hover:text-accent-blue transition-colors">{asset.name}</div>
                <div className="flex justify-between items-center text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">
                  <span>{formatSize(asset.size)}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 bg-slate-600 rounded-full" />
                    <span>{new Date(asset.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.10] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-accent-blue transition-colors">
                  <Layers size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Linked Task</div>
                  <div className="text-[0.65rem] font-bold text-slate-300 truncate tracking-tight">{asset.boardTitle} / {asset.cardTitle}</div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredAssets.length === 0 && !isLoading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-32 bg-white/[0.02] border-2 border-dashed border-white/[0.10] rounded-2xl flex flex-col items-center justify-center space-y-6"
        >
          <div className="w-20 h-20 bg-white/[0.04] rounded-2xl flex items-center justify-center text-slate-500">
            <HardDrive size={40} />
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">No Files Found</div>
            <p className="text-[0.7rem] text-slate-600 font-medium">Upload files inside tasks to see them here.</p>
          </div>
        </motion.div>
      )}
      </div>
    </div>
  );
};

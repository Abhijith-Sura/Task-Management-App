import React, { useState, useMemo } from 'react';
import { Box, Layers, ArrowRight, Plus, Activity, Layout, Terminal, Shield, Trash2, Edit3, MoreVertical, Hash } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const BOARD_TEMPLATES = [
  {
    id: "software-kanban",
    title: "Software Kanban",
    description: "Ideal for product development, sprint iterations, and engineering teams chasing continuous delivery.",
    category: "Engineering",
    icon: "💻",
    lists: ["Product Backlog", "In Development", "Code Review / QA", "Production Release"]
  },
  {
    id: "product-launch",
    title: "Product Launch Roadmap",
    description: "Launch your new product flawlessly! Map out design briefs, marketing campaigns, and warmup milestones.",
    category: "Marketing",
    icon: "🚀",
    lists: ["Research & Design Briefs", "Content Prep & Marketing", "Launch Prep & Warmup", "Live Monitoring"]
  },
  {
    id: "scrum-sprint",
    title: "Agile Scrum Sprint Tracker",
    description: "Keep sprint backlogs organized. Perfect for Scrum poker planning, active sprint targets, and retrospective logs.",
    category: "Management",
    icon: "🔄",
    lists: ["Sprint Planning Backlog", "Active Sprint Tasks", "Testing & Code Review", "Retrospective Analysis"]
  }
];

export const WorkspaceHub = ({ onBoardSelect, onViewChange, onCreateBoard }) => {
  const queryClient = useQueryClient();
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  // Board Templates Selector States
  const [activeWorkspaceIdForTemplate, setActiveWorkspaceIdForTemplate] = useState(null);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardCategory, setNewBoardCategory] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  const { data: workspacesResponse, isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data } = await api.get('/workspaces');
      return data;
    }
  });

  const { data: boardsResponse, isLoading: isLoadingBoards } = useQuery({
    queryKey: ['boards'],
    queryFn: async () => {
      const { data } = await api.get('/boards');
      return data;
    }
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: async (name) => {
      const { data } = await api.post('/workspaces', { name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workspaces']);
      setIsCreatingWorkspace(false);
      setNewWorkspaceName('');
    }
  });

  const deleteBoardMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/boards/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries(['boards'])
  });

  const renameBoardMutation = useMutation({
    mutationFn: async ({ id, title, category }) => {
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (category !== undefined) updateData.category = category;
      await api.put(`/boards/${id}`, updateData);
    },
    onSuccess: () => queryClient.invalidateQueries(['boards'])
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/workspaces/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries(['workspaces'])
  });

  const renameWorkspaceMutation = useMutation({
    mutationFn: async ({ id, name }) => {
      await api.put(`/workspaces/${id}`, { name });
    },
    onSuccess: () => queryClient.invalidateQueries(['workspaces'])
  });

  const workspaces = workspacesResponse?.data || [];
  const boards = boardsResponse?.data || [];

  const groupedWorkspaces = useMemo(() => {
    return workspaces.map(ws => {
      const wsBoards = boards.filter(b => (b.workspaceId?._id || b.workspaceId) === ws._id);
      const categories = wsBoards.reduce((acc, board) => {
        const cat = board.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(board);
        return acc;
      }, {});
      return { ...ws, categories, totalBoards: wsBoards.length };
    });
  }, [workspaces, boards]);

  if (isLoadingWorkspaces || isLoadingBoards) {
    return (
      <div className="h-full flex items-center justify-center bg-background canvas-dot-grid">
        <div className="w-10 h-10 border-4 border-accent-blue/10 border-t-accent-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8 lg:p-12 max-w-7xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32 scrollbar-thin">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-white/[0.03] pb-12">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse shadow-glow" />
            <span className="font-mono text-[0.6rem] text-accent-blue tracking-[0.3em] uppercase font-bold">Workspaces</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-display font-bold text-white tracking-tighter leading-none">
            Your <span className="text-slate-500 italic">Workspaces</span>
          </h1>
          <p className="text-sm text-slate-500 max-w-lg font-medium leading-relaxed mt-4">
            Create and manage your professional workspaces, boards, and tasks. Collaborate with your team members in real-time.
          </p>
        </div>
        <button 
          onClick={() => setIsCreatingWorkspace(true)}
          className="px-8 py-4 bg-accent-blue text-white text-[0.7rem] font-bold rounded-2xl flex items-center gap-3 hover:bg-indigo-500 transition-all shadow-glow active:scale-95 uppercase tracking-[0.2em]"
        >
          <Plus size={20} />
          Create Workspace
        </button>
      </header>

      {/* Create Workspace Modal Overlay */}
      <AnimatePresence>
        {isCreatingWorkspace && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="p-10 glass-panel rounded-[2.5rem] flex flex-col sm:flex-row items-end gap-6 shadow-2xl relative z-30"
          >
            <div className="flex-1 w-full">
              <label className="block text-[0.6rem] font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">Workspace Name</label>
              <input 
                type="text"
                autoFocus
                placeholder="e.g. Personal, Engineering, Marketing..."
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl py-4 px-6 text-base font-bold text-white focus:outline-none focus:border-accent-blue/50 transition-all placeholder-slate-700 font-display"
              />
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => createWorkspaceMutation.mutate(newWorkspaceName)}
                className="px-8 py-4 bg-accent-blue text-white text-[0.7rem] font-bold rounded-2xl uppercase tracking-[0.2em] shadow-glow hover:bg-indigo-500 transition-all"
              >
                Confirm
              </button>
              <button 
                onClick={() => setIsCreatingWorkspace(false)}
                className="px-6 py-4 bg-white/[0.02] border border-white/[0.05] text-slate-500 font-bold text-[0.7rem] uppercase tracking-[0.2em] hover:text-white transition-all rounded-2xl"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-24">
        {groupedWorkspaces.map((ws, idx) => {
          const wsOwnerId = ws.owner?._id || ws.owner || '';
          const currentUserId = currentUser._id || currentUser.id || '';
          const isOwner = currentUserId && wsOwnerId && wsOwnerId.toString() === currentUserId.toString();
          const memberInfo = ws.members?.find(m => {
            const mId = m.user?._id || m.user || '';
            return mId && mId.toString() === currentUserId.toString();
          });
          const isAdmin = isOwner || memberInfo?.role === 'admin';
          const canCreateBoard = isOwner || memberInfo?.role === 'admin' || memberInfo?.role === 'editor';

          return (
            <motion.div
              key={ws._id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1, duration: 0.8 }}
            className="space-y-10"
          >
               {/* Workspace Header - High Fidelity */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center glass-panel p-8 lg:p-10 rounded-[3rem] border border-white/[0.12] hover:border-white/[0.20] transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-accent-blue/[0.08] blur-[100px] pointer-events-none" />
              
              <div className="flex items-center gap-10 relative z-10">
                <div className="w-20 h-20 bg-accent-blue/5 rounded-[2rem] flex items-center justify-center border border-accent-blue/15 shadow-inner group-hover:scale-105 transition-all">
                  <Box className="text-accent-blue" size={36} />
                </div>
                <div>
                  <h3 className="text-3xl lg:text-5xl font-display font-bold text-white tracking-tighter group-hover:text-accent-blue transition-colors">{ws.name}</h3>
                  <div className="flex flex-wrap gap-6 mt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-white/[0.05] rounded-lg">
                        <Layers size={14} className="text-slate-400" />
                      </div>
                      <span className="font-mono text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">{ws.totalBoards.toString().padStart(2, '0')} Boards</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                      <span className="font-mono text-[0.6rem] text-emerald-500/80 font-bold uppercase tracking-[0.2em]">Connected</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-8 lg:mt-0 relative z-10">
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          if (window.showPremiumPrompt) {
                            window.showPremiumPrompt(
                              "Rename Workspace",
                              "Enter new workspace name...",
                              ws.name,
                              (name) => {
                                if (name.trim()) renameWorkspaceMutation.mutate({ id: ws._id, name: name.trim() });
                              }
                            );
                          } else {
                            const name = prompt("Rename workspace:", ws.name);
                            if (name) renameWorkspaceMutation.mutate({ id: ws._id, name });
                          }
                        }}
                        className="p-3 bg-white/[0.04] border border-white/[0.12] hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm(`Terminate workspace "${ws.name}"?`)) deleteWorkspaceMutation.mutate(ws._id);
                        }}
                        className="p-3 bg-white/[0.04] border border-white/[0.12] hover:bg-red-500/10 rounded-2xl text-slate-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                  {isAdmin && canCreateBoard && <div className="w-[1px] h-10 bg-white/10 mx-2" />}
                  {canCreateBoard && (
                    <button 
                      onClick={() => {
                        if (window.showPremiumPrompt) {
                          window.showPremiumPrompt(
                            "New Board",
                            `New board name for ${ws.name}...`,
                            "",
                            (title) => {
                              if (title.trim()) {
                                window.showPremiumPrompt(
                                  "Board Category",
                                  "Category (optional):",
                                  "General",
                                  (category) => {
                                    onCreateBoard({ 
                                      title: title.trim(), 
                                      workspaceId: ws._id, 
                                      category: category.trim() || "General" 
                                    });
                                  }
                                );
                              }
                            }
                          );
                        } else {
                          const title = prompt(`New board name for ${ws.name}:`);
                          const category = prompt(`Category (optional):`, "General");
                          if (title) onCreateBoard({ title, workspaceId: ws._id, category });
                        }
                      }}
                      className="px-8 py-3.5 bg-accent-blue text-white text-[0.65rem] font-bold rounded-2xl uppercase tracking-[0.2em] transition-all shadow-glow flex items-center gap-3 hover:bg-indigo-500"
                    >
                      <Plus size={18} /> Create Board
                    </button>
                  )}
              </div>
            </div>
 
            {/* Board Categories & Boards */}
            <div className="space-y-16 px-4">
              {Object.entries(ws.categories).map(([category, boards]) => (
                <div key={category} className="space-y-8">
                  <div className="flex items-center gap-6">
                    <h4 className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-[0.4em] font-mono whitespace-nowrap">{category} Boards</h4>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-white/[0.15] to-transparent" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {boards.map(board => (
                      <motion.div 
                        key={board._id}
                        whileHover={{ y: -8, scale: 1.02 }}
                        onClick={() => {
                          onBoardSelect(board._id);
                          onViewChange('board');
                        }}
                        className="group relative p-8 glass-panel rounded-[2rem] border border-white/[0.10] hover:border-accent-blue/50 transition-all shadow-sm hover:shadow-glow cursor-pointer overflow-hidden flex flex-col justify-between min-h-[260px]"
                      >
                        {/* Dimensional Glow */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent-blue/[0.08] blur-[80px] group-hover:bg-accent-blue/15 transition-all duration-700" />
                        
                        <div>
                          <div className="flex justify-between items-start mb-8">
                            <div className="p-3 bg-white/[0.04] border border-white/[0.12] rounded-xl text-slate-400 group-hover:text-accent-blue group-hover:scale-110 transition-all">
                              <Hash size={20} />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0" onClick={e => e.stopPropagation()}>
                              <button 
                                onClick={() => {
                                  if (window.showPremiumPrompt) {
                                    window.showPremiumPrompt(
                                      "Recalibrate Class",
                                      "Enter new board category...",
                                      board.category || "General",
                                      (newCat) => {
                                        if (newCat !== null) {
                                          renameBoardMutation.mutate({ id: board._id, category: newCat.trim() || "General" });
                                        }
                                      }
                                    );
                                  } else {
                                    const newCat = prompt("Recalibrate Class:", board.category);
                                    if (newCat) renameBoardMutation.mutate({ id: board._id, category: newCat });
                                  }
                                }}
                                className="p-2 bg-white/[0.04] border border-white/[0.12] hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                              >
                                <Layers size={16} />
                              </button>
                            </div>
                          </div>
 
                          <h5 className="text-2xl font-display font-bold text-white group-hover:text-accent-blue transition-colors leading-tight mb-2">
                            {board.title}
                          </h5>
                          <div className="font-mono text-[0.6rem] text-slate-400 font-bold uppercase tracking-[0.2em]">Board ID: {board._id.slice(-8).toUpperCase()}</div>
                        </div>
                        
                        <div className="flex justify-between items-center border-t border-white/[0.08] pt-8">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/12 flex items-center justify-center text-[0.7rem] font-display font-bold text-accent-blue shadow-inner">
                               {ws.owner?.name?.charAt(0) || 'O'}
                             </div>
                             <div className="flex flex-col">
                               <span className="font-mono text-[0.55rem] text-slate-400 font-bold uppercase tracking-widest leading-none">Role</span>
                               <span className="text-[0.65rem] font-bold text-white mt-1">Owner</span>
                             </div>
                          </div>
                          <div className="p-2.5 bg-accent-blue/5 rounded-xl group-hover:bg-accent-blue group-hover:text-white transition-all">
                            <ArrowRight size={18} className="opacity-40 group-hover:opacity-100" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>   </div>
              ))}`
            </div>

              {ws.totalBoards === 0 && (
                <div className="py-24 glass-panel rounded-[3rem] border border-dashed border-white/[0.05] flex flex-col lg:flex-row items-center justify-between gap-12 px-16 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-accent-blue/[0.01] pointer-events-none" />
                  
                  <div className="flex flex-col items-start gap-8 relative z-10 max-w-md">
                    <div className="p-4 bg-accent-blue/10 border border-accent-blue/20 rounded-2xl">
                      <Terminal size={32} className="text-accent-blue" />
                    </div>
                    <div>
                      <h4 className="text-3xl font-display font-bold text-white tracking-tight mb-4">No Boards Yet</h4>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">
                        Create a board to start managing your projects, lists, and tasks.
                      </p>
                    </div>
                    {canCreateBoard && (
                      <button 
                        onClick={() => {
                          setActiveWorkspaceIdForTemplate(ws._id);
                          setNewBoardTitle('');
                          setNewBoardCategory('General');
                          setSelectedTemplateId(null);
                        }}
                        className="px-10 py-4 bg-accent-blue text-white text-[0.7rem] font-bold rounded-2xl transition-all shadow-glow hover:bg-indigo-500 uppercase tracking-[0.2em]"
                      >
                        + Create Board
                      </button>
                    )}
                  </div>
                  
                  <div className="relative group-hover:scale-105 transition-transform duration-1000">
                    <div className="absolute inset-0 bg-accent-blue/20 blur-[100px] rounded-full" />
                    <img 
                      src="/empty_state_workspace.png" 
                      alt="Empty State Asset" 
                      className="w-[450px] relative z-10 drop-shadow-[0_0_30px_rgba(79,70,229,0.3)] opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              )}
          </motion.div>
        )})}
      </div>

      <AnimatePresence>
        {activeWorkspaceIdForTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0E0E11]/90 border border-white/[0.05] rounded-3xl w-full max-w-4xl p-8 relative shadow-2xl glass-panel"
            >
              <div className="flex items-center justify-between mb-8 border-b border-white/[0.05] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider font-mono">Create New Project Board</h3>
                  <p className="text-xs text-slate-500 mt-1">Select a premium pre-defined enterprise template or start fresh from scratch.</p>
                </div>
                <button
                  onClick={() => setActiveWorkspaceIdForTemplate(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-white/[0.05] text-slate-500 hover:text-white transition-all text-xs font-mono font-bold uppercase tracking-wider"
                >
                  Close
                </button>
              </div>

              <div className="space-y-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="font-mono text-[0.6rem] text-slate-400 uppercase tracking-widest font-bold">Board Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Q3 Sprint Backlog..."
                      value={newBoardTitle}
                      onChange={(e) => setNewBoardTitle(e.target.value)}
                      className="bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-3.5 text-xs text-white focus:outline-none focus:border-accent-blue transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-mono text-[0.6rem] text-slate-400 uppercase tracking-widest font-bold">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Engineering, Marketing..."
                      value={newBoardCategory}
                      onChange={(e) => setNewBoardCategory(e.target.value)}
                      className="bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-3.5 text-xs text-white focus:outline-none focus:border-accent-blue transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="font-mono text-[0.6rem] text-slate-400 uppercase tracking-widest font-bold">Choose a Workspace Structure Template</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Blank Board Card */}
                    <div
                      onClick={() => setSelectedTemplateId(null)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between h-40 ${
                        selectedTemplateId === null
                          ? 'border-accent-blue bg-accent-blue/10 shadow-glow'
                          : 'border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📝</span>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Blank Slate Board</h4>
                        </div>
                        <p className="text-[0.65rem] text-slate-500 mt-2.5 leading-relaxed">
                          Clean slate. Create custom lists, automation rules, and card categories by hand.
                        </p>
                      </div>
                      <span className="font-mono text-[0.55rem] text-slate-600 font-bold uppercase tracking-wider">Start Blank</span>
                    </div>

                    {/* Pre-defined templates loops */}
                    {BOARD_TEMPLATES.map(t => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedTemplateId(t.id);
                          if (!newBoardTitle) {
                            setNewBoardTitle(t.title);
                          }
                          setNewBoardCategory(t.category);
                        }}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between h-44 ${
                          selectedTemplateId === t.id
                            ? 'border-accent-blue bg-accent-blue/10 shadow-glow'
                            : 'border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="text-2xl">{t.icon}</span>
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">{t.title}</h4>
                            </div>
                            <span className="px-2 py-0.5 rounded-full border border-white/[0.05] text-[#FAFAFA] font-mono text-[0.5rem] uppercase tracking-wider">{t.category}</span>
                          </div>
                          <p className="text-[0.65rem] text-slate-500 mt-2.5 leading-relaxed line-clamp-2">
                            {t.description}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 border-t border-white/[0.03] pt-2.5 mt-2">
                          {t.lists.map((l, idx) => (
                            <span key={idx} className="bg-white/[0.02] border border-white/[0.05] px-2 py-0.5 rounded text-[0.5rem] font-mono text-slate-400 font-bold uppercase tracking-widest">{l}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 border-t border-white/[0.05] pt-6">
                <button
                  onClick={() => setActiveWorkspaceIdForTemplate(null)}
                  className="px-6 py-3.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] text-slate-400 hover:text-white text-[0.65rem] font-bold rounded-2xl uppercase tracking-[0.2em] transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={!newBoardTitle}
                  onClick={() => {
                    onCreateBoard({
                      title: newBoardTitle,
                      workspaceId: activeWorkspaceIdForTemplate,
                      category: newBoardCategory || "General",
                      templateId: selectedTemplateId
                    });
                    setActiveWorkspaceIdForTemplate(null);
                  }}
                  className={`px-8 py-3.5 text-white text-[0.65rem] font-bold rounded-2xl uppercase tracking-[0.2em] transition-all shadow-glow flex items-center gap-2.5 ${
                    newBoardTitle 
                      ? 'bg-accent-blue hover:bg-indigo-500 cursor-pointer' 
                      : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/[0.05]'
                  }`}
                >
                  <span>Build Workspace Space</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

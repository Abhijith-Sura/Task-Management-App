import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Column } from './Column';
import { useBoardData } from './useBoardData';
import { Terminal, ShieldCheck, Activity, Search, Settings, Layout, List as ListIcon, Calendar as CalendarIcon, Edit3, Trash2, Zap as ZapIcon, Plus, Clock } from 'lucide-react';
import { TaskDrawer } from '../drawer/TaskDrawer';
import { SettingsModal } from './SettingsModal';
import { TableView } from './TableView';
import { CalendarView } from './CalendarView';
import { TimelineView } from './TimelineView';
import api from '../../services/api';
import offlineSyncService from '../../services/offlineSync';

export const Board = ({ boardId, onViewChange }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewType, setViewType] = useState('kanban'); // 'kanban', 'table', 'calendar'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabels, setSelectedLabels] = useState([]);

  // Advanced Faceted Search States
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [searchAnalytics, setSearchAnalytics] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Offline Synchronization States
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(offlineSyncService.getQueue().length);
  const [syncStatusText, setSyncStatusText] = useState('');
  const { 
    board, 
    isLoading, 
    error, 
    moveCard, 
    createCard, 
    createList, 
    updateList, 
    deleteList, 
    updateCard, 
    deleteCard, 
    uploadAttachment, 
    addComment, 
    updateBoard, 
    deleteBoard, 
    inviteMember, 
    members, 
    owner, 
    automations, 
    createAutomation,
    toggleAutomation,
    deleteAutomation,
    invitations,
    createInvitation,
    revokeInvitation,
    resendInvitation
  } = useBoardData(boardId);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?._id || currentUser?.id || '';
  const isOwner = currentUserId && (board?.owner?._id || board?.owner) && (currentUserId.toString() === (board?.owner?._id || board?.owner).toString());
  const workspaceMembers = board?.workspaceId?.members || [];
  const findWorkspaceRole = (userId) => {
    if (!userId) return 'editor';
    const wsMember = workspaceMembers.find(m => {
      const idStr = m?.user?._id || m?.user || '';
      return idStr && idStr.toString() === userId.toString();
    });
    return wsMember?.role || 'editor';
  };
  const currentUserRole = isOwner ? 'admin' : findWorkspaceRole(currentUserId);
  const isViewer = currentUserRole === 'viewer';
  const boardRef = useRef(null);

  // Fetch Faceted Analytics dynamically in background
  useEffect(() => {
    if (!boardId) return;

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const queryParams = new URLSearchParams();
        if (searchQuery) queryParams.append('q', searchQuery);
        if (filterPriority) queryParams.append('priority', filterPriority);
        if (filterAssignee) queryParams.append('assigneeId', filterAssignee);
        if (filterTag) queryParams.append('label', filterTag);

        const { data } = await api.get(`/boards/${boardId}/search?${queryParams.toString()}`);
        if (data?.success && data?.data) {
          setSearchAnalytics(data.data);
        }
      } catch (err) {
        console.error("Faceted search metrics failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [boardId, searchQuery, filterPriority, filterAssignee, filterTag]);

  // Offline network status and sync orchestrator
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setSyncStatusText('Syncing offline edits...');
      try {
        await offlineSyncService.syncQueue((current, total, actionType) => {
          setSyncStatusText(`Syncing (${current}/${total}): ${actionType}...`);
        });
      } catch (err) {
        console.error('Queue synchronization failed', err);
      } finally {
        setSyncStatusText('');
        setPendingSyncCount(offlineSyncService.getQueue().length);
        // Force refresh from server now that we are online!
        window.location.reload();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodically sync stashed queue size (e.g. on stashed card updates)
    const queueInterval = setInterval(() => {
      setPendingSyncCount(offlineSyncService.getQueue().length);
    }, 1000);

    // Run immediate synchronization check if online
    if (navigator.onLine && offlineSyncService.getQueue().length > 0) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(queueInterval);
    };
  }, [boardId]);

  // Extract unique board labels dynamically
  const allBoardLabels = useMemo(() => {
    if (!board?.lists) return [];
    const labelsMap = new Map();
    board.lists.forEach(list => {
      list.cards?.forEach(card => {
        card.labels?.forEach(label => {
          if (label.text && label.color) {
            labelsMap.set(`${label.text.toLowerCase()}-${label.color.toLowerCase()}`, label);
          }
        });
      });
    });
    return Array.from(labelsMap.values());
  }, [board?.lists]);

  // Filtering logic
  const filteredLists = useMemo(() => {
    if (!board?.lists) return [];

    return board.lists.map(list => {
      let cards = list.cards || [];

      // Filter by text search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        cards = cards.filter(card => 
          card.title.toLowerCase().includes(query) || 
          card.description?.toLowerCase().includes(query) ||
          card.priority?.toLowerCase().includes(query) ||
          card.labels?.some(l => l.text.toLowerCase().includes(query))
        );
      }

      // Filter by Priority
      if (filterPriority) {
        cards = cards.filter(card => card.priority?.toLowerCase() === filterPriority.toLowerCase());
      }

      // Filter by Assignee
      if (filterAssignee) {
        cards = cards.filter(card => card.assignees?.some(a => (a._id || a) === filterAssignee));
      }

      // Filter by Label Tag
      if (filterTag) {
        cards = cards.filter(card => card.labels?.some(l => l.text.toLowerCase() === filterTag.toLowerCase()));
      }

      // Filter by selected tag filters
      if (selectedLabels.length > 0) {
        cards = cards.filter(card => 
          card.labels?.some(l => selectedLabels.includes(l.text))
        );
      }

      return {
        ...list,
        cards
      };
    });
  }, [board?.lists, searchQuery, filterPriority, filterAssignee, filterTag, selectedLabels]);

  // Re-sync selected task if board data changes
  useEffect(() => {
    if (selectedTask) {
      const updatedTask = board?.lists?.flatMap(l => l.cards).find(c => c._id === selectedTask._id);
      if (updatedTask) setSelectedTask(updatedTask);
    }
  }, [board, selectedTask?._id]);

  const onDragEnd = (cardId, info) => {
    if (isViewer) return;
    // Get the point where the card was dropped
    const x = info.point.x;
    const y = info.point.y;
    
    // Find the element at that point
    const elementAtPoint = document.elementFromPoint(x, y);
    if (!elementAtPoint) return;

    // Find the nearest column container
    const targetColumnEl = elementAtPoint.closest('.column-container');
    if (!targetColumnEl) return;

    const targetListId = targetColumnEl.getAttribute('data-column-id');
    if (!targetListId) return;

    // Calculate insert position within the list
    const cardElements = Array.from(targetColumnEl.querySelectorAll('[data-card-id]'));
    const siblingCards = cardElements.filter(el => el.getAttribute('data-card-id') !== cardId);
    
    let insertIndex = siblingCards.length;
    for (let i = 0; i < siblingCards.length; i++) {
      const rect = siblingCards[i].getBoundingClientRect();
      if (y < (rect.top + rect.height / 2)) {
        insertIndex = i;
        break;
      }
    }

    const targetList = board.lists.find(l => l._id === targetListId);
    if (!targetList) return;
    
    const sortedCards = [...targetList.cards].sort((a, b) => (a.position || 0) - (b.position || 0));
    const cardsInList = sortedCards.filter(c => (c._id || c.id) !== cardId);
    
    let newPosition;
    if (cardsInList.length === 0) {
      newPosition = 1000;
    } else if (insertIndex === 0) {
      newPosition = (cardsInList[0].position || 0) / 2;
    } else if (insertIndex >= cardsInList.length) {
      newPosition = (cardsInList[cardsInList.length - 1].position || 0) + 1000;
    } else {
      newPosition = ((cardsInList[insertIndex - 1].position || 0) + (cardsInList[insertIndex].position || 0)) / 2;
    }

    moveCard(cardId, targetListId, newPosition);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-transparent canvas-dot-grid relative overflow-hidden">
        <div className="absolute inset-0 bg-accent-blue/[0.02] animate-pulse-glow pointer-events-none" />
        <div className="relative">
          <div className="w-20 h-20 border-4 border-accent-blue/10 border-t-accent-blue rounded-2xl animate-spin shadow-glow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ZapIcon size={32} className="text-accent-blue animate-pulse" />
          </div>
        </div>
        <div className="mt-8">
          <div className="font-display text-2xl font-bold text-white tracking-tighter text-center">Loading Board...</div>
          <div className="font-mono text-[0.6rem] text-slate-600 font-bold uppercase tracking-[0.4em] mt-3 text-center">Synchronizing workspace</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-transparent relative px-6">
        <div className="max-w-md glass-panel p-10 rounded-[2.5rem] border border-red-500/20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-red-500/10 blur-[60px]" />
          <ShieldCheck className="text-red-500 mx-auto mb-6 relative z-10" size={56} />
          <h2 className="font-display text-3xl font-bold text-white mb-3 tracking-tight">Connection Lost</h2>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
            Connection to the workspace server was interrupted. Please try reconnecting.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold rounded-2xl transition-all border border-red-500/20 uppercase tracking-[0.2em] text-[0.7rem]"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-transparent" ref={boardRef}>
      <header className="px-8 py-4 border-b border-white/[0.10] flex flex-wrap items-center justify-between gap-6 bg-background/40 backdrop-blur-3xl sticky top-0 z-20 w-full">
        <div className="flex flex-wrap items-center gap-6 flex-1 min-w-[280px]">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-display font-bold tracking-tighter text-white">
                  {board?.title || 'System Board'}
                </h1>
                <button 
                  onClick={() => {
                    if (window.showPremiumPrompt) {
                      window.showPremiumPrompt(
                        "Rename Board",
                        "Enter new board name...",
                        board.title,
                        (title) => {
                          if (title.trim()) updateBoard({ title: title.trim() });
                        }
                      );
                    } else {
                      const title = prompt("Rename board:", board.title);
                      if (title) updateBoard({ title });
                    }
                  }}
                  className="p-1.5 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all border border-transparent hover:border-white/10"
                >
                  <Edit3 size={16} />
                </button>
              </div>
              <div className="font-mono text-[0.55rem] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">Board ID: {boardId.slice(-8).toUpperCase()}</div>
            </div>

            {/* Premium View Switcher */}
            <div className="flex glass-panel p-1.5 rounded-2xl ml-4 border border-white/[0.10]">
              {[
                { id: 'kanban', icon: <Layout size={14} />, label: 'Board' },
                { id: 'table', icon: <ListIcon size={14} />, label: 'Table' },
                { id: 'calendar', icon: <CalendarIcon size={14} />, label: 'Calendar' },
                { id: 'timeline', icon: <Clock size={14} />, label: 'Timeline' },
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setViewType(view.id)}
                  className={`flex items-center gap-2.5 px-5 py-2 rounded-xl text-[0.65rem] font-bold uppercase tracking-widest transition-all relative ${
                    viewType === view.id 
                      ? 'text-white' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {viewType === view.id && (
                    <motion.div layoutId="view-pill" className="absolute inset-0 bg-white/[0.08] border border-white/[0.05] rounded-xl shadow-sm" />
                  )}
                  <span className="relative z-10">{view.icon}</span>
                  <span className="relative z-10">{view.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* High-Fidelity Search */}
          <div className="relative group flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent-blue transition-colors" size={16} />
              <input 
                type="text"
                placeholder="SEARCH TASKS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/[0.04] border border-white/[0.10] rounded-2xl py-3 pl-12 pr-6 text-xs text-white focus:outline-none focus:border-accent-blue/40 focus:ring-4 focus:ring-accent-blue/5 w-72 transition-all placeholder:text-slate-500 font-bold tracking-tight"
              />
            </div>
            
            <button
              onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
              className={`px-4 py-3 border rounded-2xl font-mono text-[0.6rem] uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 duration-200 ${
                isAdvancedSearchOpen || filterPriority || filterAssignee || filterTag
                  ? 'bg-accent-blue/15 border-accent-blue text-accent-blue'
                  : 'bg-white/[0.04] border-white/[0.10] text-[#D4D4D8] hover:bg-white/[0.06]'
              }`}
            >
              <span>Filters</span>
              {(filterPriority || filterAssignee || filterTag) && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          {/* Members Suite */}
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {members?.slice(0, 4).map((m, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ y: -4, scale: 1.1 }}
                  className="w-10 h-10 rounded-2xl border-2 border-background bg-slate-900 flex items-center justify-center text-[0.7rem] font-bold text-accent-blue shadow-glow relative overflow-hidden"
                >
                  {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover" /> : m.name?.charAt(0).toUpperCase()}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </motion.div>
              ))}
              {members?.length > 4 && (
                <div className="w-10 h-10 rounded-2xl border-2 border-background bg-white/[0.04] backdrop-blur-md flex items-center justify-center text-[0.6rem] font-bold text-slate-400">
                  +{members.length - 4}
                </div>
              )}
            </div>
            <button 
              onClick={() => {
                if (window.showPremiumPrompt) {
                  window.showPremiumPrompt(
                    "Invite Collaborator",
                    "Enter collaborator email...",
                    "",
                    (email) => {
                      if (email.trim()) inviteMember(email.trim());
                    },
                    "email"
                  );
                } else {
                  const email = prompt("Enter email address of the collaborator to invite to this board:");
                  if (email) inviteMember(email);
                }
              }}
              className="p-2.5 bg-accent-blue/10 border border-accent-blue/20 rounded-2xl text-accent-blue hover:bg-accent-blue hover:text-white transition-all shadow-sm"
              title="Invite Member"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="h-10 w-[1px] bg-white/[0.05]" />

          {/* Network Status Badge */}
          {isOnline ? (
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl font-mono text-[0.6rem] font-bold uppercase tracking-widest shadow-sm shadow-emerald-500/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl font-mono text-[0.6rem] font-bold uppercase tracking-widest animate-pulse shadow-sm shadow-amber-500/5">
              <span>Offline Mode</span>
            </div>
          )}

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 px-6 py-3 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white text-[0.65rem] font-bold rounded-2xl transition-all border border-white/[0.10] uppercase tracking-[0.2em]"
          >
            <Settings size={18} className="text-slate-400" />
            Board Settings
          </button>
        </div>
      </header>

      {/* Offline Sync Progress Alert Bar */}
      {(pendingSyncCount > 0 || syncStatusText) && (
        <div className="bg-accent-blue/10 border-b border-accent-blue/20 px-8 py-3 flex items-center justify-between text-accent-blue text-[0.65rem] font-mono uppercase tracking-widest animate-pulse relative z-20">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-ping" />
            <span>
              {syncStatusText || `Queue Sync Pending: ${pendingSyncCount} offline edits stashed in local cache`}
            </span>
          </div>
          <span className="text-[0.6rem] font-bold text-slate-400">Offline Resilience Active</span>
        </div>
      )}

      <AnimatePresence>
        {isAdvancedSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-b border-white/[0.03] bg-[#0E0E11]/80 backdrop-blur-3xl overflow-hidden"
          >
            <div className="px-8 py-5 flex flex-wrap items-center justify-between gap-6">
              <div className="flex flex-wrap items-center gap-6">
                {/* Priority Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[0.55rem] text-[#D4D4D8] uppercase tracking-widest font-bold">Priority Filter</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent-blue"
                  >
                    <option value="" className="bg-[#18181B] text-white">All Priorities</option>
                    <option value="low" className="bg-[#18181B] text-white">Low</option>
                    <option value="medium" className="bg-[#18181B] text-white">Medium</option>
                    <option value="high" className="bg-[#18181B] text-white">High</option>
                  </select>
                </div>

                {/* Assignee Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[0.55rem] text-[#D4D4D8] uppercase tracking-widest font-bold">Assignee Filter</label>
                  <select
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                    className="bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent-blue max-w-44"
                  >
                    <option value="" className="bg-[#18181B] text-white">All Assignees</option>
                    {members?.map(m => (
                      <option key={m._id} value={m._id} className="bg-[#18181B] text-white">{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Labels Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[0.55rem] text-[#D4D4D8] uppercase tracking-widest font-bold">Label Tag Filter</label>
                  <select
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-accent-blue max-w-44"
                  >
                    <option value="" className="bg-[#18181B] text-[#FAFAFA]">All Tags</option>
                    {allBoardLabels?.map(l => (
                      <option key={l.text} value={l.text} className="bg-[#18181B] text-[#FAFAFA]">{l.text}</option>
                    ))}
                  </select>
                </div>

                {/* Reset Filters button */}
                {(filterPriority || filterAssignee || filterTag || searchQuery) && (
                  <button
                    onClick={() => {
                      setFilterPriority('');
                      setFilterAssignee('');
                      setFilterTag('');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-mono text-[0.6rem] uppercase tracking-widest transition-all active:scale-95"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Dynamic Faceted Statistics Breakdown */}
              <div className="flex items-center gap-6 glass-panel border border-white/[0.10] px-5 py-3 rounded-2xl">
                <div className="flex flex-col">
                  <span className="font-mono text-[0.55rem] text-[#D4D4D8] uppercase tracking-widest font-bold">Faceted Analytics</span>
                  <div className="flex items-center gap-4 mt-2">
                    {/* Priority breakdown counts */}
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span className="font-mono text-[0.6rem] text-slate-300">
                        High: <strong className="text-white">{searchAnalytics?.priorityDistribution?.find(p => p._id === 'high')?.count || 0}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      <span className="font-mono text-[0.6rem] text-slate-300">
                        Med: <strong className="text-white">{searchAnalytics?.priorityDistribution?.find(p => p._id === 'medium')?.count || 0}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="font-mono text-[0.6rem] text-slate-300">
                        Low: <strong className="text-white">{searchAnalytics?.priorityDistribution?.find(p => p._id === 'low')?.count || 0}</strong>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="h-8 w-[1px] bg-white/[0.05]" />
                
                <div className="flex flex-col">
                  <span className="font-mono text-[0.55rem] text-[#D4D4D8] uppercase tracking-widest font-bold">Matching Cards</span>
                  <span className="text-xl font-bold text-accent-blue mt-1">
                    {isSearching ? '...' : (searchAnalytics?.cards?.length || 0)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 p-8 flex flex-col overflow-hidden relative">
        {/* Subtle Ambient Backing Glows for Board */}
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-accent-blue/[0.15] rounded-full blur-[130px] pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-[30rem] h-[30rem] bg-indigo-500/[0.12] rounded-full blur-[150px] pointer-events-none animate-pulse-glow" />

        {/* Dynamic Board Tag Filter Bar */}
        {allBoardLabels.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6 px-1.5 animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">
            <span className="font-mono text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-1.5">
              <ZapIcon size={12} className="text-accent-blue" /> Filter by Tag:
            </span>
            {allBoardLabels.map((label, idx) => {
              const isSelected = selectedLabels.includes(label.text);
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedLabels(selectedLabels.filter(t => t !== label.text));
                    } else {
                      setSelectedLabels([...selectedLabels, label.text]);
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-[0.6rem] font-bold uppercase tracking-widest border transition-all duration-300 flex items-center gap-1.5 ${
                    isSelected 
                      ? 'border-accent-blue shadow-glow' 
                      : 'border-white/[0.10] hover:border-white/35'
                  }`}
                  style={{
                    backgroundColor: isSelected ? `${label.color}25` : `${label.color}05`,
                    color: label.color
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: label.color }} />
                  {label.text}
                </button>
              );
            })}
            
            {selectedLabels.length > 0 && (
              <button 
                onClick={() => setSelectedLabels([])}
                className="font-mono text-[0.55rem] text-red-500 hover:text-red-400 uppercase tracking-widest bg-red-500/10 px-2.5 py-1 rounded-lg transition-colors ml-2"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
        {viewType === 'kanban' ? (
          <div className="flex-1 flex gap-8 items-start overflow-x-auto overflow-y-hidden w-full pb-6 px-2 scrollbar-thin relative z-10">
            <AnimatePresence initial={false}>
              {filteredLists.map((list) => (
                <Column
                  key={list._id}
                  column={{ id: list._id, title: list.title }}
                  cards={list.cards}
                  onCardSelect={setSelectedTask}
                  onDragStart={() => {}} 
                  onDragEnd={onDragEnd}
                  onAddCard={(title) => createCard(title, list._id)}
                  onUpdateList={updateList}
                  onDeleteList={deleteList}
                  isViewer={isViewer}
                />
              ))}
            </AnimatePresence>
            
            {!isViewer && (
              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileActive={{ scale: 0.99 }}
                onClick={() => {
                  if (window.showPremiumPrompt) {
                    window.showPremiumPrompt(
                      "Initialize Column",
                      "Enter column title...",
                      "",
                      (title) => {
                        if (title.trim()) createList(title.trim());
                      }
                    );
                  } else {
                    const title = prompt("Initialize new list:");
                    if (title) createList(title);
                  }
                }}
                className="w-[320px] h-16 flex-shrink-0 bg-white/[0.02] border border-dashed border-white/[0.10] text-slate-400 hover:border-accent-blue/50 hover:text-accent-blue hover:bg-accent-blue/[0.03] rounded-3xl transition-all flex items-center justify-center group gap-3"
              >
                <Plus size={20} className="opacity-60 group-hover:opacity-100" />
                <span className="font-mono text-[0.7rem] font-bold tracking-[0.3em] uppercase">
                  Add Column
                </span>
              </motion.button>
            )}
          </div>
        ) : viewType === 'table' ? (
          <div className="flex-1 relative z-10 overflow-hidden">
            <TableView 
              lists={filteredLists} 
              onCardSelect={setSelectedTask} 
            />
          </div>
        ) : viewType === 'timeline' ? (
          <div className="flex-1 relative z-10 overflow-hidden">
            <TimelineView
              lists={filteredLists}
              onCardSelect={setSelectedTask}
              onUpdateCard={updateCard}
              isViewer={isViewer}
            />
          </div>
        ) : (
          <div className="flex-1 relative z-10 overflow-hidden">
            <CalendarView 
              lists={filteredLists} 
              onCardSelect={setSelectedTask} 
            />
          </div>
        )}
      </div>

      {isSettingsOpen && (
        <SettingsModal 
          board={board}
          members={members}
          owner={owner}
          onUpdateBoard={updateBoard}
          onInviteMember={inviteMember}
          automations={automations}
          onCreateAutomation={createAutomation}
          onToggleAutomation={toggleAutomation}
          onDeleteAutomation={deleteAutomation}
          onClose={() => setIsSettingsOpen(false)}
          invitations={invitations}
          onCreateInvitation={createInvitation}
          onRevokeInvitation={revokeInvitation}
          onResendInvitation={resendInvitation}
        />
      )}

      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/40 backdrop-blur-sm" 
              onClick={() => setSelectedTask(null)} 
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="h-full w-[40%] min-w-[450px] max-w-[700px] glass-panel border-l border-white/[0.10] shadow-2xl relative z-10"
            >
              <TaskDrawer 
                task={board?.lists?.flatMap(l => l.cards).find(c => (c._id || c.id) === selectedTask?._id) || selectedTask} 
                onClose={() => setSelectedTask(null)} 
                activeBoardId={boardId}
                members={members}
                boardLabels={allBoardLabels}
                onUpdateCard={(cardId, updates) => updateCard(cardId, updates)}
                onDeleteCard={(cardId) => {
                  deleteCard(cardId);
                  setSelectedTask(null);
                }}
                onUploadAttachment={(cardId, file) => uploadAttachment(cardId, file)}
                onAddComment={(cardId, text) => addComment(cardId, text)}
                isViewer={isViewer}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

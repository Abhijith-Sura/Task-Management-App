import React, { useState, useMemo, useEffect } from 'react';
import { Column } from '../canvas/Column';
import { Terminal, ShieldCheck, Activity, Search, Layout, List as ListIcon, Calendar as CalendarIcon, Zap, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_DEMO_DATA = {
  title: "Product Launch Q3",
  lists: [
    {
      _id: "list-1",
      title: "Backlog",
      cards: [
        { _id: "card-1", title: "Finalize UI/UX Design", priority: "high", labels: [{ text: "Product", color: "#3B82F6" }], position: 1000 },
        { _id: "card-2", title: "Draft Marketing Strategy", priority: "medium", labels: [{ text: "Marketing", color: "#10B981" }], position: 2000 },
        { _id: "card-3", title: "Social Media Assets", priority: "low", position: 3000 }
      ]
    },
    {
      _id: "list-2",
      title: "In Progress",
      cards: [
        { _id: "card-4", title: "Budget Approval", priority: "high", labels: [{ text: "Finance", color: "#EF4444" }], position: 1000 },
        { _id: "card-5", title: "API Documentation", priority: "medium", labels: [{ text: "Product", color: "#3B82F6" }], position: 2000 }
      ]
    },
    {
      _id: "list-3",
      title: "Completed",
      cards: [
        { _id: "card-6", title: "Initial Market Research", priority: "low", labels: [{ text: "Research", color: "#A1A1AA" }], position: 1000 }
      ]
    }
  ]
};

export const LiveBoardDemo = () => {
  const [board, setBoard] = useState(INITIAL_DEMO_DATA);
  const [viewType, setViewType] = useState('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutoPiloting, setIsAutoPiloting] = useState(true);

  // AutoPilot Logic: Move a card occasionally to show movement
  useEffect(() => {
    if (!isAutoPiloting) return;

    const interval = setInterval(() => {
      setBoard(prev => {
        const newBoard = JSON.parse(JSON.stringify(prev));
        const sourceList = newBoard.lists[0];
        const targetList = newBoard.lists[1];
        
        if (sourceList.cards.length > 0) {
          const card = sourceList.cards.shift();
          targetList.cards.push(card);
        } else {
          return INITIAL_DEMO_DATA;
        }
        return newBoard;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPiloting]);

  const filteredLists = useMemo(() => {
    if (!searchQuery) return board.lists;
    const query = searchQuery.toLowerCase();
    return board.lists.map(list => ({
      ...list,
      cards: list.cards.filter(card => 
        card.title.toLowerCase().includes(query) || 
        card.priority?.toLowerCase().includes(query)
      )
    }));
  }, [board.lists, searchQuery]);

  const onDragEnd = (cardId, info) => {
    setIsAutoPiloting(false);
    const x = info.point.x;
    const elementAtPoint = document.elementFromPoint(x, info.point.y);
    const targetColumnEl = elementAtPoint?.closest('.column-container');
    
    if (targetColumnEl) {
      const targetListId = targetColumnEl.getAttribute('data-column-id');
      setBoard(prev => {
        const newBoard = JSON.parse(JSON.stringify(prev));
        let cardToMove = null;
        
        newBoard.lists.forEach(l => {
          const idx = l.cards.findIndex(c => c._id === cardId);
          if (idx !== -1) {
            cardToMove = l.cards.splice(idx, 1)[0];
          }
        });

        const targetList = newBoard.lists.find(l => l._id === targetListId);
        if (targetList && cardToMove) {
          targetList.cards.push(cardToMove);
        }
        
        return newBoard;
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent-blue/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface/30 backdrop-blur-xl z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="font-mono text-[0.7rem] text-accent-blue uppercase tracking-widest border border-accent-blue/20 px-2 py-0.5 rounded-sm bg-accent-blue/5">
              Live Demo
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#FAFAFA] uppercase">
              {board.title}
            </h1>
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" size={14} />
            <input 
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/[0.03] border border-border rounded-sm py-1.5 pl-9 pr-4 font-mono text-xs text-[#FAFAFA] focus:outline-none focus:border-accent-blue w-64 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-white/[0.03] border border-border p-1 rounded-sm">
            {[
              { id: 'kanban', icon: <Layout size={14} />, label: 'Board' },
              { id: 'table', icon: <ListIcon size={14} />, label: 'Table' }
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setViewType(view.id)}
                className={`flex items-center gap-2 px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-widest rounded-sm transition-all ${
                  viewType === view.id 
                    ? 'bg-accent-blue text-white shadow-lg' 
                    : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
                }`}
              >
                {view.icon} {view.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <Zap size={14} className="text-green-500 animate-pulse" />
            <span className="font-mono text-[0.6rem] text-green-500 font-bold tracking-[0.2em]">Interactive Preview</span>
          </div>
        </div>
      </header>

      <div className="flex-1 p-8 flex flex-col overflow-hidden">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-accent-blue" />
            <span className="font-mono text-[0.65rem] text-[#A1A1AA] uppercase tracking-[0.3em]">Workspace / Board View</span>
          </div>
          {isAutoPiloting && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="font-mono text-[0.55rem] text-accent-blue animate-pulse uppercase tracking-widest bg-accent-blue/5 px-2 py-1 rounded-sm border border-accent-blue/10"
            >
              Demo Mode: Visualizing Workflow
            </motion.div>
          )}
        </div>

        <div className="flex-1 flex gap-8 items-start overflow-x-auto pb-10 scrollbar-thin">
          {filteredLists.map((list) => (
            <Column
              key={list._id}
              column={{ id: list._id, title: list.title }}
              cards={list.cards}
              onCardSelect={() => {}}
              onDragStart={() => setIsAutoPiloting(false)}
              onDragEnd={onDragEnd}
              onAddCard={() => {}}
              onUpdateList={() => {}}
              onDeleteList={() => {}}
            />
          ))}
          
          <div className="w-[320px] h-20 flex-shrink-0 bg-white/[0.02] border border-dashed border-border rounded-sm flex items-center justify-center opacity-30">
            <span className="font-mono text-xs uppercase tracking-widest">+ Create List</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAutoPiloting && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-surface border border-accent-blue/30 rounded-sm shadow-2xl z-50 flex items-center gap-4"
          >
            <div className="p-2 bg-accent-blue/10 rounded-full">
              <MousePointer2 size={16} className="text-accent-blue" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold uppercase tracking-tight">Interactive Playground</div>
              <div className="text-[0.6rem] font-mono text-[#A1A1AA]">Drag cards or search tasks to explore the interface.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

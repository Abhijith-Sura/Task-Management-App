import React from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import { motion, LayoutGroup } from 'framer-motion';
import { Card } from './Card';

export const Column = ({ column, cards, onCardSelect, activeCardId, onDragStart, onDragEnd, onAddCard, onUpdateList, onDeleteList, isViewer }) => {
  const [isAdding, setIsAdding] = React.useState(false);
  const [newCardTitle, setNewCardTitle] = React.useState('');
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (newCardTitle.trim()) {
      onAddCard(newCardTitle.trim());
      setNewCardTitle('');
      setIsAdding(false);
    }
  };
  return (
    <div 
      className="column-container w-[360px] flex flex-col max-h-full flex-shrink-0 bg-surface/50 backdrop-blur-3xl border border-white/[0.12] hover:border-white/[0.22] rounded-3xl relative overflow-hidden shadow-soft transition-all duration-300"
      style={{ padding: 'var(--column-p)' }}
      data-column-id={column.id}
    >
      {/* Column Header - Glassmorphic Header */}
      <div className="px-3 py-4 flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-accent-blue shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
          <h2 className="text-[0.85rem] font-display font-bold uppercase tracking-[0.2em] text-white">
            {column.title}
          </h2>
          <span className="font-mono text-[0.65rem] font-bold text-slate-300 bg-white/[0.06] border border-white/[0.12] px-2.5 py-0.5 rounded-lg">
            {cards.length.toString().padStart(2, '0')}
          </span>
        </div>
        {!isViewer && (
          <div className="flex gap-2 relative">
            <button 
              onClick={() => setIsAdding(true)}
              className="p-2 bg-white/[0.06] border border-white/[0.12] hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-all shadow-sm"
            >
              <Plus size={16} />
            </button>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 bg-white/[0.06] border border-white/[0.12] hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-all shadow-sm"
            >
              <MoreHorizontal size={16} />
            </button>

            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 top-full mt-3 w-48 bg-surface/95 backdrop-blur-2xl border border-white/[0.15] rounded-2xl shadow-soft z-50 overflow-hidden"
                >
                  <button 
                    onClick={() => {
                      if (window.showPremiumPrompt) {
                        window.showPremiumPrompt(
                          "Rename Column",
                          "Enter new column title...",
                          column.title,
                          (newTitle) => {
                            if (newTitle.trim() && newTitle.trim() !== column.title) {
                              onUpdateList(column.id, newTitle.trim());
                            }
                          }
                        );
                      } else {
                        const newTitle = prompt("Rename list:", column.title);
                        if (newTitle && newTitle !== column.title) onUpdateList(column.id, newTitle);
                      }
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-5 py-3 text-[0.65rem] font-bold text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors uppercase tracking-widest"
                  >
                    Rename List
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(`Delete list "${column.title}"? This cannot be undone.`)) {
                        onDeleteList(column.id);
                      }
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-5 py-3 text-[0.65rem] font-bold text-red-500 hover:bg-red-500/10 transition-colors uppercase tracking-widest"
                  >
                    Delete List
                  </button>
                </motion.div>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Cards Scroll Area */}
      <div 
        className="flex-1 px-1.5 pb-4 overflow-y-auto flex flex-col scrollbar-thin min-h-[100px]"
        style={{ gap: 'var(--card-gap)' }}
      >
        <LayoutGroup>
          {cards.map((card) => (
            <Card 
              key={card._id || card.id} 
              card={card} 
              onSelect={onCardSelect}
              isDragging={activeCardId === (card._id || card.id)}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isViewer={isViewer}
            />
          ))}
        </LayoutGroup>

        {!isViewer && (
          isAdding ? (
            <motion.form 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onSubmit={handleAddSubmit} 
              className="mx-1.5 p-5 bg-surface/90 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-glow"
            >
              <textarea 
                autoFocus
                className="w-full bg-transparent border-none text-[0.9rem] text-slate-200 focus:outline-none placeholder:text-slate-500 resize-none min-h-[80px] font-medium leading-relaxed"
                placeholder="Task title..."
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddSubmit(e);
                  }
                  if (e.key === 'Escape') setIsAdding(false);
                }}
              />
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-accent-blue animate-pulse" />
                  <span className="font-mono text-[0.6rem] text-slate-300 font-bold uppercase tracking-[0.2em]">Creating Task...</span>
                </div>
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-1.5 text-[0.6rem] font-bold text-slate-300 hover:text-white uppercase tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-1.5 bg-accent-blue text-white text-[0.6rem] font-bold rounded-xl uppercase tracking-[0.2em] shadow-lg shadow-accent-blue/20 hover:bg-indigo-500 transition-all active:scale-95"
                  >
                    Add
                  </button>
                </div>
              </div>
            </motion.form>
          ) : (
            <button 
              onClick={() => setIsAdding(true)}
              className="mx-1.5 py-4 flex items-center justify-center gap-3 text-slate-200 hover:text-white transition-all group border border-dashed border-white/[0.15] rounded-2xl hover:border-accent-blue/40 hover:bg-accent-blue/[0.02]"
            >
              <Plus size={14} className="group-hover:scale-125 group-hover:rotate-90 transition-transform duration-500" />
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em]">Add Task</span>
            </button>
          )
        )}
      </div>
    </div>
  );
};

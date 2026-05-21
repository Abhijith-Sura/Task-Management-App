import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Paperclip, Clock, CheckSquare, Calendar, MoreHorizontal } from 'lucide-react';
import { parseMetadata } from '../../utils/metadata';

export const Card = ({ card, onSelect, isDragging, onDragStart, onDragEnd, isViewer }) => {
  const metadata = parseMetadata(card.description);

  const getDueDateStatus = () => {
    if (!card.dueDate) return null;
    const due = new Date(card.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueTime = due.getTime();
    const todayTime = today.getTime();
    
    if (card.dueDateCompleted) {
      return {
        text: '✓ Completed',
        className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      };
    }
    
    const diffTime = dueTime - todayTime;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return {
        text: '⚠️ Overdue',
        className: 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse'
      };
    } else if (diffDays === 0) {
      return {
        text: '⏱ Due Today',
        className: 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold'
      };
    } else if (diffDays === 1) {
      return {
        text: '⏱ Due Tomorrow',
        className: 'bg-orange-500/10 text-orange-500 border-orange-500/20 font-bold'
      };
    } else {
      return {
        text: `⏱ ${diffDays}d left`,
        className: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20'
      };
    }
  };

  const getBudgetStatus = () => {
    const budgetVal = card.metadata?.budget || metadata?.budget || 0;
    const actualVal = card.metadata?.actualCost || metadata?.actualCost || 0;
    
    if (!budgetVal) return null;
    
    if (actualVal > 0) {
      const percentage = (actualVal / budgetVal) * 100;
      if (percentage > 100) {
        return {
          text: `$${actualVal} / $${budgetVal} (Overrun)`,
          className: 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse'
        };
      }
      return {
        text: `$${actualVal} / $${budgetVal} (${Math.round(percentage)}%)`,
        className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      };
    }
    
    return {
      text: `$${budgetVal}`,
      className: 'bg-accent-blue/5 text-accent-blue border-accent-blue/10'
    };
  };

  return (
    <div className="relative group/card">
      {/* The Actual Draggable Card */}
      <motion.div
        layoutId={card._id || card.id}
        drag={!isViewer}
        dragElastic={0.08}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        data-card-id={card._id || card.id}
        onDragStart={() => onDragStart(card._id || card.id)}
        onDragEnd={(event, info) => onDragEnd(card._id || card.id, info)}
        onClick={() => !isDragging && onSelect(card)}
        whileDrag={{ 
          scale: 1.04, 
          rotate: 1.5,
          zIndex: 50, 
          boxShadow: "0 40px 80px -15px rgba(0, 0, 0, 0.7)",
          cursor: 'grabbing',
          pointerEvents: 'none'
        }}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 450, damping: 32 }}
        className={`bg-surface/75 backdrop-blur-2xl border border-white/[0.12] rounded-2xl relative select-none transition-all duration-300 hover:bg-surface/95 hover:border-white/[0.22] group shadow-sm hover:shadow-glow ${
          isViewer ? 'cursor-pointer' : 'cursor-grab'
        } ${
          isDragging ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ padding: 'var(--card-p)' }}
      >
        {card.coverUrl && (
          <div 
            className="h-36 rounded-t-2xl border-b border-white/[0.10] mb-5 relative overflow-hidden"
            style={{
              backgroundImage: (card.coverUrl.startsWith('linear-gradient') || card.coverUrl.startsWith('rgb') || card.coverUrl.startsWith('#')) ? card.coverUrl : `url(${card.coverUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              width: 'calc(100% + (var(--card-p) * 2))',
              marginLeft: 'calc(var(--card-p) * -1)',
              marginTop: 'calc(var(--card-p) * -1)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface/90" />
          </div>
        )}
        {/* Priority & Meta Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className={`px-2.5 py-0.5 rounded-lg text-[0.6rem] font-bold uppercase tracking-[0.15em] border border-white/[0.08] ${
              card?.priority === 'high' ? 'bg-red-500/10 text-red-500' :
              card?.priority === 'low' ? 'bg-emerald-500/10 text-emerald-500' :
              'bg-blue-500/10 text-accent-blue'
            }`}>
              {card?.priority || 'NORMAL'}
            </div>
            {getBudgetStatus() && (
              <span className={`font-mono text-[0.6rem] font-bold tracking-widest px-2 py-0.5 rounded-lg border ${getBudgetStatus().className}`}>
                {getBudgetStatus().text}
              </span>
            )}
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
            <MoreHorizontal size={14} className="text-slate-400 hover:text-white cursor-pointer" />
          </div>
        </div>

        {/* Task Title - Premium Typography */}
        <h3 className="text-[1.1rem] font-display font-bold leading-snug mb-5 text-white tracking-tight group-hover:text-accent-blue transition-colors duration-300">
          {card.title}
        </h3>

        {/* Labels Display - High Fidelity */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {card.labels.map((label, idx) => (
              <div 
                key={idx} 
                className="px-2 py-0.5 rounded-lg text-[0.55rem] font-bold uppercase tracking-[0.2em] border border-white/[0.10] ring-1 ring-white/5"
                style={{ 
                  backgroundColor: `${label.color}10`, 
                  color: label.color,
                  borderColor: `${label.color}20`
                }}
              >
                {label.text}
              </div>
            ))}
          </div>
        )}
        
        {/* Checklist Progress Bar */}
        {card.checklists?.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1 text-[0.55rem] font-mono text-slate-350">
              <span className="flex items-center gap-1"><CheckSquare size={10} /> Progress</span>
              <span className="font-bold text-accent-blue">{Math.round((card.checklists.filter(c => c.completed).length / card.checklists.length) * 100)}%</span>
            </div>
            <div className="w-full h-1 bg-white/[0.10] rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent-blue rounded-full transition-all duration-500" 
                style={{ width: `${Math.round((card.checklists.filter(c => c.completed).length / card.checklists.length) * 100)}%` }} 
              />
            </div>
          </div>
        )}
        
        {/* Card Footer - Technical Precision */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4 text-slate-300">
            {card.comments > 0 && (
              <div className="flex items-center gap-1.5" title="Comments">
                <MessageSquare size={12} className="opacity-80" />
                <span className="font-mono text-[0.65rem] font-bold text-slate-300">{card.comments}</span>
              </div>
            )}
            
            {card.checklists?.length > 0 && (
              <div className="flex items-center gap-1.5" title="Checklist">
                <CheckSquare size={12} className={`opacity-80 ${card.checklists.every(c => c.completed) ? 'text-emerald-500' : ''}`} />
                <span className="font-mono text-[0.65rem] font-bold text-slate-300">
                  {card.checklists.filter(c => c.completed).length}/{card.checklists.length}
                </span>
              </div>
            )}

            {getDueDateStatus() && (
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[0.55rem] font-bold uppercase tracking-wider ${getDueDateStatus().className}`} title="Due Date Status">
                <Clock size={10} />
                <span>{getDueDateStatus().text}</span>
              </div>
            )}
          </div>
          
          {/* Avatar Stack - Dimensional Presence */}
          <div className="flex -space-x-2">
            {card.assignees?.map((user) => {
              if (!user) return null;
              const displayName = user.name || 'Anonymous';
              return (
                <div 
                  key={user._id || Math.random().toString()} 
                  className="w-8 h-8 rounded-xl border-2 border-[#0B0C10] bg-slate-900 flex items-center justify-center text-[0.65rem] font-bold text-white overflow-hidden hover:-translate-y-1 hover:z-10 transition-all shadow-lg ring-1 ring-white/5"
                  title={displayName}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </div>
              );
            })}
            {(!card.assignees || card.assignees.length === 0) && (
              <div className="w-8 h-8 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center text-[0.6rem] font-bold text-slate-300 hover:border-white/40 transition-colors">
                +
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Highlight on Hover */}
        <div className="absolute inset-0 bg-accent-blue/0 group-hover:bg-accent-blue/[0.02] rounded-2xl pointer-events-none transition-all duration-500" />
      </motion.div>

      {/* Premium Drop Zone Preview */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 border-2 border-dashed border-white/10 rounded-2xl bg-white/[0.02] -z-10"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

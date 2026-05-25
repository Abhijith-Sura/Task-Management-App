import React from 'react';
import { User, Tag, Clock, CheckSquare, MessageSquare, DollarSign, Database as DatabaseIcon, Activity } from 'lucide-react';
import { parseMetadata } from '../../utils/metadata';

/**
 * TableView Component
 * Renders tasks in a tabular format, displaying all metadata, labels, and completion metrics.
 * 
 * @param {Object} props - Component props.
 * @param {Array} props.lists - The lists containing task cards.
 * @param {Function} props.onCardSelect - Callback when a card row is clicked.
 * @returns {JSX.Element} The rendered table view.
 */
export const TableView = ({ lists, onCardSelect }) => {
  const allCards = lists.flatMap(list => 
    list.cards.map(card => ({ ...card, listTitle: list.title }))
  );

  return (
    <div className="h-full w-full overflow-hidden bg-surface border border-white/[0.05] rounded-2xl shadow-soft animate-in fade-in zoom-in-95 duration-500 flex flex-col">
      <div className="overflow-auto flex-1 scrollbar-thin">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead>
            <tr className="border-b border-white/[0.03] bg-white/[0.01]">
              <th className="p-5 text-[0.65rem] font-bold text-slate-500 uppercase tracking-[0.2em] w-16 text-center">#</th>
              <th className="p-5 text-[0.65rem] font-bold text-slate-500 uppercase tracking-[0.2em]">Task Name</th>
              <th className="p-5 text-[0.65rem] font-bold text-slate-500 uppercase tracking-[0.2em] w-36">Status</th>
              <th className="p-5 text-[0.65rem] font-bold text-slate-500 uppercase tracking-[0.2em] w-32 text-center">Priority</th>
              <th className="p-5 text-[0.65rem] font-bold text-slate-500 uppercase tracking-[0.2em] w-32">Budget</th>
              <th className="p-5 text-[0.65rem] font-bold text-slate-500 uppercase tracking-[0.2em] w-48">Assignees</th>
              <th className="p-5 text-[0.65rem] font-bold text-slate-500 uppercase tracking-[0.2em] w-32">Labels</th>
              <th className="p-5 text-[0.65rem] font-bold text-slate-500 uppercase tracking-[0.2em] w-32">Completion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {allCards.map((card, idx) => {
              // Parse markdown-style checklist items from the description to calculate progress
              const subtasks = card.description?.split('\n').filter(l => l.match(/^- \[[x ]\]/)) || [];
              const done = subtasks.filter(l => l.startsWith('- [x]')).length;
              const percent = subtasks.length > 0 ? Math.round((done / subtasks.length) * 100) : 0;

              return (
                <tr 
                  key={card._id} 
                  onClick={() => onCardSelect(card)}
                  className="hover:bg-white/[0.01] transition-all cursor-pointer group"
                >
                  <td className="p-5 text-[0.65rem] font-bold text-slate-600 text-center">
                    {(idx + 1).toString().padStart(2, '0')}
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white group-hover:text-accent-blue transition-colors">
                        {card.title}
                      </span>
                      <span className="text-[0.6rem] font-bold text-slate-600 uppercase tracking-widest mt-1">
                        ID: {card._id.substring(0, 12).toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="px-3 py-1 bg-white/[0.03] border border-white/[0.05] rounded-lg text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">
                      {card.listTitle}
                    </span>
                  </td>
                  <td className="p-5 text-center">
                    <span className={`text-[0.65rem] font-bold uppercase tracking-widest ${
                      card.priority === 'high' ? 'text-red-500' : 
                      card.priority === 'medium' ? 'text-amber-500' : 
                      'text-emerald-500'
                    }`}>
                      {card.priority || 'NORMAL'}
                    </span>
                  </td>
                  <td className="p-5">
                    <span className="text-xs font-display font-bold text-accent-blue">
                      {parseMetadata(card.description).budget ? `$${parseMetadata(card.description).budget}` : '—'}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex -space-x-2">
                      {card.assignees?.map((a, i) => (
                        <div key={i} className="w-8 h-8 rounded-lg bg-accent-blue/10 border-2 border-surface flex items-center justify-center text-[0.65rem] font-bold text-accent-blue shadow-sm">
                          {a.name?.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {(!card.assignees || card.assignees.length === 0) && (
                        <span className="text-[0.6rem] font-bold text-slate-600 uppercase tracking-widest italic">Unassigned</span>
                      )}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-wrap gap-1.5">
                      {card.labels?.slice(0, 3).map((l, i) => (
                        <div 
                          key={i} 
                          className="w-2 h-2 rounded-full ring-2 ring-white/5 shadow-sm" 
                          style={{ backgroundColor: l.color }}
                          title={l.text}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.02]">
                        <div className="h-full bg-gradient-to-r from-accent-blue to-indigo-400" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="text-[0.65rem] font-display font-bold text-slate-400">{percent}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {allCards.length === 0 && (
        <div className="p-32 flex flex-col items-center justify-center space-y-6">
          <div className="w-20 h-20 bg-white/[0.02] rounded-2xl flex items-center justify-center text-slate-700">
            <DatabaseIcon size={40} />
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">No Records Detected</div>
            <p className="text-[0.7rem] text-slate-600 font-medium">Your current filter or workspace has no tasks available for table view.</p>
          </div>
        </div>
      )}
    </div>
  );
};

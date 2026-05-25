import React, { useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Users, Clock, AlertTriangle, Plus, Star } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Safely parses a date input and normalizes it to prevent timezone shift issues,
 * especially for UTC midnight strings.
 * 
 * @param {string|Date} dateInput - The date to parse.
 * @returns {Date} A localized Date object.
 */
const parseUtcSafe = (dateInput) => {
  if (!dateInput) return new Date();
  const dateStr = typeof dateInput === 'string' ? dateInput : new Date(dateInput).toISOString();
  const isUtcMidnight = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) || dateStr.endsWith('T00:00:00.000Z') || dateStr.endsWith('T00:00:00.000+00:00') || dateStr.includes('T00:00:00');
  
  if (isUtcMidnight) {
    const parts = dateStr.split('T')[0].split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date(dateInput);
};

/**
 * TimelineView Component
 * Renders a Gantt-style timeline for scheduling and visualizing tasks across a 14-day sprint.
 * 
 * @param {Object} props - The component props.
 * @param {Array} props.lists - The lists containing cards.
 * @param {Function} props.onCardSelect - Callback when a card is selected.
 * @param {Function} props.onUpdateCard - Callback to update card details (e.g., rescheduling).
 * @param {boolean} props.isViewer - Indicates if the user is in view-only mode.
 * @returns {JSX.Element} The rendered timeline view.
 */
export const TimelineView = ({ lists, onCardSelect, onUpdateCard, isViewer }) => {
  // Generate 14-day scheduling window starting from today
  const timelineDays = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const todayStr = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toDateString();
  }, []);

  // Collect all cards across all lists in the board
  const allCards = useMemo(() => {
    const cards = [];
    lists.forEach(list => {
      list.cards.forEach(card => {
        cards.push({
          ...card,
          listName: list.title
        });
      });
    });
    return cards;
  }, [lists]);

  /**
   * Reschedules a card by shifting its start date or extending its due date.
   * Ensures logical constraint: Start Date <= Due Date.
   * 
   * @param {Object} card - The card to reschedule.
   * @param {number} shiftStartDays - Number of days to shift the start date.
   * @param {number} extendDueDays - Number of days to extend the due date.
   */
  const handleReschedule = (card, shiftStartDays, extendDueDays) => {
    if (isViewer) return;

    let start = card.startDate ? parseUtcSafe(card.startDate) : new Date();
    let due = card.dueDate ? parseUtcSafe(card.dueDate) : new Date();

    // Fallback if missing dates entirely
    if (!card.startDate && !card.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDue = new Date(today);
      targetDue.setDate(today.getDate() + 3);
      onUpdateCard(card._id || card.id, {
        startDate: today.toISOString(),
        dueDate: targetDue.toISOString()
      });
      return;
    }

    start.setDate(start.getDate() + shiftStartDays);
    due.setDate(due.getDate() + extendDueDays);

    // Enforce logical constraint: Start Date <= Due Date
    if (start > due) {
      due = new Date(start);
      due.setDate(start.getDate() + 1);
    }

    onUpdateCard(card._id || card.id, {
      startDate: start.toISOString(),
      dueDate: due.toISOString()
    });
  };

  /**
   * Quickly schedules an unscheduled task: Sets start date to today, due date to 3 days from now.
   * 
   * @param {Object} card - The card to schedule.
   */
  const handleQuickSchedule = (card) => {
    if (isViewer) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDue = new Date(today);
    targetDue.setDate(today.getDate() + 3);

    onUpdateCard(card._id || card.id, {
      startDate: today.toISOString(),
      dueDate: targetDue.toISOString()
    });
  };

  // Helper: Format day labels
  const formatDayLabel = (date) => {
    const daysName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return daysName[date.getDay()];
  };

  return (
    <div className="flex-1 flex flex-col bg-[#09090B] border border-white/[0.03] rounded-[2rem] overflow-hidden shadow-2xl glass-panel animate-in fade-in duration-500">
      
      {/* Gantt Header Status Pane */}
      <div className="p-6 border-b border-white/[0.03] bg-white/[0.01] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="text-accent-blue" size={20} />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">SVG Timeline Scheduler</h3>
            <p className="text-[0.65rem] text-slate-500 mt-0.5">Plot start & due dates across a continuous 2-week active sprint roadmap.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-accent-blue shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
            <span className="font-mono text-[0.6rem] text-slate-400 font-bold uppercase tracking-widest">Active Sprint Track</span>
          </div>
        </div>
      </div>

      {/* Main Gantt Grid Container */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* Timeline Header Row */}
        <div className="flex border-b border-white/[0.03] min-w-[1200px] sticky top-0 z-10 bg-[#09090B]">
          {/* Left spacer column for titles */}
          <div className="w-[300px] p-4 border-r border-white/[0.03] flex items-center bg-white/[0.01]">
            <span className="font-mono text-[0.6rem] font-bold text-slate-500 uppercase tracking-wider">Project Milestones</span>
          </div>
          
          {/* 14 Calendar day labels */}
          <div className="flex-1 grid grid-cols-14 bg-white/[0.01]/40">
            {timelineDays.map((day, idx) => {
              const isToday = day.toDateString() === todayStr;
              return (
                <div 
                  key={idx} 
                  className={`p-3 text-center border-r border-white/[0.03] flex flex-col items-center justify-center relative ${
                    isToday ? 'bg-accent-blue/10 border-b-2 border-b-accent-blue' : ''
                  }`}
                >
                  <span className={`font-mono text-[0.55rem] uppercase tracking-widest font-bold ${isToday ? 'text-accent-blue' : 'text-slate-500'}`}>
                    {formatDayLabel(day)}
                  </span>
                  <span className={`text-xs font-bold mt-1 ${isToday ? 'text-white' : 'text-slate-400'}`}>
                    {day.getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline body lanes */}
        <div className="flex-1 min-w-[1200px] divide-y divide-white/[0.03] pb-12">
          {allCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-3xl mb-4">📅</span>
              <h4 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest">No Milestones to Display</h4>
              <p className="text-[0.65rem] text-slate-600 mt-2">Initialize new cards in the Kanban Board to start charting sprint roadmaps.</p>
            </div>
          ) : (
            allCards.map((card) => {
              // Calculate overlap metrics
              let startIdx = -1;
              let endIdx = -1;
              let isScheduled = false;

              if (card.startDate && card.dueDate) {
                const cardStart = parseUtcSafe(card.startDate);
                cardStart.setHours(0,0,0,0);
                const cardDue = parseUtcSafe(card.dueDate);
                cardDue.setHours(0,0,0,0);

                const windowStart = timelineDays[0];
                const windowEnd = timelineDays[13];

                // Check if date overlaps with active 14-day sprint
                if (cardDue >= windowStart && cardStart <= windowEnd) {
                  isScheduled = true;
                  
                  // Compute grid index mappings
                  const diffStartMs = cardStart.getTime() - windowStart.getTime();
                  const diffStartDays = Math.floor(diffStartMs / (1000 * 60 * 60 * 24));
                  startIdx = Math.max(0, diffStartDays);

                  const diffDueMs = cardDue.getTime() - windowStart.getTime();
                  const diffDueDays = Math.floor(diffDueMs / (1000 * 60 * 60 * 24));
                  endIdx = Math.min(13, diffDueDays);
                }
              }

              const colSpan = isScheduled ? (endIdx - startIdx + 1) : 0;

              // Compute checklist progress ratio
              const completedCount = card.checklists?.filter(c => c.completed).length || 0;
              const totalCount = card.checklists?.length || 0;
              const progressRatio = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

              return (
                <div key={card._id || card.id} className="flex min-h-[90px] group/row hover:bg-white/[0.01] transition-colors items-center">
                  
                  {/* Left Column: Milestone Details */}
                  <div className="w-[300px] p-4 border-r border-white/[0.03] flex items-center justify-between gap-4">
                    <div className="flex flex-col min-w-0">
                      <span 
                        onClick={() => onCardSelect(card)}
                        className="text-xs font-bold text-white hover:text-accent-blue transition-colors cursor-pointer truncate font-mono uppercase tracking-wide"
                      >
                        {card.title}
                      </span>
                      <span className="font-mono text-[0.5rem] font-bold text-slate-500 uppercase tracking-widest mt-1">
                        Category: {card.listName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {card.priority && (
                        <span className={`px-2 py-0.5 rounded-full border text-[0.5rem] font-mono font-bold uppercase tracking-widest ${
                          card.priority === 'high' ? 'border-red-500/20 bg-red-500/10 text-red-500' :
                          card.priority === 'medium' ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-500' :
                          'border-blue-500/20 bg-blue-500/10 text-blue-500'
                        }`}>
                          {card.priority}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Dynamic Horizontal Chart Lane */}
                  <div className="flex-1 grid grid-cols-14 h-full relative items-center px-2 py-4">
                    
                    {/* Visual Grid Column divider markers */}
                    <div className="absolute inset-0 grid grid-cols-14 pointer-events-none">
                      {Array.from({ length: 14 }).map((_, i) => (
                        <div key={i} className="border-r border-white/[0.02] h-full" />
                      ))}
                    </div>

                    {isScheduled ? (
                      /* Scheduled Timeline Bar */
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          gridColumnStart: startIdx + 1,
                          gridColumnEnd: endIdx + 2
                        }}
                        className="relative h-14 bg-gradient-to-r from-accent-blue/20 to-indigo-600/15 border border-accent-blue/30 rounded-2xl p-2.5 flex items-center justify-between gap-4 shadow-glow group/bar relative z-10"
                      >
                        {/* Shifting and Rescheduling drag actions overlay triggers */}
                        {!isViewer && (
                          <div className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity flex items-center gap-1 z-20">
                            <button
                              onClick={() => handleReschedule(card, -1, 0)}
                              className="p-1 rounded-lg bg-black border border-white/[0.05] hover:bg-accent-blue text-slate-400 hover:text-white transition-all shadow-md"
                              title="Shift Start -1 Day"
                            >
                              <ChevronLeft size={10} />
                            </button>
                            <button
                              onClick={() => handleReschedule(card, 1, 0)}
                              className="p-1 rounded-lg bg-black border border-white/[0.05] hover:bg-accent-blue text-slate-400 hover:text-white transition-all shadow-md"
                              title="Shift Start +1 Day"
                            >
                              <ChevronRight size={10} />
                            </button>
                          </div>
                        )}

                        <div className="flex flex-col flex-1 min-w-0 justify-between h-full">
                          <div className="flex items-center gap-2 min-w-0">
                            <Clock size={10} className="text-accent-blue flex-shrink-0" />
                            <span className="text-[0.6rem] font-mono text-slate-400 truncate">
                              {new Date(card.startDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} - {new Date(card.dueDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                            </span>
                          </div>
                          
                          {/* Inner Checklist completion progress bar */}
                          {totalCount > 0 && (
                            <div className="w-full bg-white/[0.05] h-1 rounded-full overflow-hidden mt-1.5 flex items-center">
                              <div 
                                className="bg-accent-blue h-full rounded-full transition-all duration-300"
                                style={{ width: `${progressRatio}%` }}
                              />
                            </div>
                          )}
                        </div>

                        {!isViewer && (
                          <div className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity flex items-center gap-1 z-20">
                            <button
                              onClick={() => handleReschedule(card, 0, -1)}
                              className="p-1 rounded-lg bg-black border border-white/[0.05] hover:bg-accent-blue text-slate-400 hover:text-white transition-all shadow-md"
                              title="Contract Due -1 Day"
                            >
                              <ChevronLeft size={10} />
                            </button>
                            <button
                              onClick={() => handleReschedule(card, 0, 1)}
                              className="p-1 rounded-lg bg-black border border-white/[0.05] hover:bg-accent-blue text-slate-400 hover:text-white transition-all shadow-md"
                              title="Extend Due +1 Day"
                            >
                              <ChevronRight size={10} />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      /* Gray Unscheduled Placeholder bar */
                      <div 
                        className="col-span-14 h-12 bg-white/[0.01] border border-dashed border-white/[0.05] rounded-xl flex items-center justify-between px-6 text-slate-600 hover:border-slate-500 hover:text-slate-400 transition-all z-10"
                      >
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle size={12} className="text-slate-500" />
                          <span className="font-mono text-[0.55rem] uppercase tracking-widest font-bold">Unscheduled Milestone</span>
                        </div>
                        
                        {!isViewer && (
                          <button
                            onClick={() => handleQuickSchedule(card)}
                            className="px-3.5 py-1.5 bg-white/[0.02] border border-white/[0.05] hover:bg-accent-blue hover:text-white hover:border-accent-blue rounded-lg font-mono text-[0.55rem] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 active:scale-95"
                          >
                            <Plus size={10} /> Schedule Task
                          </button>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

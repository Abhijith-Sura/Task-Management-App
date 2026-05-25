import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CalendarView Component
 * Renders a calendar interface displaying tasks based on their due dates.
 * 
 * @param {Object} props - The component props.
 * @param {Array} props.lists - The lists containing cards/tasks to display.
 * @param {Function} props.onCardSelect - Callback function triggered when a card is clicked.
 * @returns {JSX.Element} The rendered calendar view.
 */
export const CalendarView = ({ lists, onCardSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Flatten all cards from the lists into a single array for easier filtering by date
  const allCards = lists?.flatMap(list => 
    list.cards?.map(card => ({ ...card, listTitle: list.title })) || []
  ) || [];

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = [];
  const totalDays = daysInMonth(year, month);
  const startOffset = firstDayOfMonth(year, month);

  // Add null padding for the days of the previous month before the 1st of the current month
  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }

  // Add the actual days of the current month
  for (let i = 1; i <= totalDays; i++) {
    days.push(new Date(year, month, i));
  }

  // Add null padding for the next month to complete the grid (ensuring a multiple of 7 cells)
  const totalCells = Math.ceil(days.length / 7) * 7;
  const endOffset = totalCells - days.length;
  for (let i = 0; i < endOffset; i++) {
    days.push(null);
  }

  /**
   * Navigates the calendar by a specified number of months.
   * @param {number} direction - 1 for next month, -1 for previous month.
   */
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  /**
   * Normalizes a date input to a local YYYY-MM-DD string format.
   * Resolves issues where UTC midnight dates shift by a day depending on the local timezone.
   * @param {string|Date} dateInput - The date to format.
   * @returns {string} The formatted YYYY-MM-DD string.
   */
  const formatLocalDate = (dateInput) => {
    if (!dateInput) return '';
    const dateStr = typeof dateInput === 'string' ? dateInput : new Date(dateInput).toISOString();
    
    // Check if the date string signifies UTC midnight
    const isUtcMidnight = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) || dateStr.endsWith('T00:00:00.000Z') || dateStr.endsWith('T00:00:00.000+00:00') || dateStr.includes('T00:00:00');
    
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    
    if (isUtcMidnight) {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } else {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  };

  /**
   * Retrieves all tasks/cards assigned to a specific date.
   * @param {Date} date - The date to filter cards by.
   * @returns {Array} An array of cards due on the given date.
   */
  const getCardsForDate = (date) => {
    if (!date) return [];
    const cellDateStr = formatLocalDate(date);

    return allCards.filter(card => {
      if (!card.dueDate) return false;
      return formatLocalDate(card.dueDate) === cellDateStr;
    });
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="h-full flex flex-col bg-surface border border-white/[0.05] rounded-2xl overflow-hidden shadow-soft animate-in fade-in slide-in-from-right-4 duration-500 min-h-[600px]">
      <header className="p-6 border-b border-white/[0.03] bg-white/[0.01] flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-accent-blue/10 rounded-lg text-accent-blue">
            <CalendarIcon size={18} />
          </div>
          <h3 className="text-xl font-display font-bold text-white tracking-tight">
            {monthNames[month]} <span className="text-slate-500 font-medium">{year}</span>
          </h3>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-white/[0.02] border border-white/[0.05] p-1 rounded-xl">
            <button 
              onClick={() => navigateMonth(-1)}
              className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              title="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-1.5 text-[0.65rem] font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all uppercase tracking-widest"
            >
              Today
            </button>
            <button 
              onClick={() => navigateMonth(1)}
              className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              title="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-7 border-b border-white/[0.03] bg-white/[0.01]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-4 text-center text-[0.65rem] font-bold text-slate-500 uppercase tracking-[0.2em]">
            {day}
          </div>
        ))}
      </div>

      <div 
        className="flex-1 grid grid-cols-7 overflow-y-auto scrollbar-thin divide-x divide-y divide-white/[0.02]"
      >
        {days.map((date, idx) => {
          const cards = getCardsForDate(date);
          const isToday = date?.toDateString() === new Date().toDateString();

          return (
            <div 
              key={idx} 
              className={`min-h-[140px] p-3 flex flex-col gap-2 transition-colors hover:bg-white/[0.01] ${
                !date ? 'bg-white/[0.01]' : ''
              } ${isToday ? 'bg-accent-blue/[0.02]' : ''}`}
            >
              {date && (
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-display font-bold ${isToday ? 'text-accent-blue' : 'text-slate-600'}`}>
                    {date.getDate()}
                  </span>
                  {cards.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[0.6rem] font-bold text-slate-500">{cards.length}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-blue shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto scrollbar-none pr-0.5">
                {cards.map(card => (
                  <motion.div
                    key={card._id}
                    whileHover={{ x: 2, scale: 1.02 }}
                    onClick={() => onCardSelect(card)}
                    className="p-2 bg-surface border border-white/[0.05] rounded-xl cursor-pointer hover:border-accent-blue/40 hover:shadow-soft transition-all group"
                  >
                    <div className="text-[0.65rem] font-bold text-white truncate tracking-tight group-hover:text-accent-blue transition-colors mb-1">
                      {card.title}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        card.priority === 'high' ? 'bg-red-500' : 
                        card.priority === 'medium' ? 'bg-amber-500' : 
                        'bg-emerald-500'
                      }`} />
                      <span className="text-[0.55rem] font-bold text-slate-500 uppercase tracking-widest truncate">{card.listTitle}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

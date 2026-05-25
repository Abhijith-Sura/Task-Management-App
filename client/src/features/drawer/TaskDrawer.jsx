import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, ShieldCheck, User, Paperclip, Upload, FileText, MessageSquare, Activity, CheckSquare, Plus, Database, Tag as TagIcon, DollarSign, Clock as ClockIcon, Trash2, CheckCircle2, Image, Sparkles } from 'lucide-react';
import { ActivityLog } from './ActivityLog';
import { CommentSection } from './CommentSection';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DescriptionEditor } from './DescriptionEditor';

import { socketService } from '../../services/socket';
import api from '../../services/api';

/**
 * Formats a given date input into a local YYYY-MM-DD string.
 * Handles UTC midnight dates properly to avoid timezone offset issues.
 *
 * @param {string|Date} dateInput - The date to format.
 * @returns {string} The formatted local date string.
 */
const formatLocalDate = (dateInput) => {
  if (!dateInput) return '';
  const dateStr = typeof dateInput === 'string' ? dateInput : new Date(dateInput).toISOString();
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
 * TaskDrawer Component
 * 
 * A comprehensive side drawer displaying detailed information about a specific task/card.
 * Includes sections for overview, discussion, activity, checklist, labels, assignees, and AI autopilot features.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {Object} props.task - The task/card data object.
 * @param {Function} props.onClose - Callback function triggered to close the drawer.
 * @param {string} props.activeBoardId - The ID of the active board containing this task.
 * @param {Array<Object>} [props.members=[]] - Array of all board members available for assignment.
 * @param {Array<Object>} [props.boardLabels=[]] - Array of all available labels for the board.
 * @param {Function} props.onUpdateCard - Callback function triggered to update card properties.
 * @param {Function} props.onDeleteCard - Callback function triggered to delete the card.
 * @param {Function} props.onUploadAttachment - Callback function triggered to upload a file attachment.
 * @param {Function} props.onAddComment - Callback function triggered to add a comment to the task.
 * @param {boolean} props.isViewer - Indicates if the user is in view-only mode.
 * @returns {React.ReactElement} The rendered TaskDrawer component.
 */
export const TaskDrawer = ({ task, onClose, activeBoardId, members = [], boardLabels = [], onUpdateCard, onDeleteCard, onUploadAttachment, onAddComment, isViewer }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [isTagOpen, setIsTagOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [viewers, setViewers] = useState([]);

  // AI States
  const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const handleAIAutopilot = async () => {
    if (isViewer) return;
    setIsGeneratingChecklist(true);
    try {
      const { data } = await api.post('/ai/generate-subtasks', { cardId: task._id });
      if (data?.success && data?.data) {
        onUpdateCard(task._id, { checklists: data.data.checklists });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to auto-generate subtasks');
    } finally {
      setIsGeneratingChecklist(false);
    }
  };

  const handleGenerateAISummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const { data } = await api.post('/ai/summarize-discussion', { cardId: task._id });
      if (data?.success && data?.data) {
        setAiSummary(data.data.summary);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate discussion summary');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // --- Presence Logic ---
  React.useEffect(() => {
    if (!task?._id) return;

    // Join card room
    socketService.joinCard(activeBoardId, task._id, {
      _id: currentUser._id,
      name: currentUser.name,
      avatar: currentUser.avatar
    });

    // Listen for updates
    const handleViewersUpdate = (data) => {
      if (data.cardId === task._id) {
        setViewers(data.viewers.filter(v => v._id !== currentUser._id));
      }
    };

    socketService.onCardViewersUpdated(handleViewersUpdate);

    return () => {
      socketService.leaveCard(activeBoardId, task._id, currentUser._id);
    };
  }, [task?._id, activeBoardId]);

  const updateMetadata = (key, value) => {
    if (isViewer) return;
    const updatedMetadata = { ...(task.metadata || {}), [key]: value };
    onUpdateCard(task._id, { metadata: updatedMetadata });
  };

  const getDueDateCountdownText = () => {
    if (!task?.dueDate) return '';
    if (task.dueDateCompleted) return ' (Completed)';
    const due = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return ` (${Math.abs(diffDays)}d overdue)`;
    } else if (diffDays === 0) {
      return ' (Due today)';
    } else if (diffDays === 1) {
      return ' (Due tomorrow)';
    } else {
      return ` (${diffDays}d left)`;
    }
  };

  const addChecklistItem = () => {
    if (isViewer || !newChecklistItem.trim()) return;
    const updatedChecklists = [...(task.checklists || []), { text: newChecklistItem, completed: false }];
    onUpdateCard(task._id, { checklists: updatedChecklists });
    setNewChecklistItem('');
  };

  const toggleChecklistItem = (idx) => {
    if (isViewer) return;
    const updatedChecklists = [...(task.checklists || [])];
    updatedChecklists[idx].completed = !updatedChecklists[idx].completed;
    onUpdateCard(task._id, { checklists: updatedChecklists });
  };

  const removeChecklistItem = (idx) => {
    if (isViewer) return;
    const updatedChecklists = task.checklists.filter((_, i) => i !== idx);
    onUpdateCard(task._id, { checklists: updatedChecklists });
  };

  const isGradient = task.coverUrl && (task.coverUrl.startsWith('linear-gradient') || task.coverUrl.startsWith('rgb') || task.coverUrl.startsWith('#'));

  return (
    <div className="h-full flex flex-col bg-surface border-l border-border shadow-2xl overflow-hidden">
      {task.coverUrl && (
        <div 
          className="h-56 w-full relative flex-shrink-0 border-b border-white/[0.05]"
          style={{
            backgroundImage: isGradient ? task.coverUrl : `url(${task.coverUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#0E0E12'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
        </div>
      )}
      
      <header className={`px-8 pt-8 ${!task.coverUrl ? 'pb-0' : '-mt-16 relative z-10'}`}>
        <div className="flex justify-between items-start mb-3">
          <div className="font-mono text-accent-blue text-[0.65rem] font-bold tracking-[0.2em] uppercase bg-accent-blue/10 border border-accent-blue/20 px-2.5 py-1 rounded-md flex items-center gap-2 backdrop-blur-md">
            {isViewer && <span>🔒</span>}
            Task Details {isViewer && <span className="opacity-60">(View Only)</span>}
          </div>
          
          <div className="flex items-center gap-4 bg-surface/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5">
            {/* Presence Indicators */}
            <div className="flex -space-x-2">
              <AnimatePresence>
                {viewers.map((viewer, idx) => (
                  <motion.div
                    key={viewer.socketId || viewer._id || idx}
                    initial={{ scale: 0, opacity: 0, x: 10 }}
                    animate={{ scale: 1, opacity: 1, x: 0 }}
                    exit={{ scale: 0, opacity: 0, x: 10 }}
                    className="w-7 h-7 rounded-full border border-surface bg-accent-amber/20 flex items-center justify-center text-[0.6rem] font-bold text-accent-amber ring-2 ring-surface relative group shadow-lg"
                    title={`${viewer.name} is viewing`}
                  >
                    {viewer.name?.charAt(0).toUpperCase()}
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-surface animate-pulse" />
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-[#1A1A20] border border-white/10 rounded text-[0.55rem] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                      {viewer.name} (Viewing)
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <button 
              onClick={onClose}
              className="text-[#A1A1AA] hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        <h2 className="text-3xl font-display font-bold text-white mt-4 mb-8 tracking-tight leading-snug drop-shadow-md">
          {task.title}
        </h2>
        
        {/* Tab Navigation */}
        <div className="flex gap-10 border-b border-white/[0.05]">
          {[
            { id: 'details', label: 'Overview', icon: <FileText size={14} /> },
            { id: 'comments', label: 'Discussion', icon: <MessageSquare size={14} /> },
            { id: 'activity', label: 'Activity', icon: <Activity size={14} /> }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 font-mono text-[0.65rem] uppercase tracking-[0.2em] font-bold transition-all relative flex items-center gap-2 ${
                activeTab === tab.id ? 'text-accent-blue' : 'text-[#82828C] hover:text-[#FAFAFA]'
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="drawer-tab" 
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-blue shadow-[0_0_12px_rgba(59,130,246,0.8)]" 
                />
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="p-6 flex-1 overflow-y-auto scrollbar-thin">
        {activeTab === 'details' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Properties Grid */}
            <section>
              <h3 className="font-mono text-[0.7rem] text-[#A1A1AA] uppercase mb-4 tracking-[0.2em] flex items-center gap-2">
                <Database size={14} /> Properties
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.02] border border-border p-4 rounded-sm hover:border-accent-blue/20 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={12} className="text-[#A1A1AA]" />
                    <span className="font-mono text-[0.6rem] text-[#A1A1AA] uppercase">Budget</span>
                  </div>
                  <input 
                    type="number"
                    value={task.metadata?.budget || ''}
                    onChange={(e) => updateMetadata('budget', parseFloat(e.target.value) || 0)}
                    readOnly={isViewer}
                    className="w-full bg-transparent font-mono text-xs text-accent-blue font-bold focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div className="bg-white/[0.02] border border-border p-4 rounded-sm hover:border-accent-blue/20 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <ClockIcon size={12} className="text-[#A1A1AA]" />
                    <span className="font-mono text-[0.6rem] text-[#A1A1AA] uppercase">
                      Due Date<span className="text-accent-blue font-bold">{getDueDateCountdownText()}</span>
                    </span>
                  </div>
                  <input 
                    type="date"
                    value={formatLocalDate(task.dueDate)}
                    onChange={(e) => onUpdateCard(task._id, { dueDate: e.target.value })}
                    disabled={isViewer}
                    className="w-full bg-transparent font-mono text-xs text-accent-blue font-bold focus:outline-none [color-scheme:dark] disabled:opacity-75"
                  />
                </div>
                <div className="bg-white/[0.02] border border-border p-4 rounded-sm col-span-2 hover:border-accent-blue/20 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare size={12} className="text-[#A1A1AA]" />
                    <span className="font-mono text-[0.6rem] text-[#A1A1AA] uppercase">Department</span>
                  </div>
                  <select 
                    value={task.metadata?.department || ''}
                    onChange={(e) => updateMetadata('department', e.target.value)}
                    disabled={isViewer}
                    className="w-full bg-transparent font-mono text-xs text-accent-blue font-bold focus:outline-none appearance-none disabled:opacity-75"
                  >
                    <option value="" className="bg-surface">Not Assigned</option>
                    <option value="Engineering" className="bg-surface">Engineering</option>
                    <option value="Marketing" className="bg-surface">Marketing</option>
                    <option value="Design" className="bg-surface">Design</option>
                    <option value="Finance" className="bg-surface">Finance</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Performance & Tracking Analytics */}
            <section className="bg-white/[0.01] border border-white/[0.03] p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
                <h4 className="font-mono text-[0.7rem] text-[#A1A1AA] uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                  <Activity size={14} className="text-accent-blue" />
                  Performance Metrics
                </h4>
                {task.dueDate && (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={!!task.dueDateCompleted}
                      disabled={isViewer}
                      onChange={(e) => onUpdateCard(task._id, { dueDateCompleted: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-900 text-accent-blue focus:ring-accent-blue focus:ring-opacity-50"
                    />
                    <span className="font-mono text-[0.6rem] uppercase tracking-wider text-slate-400">Mark Due Date Done</span>
                  </label>
                )}
              </div>

              {/* Progress and status indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Budget Management Card */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[0.6rem] text-slate-500 uppercase tracking-widest font-bold">Cost Utilization</span>
                    {task.metadata?.budget > 0 && (
                      <span className={`text-[0.6rem] font-mono font-bold px-2 py-0.5 rounded border ${
                        (task.metadata?.actualCost || 0) > task.metadata.budget 
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}>
                        {(task.metadata?.actualCost || 0) > task.metadata.budget ? 'Over Budget' : 'On Track'}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface/50 border border-white/[0.03] p-3 rounded-xl">
                      <span className="block text-[0.55rem] font-mono text-slate-600 uppercase tracking-wider">Estimated Budget</span>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-slate-500 font-bold">$</span>
                        <input 
                          type="number"
                          value={task.metadata?.budget || ''}
                          onChange={(e) => updateMetadata('budget', parseFloat(e.target.value) || 0)}
                          readOnly={isViewer}
                          className="w-full bg-transparent font-mono text-sm text-white font-bold focus:outline-none"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="bg-surface/50 border border-white/[0.03] p-3 rounded-xl">
                      <span className="block text-[0.55rem] font-mono text-slate-600 uppercase tracking-wider">Actual Spent Cost</span>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-slate-500 font-bold">$</span>
                        <input 
                          type="number"
                          value={task.metadata?.actualCost || ''}
                          onChange={(e) => updateMetadata('actualCost', parseFloat(e.target.value) || 0)}
                          readOnly={isViewer}
                          className="w-full bg-transparent font-mono text-sm text-white font-bold focus:outline-none"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Budget Progress Bar */}
                  {task.metadata?.budget > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[0.55rem] font-mono text-slate-500">
                        <span>Burn Rate</span>
                        <span>
                          ${task.metadata.actualCost || 0} / ${task.metadata.budget} ({Math.round(((task.metadata.actualCost || 0) / task.metadata.budget) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            (task.metadata.actualCost || 0) > task.metadata.budget ? 'bg-rose-500 animate-pulse' : 'bg-gradient-to-r from-emerald-500 to-accent-blue'
                          }`}
                          style={{ width: `${Math.min(100, ((task.metadata.actualCost || 0) / task.metadata.budget) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Effort Tracking Card */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[0.6rem] text-slate-500 uppercase tracking-widest font-bold">Effort & Hour Logs</span>
                    {task.metadata?.estimatedHours > 0 && (
                      <span className={`text-[0.6rem] font-mono font-bold px-2 py-0.5 rounded border ${
                        (task.metadata?.actualHours || 0) > task.metadata.estimatedHours 
                          ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' 
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}>
                        {(task.metadata?.actualHours || 0) > task.metadata.estimatedHours ? 'Hours Exceeded' : 'On Schedule'}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface/50 border border-white/[0.03] p-3 rounded-xl">
                      <span className="block text-[0.55rem] font-mono text-slate-600 uppercase tracking-wider">Estimated Hours</span>
                      <input 
                        type="number"
                        value={task.metadata?.estimatedHours || ''}
                        onChange={(e) => updateMetadata('estimatedHours', parseFloat(e.target.value) || 0)}
                        readOnly={isViewer}
                        className="w-full bg-transparent font-mono text-sm text-white font-bold focus:outline-none mt-1"
                        placeholder="Hours"
                      />
                    </div>

                    <div className="bg-surface/50 border border-white/[0.03] p-3 rounded-xl">
                      <span className="block text-[0.55rem] font-mono text-slate-600 uppercase tracking-wider">Logged Hours</span>
                      <input 
                        type="number"
                        value={task.metadata?.actualHours || ''}
                        onChange={(e) => updateMetadata('actualHours', parseFloat(e.target.value) || 0)}
                        readOnly={isViewer}
                        className="w-full bg-transparent font-mono text-sm text-white font-bold focus:outline-none mt-1"
                        placeholder="Hours"
                      />
                    </div>
                  </div>

                  {/* Hours Progress Bar */}
                  {task.metadata?.estimatedHours > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[0.55rem] font-mono text-slate-500">
                        <span>Time Utilized</span>
                        <span>
                          {task.metadata.actualHours || 0} hrs / {task.metadata.estimatedHours} hrs ({Math.round(((task.metadata.actualHours || 0) / task.metadata.estimatedHours) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            (task.metadata.actualHours || 0) > task.metadata.estimatedHours ? 'bg-orange-500' : 'bg-gradient-to-r from-emerald-500 to-indigo-500'
                          }`}
                          style={{ width: `${Math.min(100, ((task.metadata.actualHours || 0) / task.metadata.estimatedHours) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Description */}
            <section>
              <h3 className="font-mono text-[0.7rem] text-[#A1A1AA] uppercase mb-4 tracking-[0.2em]">Description</h3>
              <DescriptionEditor 
                value={task.description} 
                onChange={(val) => {}} 
                onSave={(newDesc) => onUpdateCard(task._id, { description: newDesc })}
                isViewer={isViewer}
              />
            </section>
            
            {/* Priority & ID */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-background/50 p-4 border border-border rounded-sm">
                <div className="font-mono text-[0.6rem] text-[#A1A1AA] uppercase mb-1">Task ID</div>
                <div className="font-mono text-xs text-accent-blue font-bold tracking-tighter">
                  {task?._id?.toUpperCase() || 'UNKNOWN'}
                </div>
              </div>
              <div className="bg-background/50 p-4 border border-border rounded-sm">
                <div className="font-mono text-[0.6rem] text-[#A1A1AA] uppercase mb-2">Priority</div>
                <div className="flex gap-2">
                  {['low', 'medium', 'high'].map((p) => (
                    <button
                      key={p}
                      onClick={() => onUpdateCard(task._id, { priority: p })}
                      disabled={isViewer}
                      className={`px-2 py-0.5 font-mono text-[0.55rem] uppercase border rounded-sm transition-all disabled:opacity-60 ${
                        task.priority === p 
                          ? 'bg-accent-blue text-white border-accent-blue shadow-[0_0_8px_rgba(59,130,246,0.3)]' 
                          : 'text-[#A1A1AA] border-border hover:border-[#A1A1AA]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Checklist */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-mono text-[0.7rem] text-[#A1A1AA] uppercase tracking-[0.2em] flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-accent-blue" /> Checklist
                </h3>
                <div className="flex items-center gap-4">
                  {!isViewer && (
                    <button
                      onClick={handleAIAutopilot}
                      disabled={isGeneratingChecklist}
                      className="px-2.5 py-1 bg-accent-blue/10 hover:bg-accent-blue text-accent-blue hover:text-white border border-accent-blue/20 rounded font-mono text-[0.55rem] uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <Sparkles size={11} className={isGeneratingChecklist ? "animate-spin" : "animate-pulse"} />
                      <span>{isGeneratingChecklist ? "Generating..." : "AI Autopilot"}</span>
                    </button>
                  )}
                  {task.checklists?.length > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1 bg-border rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent-blue transition-all duration-500" 
                          style={{ width: `${Math.round((task.checklists.filter(c => c.completed).length / task.checklists.length) * 100)}%` }} 
                        />
                      </div>
                      <span className="font-mono text-[0.6rem] text-accent-blue font-bold">
                        {Math.round((task.checklists.filter(c => c.completed).length / task.checklists.length) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {task.checklists?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white/[0.01] border border-border rounded-sm group hover:border-accent-blue/30 transition-all">
                    <input 
                      type="checkbox" 
                      checked={item.completed}
                      onChange={() => toggleChecklistItem(idx)}
                      disabled={isViewer}
                      className="accent-accent-blue w-4 h-4 cursor-pointer disabled:opacity-50"
                    />
                    <span className={`text-xs font-mono flex-1 transition-all ${item.completed ? 'text-[#A1A1AA] line-through' : 'text-[#FAFAFA]'}`}>
                      {item.text}
                    </span>
                    {!isViewer && (
                      <button 
                        onClick={() => removeChecklistItem(idx)}
                        className="opacity-0 group-hover:opacity-100 text-[#A1A1AA] hover:text-red-500 p-1 transition-all"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                
                {!isViewer && (
                  <div className="mt-4 flex gap-2">
                    <input 
                      type="text"
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                      placeholder="Add an item..."
                      className="flex-1 bg-white/[0.03] border border-border rounded-sm px-3 py-2 font-mono text-xs text-[#FAFAFA] focus:outline-none focus:border-accent-blue"
                    />
                    <button 
                      onClick={addChecklistItem}
                      className="px-4 bg-accent-blue/10 border border-accent-blue/30 text-accent-blue hover:bg-accent-blue hover:text-white transition-all font-mono text-[0.7rem] uppercase tracking-widest rounded-sm"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Assignees */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-mono text-[0.7rem] text-[#A1A1AA] uppercase tracking-[0.2em] flex items-center gap-2">
                  <UserPlus size={14} className="text-accent-blue" /> Assignees
                </h3>
                {!isViewer && (
                  <button 
                    onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
                    className="p-1 hover:bg-white/[0.05] rounded-sm text-accent-blue transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {task.assignees?.map((assignee) => (
                  <div key={assignee._id} className="flex items-center justify-between p-3 bg-white/[0.01] border border-border rounded-sm group">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-[0.65rem] font-bold text-accent-blue">
                        {assignee.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-mono text-[#FAFAFA]">{assignee.name}</span>
                    </div>
                    {!isViewer && (
                      <button 
                        onClick={() => {
                          const newAssignees = task.assignees.filter(a => a._id !== assignee._id).map(a => a._id);
                          onUpdateCard(task._id, { assignees: newAssignees });
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[0.6rem] font-mono text-red-500 hover:bg-red-500/10 px-2 py-1 rounded-sm transition-all uppercase"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}

                {isAssigneeOpen && (
                  <div className="mt-2 p-4 bg-surface border border-accent-blue/30 rounded-sm shadow-xl animate-in fade-in zoom-in-95 duration-200 z-10">
                    <div className="font-mono text-[0.6rem] text-[#A1A1AA] uppercase mb-3 tracking-widest">Available Members</div>
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                      {members.filter(m => !task.assignees?.some(a => a._id === m._id)).map(member => (
                        <div 
                          key={member._id}
                          onClick={() => {
                            const newAssignees = [...(task.assignees?.map(a => a._id) || []), member._id];
                            onUpdateCard(task._id, { assignees: newAssignees });
                            setIsAssigneeOpen(false);
                          }}
                          className="flex items-center gap-3 p-2 hover:bg-white/[0.05] cursor-pointer rounded-sm transition-colors group"
                        >
                          <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center text-[0.6rem] font-bold text-[#A1A1AA] group-hover:bg-accent-blue/20 group-hover:text-accent-blue transition-colors">
                            {member.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-mono text-[#A1A1AA] group-hover:text-[#FAFAFA] transition-colors">{member.name}</span>
                        </div>
                      ))}
                      {members.length === 0 && <div className="text-[0.6rem] font-mono text-[#A1A1AA]/50 italic p-2 text-center">No members found</div>}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Labels */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-mono text-[0.7rem] text-[#A1A1AA] uppercase tracking-[0.2em] flex items-center gap-2">
                  <TagIcon size={14} className="text-accent-blue" /> Labels
                </h3>
                {!isViewer && (
                  <button 
                    onClick={() => setIsTagOpen(!isTagOpen)}
                    className="p-1 hover:bg-white/[0.05] rounded-sm text-accent-blue transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {task.labels?.map((label, idx) => (
                  <div 
                    key={idx} 
                    className="group flex items-center gap-2 px-3 py-1 rounded-full border transition-all"
                    style={{ 
                      backgroundColor: `${label.color}10`, 
                      borderColor: `${label.color}40`,
                      color: label.color 
                    }}
                  >
                    <span className="text-[0.6rem] font-bold uppercase tracking-widest">{label.text}</span>
                    {!isViewer && (
                      <button 
                        onClick={() => {
                          const newLabels = task.labels.filter((_, i) => i !== idx);
                          onUpdateCard(task._id, { labels: newLabels });
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-0.5"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                ))}
                {(!task.labels || task.labels.length === 0) && (
                  <span className="text-[0.6rem] font-mono text-slate-500 italic">No labels assigned</span>
                )}
              </div>
              
              {isTagOpen && (
                <div className="mt-2 p-4 bg-surface border border-accent-blue/30 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-20 relative">
                  <div className="font-mono text-[0.6rem] text-[#A1A1AA] uppercase mb-3 tracking-widest flex justify-between items-center">
                    <span>Select Tag</span>
                    <button onClick={() => setIsTagOpen(false)} className="text-slate-500 hover:text-white"><X size={12} /></button>
                  </div>
                  
                  {/* Search Existing Tags */}
                  <input 
                    type="text"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder="Search or create label..."
                    className="w-full bg-white/[0.03] border border-border rounded-lg px-3 py-2 font-mono text-xs text-[#FAFAFA] focus:outline-none focus:border-accent-blue mb-3"
                  />
                  
                  {/* Existing Board Labels List */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin mb-4">
                    {boardLabels
                      .filter(l => l.text?.toLowerCase().includes(tagSearch.toLowerCase()))
                      .map((label, idx) => {
                        const isAssigned = task.labels?.some(l => l.text === label.text && l.color === label.color);
                        return (
                          <div 
                            key={idx}
                            onClick={() => {
                              let newLabels;
                              if (isAssigned) {
                                newLabels = task.labels.filter(l => !(l.text === label.text && l.color === label.color));
                              } else {
                                newLabels = [...(task.labels || []), label];
                              }
                              onUpdateCard(task._id, { labels: newLabels });
                            }}
                            className="flex items-center justify-between p-2 hover:bg-white/[0.05] cursor-pointer rounded-lg transition-colors group"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }} />
                              <span className="text-xs font-mono text-[#A1A1AA] group-hover:text-white transition-colors">{label.text}</span>
                            </div>
                            <input 
                              type="checkbox"
                              checked={isAssigned}
                              readOnly
                              className="accent-accent-blue cursor-pointer"
                            />
                          </div>
                        );
                      })}
                    {boardLabels.length === 0 && (
                      <div className="text-[0.6rem] font-mono text-[#A1A1AA]/50 italic p-2 text-center">No board tags found</div>
                    )}
                  </div>
                  
                  {/* Quick Color Picker to Create a New Tag */}
                  <div className="border-t border-border pt-3">
                    <div className="text-[0.55rem] font-mono text-slate-500 uppercase tracking-wider mb-2">Create New Tag</div>
                    <div className="flex gap-2.5 justify-between">
                      {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'].map(color => (
                        <button
                          key={color}
                          onClick={() => {
                            const text = tagSearch.trim();
                            if (text) {
                              const newLabels = [...(task.labels || []), { text, color }];
                              onUpdateCard(task._id, { labels: newLabels });
                              setTagSearch('');
                              setIsTagOpen(false);
                            } else if (window.showPremiumPrompt) {
                              window.showPremiumPrompt(
                                "Create Label",
                                "Enter label name...",
                                "",
                                (labelText) => {
                                  if (labelText.trim()) {
                                    const newLabels = [...(task.labels || []), { text: labelText.trim(), color }];
                                    onUpdateCard(task._id, { labels: newLabels });
                                    setTagSearch('');
                                    setIsTagOpen(false);
                                  }
                                }
                              );
                            } else {
                              const fallbackText = prompt('Label Name:');
                              if (fallbackText) {
                                const newLabels = [...(task.labels || []), { text: fallbackText, color }];
                                onUpdateCard(task._id, { labels: newLabels });
                                setTagSearch('');
                                setIsTagOpen(false);
                              }
                            }
                          }}
                          className="w-6 h-6 rounded-full border border-white/5 hover:scale-110 transition-all shadow-md"
                          style={{ backgroundColor: color }}
                          title={`Create tag with this color`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Card Cover */}
            {!isViewer && (
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-mono text-[0.7rem] text-[#A1A1AA] uppercase tracking-[0.2em] flex items-center gap-2">
                    <Image size={14} className="text-accent-blue" /> Card Cover
                  </h3>
                  {task.coverUrl && (
                    <button 
                      onClick={() => onUpdateCard(task._id, { coverUrl: null })}
                      className="font-mono text-[0.55rem] text-red-500 hover:text-red-400 uppercase tracking-widest bg-red-500/10 px-2.5 py-1 rounded-lg transition-all"
                    >
                      Remove Cover
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { value: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', label: 'Classic Blue' },
                    { value: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)', label: 'Neon Rose' },
                    { value: 'linear-gradient(135deg, #10B981 0%, #047857 100%)', label: 'Emerald Mint' },
                    { value: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)', label: 'Sunset Amber' },
                    { value: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80', label: 'Silk Violet' },
                    { value: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80', label: '3D Spheres' },
                    { value: 'https://images.unsplash.com/photo-1618005198143-d3667c29fb5a?w=800&auto=format&fit=crop&q=80', label: 'Neon Cyberpunk' },
                    { value: '/nano_banana.png', label: 'Nano Banana ✨' }
                  ].map((cov, idx) => {
                    const isCovGradient = cov.value.startsWith('linear-gradient');
                    const isSelected = task.coverUrl === cov.value;
                    return (
                      <button
                        key={idx}
                        onClick={() => onUpdateCard(task._id, { coverUrl: cov.value })}
                        className={`h-12 rounded-xl relative overflow-hidden transition-all duration-300 ring-offset-2 ring-offset-[#09090B] border ${
                          isSelected 
                            ? 'ring-2 ring-accent-blue scale-95 border-accent-blue/60 shadow-[0_0_15px_rgba(79,70,229,0.3)]' 
                            : 'border-white/[0.08] hover:border-white/[0.2] hover:scale-105 hover:shadow-[0_4px_12px_rgba(255,255,255,0.03)]'
                        }`}
                        style={{
                          backgroundImage: isCovGradient ? cov.value : `url(${cov.value})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundColor: '#0E0E12'
                        }}
                        title={cov.label}
                      >
                        {isSelected && (
                          <div className="absolute inset-0 bg-accent-blue/15 flex items-center justify-center backdrop-blur-[1px]">
                            <div className="w-5 h-5 bg-accent-blue text-white rounded-full flex items-center justify-center shadow-lg border border-white/20 animate-scale-in">
                              <ShieldCheck size={11} className="stroke-[3px]" />
                            </div>
                          </div>
                        )}
                        
                        {/* Elegant overlay to see details on dark cards */}
                        <div className="absolute bottom-1 left-1.5 opacity-0 hover:opacity-100 transition-opacity bg-black/60 rounded px-1 py-0.5 text-[0.45rem] text-slate-400 font-mono pointer-events-none uppercase">
                          {cov.label.split(' ')[0]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Attachments */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-mono text-[0.7rem] text-[#A1A1AA] uppercase tracking-[0.2em] flex items-center gap-2">
                  <Paperclip size={14} className="text-accent-blue" /> Attachments
                </h3>
                {!isViewer && (
                  <label className="cursor-pointer p-1.5 hover:bg-white/[0.05] rounded-sm text-accent-blue transition-all border border-transparent hover:border-accent-blue/20">
                    <Upload size={16} />
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) onUploadAttachment(task._id, file);
                      }} 
                    />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {task.attachments?.map((att, idx) => {
                  const url = typeof att === 'string' ? att : att.url;
                  const name = typeof att === 'string' ? url.split(/[\\/]/).pop() : att.name;
                  const rawUrl = url.startsWith('http') ? url : `${API_BASE}${url.replace(/\\/g, '/')}`;
                  const fullUrl = encodeURI(rawUrl);
                  
                  return (
                    <a 
                      key={idx} 
                      href={fullUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-white/[0.01] border border-border rounded-sm hover:border-accent-blue group transition-all"
                    >
                      <FileText size={18} className="text-[#A1A1AA] group-hover:text-accent-blue" />
                      <div className="flex-1 overflow-hidden">
                        <div className="text-[0.65rem] font-mono text-[#FAFAFA] truncate" title={name}>{name}</div>
                        <div className="text-[0.55rem] font-mono text-[#A1A1AA] uppercase">View File</div>
                      </div>
                    </a>
                  );
                })}
                {(!task.attachments || task.attachments.length === 0) && (
                  <div className="col-span-2 py-6 border border-dashed border-border text-center text-[0.65rem] font-mono text-[#A1A1AA]/40 italic rounded-sm">
                    No attachments uploaded
                  </div>
                )}
              </div>
            </section>

            {/* Footer Actions */}
            <div className="mt-12 pt-8 border-t border-border/50 flex gap-4">
              {!isViewer ? (
                <>
                  <button 
                    onClick={() => {
                      if (confirm("Permanently delete this task? This action cannot be undone.")) {
                        onDeleteCard(task._id);
                      }
                    }}
                    className="w-1/3 py-3 border border-red-500/30 text-red-500 font-mono text-[0.7rem] font-bold rounded-sm hover:bg-red-500/10 transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} /> Delete Task
                  </button>
                  <button 
                    onClick={() => onClose()}
                    className="w-2/3 py-3 bg-accent-blue text-white font-mono text-[0.7rem] font-bold rounded-sm hover:bg-blue-600 transition-all uppercase tracking-[0.2em] shadow-lg shadow-accent-blue/20"
                  >
                    Save & Close
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => onClose()}
                  className="w-full py-3 bg-[#18181B] border border-border text-[#FAFAFA] hover:bg-white/5 font-mono text-[0.7rem] font-bold rounded-sm transition-all uppercase tracking-[0.2em] shadow-lg"
                >
                  Close Task Details
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
             <h3 className="font-mono text-[0.7rem] text-[#A1A1AA] uppercase mb-6 tracking-[0.2em] flex items-center gap-2">
               <MessageSquare size={14} className="text-accent-blue" /> Project Discussion
             </h3>

             {/* AI Summary Box */}
             <div className="mb-6 p-6 bg-gradient-to-br from-indigo-500/[0.02] to-accent-blue/[0.05] border border-accent-blue/20 rounded-2xl relative shadow-lg">
               <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                 <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-lg bg-accent-blue/20 flex items-center justify-center border border-accent-blue/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                     <Sparkles size={12} className="text-accent-blue" />
                   </div>
                   <span className="font-mono text-[0.7rem] text-white font-bold uppercase tracking-[0.15em] drop-shadow-sm">AI Summary</span>
                 </div>
                 <button
                   onClick={handleGenerateAISummary}
                   disabled={isGeneratingSummary}
                   className="flex items-center gap-1.5 px-4 py-2 bg-accent-blue/10 hover:bg-accent-blue text-accent-blue hover:text-white border border-accent-blue/30 rounded-lg font-mono text-[0.6rem] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                 >
                   {isGeneratingSummary ? "..." : "✨ Summarize"}
                 </button>
               </div>
               
               {aiSummary ? (
                 <div className="p-4 bg-black/40 border border-white/5 rounded-xl font-mono text-[0.65rem] text-[#E4E4E7] leading-relaxed max-w-full overflow-hidden shadow-inner">
                   <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiSummary}</ReactMarkdown>
                 </div>
               ) : (
                 <p className="font-mono text-[0.6rem] text-slate-400 italic leading-relaxed px-1">
                   Generate a bullet-pointed executive summary of all decisions and action items.
                 </p>
               )}
             </div>

             <CommentSection 
                cardId={task._id} 
                onAddComment={(text) => onAddComment(task._id, text)} 
                isViewer={isViewer}
             />
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="font-mono text-[0.7rem] text-[#A1A1AA] uppercase mb-6 tracking-[0.2em] flex items-center gap-2">
               <Activity size={14} className="text-accent-blue" /> Task Activity
            </h3>
            <ActivityLog boardId={activeBoardId} cardId={task._id} />
          </div>
        )}
      </div>
    </div>
  );
};

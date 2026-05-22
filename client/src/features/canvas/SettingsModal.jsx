import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Shield, Settings, User, Zap, ToggleLeft, ToggleRight, Info, Copy, RotateCcw, Check, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';

export const SettingsModal = ({ 
  board, 
  members, 
  owner, 
  onUpdateBoard, 
  onInviteMember, 
  onClose, 
  automations = [],
  onCreateAutomation,
  onToggleAutomation,
  onDeleteAutomation,
  invitations = [],
  onCreateInvitation,
  onRevokeInvitation,
  onResendInvitation
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('personnel');
  const [newTitle, setNewTitle] = useState(board?.title || '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  
  const [inviteLink, setInviteLink] = useState('');
  const [loadingLink, setLoadingLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailStatus, setEmailStatus] = useState({ type: '', message: '' });

  // Rule Builder States
  const [ruleName, setRuleName] = useState('');
  const [triggerListId, setTriggerListId] = useState('');
  const [actionType, setActionType] = useState('SET_PRIORITY');
  const [actionListId, setActionListId] = useState('');
  const [actionAssigneeId, setActionAssigneeId] = useState('');
  const [actionPriority, setActionPriority] = useState('high');
  const [isCreatingRule, setIsCreatingRule] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isOwner = currentUser._id === (board.owner?._id || board.owner);

  // Dynamic Workspace Roles Lookup
  const workspaceMembers = board?.workspaceId?.members || [];
  const findWorkspaceRole = (userId) => {
    const wsMember = workspaceMembers.find(m => {
      const idStr = m.user?._id || m.user || '';
      return idStr.toString() === userId.toString();
    });
    return wsMember?.role || 'editor';
  };

  const currentUserRole = isOwner ? 'admin' : findWorkspaceRole(currentUser._id);
  const canManageRoles = currentUserRole === 'admin';

  const handleUpdateRole = async (memberId, role) => {
    try {
      const workspaceId = board.workspaceId?._id || board.workspaceId;
      const { data } = await api.put(`/workspaces/${workspaceId}/members/${memberId}/role`, { role });
      if (data?.success) {
        setEmailStatus({ type: 'success', message: 'Collaborator role updated successfully!' });
        queryClient.invalidateQueries({ queryKey: ['board', board._id] });
      }
    } catch (err) {
      setEmailStatus({ type: 'error', message: err.response?.data?.message || 'Failed to update role' });
    } finally {
      setTimeout(() => setEmailStatus({ type: '', message: '' }), 4000);
    }
  };

  const handleEvictMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member from the workspace?')) return;
    try {
      const workspaceId = board.workspaceId?._id || board.workspaceId;
      const { data } = await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
      if (data?.success) {
        setEmailStatus({ type: 'success', message: 'Collaborator evicted successfully!' });
        queryClient.invalidateQueries({ queryKey: ['board', board._id] });
      }
    } catch (err) {
      setEmailStatus({ type: 'error', message: err.response?.data?.message || 'Failed to evict member' });
    } finally {
      setTimeout(() => setEmailStatus({ type: '', message: '' }), 4000);
    }
  };

  useEffect(() => {
    if (isOwner && board?._id) {
      fetchInviteLink();
    }
  }, [board?._id]);

  const fetchInviteLink = async () => {
    setLoadingLink(true);
    try {
      const { data } = await api.get(`/boards/${board._id}/invite-link`);
      if (data?.success) {
        setInviteLink(data.data.inviteLink);
      }
    } catch (err) {
      console.error("Error generating invite link:", err);
    } finally {
      setLoadingLink(false);
    }
  };

  const handleResetLink = async () => {
    if (!window.confirm("Are you sure you want to reset the invite link? The current link will no longer work.")) return;
    setLoadingLink(true);
    try {
      const { data } = await api.post(`/boards/${board._id}/invite-link/reset`);
      if (data?.success) {
        setInviteLink(data.data.inviteLink);
        setEmailStatus({ type: 'success', message: 'Invite link successfully reset' });
        setTimeout(() => setEmailStatus({ type: '', message: '' }), 4000);
      }
    } catch (err) {
      console.error("Error resetting invite link:", err);
      setEmailStatus({ type: 'error', message: 'Failed to reset invite link' });
      setTimeout(() => setEmailStatus({ type: '', message: '' }), 4000);
    } finally {
      setLoadingLink(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateTitle = (e) => {
    e.preventDefault();
    if (newTitle.trim() === board.title) return;
    onUpdateBoard({ title: newTitle });
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    
    setEmailStatus({ type: 'loading', message: 'Sending invitation email...' });
    try {
      const result = await onCreateInvitation(inviteEmail, inviteRole);
      setEmailStatus({ type: 'success', message: `Invitation sent to: ${inviteEmail}` });
      setInviteEmail('');
    } catch (err) {
      setEmailStatus({ 
        type: 'error', 
        message: err.response?.data?.message || err.message || 'Failed to send invitation. Please try again.' 
      });
    } finally {
      setTimeout(() => setEmailStatus({ type: '', message: '' }), 5000);
    }
  };

  const handleResendInvite = async (inviteId, email) => {
    setEmailStatus({ type: 'loading', message: `Resending invitation email to ${email}...` });
    try {
      await onResendInvitation(inviteId);
      setEmailStatus({ type: 'success', message: `Invitation successfully resent to: ${email}` });
    } catch (err) {
      setEmailStatus({ type: 'error', message: err.message || 'Failed to resend invitation' });
    } finally {
      setTimeout(() => setEmailStatus({ type: '', message: '' }), 4000);
    }
  };

  const handleRevokeInvite = async (inviteId) => {
    if (!window.confirm('Are you sure you want to cancel this pending invitation?')) return;
    setEmailStatus({ type: 'loading', message: 'Revoking invitation...' });
    try {
      await onRevokeInvitation(inviteId);
      setEmailStatus({ type: 'success', message: 'Invitation successfully revoked!' });
    } catch (err) {
      setEmailStatus({ type: 'error', message: err.message || 'Failed to revoke invitation' });
    } finally {
      setTimeout(() => setEmailStatus({ type: '', message: '' }), 4000);
    }
  };

  const handleRemoveMember = (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    const newMembers = board.members.filter(m => m !== memberId);
    onUpdateBoard({ members: newMembers });
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!ruleName.trim() || !triggerListId) return;

    try {
      const payload = {
        name: ruleName,
        trigger: {
          type: "CARD_MOVED",
          targetListId: triggerListId
        },
        action: {
          type: actionType,
          targetListId: actionType === "MOVE_CARD" ? actionListId : undefined,
          assigneeId: actionType === "ASSIGN_USER" ? actionAssigneeId : undefined,
          priority: actionType === "SET_PRIORITY" ? actionPriority : undefined
        }
      };

      await onCreateAutomation(payload);
      setRuleName('');
      setTriggerListId('');
      setActionListId('');
      setActionAssigneeId('');
      setIsCreatingRule(false);
      setEmailStatus({ type: 'success', message: 'Workflow rule created successfully!' });
    } catch (err) {
      setEmailStatus({ type: 'error', message: err.message || 'Failed to create rule' });
    } finally {
      setTimeout(() => setEmailStatus({ type: '', message: '' }), 4000);
    }
  };

  const handleToggleRule = async (ruleId, active) => {
    try {
      await onToggleAutomation(ruleId, active);
    } catch (err) {
      setEmailStatus({ type: 'error', message: 'Failed to update rule status' });
      setTimeout(() => setEmailStatus({ type: '', message: '' }), 4000);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this automation rule?')) return;
    try {
      await onDeleteAutomation(ruleId);
    } catch (err) {
      setEmailStatus({ type: 'error', message: 'Failed to delete rule' });
      setTimeout(() => setEmailStatus({ type: '', message: '' }), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-md" 
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-2xl bg-surface border border-border shadow-2xl rounded-sm overflow-hidden"
      >
        <header className="p-6 border-b border-border bg-white/[0.02] flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Settings className="text-accent-blue" size={20} />
              <h2 className="font-mono text-[0.8rem] text-[#FAFAFA] font-bold uppercase tracking-[0.2em]">Board Settings</h2>
            </div>
            
            <nav className="flex gap-4 border-l border-border pl-6">
              {[
                { id: 'personnel', label: 'Members' },
                { id: 'automations', label: 'Automations' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`font-mono text-[0.6rem] uppercase tracking-widest transition-all ${
                    activeTab === tab.id ? 'text-accent-blue border-b-2 border-accent-blue pb-1' : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          <button onClick={onClose} className="text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors">
            <X size={20} />
          </button>
        </header>

        <div className="p-8 space-y-10 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {activeTab === 'personnel' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-300">
              {/* Section 1: Core Board Identity */}
              <section>
                <h3 className="font-mono text-[0.7rem] text-[#A1A1AA] uppercase mb-4 tracking-[0.2em]">Board Details</h3>
                <form onSubmit={handleUpdateTitle} className="flex gap-4">
                  <input 
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="flex-1 bg-background border border-border rounded-sm px-4 py-2 font-mono text-xs text-[#FAFAFA] focus:outline-none focus:border-accent-blue transition-all"
                    placeholder="Enter new board title..."
                  />
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-accent-blue text-white font-mono text-[0.65rem] font-bold rounded-sm hover:bg-blue-600 transition-colors uppercase tracking-widest"
                  >
                    Save
                  </button>
                </form>
              </section>

              {/* Section 2: Personnel Orchestration */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-mono text-[0.7rem] text-[#A1A1AA] uppercase tracking-[0.2em]">Manage Members</h3>
                  <span className="font-mono text-[0.6rem] text-accent-blue font-bold px-2 py-0.5 bg-accent-blue/10 rounded-full border border-accent-blue/20">
                    {members.length} Members Active
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  {/* Owner */}
                  <div className="flex items-center justify-between p-3 bg-white/[0.04] border border-accent-blue/20 rounded-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-blue flex items-center justify-center text-xs font-bold text-white">
                        {owner?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-mono text-xs text-[#FAFAFA] font-bold">{owner?.name} (Owner)</div>
                        <div className="font-mono text-[0.6rem] text-[#A1A1AA]">{owner?.email}</div>
                      </div>
                    </div>
                    <span className="font-mono text-[0.55rem] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.1)] flex items-center gap-1.5">
                      <Shield size={12} />
                      Admin
                    </span>
                  </div>

                  {/* Members */}
                  {board.members?.map((memberId) => {
                    const member = members.find(m => m._id === memberId);
                    if (!member) return null;
                    const role = findWorkspaceRole(memberId);

                    return (
                      <div key={memberId} className="flex items-center justify-between p-3 bg-white/[0.02] border border-border rounded-sm group hover:border-accent-blue/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-xs font-bold text-[#A1A1AA]">
                            {member.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-mono text-xs text-[#FAFAFA] font-bold">{member.name}</div>
                            <div className="font-mono text-[0.6rem] text-[#A1A1AA]">{member.email}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {canManageRoles ? (
                            <select
                              value={role}
                              onChange={(e) => handleUpdateRole(memberId, e.target.value)}
                              className="bg-background border border-border rounded-sm px-2 py-1 font-mono text-[0.6rem] text-[#FAFAFA] focus:outline-none focus:border-accent-blue transition-all"
                            >
                              <option value="admin">Admin</option>
                              <option value="editor">Editor</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          ) : (
                            <span className={`font-mono text-[0.55rem] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                              role === 'admin' ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.1)]' :
                              role === 'editor' ? 'bg-accent-blue/10 border-accent-blue/20 text-accent-blue shadow-[0_0_8px_rgba(37,99,235,0.1)]' :
                              'bg-white/[0.03] border-white/[0.05] text-[#A1A1AA]'
                            }`}>
                              {role}
                            </span>
                          )}

                          {canManageRoles && (
                            <button 
                              onClick={() => handleEvictMember(memberId)}
                              className="opacity-0 group-hover:opacity-100 p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-sm transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Invite Form */}
                <form onSubmit={handleInvite} className="flex gap-4">
                  <div className="relative flex-1">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" size={14} />
                    <input 
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full bg-background border border-border rounded-sm pl-10 pr-4 py-2.5 font-mono text-xs text-[#FAFAFA] focus:outline-none focus:border-accent-blue transition-all"
                      placeholder="Collaborator Email..."
                    />
                  </div>

                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="bg-background border border-border rounded-sm px-4 py-2.5 font-mono text-xs text-[#FAFAFA] focus:outline-none focus:border-accent-blue transition-all"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>

                  <button 
                    type="submit"
                    disabled={emailStatus.type === 'loading'}
                    className="px-6 py-2.5 bg-accent-blue text-white font-mono text-[0.65rem] font-bold rounded-sm hover:bg-blue-600 transition-colors uppercase tracking-widest disabled:opacity-50"
                  >
                    Invite
                  </button>
                </form>

                {/* Invitation Status */}
                <AnimatePresence>
                  {emailStatus.message && (
                    <motion.div 
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`mt-4 p-3 border rounded-sm font-mono text-[0.6rem] font-bold uppercase tracking-wider flex items-center gap-2 ${
                        emailStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]' :
                        emailStatus.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]' :
                        'bg-accent-blue/10 border-accent-blue/20 text-accent-blue animate-pulse'
                      }`}
                    >
                      <Info size={12} className={emailStatus.type === 'loading' ? 'animate-spin' : ''} />
                      <span>{emailStatus.message}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pending Invitations Section */}
                {invitations.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-border space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-mono text-[0.65rem] text-[#A1A1AA] uppercase tracking-[0.2em]">Pending Invitations</h4>
                      <span className="font-mono text-[0.55rem] text-accent-amber px-2 py-0.5 bg-accent-amber/5 rounded border border-accent-amber/15">
                        {invitations.length} Awaiting Acceptance
                      </span>
                    </div>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-thin">
                      {invitations.map((invite) => (
                        <div 
                          key={invite._id} 
                          className="flex items-center justify-between p-3 bg-white/[0.01] border border-border/60 rounded-sm hover:border-accent-blue/20 hover:bg-white/[0.02] transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent-blue/5 border border-accent-blue/10 flex items-center justify-center">
                              <Mail className="text-[#A1A1AA] group-hover:text-accent-blue transition-colors" size={14} />
                            </div>
                            <div>
                              <div className="font-mono text-xs text-[#FAFAFA] font-bold">{invite.email}</div>
                              <div className="font-mono text-[0.55rem] text-[#A1A1AA]">
                                Invited by {invite.invitedBy?.name || 'Admin'} • {new Date(invite.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[0.5rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-accent-amber/10 border border-accent-amber/20 text-accent-amber shadow-[0_0_8px_rgba(245,158,11,0.05)] animate-pulse">
                              Pending
                            </span>
                            <span className={`font-mono text-[0.5rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                              invite.role === 'editor' ? 'bg-accent-blue/10 border-accent-blue/20 text-accent-blue shadow-[0_0_8px_rgba(37,99,235,0.05)]' :
                              invite.role === 'viewer' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                              'bg-white/[0.03] border-white/[0.05] text-[#A1A1AA]'
                            }`}>
                              {invite.role}
                            </span>

                            {isOwner && (
                              <div className="flex items-center gap-1 border-l border-border pl-3 ml-1">
                                <button
                                  type="button"
                                  onClick={() => handleResendInvite(invite._id, invite.email)}
                                  title="Resend invitation email"
                                  className="p-1.5 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-white/5 rounded transition-all"
                                >
                                  <RotateCcw size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRevokeInvite(invite._id)}
                                  title="Revoke invitation"
                                  className="p-1.5 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Section 3: Board Invite Link */}
              {isOwner && (
                <section className="p-6 bg-white/[0.01] border border-white/[0.03] rounded-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/[0.02] blur-[40px] pointer-events-none" />
                  
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="font-mono text-[0.7rem] text-[#FAFAFA] font-bold uppercase tracking-[0.2em]">Invite Link</h4>
                      <p className="font-mono text-[0.55rem] text-slate-500 mt-1 leading-relaxed">
                        Anyone with this link can join as a member. Reset the link if you want to deactivate it.
                      </p>
                    </div>
                    <span className="font-mono text-[0.55rem] text-[#A1A1AA] font-bold px-2 py-0.5 bg-white/[0.03] rounded border border-white/[0.05]">
                      Secure Link
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <input 
                      type="text"
                      readOnly
                      value={inviteLink || (loadingLink ? 'Generating Link...' : 'No Active Link')}
                      className="flex-1 bg-background border border-border rounded-lg px-4 py-3 font-mono text-[0.65rem] text-slate-400 select-all focus:outline-none"
                    />
                    <button 
                      onClick={handleCopyLink}
                      disabled={!inviteLink}
                      className="px-4 py-3 bg-white/[0.02] border border-white/[0.05] hover:bg-accent-blue hover:text-white rounded-lg transition-all text-slate-400 font-mono text-[0.65rem] font-bold flex items-center gap-2 tracking-widest uppercase hover:shadow-glow active:scale-95"
                    >
                      {copied ? (
                        <>
                          <Check size={14} className="text-emerald-500 animate-pulse" />
                          <span className="text-emerald-500">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <button 
                      onClick={handleResetLink}
                      disabled={loadingLink}
                      title="Reset invite link"
                      className="p-3 bg-white/[0.02] border border-white/[0.05] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 rounded-lg text-slate-500 transition-all active:scale-95 flex items-center justify-center"
                    >
                      <RotateCcw size={14} className={loadingLink ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </section>
              )}
            </div>
          )}

          {activeTab === 'automations' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-center">
                <h3 className="font-mono text-[0.7rem] text-[#A1A1AA] uppercase tracking-[0.2em]">Board Automations</h3>
                {!isCreatingRule && (isOwner || currentUser.role === 'admin' || currentUser.role === 'editor') && (
                  <button
                    onClick={() => setIsCreatingRule(true)}
                    className="px-3 py-1.5 bg-accent-blue/10 hover:bg-accent-blue text-accent-blue hover:text-white border border-accent-blue/20 rounded font-mono text-[0.6rem] uppercase tracking-wider transition-all flex items-center gap-1.5"
                  >
                    <Zap size={12} />
                    <span>Create Custom Rule</span>
                  </button>
                )}
              </div>

              {/* Create Automation Form */}
              {isCreatingRule && (
                <form onSubmit={handleCreateRule} className="p-6 bg-white/[0.01] border border-border rounded-lg space-y-5 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <span className="font-mono text-[0.65rem] text-[#FAFAFA] font-bold uppercase tracking-wider">New Automation Rule</span>
                    <button type="button" onClick={() => setIsCreatingRule(false)} className="text-[#A1A1AA] hover:text-white font-mono text-[0.6rem] uppercase transition-colors">Cancel</button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block font-mono text-[0.55rem] text-[#A1A1AA] uppercase tracking-wider mb-1.5">Rule Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Set Priority to High on Urgent Move"
                        value={ruleName}
                        onChange={(e) => setRuleName(e.target.value)}
                        className="w-full bg-background border border-border rounded px-3 py-2 font-mono text-xs text-[#FAFAFA] focus:border-accent-blue focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-mono text-[0.55rem] text-[#A1A1AA] uppercase tracking-wider mb-1.5">Trigger: When card moves to</label>
                        <select
                          required
                          value={triggerListId}
                          onChange={(e) => setTriggerListId(e.target.value)}
                          className="w-full bg-background border border-border rounded px-3 py-2 font-mono text-xs text-[#FAFAFA] focus:border-accent-blue focus:outline-none"
                        >
                          <option value="">Select list...</option>
                          {board?.lists?.map(l => (
                            <option key={l._id} value={l._id}>{l.title}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-mono text-[0.55rem] text-[#A1A1AA] uppercase tracking-wider mb-1.5">Action: Executed operation</label>
                        <select
                          required
                          value={actionType}
                          onChange={(e) => setActionType(e.target.value)}
                          className="w-full bg-background border border-border rounded px-3 py-2 font-mono text-xs text-[#FAFAFA] focus:border-accent-blue focus:outline-none"
                        >
                          <option value="SET_PRIORITY">Set Priority Level</option>
                          <option value="ASSIGN_USER">Assign Task to Member</option>
                          <option value="MOVE_CARD">Move Task to List</option>
                        </select>
                      </div>
                    </div>

                    {/* Action Context Dropdowns */}
                    {actionType === 'SET_PRIORITY' && (
                      <div>
                        <label className="block font-mono text-[0.55rem] text-[#A1A1AA] uppercase tracking-wider mb-1.5">Priority Value</label>
                        <select
                          value={actionPriority}
                          onChange={(e) => setActionPriority(e.target.value)}
                          className="w-full bg-background border border-border rounded px-3 py-2 font-mono text-xs text-[#FAFAFA] focus:border-accent-blue focus:outline-none"
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    )}

                    {actionType === 'ASSIGN_USER' && (
                      <div>
                        <label className="block font-mono text-[0.55rem] text-[#A1A1AA] uppercase tracking-wider mb-1.5">Select Member</label>
                        <select
                          required
                          value={actionAssigneeId}
                          onChange={(e) => setActionAssigneeId(e.target.value)}
                          className="w-full bg-background border border-border rounded px-3 py-2 font-mono text-xs text-[#FAFAFA] focus:border-accent-blue focus:outline-none"
                        >
                          <option value="">Select board collaborator...</option>
                          {members.map(m => (
                            <option key={m._id || m} value={m._id || m}>{m.name || m.email || 'Collaborator'}</option>
                          ))}
                          {board?.owner && (
                            <option value={board.owner._id || board.owner}>{board.owner.name || 'Owner'}</option>
                          )}
                        </select>
                      </div>
                    )}

                    {actionType === 'MOVE_CARD' && (
                      <div>
                        <label className="block font-mono text-[0.55rem] text-[#A1A1AA] uppercase tracking-wider mb-1.5">Select Destination List</label>
                        <select
                          required
                          value={actionListId}
                          onChange={(e) => setActionListId(e.target.value)}
                          className="w-full bg-background border border-border rounded px-3 py-2 font-mono text-xs text-[#FAFAFA] focus:border-accent-blue focus:outline-none"
                        >
                          <option value="">Select destination list...</option>
                          {board?.lists?.map(l => (
                            <option key={l._id} value={l._id}>{l.title}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-accent-blue hover:bg-accent-blue/90 text-white rounded font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-glow hover:scale-[1.01]"
                  >
                    ⚡ Save Automation Rule
                  </button>
                </form>
              )}

              {/* Rules List */}
              <div className="space-y-4">
                {automations.length === 0 ? (
                  <div className="p-8 border border-dashed border-border rounded-lg text-center bg-white/[0.01]">
                    <Zap className="mx-auto text-slate-600 mb-3 animate-pulse" size={24} />
                    <h4 className="font-mono text-xs text-[#FAFAFA] font-bold uppercase tracking-wider mb-1">No Active Automations</h4>
                    <p className="font-mono text-[0.6rem] text-[#A1A1AA] max-w-sm mx-auto leading-relaxed">
                      Admins and Editors can build custom workflow trigger rules to automatically route cards, assign resources, or escalate priorities.
                    </p>
                  </div>
                ) : (
                  automations.map((rule) => {
                    const triggerList = board?.lists?.find(l => l._id === rule.trigger.targetListId);
                    const actionList = board?.lists?.find(l => l._id === rule.action.targetListId);
                    
                    let actionDetail = "";
                    if (rule.action.type === 'SET_PRIORITY') {
                      actionDetail = `Set priority to ${rule.action.priority?.toUpperCase()}`;
                    } else if (rule.action.type === 'ASSIGN_USER') {
                      actionDetail = "Assign collaborator";
                    } else if (rule.action.type === 'MOVE_CARD') {
                      actionDetail = `Move task to "${actionList?.title || 'Another List'}"`;
                    }

                    return (
                      <div key={rule._id} className="p-4 bg-white/[0.02] border border-border rounded-sm flex items-center justify-between group hover:border-accent-blue/30 transition-all">
                        <div className="flex items-start gap-4">
                          <div className="mt-1 text-accent-blue">
                            <Zap size={16} />
                          </div>
                          <div>
                            <div className="font-mono text-xs text-[#FAFAFA] font-bold mb-1 uppercase flex items-center gap-2">
                              <span>{rule.name}</span>
                              {!rule.active && (
                                <span className="font-mono text-[0.5rem] text-slate-500 uppercase tracking-widest bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/[0.05]">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[0.6rem] text-[#A1A1AA] space-y-0.5">
                              <div>Trigger: Card moved to "{triggerList?.title || 'Any List'}"</div>
                              <div className="text-accent-blue">Operation: {actionDetail}</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleRule(rule._id, !rule.active)}
                            className={`p-2 transition-all ${rule.active ? 'text-accent-blue' : 'text-[#A1A1AA]'}`}
                          >
                            {rule.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                          </button>
                          {(isOwner || currentUser.role === 'admin' || currentUser.role === 'editor') && (
                            <button
                              onClick={() => handleDeleteRule(rule._id)}
                              className="p-1.5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-4 bg-accent-blue/5 border border-accent-blue/20 rounded-sm flex items-start gap-3">
                <Info size={16} className="text-accent-blue mt-0.5" />
                <p className="font-mono text-[0.6rem] text-[#A1A1AA] leading-relaxed">
                  Info: Workflow rules execute instantly in the background across all connected client screens using real-time socket propagation.
                </p>
              </div>
            </div>
          )}
        </div>

        <footer className="p-6 bg-white/[0.02] border-t border-border flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-transparent border border-border text-[#A1A1AA] hover:text-[#FAFAFA] font-mono text-[0.75rem] font-bold rounded-sm transition-all uppercase tracking-widest"
          >
            Close
          </button>
        </footer>
      </motion.div>
    </div>
  );
};

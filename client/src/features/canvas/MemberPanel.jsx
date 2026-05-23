import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, UserMinus, Crown, Eye } from 'lucide-react';

const roleConfig = {
  owner: { label: 'Owner', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  editor: { label: 'Editor', color: 'text-accent-blue', bg: 'bg-accent-blue/10 border-accent-blue/20' },
  viewer: { label: 'Viewer', color: 'text-slate-400', bg: 'bg-white/[0.04] border-white/[0.08]' },
};

export const MemberPanel = ({ members, owner, isOwner, onRemoveMember, onClose }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    // Use a small delay so the opening button click doesn't immediately close the panel
    const timer = setTimeout(() => {
      const handleClick = (e) => {
        if (panelRef.current && !panelRef.current.contains(e.target)) {
          onClose();
        }
      };
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, 50);

    return () => clearTimeout(timer);
  }, [onClose]);

  // Build deduplicated member list: owner first, then board members
  const allMembers = [];
  const seen = new Set();

  if (owner) {
    const id = (owner._id || owner).toString();
    allMembers.push({ ...owner, _isOwner: true });
    seen.add(id);
  }

  (members || []).forEach(m => {
    const id = (m._id || m).toString();
    if (!seen.has(id)) {
      seen.add(id);
      allMembers.push(m);
    }
  });

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ type: 'spring', damping: 24, stiffness: 320 }}
      className="absolute top-full mt-3 left-0 w-[290px] bg-[#0f0f14]/95 backdrop-blur-3xl border border-white/[0.1] rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Top accent bar */}
      <div className="h-[2px] w-full bg-gradient-to-r from-accent-blue via-violet-500 to-accent-blue" />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[0.6rem] text-slate-400 uppercase tracking-[0.2em] font-bold">
            Members · {allMembers.length}
          </span>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-white rounded-lg transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Members list */}
        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-0.5 scrollbar-thin">
          {allMembers.map((member) => {
            const memberId = (member._id || member)?.toString();
            const isThisOwner = !!member._isOwner;
            const name = member.name || 'Unknown';
            const email = member.email || '';
            const initial = name.charAt(0).toUpperCase();
            const cfg = isThisOwner ? roleConfig.owner : roleConfig.editor;

            return (
              <div
                key={memberId}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-all group"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-xl border border-white/[0.08] bg-slate-800 flex items-center justify-center text-[0.7rem] font-bold text-accent-blue shrink-0 relative overflow-hidden">
                  {member.avatar
                    ? <img src={member.avatar} alt={name} className="w-full h-full object-cover" />
                    : initial
                  }
                  {isThisOwner && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-accent-blue rounded-full flex items-center justify-center border border-[#0f0f14]">
                      <Crown size={7} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[0.7rem] text-white font-bold truncate leading-tight">
                    {name}
                  </div>
                  {email && (
                    <div className="font-mono text-[0.55rem] text-slate-500 truncate">{email}</div>
                  )}
                </div>

                {/* Role badge */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`font-mono text-[0.5rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>

                  {/* Remove button — only for owner, only for non-owner members */}
                  {isOwner && !isThisOwner && (
                    <button
                      onClick={() => onRemoveMember(memberId)}
                      title="Remove from board"
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <UserMinus size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {allMembers.length === 0 && (
            <div className="py-6 text-center">
              <p className="font-mono text-[0.6rem] text-slate-500 uppercase tracking-wider">No members yet</p>
            </div>
          )}
        </div>

        {isOwner && (
          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <p className="font-mono text-[0.5rem] text-slate-600 tracking-wider leading-relaxed">
              Hover a member and click the remove icon to remove them from the board.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

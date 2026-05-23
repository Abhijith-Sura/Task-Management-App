import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserMinus, Crown, Shield, Eye } from 'lucide-react';

const roleConfig = {
  admin: { label: 'Admin', icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  editor: { label: 'Editor', icon: Shield, color: 'text-accent-blue', bg: 'bg-accent-blue/10 border-accent-blue/20' },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-slate-400', bg: 'bg-white/[0.04] border-white/[0.08]' },
};

export const MemberPanel = ({ members, owner, isOwner, onRemoveMember, onClose }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const getRole = (memberId) => {
    const ws = owner?._id?.toString() === memberId?.toString() ? 'admin' : 'editor';
    return ws;
  };

  // Merge owner + members, deduplicate
  const allMembers = [];
  const seen = new Set();
  if (owner) {
    allMembers.push({ ...owner, _isOwner: true });
    seen.add((owner._id || owner).toString());
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
      className="absolute top-full mt-2 right-0 w-[280px] bg-surface/95 backdrop-blur-3xl border border-white/[0.1] rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Top gradient bar */}
      <div className="h-[2px] w-full bg-gradient-to-r from-accent-blue via-violet-500 to-accent-blue" />

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[0.6rem] text-slate-400 uppercase tracking-[0.2em] font-bold">
            Board Members ({allMembers.length})
          </span>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-white rounded-lg transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
          {allMembers.map((member) => {
            const memberId = member._id || member;
            const memberIdStr = memberId?.toString();
            const isThisOwner = member._isOwner;
            const name = member.name || 'User';
            const email = member.email || '';
            const initial = name.charAt(0).toUpperCase();
            const cfg = roleConfig[isThisOwner ? 'admin' : 'editor'];

            return (
              <div
                key={memberIdStr}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-all group"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-xl border border-white/[0.08] bg-slate-800 flex items-center justify-center text-[0.7rem] font-bold text-accent-blue shrink-0 relative overflow-hidden">
                  {member.avatar
                    ? <img src={member.avatar} alt={name} className="w-full h-full object-cover" />
                    : initial
                  }
                  {isThisOwner && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent-blue rounded-full flex items-center justify-center">
                      <Crown size={7} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-[0.7rem] text-white font-bold truncate">
                    {name}
                    {isThisOwner && <span className="ml-1 text-[0.55rem] text-slate-500">(you)</span>}
                  </div>
                  <div className="font-mono text-[0.55rem] text-slate-500 truncate">{email}</div>
                </div>

                {/* Role badge + remove */}
                <div className="flex items-center gap-1.5">
                  <span className={`font-mono text-[0.5rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                    {isThisOwner ? 'Owner' : 'Editor'}
                  </span>
                  {isOwner && !isThisOwner && (
                    <button
                      onClick={() => onRemoveMember(memberIdStr)}
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
        </div>
      </div>
    </motion.div>
  );
};

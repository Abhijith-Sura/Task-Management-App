import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { MessageSquare, Send, User, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * CommentSection Component
 * 
 * Renders the comments area for a specific card, allowing users to view and add comments.
 * It uses React Query to fetch the comments from the server.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.cardId - The ID of the card to fetch and add comments for.
 * @param {Function} props.onAddComment - Callback function triggered when a new comment is submitted.
 * @param {boolean} props.isViewer - Indicates if the user is in view-only mode (cannot add comments).
 * @returns {React.ReactElement} The rendered CommentSection component.
 */
export const CommentSection = ({ cardId, onAddComment, isViewer }) => {
  const [commentText, setCommentText] = useState('');

  // Fetch comments specific to the given card
  const { data: commentsResponse, isLoading } = useQuery({
    queryKey: ['comments', cardId],
    queryFn: async () => {
      const { data } = await api.get(`/cards/${cardId}/comments`);
      return data;
    },
    enabled: !!cardId,
  });

  const comments = commentsResponse?.data || [];

  // Form submission handler for new comments
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(commentText);
    setCommentText(''); // Clear input after submission
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-8 mb-8 overflow-y-auto pr-3 scrollbar-thin">
        {comments.map((comment) => (
          <div key={comment._id} className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-sm font-bold text-accent-blue flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
              {comment.userId?.avatar ? (
                <img src={comment.userId.avatar} alt={comment.userId.name} className="w-full h-full rounded-xl object-cover" />
              ) : (
                comment.userId?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl group-hover:border-accent-blue/30 transition-all shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[0.7rem] font-bold text-white uppercase tracking-wider">{comment.userId?.name}</span>
                <span className="text-[0.65rem] font-bold text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                  <Clock size={12} className="text-slate-600" />
                  {formatDistanceToNow(new Date(comment.createdAt))} ago
                </span>
              </div>
              <p className="text-[0.8rem] text-slate-400 leading-relaxed font-medium">
                {comment.text}
              </p>
            </div>
          </div>
        ))}
        {comments.length === 0 && !isLoading && (
          <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-white/[0.03] rounded-2xl bg-white/[0.01]">
            <div className="p-4 bg-white/[0.02] rounded-xl mb-4">
              <MessageSquare size={32} className="text-slate-700" />
            </div>
            <span className="text-[0.7rem] font-bold text-slate-500 uppercase tracking-[0.2em]">No discussion yet</span>
            <p className="text-[0.6rem] text-slate-700 mt-2">Start the conversation by adding a note below.</p>
          </div>
        )}
      </div>

      {!isViewer ? (
        <form onSubmit={handleSubmit} className="relative group">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Type a message or share an update..."
            className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 pr-16 text-sm text-white focus:outline-none focus:border-accent-blue/40 focus:ring-4 focus:ring-accent-blue/5 resize-none h-28 transition-all placeholder:text-slate-600 shadow-inner"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="absolute right-4 bottom-4 p-3 bg-accent-blue text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 disabled:scale-95 transition-all shadow-xl shadow-accent-blue/20 group-hover:scale-105 active:scale-90"
            title="Send message"
          >
            <Send size={18} />
          </button>
        </form>
      ) : (
        <div className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl flex items-center justify-center gap-3 font-mono text-[0.65rem] text-[#A1A1AA] uppercase tracking-widest select-none">
          <span>🔒 View Only — Comments Locked</span>
        </div>
      )}
    </div>
  );
};

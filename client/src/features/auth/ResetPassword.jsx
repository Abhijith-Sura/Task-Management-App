import React, { useState } from 'react';
import { resetPassword } from './AuthService';
import { Terminal, ShieldAlert, Loader2, CheckCircle } from 'lucide-react';
import bgControl from '../../assets/bg-control.png';
import zenithLogo from '../../assets/zenith_logo.png';

export const ResetPassword = ({ token, onSwitchToLogin }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-screen flex items-center justify-center bg-background">
      <div 
        className="fixed inset-0 bg-cover bg-center blur-[20px] opacity-55" 
        style={{ backgroundImage: `url(${bgControl})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-t from-background via-transparent to-background" />

      <div className="relative w-[400px] bg-surface/90 backdrop-blur-xl border border-white/[0.12] p-8 rounded-sm shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-sm mb-4 border border-white/[0.12] overflow-hidden flex items-center justify-center shadow-glow">
            <img src={zenithLogo} alt="Zenith Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-bold tracking-widest text-[#FAFAFA] font-mono">Create New Password</h1>
          <p className="text-xs text-slate-400 font-mono mt-2 tracking-tighter uppercase text-center">
            Please enter your new password below
          </p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-sm text-center">
              <CheckCircle className="text-emerald-500" size={32} />
              <p className="font-mono text-xs text-emerald-400 uppercase tracking-widest leading-relaxed">
                Password updated successfully!
              </p>
            </div>
            <button 
              onClick={onSwitchToLogin}
              className="w-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.12] py-3 font-mono text-sm font-bold text-white rounded-sm transition-all uppercase tracking-widest"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block font-mono text-[0.65rem] text-slate-400 uppercase tracking-widest">New Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.12] px-4 py-3 text-sm font-mono text-[#FAFAFA] rounded-sm focus:outline-none focus:border-accent-blue transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-[0.65rem] text-slate-400 uppercase tracking-widest">Confirm Password</label>
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.12] px-4 py-3 text-sm font-mono text-[#FAFAFA] rounded-sm focus:outline-none focus:border-accent-blue transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-sm">
                <ShieldAlert size={16} />
                <span className="font-mono text-[0.65rem] uppercase font-bold">{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-accent-blue hover:bg-blue-600 disabled:bg-blue-800 py-3 font-mono text-sm font-bold text-white rounded-sm transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Update Password'}
            </button>

            <div className="text-center mt-6">
              <button 
                type="button"
                onClick={onSwitchToLogin}
                className="text-slate-400 font-mono text-[0.7rem] uppercase tracking-widest hover:text-white transition-colors"
              >
                Cancel and Return to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

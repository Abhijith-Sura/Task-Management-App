import React, { useState } from 'react';
import { login } from './AuthService';
import { Terminal, ShieldAlert, Loader2 } from 'lucide-react';
import bgControl from '../../assets/bg-control.png';
import zenithLogo from '../../assets/zenith_logo.png';

export const Login = ({ onLoginSuccess, onSwitchToRegister, onVerificationRequired, onSwitchToForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.data && res.data.verified === false) {
        onVerificationRequired(res.data.email);
      } else {
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-screen flex items-center justify-center bg-background">
      {/* Background with blur */}
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
          <h1 className="text-xl font-bold tracking-widest text-[#FAFAFA] font-mono">Sign In</h1>
          <p className="text-xs text-slate-400 font-mono mt-2 tracking-tighter uppercase">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block font-mono text-[0.65rem] text-slate-400 uppercase tracking-widest">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.12] px-4 py-3 text-sm font-mono text-[#FAFAFA] rounded-sm focus:outline-none focus:border-accent-blue transition-all"
              placeholder="user@example.com"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block font-mono text-[0.65rem] text-slate-400 uppercase tracking-widest">Password</label>
              <button 
                type="button"
                onClick={onSwitchToForgotPassword}
                className="text-accent-blue font-mono text-[0.6rem] uppercase tracking-widest hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={onSwitchToRegister}
            className="text-accent-blue font-mono text-[0.7rem] uppercase tracking-widest hover:underline"
          >
            Don't have an account? Create one
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex justify-between items-center opacity-40">
          <div className="font-mono text-[0.5rem] text-[#A1A1AA]">MERN Productivity Stack</div>
          <div className="font-mono text-[0.5rem] text-[#A1A1AA]">Secure SSL Connection</div>
        </div>
      </div>
    </div>
  );
};

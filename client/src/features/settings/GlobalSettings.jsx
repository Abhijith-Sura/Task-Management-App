import React, { useState, useEffect, useRef } from 'react';
import { User, Shield, Sliders, Activity, Save, Camera, Key, Lock, Eye, EyeOff, Check, X, LogOut, Terminal, Bell, Sparkles, Calendar, CheckSquare, AlertTriangle, ChevronRight, HardDrive } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { logout } from '../auth/AuthService';
import { motion, AnimatePresence } from 'framer-motion';

export const GlobalSettings = () => {
  const queryClient = useQueryClient();
  const localUser = JSON.parse(localStorage.getItem('user')) || { name: 'User', email: 'user@example.com' };
  
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: localUser.name || '',
    email: localUser.email || '',
    avatar: localUser.avatar || ''
  });

  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [securityMessage, setSecurityMessage] = useState('');
  const [securityError, setSecurityError] = useState('');

  // UI preferences loaded from localStorage
  const [prefAurora, setPrefAurora] = useState(localStorage.getItem('zenith_ambient_glows') !== 'false');
  const [prefGrid, setPrefGrid] = useState(localStorage.getItem('zenith_canvas_grid') || 'dots');
  const [prefDensity, setPrefDensity] = useState(localStorage.getItem('zenith_layout_density') || 'comfortable');

  // React Query Profile Data
  const { data: profileResponse, isLoading: isProfileLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/profile');
      return data;
    }
  });

  const profileData = profileResponse?.data || {};
  const userData = profileData.user || localUser;
  const stats = profileData.stats || { totalTasks: 0, highPriorityTasks: 0 };
  const joinedAt = profileData.joinedAt || userData.createdAt || new Date();

  // Sync server data to form once loaded
  useEffect(() => {
    if (userData.name || userData.email || userData.avatar) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        avatar: userData.avatar || ''
      });
    }
  }, [userData]);

  // Telemetry activities log
  const { data: activityResponse, isLoading: isActivityLoading } = useQuery({
    queryKey: ['global-activity'],
    queryFn: async () => {
      const { data } = await api.get('/auth/activity');
      return data;
    },
    enabled: activeTab === 'activity'
  });
  const activities = activityResponse?.data || [];

  const updateProfileMutation = useMutation({
    mutationFn: async (updates) => {
      const { data } = await api.put('/users/profile', updates);
      return data;
    },
    onSuccess: (response) => {
      const updatedUser = response.data;
      const normalizedUser = {
        ...updatedUser,
        _id: updatedUser.id || updatedUser._id,
        id: updatedUser.id || updatedUser._id
      };
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setMessage('Profile configuration updated successfully.');
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile configuration.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.put('/users/profile', payload);
      return data;
    },
    onSuccess: () => {
      setSecurityMessage('Security credentials modified successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSecurityMessage(''), 3000);
    },
    onError: (err) => {
      setSecurityError(err.response?.data?.message || 'Validation rejected standard credential adjustment.');
      setTimeout(() => setSecurityError(''), 4000);
    }
  });

  const handleSaveProfile = () => {
    if (!formData.name.trim()) {
      setErrorMsg('Full name cannot be blank.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    updateProfileMutation.mutate(formData);
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setSecurityError('Password must contain at least 6 characters.');
      setTimeout(() => setSecurityError(''), 3000);
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityError('Confirmation password does not match.');
      setTimeout(() => setSecurityError(''), 3000);
      return;
    }
    updatePasswordMutation.mutate({ password: newPassword });
  };

  const handlePrefChange = (key, value) => {
    localStorage.setItem(key, value);
    window.dispatchEvent(new Event('zenith-pref-change'));
    if (key === 'zenith_ambient_glows') setPrefAurora(value !== 'false');
    if (key === 'zenith_canvas_grid') setPrefGrid(value);
    if (key === 'zenith_layout_density') setPrefDensity(value);
  };

  const tabs = [
    { id: 'profile', label: 'Profile & Stats', icon: <User size={16} /> },
    { id: 'security', label: 'Security & Access', icon: <Shield size={16} /> },
    { id: 'preferences', label: 'UI Preferences', icon: <Sliders size={16} /> },
    { id: 'activity', label: 'Activity Log', icon: <Activity size={16} /> }
  ];

  const renderProfileTab = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="border-b border-white/[0.05] pb-6">
        <h3 className="text-xl font-bold text-white tracking-tight font-display mb-1 uppercase">Account Profile</h3>
        <p className="text-[0.7rem] text-slate-500 uppercase tracking-widest font-mono">Manage public branding details and live usage stats</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 items-start bg-white/[0.01] border border-white/[0.04] p-8 rounded-2xl">
        <div className="flex flex-col items-center gap-4">
          <div 
            className="relative group cursor-pointer" 
            onClick={() => fileInputRef.current?.click()}
            title="Upload profile picture"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 5 * 1024 * 1024) {
                    setErrorMsg('Image size must be less than 5MB.');
                    setTimeout(() => setErrorMsg(''), 4000);
                    return;
                  }
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setFormData(prev => ({ ...prev, avatar: reader.result }));
                  };
                  reader.onerror = () => {
                    setErrorMsg('Failed to read image file.');
                    setTimeout(() => setErrorMsg(''), 4000);
                  };
                  reader.readAsDataURL(file);
                }
              }} 
            />
            <div className="w-32 h-32 rounded-2xl bg-accent-blue/10 border-2 border-accent-blue/20 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-accent-blue/50 transition-all duration-300">
              {formData.avatar ? (
                <img src={formData.avatar} alt="Avatar Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera size={36} className="text-slate-600" />
              )}
            </div>
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 rounded-2xl">
              <Camera size={20} className="text-white animate-pulse" />
            </div>
          </div>
          <span className="text-[0.55rem] text-slate-500 uppercase tracking-widest font-mono font-bold">Avatar Preview</span>
        </div>

        <div className="space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-widest">Full Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. John Doe"
                className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-accent-blue/40 focus:ring-4 focus:ring-accent-blue/5 transition-all placeholder:text-slate-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-widest">Email Address</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="john@example.com"
                className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-accent-blue/40 focus:ring-4 focus:ring-accent-blue/5 transition-all placeholder:text-slate-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-widest">Profile Picture URL</label>
            <input 
              type="text" 
              value={formData.avatar}
              onChange={(e) => setFormData({...formData, avatar: e.target.value})}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl py-3.5 px-4 text-sm text-white focus:outline-none focus:border-accent-blue/40 focus:ring-4 focus:ring-accent-blue/5 transition-all placeholder:text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Grid statistics metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/[0.02] border border-white/[0.06] hover:border-accent-blue/30 rounded-2xl p-6 shadow-soft transition-all duration-300 group hover:scale-[1.01]">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl w-fit mb-4">
            <Calendar size={18} />
          </div>
          <div className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-widest mb-1">Joined System</div>
          <div className="text-lg font-bold text-white tracking-tight">
            {new Date(joinedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </div>
          <div className="text-[0.55rem] text-slate-600 mt-1.5 uppercase font-mono tracking-widest">Verified Account Member</div>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] hover:border-accent-blue/30 rounded-2xl p-6 shadow-soft transition-all duration-300 group hover:scale-[1.01]">
          <div className="p-2.5 bg-accent-blue/10 text-accent-blue rounded-xl w-fit mb-4">
            <CheckSquare size={18} />
          </div>
          <div className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Tasks</div>
          <div className="text-3xl font-display font-black text-white tracking-tight">
            {stats.totalTasks || 0}
          </div>
          <div className="text-[0.55rem] text-slate-655 mt-1.5 uppercase font-mono tracking-widest">Assigned Items Across Boards</div>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] hover:border-red-500/30 rounded-2xl p-6 shadow-soft transition-all duration-300 group hover:scale-[1.01]">
          <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl w-fit mb-4">
            <AlertTriangle size={18} className="animate-pulse" />
          </div>
          <div className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-widest mb-1">High Priority Tasks</div>
          <div className="text-3xl font-display font-black text-red-500 tracking-tight">
            {stats.highPriorityTasks || 0}
          </div>
          <div className="text-[0.55rem] text-slate-655 mt-1.5 uppercase font-mono tracking-widest">Requiring Critical Action</div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSaveProfile}
          disabled={updateProfileMutation.isPending}
          className="px-8 py-3.5 bg-accent-blue text-white text-[0.7rem] font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-600 transition-all uppercase tracking-[0.1em] shadow-lg shadow-accent-blue/20 active:scale-95 disabled:opacity-50"
        >
          {updateProfileMutation.isPending ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Save size={16} />}
          Save Profile Details
        </button>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <form onSubmit={handleSavePassword} className="space-y-8 animate-in fade-in duration-300">
      <div className="border-b border-white/[0.05] pb-6">
        <h3 className="text-xl font-bold text-white tracking-tight font-display mb-1 uppercase">Security & Credentials</h3>
        <p className="text-[0.7rem] text-slate-500 uppercase tracking-widest font-mono">Modify secure password and system tokens</p>
      </div>

      {securityMessage && (
        <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[0.65rem] font-bold uppercase tracking-wider rounded-xl flex items-center gap-3">
          <Check size={16} />
          {securityMessage}
        </div>
      )}

      {securityError && (
        <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-500 text-[0.65rem] font-bold uppercase tracking-wider rounded-xl flex items-center gap-3">
          <X size={16} />
          {securityError}
        </div>
      )}

      <div className="bg-white/[0.01] border border-white/[0.04] p-8 rounded-2xl space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-widest">New Password</label>
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[0.6rem] font-bold text-accent-blue uppercase tracking-widest hover:text-indigo-400"
              >
                {showPassword ? <div className="flex items-center gap-1.5"><EyeOff size={12} /> Hide</div> : <div className="flex items-center gap-1.5"><Eye size={12} /> Show</div>}
              </button>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter a new secure password (min 6 chars)"
                className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-accent-blue/40 focus:ring-4 focus:ring-accent-blue/5 transition-all placeholder:text-slate-700"
              />
              <Lock size={16} className="absolute left-4 top-4.5 text-slate-600" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[0.65rem] text-slate-500 font-bold uppercase tracking-widest">Confirm New Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Verify new password"
                className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-accent-blue/40 focus:ring-4 focus:ring-accent-blue/5 transition-all placeholder:text-slate-700"
              />
              <Key size={16} className="absolute left-4 top-4.5 text-slate-600" />
            </div>
          </div>
        </div>

        {newPassword && (
          <div className="p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl space-y-2 text-[0.65rem] font-mono uppercase tracking-wider text-slate-500">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 6 ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span>Minimum 6 characters</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${confirmPassword && newPassword === confirmPassword ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span>Passwords match</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button 
          type="submit"
          disabled={updatePasswordMutation.isPending || !newPassword}
          className="px-8 py-3.5 bg-accent-blue text-white text-[0.7rem] font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-600 transition-all uppercase tracking-[0.1em] shadow-lg shadow-accent-blue/20 active:scale-95 disabled:opacity-50"
        >
          {updatePasswordMutation.isPending ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Shield size={16} />}
          Update Secure Password
        </button>
      </div>
    </form>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-10 animate-in fade-in duration-300">
      <div className="border-b border-white/[0.05] pb-6">
        <h3 className="text-xl font-bold text-white tracking-tight font-display mb-1 uppercase">UI Preferences</h3>
        <p className="text-[0.7rem] text-slate-500 uppercase tracking-widest font-mono">Personalize global theme options and grid layouts</p>
      </div>

      {/* Ambient aurora toggle */}
      <div className="flex items-center justify-between bg-white/[0.01] border border-white/[0.04] p-6 rounded-2xl">
        <div className="space-y-1 pr-6">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles size={16} className="text-accent-blue" />
            Ambient Aurora Gradients
          </h4>
          <p className="text-[0.65rem] text-slate-500 font-medium leading-relaxed max-w-md">
            Render dynamic glassmorphic aurora gradients that swirl and glow softly in the system background mesh.
          </p>
        </div>
        <button
          onClick={() => handlePrefChange('zenith_ambient_glows', prefAurora ? 'false' : 'true')}
          className={`w-12 h-6.5 rounded-full p-1 transition-all duration-300 flex-shrink-0 cursor-pointer ${
            prefAurora ? 'bg-accent-blue shadow-glow' : 'bg-white/[0.05] border border-white/[0.10]'
          }`}
        >
          <div 
            className={`w-4.5 h-4.5 rounded-full bg-white transition-all duration-300 ${
              prefAurora ? 'translate-x-5.5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Grid Canvas Overlay style Segmented Cards */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Sliders size={16} className="text-accent-blue" />
          Canvas Grid Overlay
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'dots', label: 'Dot Matrix', desc: 'Futuristic technical dots' },
            { id: 'lines', label: 'CAD Grid', desc: 'Structured grid lines' },
            { id: 'blank', label: 'Dark Space', desc: 'No grids overlay' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handlePrefChange('zenith_canvas_grid', item.id)}
              className={`p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group hover:scale-[1.02] cursor-pointer ${
                prefGrid === item.id 
                  ? 'bg-accent-blue/10 border-accent-blue/40 shadow-glow text-white' 
                  : 'bg-white/[0.01] border-white/[0.06] text-slate-400 hover:border-white/[0.15]'
              }`}
            >
              {item.id === 'dots' && (
                <div className="absolute inset-0 opacity-10 pointer-events-none canvas-dot-grid" />
              )}
              {item.id === 'lines' && (
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                     style={{ 
                       backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
                       backgroundSize: '16px 16px' 
                     }} 
                />
              )}
              <span className="block font-bold text-xs uppercase tracking-wider mb-1 font-display relative z-10">{item.label}</span>
              <span className="block text-[0.6rem] text-slate-500 relative z-10">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Layout Density Segmented Cards */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <HardDrive size={16} className="text-accent-blue" />
          Display Density Level
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 'comfortable', label: 'Comfortable Mode', desc: 'Default spacious layout with generous padding and cards' },
            { id: 'compact', label: 'Compact Matrix', desc: 'Highly optimized spatial density for broad visual tracking' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handlePrefChange('zenith_layout_density', item.id)}
              className={`p-5 rounded-2xl border text-left transition-all duration-300 relative group hover:scale-[1.02] cursor-pointer ${
                prefDensity === item.id 
                  ? 'bg-accent-blue/10 border-accent-blue/40 shadow-glow text-white' 
                  : 'bg-white/[0.01] border-white/[0.06] text-slate-400 hover:border-white/[0.15]'
              }`}
            >
              <span className="block font-bold text-xs uppercase tracking-wider mb-1 font-display">{item.label}</span>
              <span className="block text-[0.6rem] text-slate-500">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderActivityTab = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="border-b border-white/[0.05] pb-6 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight font-display mb-1 uppercase">Activity Log</h3>
          <p className="text-[0.7rem] text-slate-500 uppercase tracking-widest font-mono">Trace secure telemetries of past interactions</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/[0.08] rounded-xl">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_6px_#10B981]" />
          <span className="text-[0.55rem] font-mono text-slate-500 uppercase tracking-widest font-bold">Real-time Feed</span>
        </div>
      </div>

      <div className="divide-y divide-white/[0.04] max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin space-y-3">
        {isActivityLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-600">
            <Activity className="animate-spin text-accent-blue" size={24} />
            <span className="text-[0.6rem] font-mono uppercase tracking-[0.2em]">Acquiring System Streams...</span>
          </div>
        ) : activities.length > 0 ? (
          activities.map((log) => {
            const isAuthEvent = log.type?.toLowerCase().includes('auth') || log.action?.toLowerCase().includes('password') || log.action?.toLowerCase().includes('login');
            const isBoardEvent = log.boardId || log.action?.toLowerCase().includes('board') || log.action?.toLowerCase().includes('workspace');
            
            return (
              <div key={log._id} className="py-4 flex justify-between items-start gap-4 hover:bg-white/[0.01] px-4 rounded-xl transition-all group">
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 p-2 rounded-lg ${
                    isAuthEvent 
                      ? 'bg-amber-500/10 text-amber-500' 
                      : isBoardEvent 
                        ? 'bg-emerald-500/10 text-emerald-500' 
                        : 'bg-accent-blue/10 text-accent-blue'
                  }`}>
                    {isAuthEvent ? <Shield size={14} /> : isBoardEvent ? <Terminal size={14} /> : <User size={14} />}
                  </div>
                  <div>
                    <div className="text-xs text-white leading-relaxed group-hover:text-accent-blue transition-colors duration-200">
                      {log.action}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-[0.6rem] text-slate-500 font-mono uppercase tracking-tighter">
                      <span>{log.user?.name || 'SYSTEM'}</span>
                      {log.boardId?.title && (
                        <>
                          <div className="w-1 h-1 rounded-full bg-slate-700" />
                          <span>Board: {log.boardId?.title}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-[0.6rem] text-slate-600 font-mono whitespace-nowrap mt-1">
                  {new Date(log.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center text-slate-500">
            <Activity className="mx-auto mb-4 opacity-15" size={36} />
            <div className="text-[0.65rem] font-mono uppercase tracking-[0.2em] opacity-40">Zero telemetry recorded.</div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-12 max-w-5xl mx-auto space-y-16 animate-in fade-in duration-500 pb-24 scrollbar-thin">
      <header className="flex justify-between items-end border-b border-white/[0.05] pb-10">
        <div>
          <div className="text-accent-blue text-[0.7rem] font-bold tracking-[0.2em] uppercase mb-3 flex items-center gap-2">
            <Sliders size={12} />
            System Control Panel
          </div>
          <h1 className="text-5xl font-display font-black text-white tracking-tight">Zenith Settings</h1>
        </div>
      </header>

      {message && (
        <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[0.65rem] font-bold uppercase tracking-wider rounded-xl animate-in zoom-in-95 duration-300 flex items-center gap-3">
          <Check size={16} />
          {message}
        </div>
      )}

      {errorMsg && (
        <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-500 text-[0.65rem] font-bold uppercase tracking-wider rounded-xl animate-in zoom-in-95 duration-300 flex items-center gap-3">
          <X size={16} />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-12 items-start">
        {/* Left tabs selector rail */}
        <div className="flex flex-col gap-2 bg-white/[0.01] border border-white/[0.04] p-3 rounded-2xl shadow-soft">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-5 py-4 rounded-xl font-display text-[0.75rem] font-bold tracking-wider transition-all duration-300 relative group uppercase text-left cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-accent-blue/15 text-white border border-accent-blue/30 shadow-glow'
                  : 'text-slate-450 hover:text-white hover:bg-white/[0.02] border border-transparent'
              }`}
            >
              <div className={activeTab === tab.id ? 'text-accent-blue' : 'text-slate-500 group-hover:text-slate-350'}>
                {tab.icon}
              </div>
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="settings-active-tab" 
                  className="absolute left-0 w-1 h-5 bg-accent-blue rounded-full" 
                />
              )}
            </button>
          ))}

          <div className="h-[1px] bg-white/[0.04] my-4 mx-2" />

          {/* Revoke Session logout button integrated at the bottom of settings sidebar */}
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-5 py-4 rounded-xl font-display text-[0.75rem] font-bold tracking-wider text-red-500/80 hover:text-white hover:bg-red-500/10 transition-all uppercase text-left cursor-pointer"
          >
            <LogOut size={16} />
            <span>Logout Session</span>
          </button>
        </div>

        {/* Right content window */}
        <div className="bg-surface/35 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 shadow-soft min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === 'profile' && renderProfileTab()}
              {activeTab === 'security' && renderSecurityTab()}
              {activeTab === 'preferences' && renderPreferencesTab()}
              {activeTab === 'activity' && renderActivityTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

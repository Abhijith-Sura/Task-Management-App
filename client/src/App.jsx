import { useState, useEffect, useCallback } from 'react';
import { AppShell } from './layouts/AppShell';
import { Board } from './features/canvas/Board';
import { Dashboard } from './features/analytics/Dashboard';
import { GlobalSettings } from './features/settings/GlobalSettings';
import { AssetManager } from './features/assets/AssetManager';
import { WorkspaceHub } from './features/workspace/WorkspaceHub';
import { UserProfile } from './features/profile/UserProfile';
import { CommandPalette } from './features/command/CommandPalette';
import { LandingPage } from './features/marketing/LandingPage';
import { DemoDashboard } from './features/marketing/DemoDashboard';
import { LiveBoardDemo } from './features/marketing/LiveBoardDemo';
import { ActivityFeed } from './features/analytics/ActivityFeed';
import { Auth } from './features/auth/Auth';
import { isAuthenticated, logout } from './features/auth/AuthService';
import { NotificationHub } from './features/notifications/NotificationHub';
import { PremiumPromptModal } from './components/ui/PremiumPromptModal';
import { ToastContainer, showToast } from './components/ui/Toast';
import { Terminal, Settings, Activity, LogOut, Plus, ShieldAlert, Bell, HardDrive, Box, Hash } from 'lucide-react';
import api from './services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socketService } from './services/socket';
import { motion, AnimatePresence } from 'framer-motion';
import zenithLogo from './assets/zenith_logo.png';

const Sidebar = ({ boards, onBoardSelect, activeBoardId, currentView, onViewChange, unreadCount, isNotifOpen, setIsNotifOpen, role, user: propUser }) => {
  const localUser = JSON.parse(localStorage.getItem('user') || '{}');
  const user = propUser || localUser;

  return (
    <div className="flex flex-col h-full select-none relative z-20">
      {/* Workspace Branding */}
      <div className="p-8 pb-12">
        <div className="flex items-center justify-between mb-10">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-glow group-hover:rotate-12 transition-all duration-500 overflow-hidden">
              <img src={zenithLogo} alt="Zenith Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-[1.2rem] tracking-tighter text-white leading-none">Zenith</span>
              <span className="font-mono text-[0.55rem] text-slate-600 tracking-[0.3em] uppercase font-bold mt-1">Task Manager</span>
            </div>
          </motion.div>
          
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-400 hover:text-white transition-all bg-white/[0.04] border border-white/[0.12] rounded-xl hover:shadow-glow"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent-blue rounded-full ring-2 ring-background animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.8)]" />
            )}
          </button>
        </div>
 
        <nav className="flex-1 overflow-y-auto space-y-10 scrollbar-none pr-1">
          {/* Main Navigation - High Density */}
          <div className="space-y-2">
            <SidebarItem 
              icon={<Box size={18} />} 
              label="Workspaces" 
              active={currentView === 'workspaces'} 
              onClick={() => onViewChange('workspaces')}
            />
            <SidebarItem 
              icon={<Activity size={18} />} 
              label="Analytics" 
              active={currentView === 'dashboard'} 
              onClick={() => onViewChange('dashboard')}
            />
          </div>
 
          {/* Boards List */}
          <div className="space-y-4">
            <div className="px-4 flex items-center justify-between">
              <span className="text-[0.6rem] font-bold text-slate-500 uppercase tracking-[0.3em]">My Boards</span>
              <div className="w-8 h-[1px] bg-white/[0.10]" />
            </div>
            <div className="space-y-1 max-h-[35vh] overflow-y-auto scrollbar-none px-2">
              {boards.map(board => (
                <motion.div 
                   key={board._id}
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    onBoardSelect(board._id);
                    onViewChange('board');
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-xl transition-all group relative overflow-hidden ${
                    activeBoardId === board._id && currentView === 'board'
                      ? 'bg-accent-blue/15 text-white border border-accent-blue/30' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {activeBoardId === board._id && currentView === 'board' && (
                    <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-accent-blue/[0.05] z-[-1]" />
                  )}
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    activeBoardId === board._id && currentView === 'board' ? 'bg-accent-blue shadow-glow' : 'bg-slate-700'
                  }`} />
                  <span className="text-[0.8rem] font-bold tracking-tight truncate">{board.title}</span>
                  <div className="flex-1" />
                  {activeBoardId === board._id && currentView === 'board' && <Hash size={12} className="text-accent-blue" />}
                </motion.div>
              ))}
            </div>
          </div>
 
          {/* Settings & Files */}
          <div className="space-y-2">
            <div className="px-4 mb-4">
              <span className="text-[0.6rem] font-bold text-slate-500 uppercase tracking-[0.3em]">Vault</span>
            </div>
            <SidebarItem 
              icon={<HardDrive size={18} />} 
              label="Files" 
              active={currentView === 'assets'} 
              onClick={() => onViewChange('assets')}
            />
            <SidebarItem 
              icon={<Settings size={18} />} 
              label="Settings" 
              active={currentView === 'settings'} 
              onClick={() => onViewChange('settings')}
            />
          </div>
        </nav>
      </div>
 
      {/* User Profile Footer */}
      <div className="mt-auto p-6">
        <div className="glass-panel p-3 rounded-2xl flex items-center gap-3 border border-white/[0.12] group hover:border-accent-blue/50 transition-all cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-accent-blue font-display font-bold shadow-sm group-hover:scale-105 transition-all">
            {user.avatar ? <img src={user.avatar} className="w-full h-full rounded-xl object-cover" /> : user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[0.85rem] font-bold text-white truncate tracking-tight">{user.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.8)]" />
              <div className="text-[0.6rem] text-slate-500 font-bold uppercase tracking-widest truncate leading-none">
                {role === 'admin' ? 'Workspace Owner' : role === 'editor' ? 'Workspace Editor' : role === 'viewer' ? 'Workspace Viewer' : 'Workspace Member'}
              </div>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }) => (
  <motion.div 
    whileHover={{ x: 4 }}
    onClick={onClick}
    className={`flex items-center gap-4 px-4 py-3 cursor-pointer rounded-xl transition-all duration-300 group relative overflow-hidden ${
      active 
        ? 'bg-accent-blue/15 text-white etch-border' 
        : 'text-slate-400 hover:text-slate-200'
    }`}
  >
    <div className={`transition-all duration-300 ${active ? 'text-accent-blue scale-110' : 'text-slate-500 group-hover:text-slate-350'}`}>
      {icon}
    </div>
    <span className="text-[0.85rem] font-bold tracking-tight">{label}</span>
    {active && (
      <motion.div 
        layoutId="active-indicator"
        className="absolute right-0 w-1 h-4 bg-accent-blue rounded-full mr-2" 
      />
    )}
  </motion.div>
);

function App() {
  const [isAuth, setIsAuth] = useState(isAuthenticated());
  const [isLanding, setIsLanding] = useState(!isAuthenticated());
  const [isDemo, setIsDemo] = useState(false);
  const [isAuthView, setIsAuthView] = useState(false);
  
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [currentView, setCurrentView] = useState('board');
  const [notifications, setNotifications] = useState([]);
  const [lastReadTime, setLastReadTime] = useState(() => {
    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
    const key = localUser._id ? `zenith_notifications_last_read_${localUser._id}` : 'zenith_notifications_last_read';
    const saved = localStorage.getItem(key);
    return saved ? parseInt(saved, 10) : Date.now();
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const queryClient = useQueryClient();
  const [promptConfig, setPromptConfig] = useState(null);

  useEffect(() => {
    window.showPremiumPrompt = (title, placeholder, defaultValue, onConfirm, type = 'text') => {
      setPromptConfig({ title, placeholder, defaultValue, onConfirm, type });
    };
    return () => {
      window.showPremiumPrompt = null;
    };
  }, []);

  // Update lastReadTime when notification hub is opened
  useEffect(() => {
    if (isNotifOpen) {
      const now = Date.now();
      setLastReadTime(now);
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      const key = localUser._id ? `zenith_notifications_last_read_${localUser._id}` : 'zenith_notifications_last_read';
      localStorage.setItem(key, now.toString());
    }
  }, [isNotifOpen]);

  // Fetch reactive User Profile data
  const { data: profileResponse } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/profile');
      return data;
    },
    enabled: isAuth,
  });


  // Global layout density preference synchronizer
  useEffect(() => {
    const handlePrefChange = () => {
      const density = localStorage.getItem('zenith_layout_density') || 'comfortable';
      if (density === 'compact') {
        document.documentElement.classList.add('layout-compact');
      } else {
        document.documentElement.classList.remove('layout-compact');
      }
    };
    handlePrefChange();
    window.addEventListener('zenith-pref-change', handlePrefChange);
    return () => window.removeEventListener('zenith-pref-change', handlePrefChange);
  }, []);

  const handleJoinViaToken = useCallback(async (token, isIndividual = false) => {
    try {
      const endpoint = isIndividual 
        ? `/boards/invitations/accept/${token}`
        : `/boards/join/${token}`;

      const { data } = await api.post(endpoint);
      if (data?.success) {
        setNotifications(prev => [{
          _id: Date.now(),
          action: isIndividual ? 'Accepted gated invitation' : 'Joined board successfully',
          cardTitle: 'Workspace Collaboration',
          user: { name: 'Core Security' },
          createdAt: new Date().toISOString()
        }, ...prev]);
        
        await queryClient.invalidateQueries({ queryKey: ['boards'] });
        await queryClient.invalidateQueries({ queryKey: ['board-invitations'] });
        
        const joinedBoardId = data.data.boardId;
        setActiveBoardId(joinedBoardId);
        setCurrentView('board');
        sessionStorage.removeItem('pendingInviteToken');
        sessionStorage.removeItem('pendingInviteIsIndividual');
        window.history.replaceState({}, document.title, '/');

        // Show welcome toast after a short delay so the board has time to render
        setTimeout(() => {
          showToast('Welcome to the board! You now have access to collaborate.', 'success', 6000);
        }, 800);
      }
    } catch (err) {
      console.error("Failed to join board via token:", err);
      sessionStorage.removeItem('pendingInviteToken');
      sessionStorage.removeItem('pendingInviteIsIndividual');
      window.history.replaceState({}, document.title, '/');
    }
  }, [queryClient]);

  // URL Interception for board invite tokens
  useEffect(() => {
    // 1. Check individual invitation links first
    const individualMatch = window.location.pathname.match(/\/b\/invite\/individual\/([a-zA-Z0-9]+)/);
    if (individualMatch) {
      const token = individualMatch[1];
      if (isAuth) {
        handleJoinViaToken(token, true);
      } else {
        sessionStorage.setItem('pendingInviteToken', token);
        sessionStorage.setItem('pendingInviteIsIndividual', 'true');
        setIsAuthView(true);
        setIsLanding(true);
      }
      return;
    }

    // 2. Check global shareable invite links
    const globalMatch = window.location.pathname.match(/\/b\/invite\/([a-zA-Z0-9]+)/);
    if (globalMatch) {
      const token = globalMatch[1];
      if (isAuth) {
        handleJoinViaToken(token, false);
      } else {
        sessionStorage.setItem('pendingInviteToken', token);
        sessionStorage.setItem('pendingInviteIsIndividual', 'false');
        setIsAuthView(true);
        setIsLanding(true);
      }
    }
  }, [isAuth, handleJoinViaToken]);

  // Fetch Available Boards
  const { data: boardsResponse, isLoading: boardsLoading } = useQuery({
    queryKey: ['boards'],
    queryFn: async () => {
      const { data } = await api.get('/boards');
      return data;
    },
    enabled: isAuth,
  });

  const boards = boardsResponse?.data || [];

  // Command Palette Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Create Board Mutation
  const createBoardMutation = useMutation({
    mutationFn: async ({ title, workspaceId, templateId }) => {
      if (templateId) {
        const { data } = await api.post('/boards/create-from-template', { title, workspaceId, templateId });
        return data.data || data;
      }
      const { data } = await api.post('/boards', { title, workspaceId });
      return data.data || data;
    },
    onSuccess: (newBoard) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      const boardId = newBoard?._id || newBoard?.id || newBoard?.data?._id;
      setActiveBoardId(boardId);
      setCurrentView('board');
    }
  });

  useEffect(() => {
    if (boards && boards.length > 0 && !activeBoardId) {
      setActiveBoardId(boards[0]._id);
    }
    // If the active board was deleted and is no longer in the list, reset
    if (activeBoardId && boards && boards.length > 0 && !boards.find(b => b._id === activeBoardId)) {
      setActiveBoardId(boards[0]._id);
      setCurrentView('dashboard');
    }
    // If there are no boards at all, clear the active board
    if (boards && boards.length === 0 && activeBoardId) {
      setActiveBoardId(null);
      setCurrentView('dashboard');
    }
  }, [boards, activeBoardId]);

  // Global Notification Listener
  useEffect(() => {
    if (!isAuth) return;
    
    const handleActivity = (data) => {
      setNotifications(prev => [{
        _id: Date.now(),
        action: data.action || 'Activity detected',
        cardTitle: data.cardTitle || 'Board Item',
        user: data.user || { name: 'User' },
        createdAt: new Date().toISOString()
      }, ...prev].slice(0, 50));
    };

    socketService.onUpdateCard((data) => handleActivity({ ...data, action: 'Updated card' }));
    socketService.onBoardRefresh(() => handleActivity({ action: 'Synchronized board' }));

    return () => {};
  }, [isAuth]);

  // Seed Notifications from historical board activities
  useEffect(() => {
    if (!activeBoardId || !isAuth) return;

    const fetchBoardActivity = async () => {
      try {
        const { data } = await api.get(`/boards/${activeBoardId}/activity`);
        if (data?.success && data.data) {
          const mapped = data.data.map(act => ({
            _id: act._id,
            action: act.action,
            cardTitle: act.cardTitle || 'Board Event',
            user: act.user || { name: 'SYSTEM' },
            createdAt: act.createdAt
          }));
          setNotifications(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch initial activities:", err);
      }
    };

    fetchBoardActivity();
  }, [activeBoardId, isAuth]);

  // Landing Page Logic
  if (isLanding && !isDemo) {
    if (isAuthView) {
      return <Auth onAuthSuccess={() => {
        setIsAuth(true);
        setIsLanding(false);
        setIsAuthView(false);
        
        // Post-auth redirection for pending invite link
        const pendingToken = sessionStorage.getItem('pendingInviteToken');
        const isIndividual = sessionStorage.getItem('pendingInviteIsIndividual') === 'true';
        if (pendingToken) {
          handleJoinViaToken(pendingToken, isIndividual);
        }
      }} />;
    }
    return (
      <LandingPage 
        onAuthClick={() => setIsAuthView(true)} 
        onDemoClick={() => {
          setIsDemo(true);
          setCurrentView('live-demo');
        }}
      />
    );
  }

  if (isAuth && boardsLoading) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Terminal className="text-accent-blue animate-pulse" size={48} />
        <div className="font-mono text-xs tracking-widest text-[#A1A1AA]">Loading Workspace...</div>
      </div>
    );
  }

  if (isAuth && boards.length === 0 && !activeBoardId && !isDemo) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col items-center justify-center">
        <div className="w-[400px] p-8 bg-surface border border-border rounded-sm text-center shadow-2xl">
          <ShieldAlert className="text-accent-amber mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold font-mono text-[#FAFAFA] mb-2 uppercase">No Active Boards</h2>
          <p className="text-xs text-[#A1A1AA] font-mono mb-8 tracking-tighter">Get started by creating your first board.</p>
          
          <button 
            onClick={() => createBoardMutation.mutate({ title: 'New Board' })}
            disabled={createBoardMutation.isPending}
            className="w-full py-3 bg-accent-blue text-white font-mono text-sm font-bold rounded-sm flex items-center justify-center gap-2 hover:bg-blue-600 transition-all uppercase tracking-widest shadow-lg"
          >
            {createBoardMutation.isPending ? <Plus className="animate-spin" /> : <Plus size={18} />}
            Create Your First Board
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (isDemo) {
      if (currentView === 'live-demo') return <LiveBoardDemo />;
      return <DemoDashboard />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'telemetry':
        return <ActivityFeed />;
      case 'workspaces':
        return <WorkspaceHub 
          onBoardSelect={setActiveBoardId} 
          onViewChange={setCurrentView} 
          onCreateBoard={(boardData) => createBoardMutation.mutate(boardData)}
        />;
      case 'profile':
        return <UserProfile />;
      case 'assets':
        return <AssetManager />;
      case 'settings':
        return <GlobalSettings />;
      case 'board':
      default:
        return activeBoardId ? <Board boardId={activeBoardId} onViewChange={setCurrentView} /> : null;
    }
  };



  const profileData = profileResponse?.data || {};
  const user = profileData.user || JSON.parse(localStorage.getItem('user') || '{}');
  const activeBoard = boards.find(b => b._id === activeBoardId);
  const isOwner = user._id && activeBoard?.owner && (user._id.toString() === (activeBoard.owner?._id || activeBoard.owner).toString());
  const workspaceMembers = activeBoard?.workspaceId?.members || [];
  const findWorkspaceRole = (userId) => {
    if (!userId || !workspaceMembers.length) return 'member';
    const wsMember = workspaceMembers.find(m => {
      const idStr = m?.user?._id || m?.user || '';
      return idStr && idStr.toString() === userId.toString();
    });
    return wsMember?.role || 'member';
  };
  const currentUserRole = isOwner ? 'admin' : findWorkspaceRole(user._id);

  const unreadCount = notifications.filter(n => {
    const time = new Date(n.createdAt).getTime();
    return time > lastReadTime;
  }).length;

  return (
    <AppShell 
      sidebar={
        <Sidebar 
          boards={boards} 
          onBoardSelect={setActiveBoardId} 
          activeBoardId={activeBoardId} 
          currentView={currentView}
          onViewChange={setCurrentView}
          unreadCount={unreadCount}
          isNotifOpen={isNotifOpen}
          setIsNotifOpen={setIsNotifOpen}
          isDemo={isDemo}
          onExitDemo={() => {
            setIsDemo(false);
            setIsLanding(true);
          }}
          role={currentUserRole}
          user={user}
        />
      }
    >
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView === 'board' ? `${currentView}-${activeBoardId}` : currentView}
            initial={{ opacity: 0, y: 15, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.995 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {!isDemo && (
        <AnimatePresence>
          {isCommandPaletteOpen && (
            <CommandPalette 
              isOpen={isCommandPaletteOpen}
              onClose={() => setIsCommandPaletteOpen(false)}
              boards={boards}
              onViewChange={setCurrentView}
              onBoardSelect={setActiveBoardId}
            />
          )}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {isNotifOpen && (
          <NotificationHub 
            notifications={notifications}
            onClear={() => setNotifications([])}
            onClose={() => setIsNotifOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {promptConfig && (
          <PremiumPromptModal 
            title={promptConfig.title}
            placeholder={promptConfig.placeholder}
            defaultValue={promptConfig.defaultValue}
            type={promptConfig.type}
            onConfirm={(val) => {
              promptConfig.onConfirm(val);
              setPromptConfig(null);
            }}
            onClose={() => setPromptConfig(null)}
          />
        )}
      </AnimatePresence>

      {/* Global Toast Notifications */}
      <ToastContainer />
    </AppShell>
  );
}

export default App;

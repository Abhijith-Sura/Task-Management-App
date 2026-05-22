import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpaceBackground } from '../components/ui/SpaceBackground';
import { Menu, X } from 'lucide-react';

export const AppShell = ({ children, sidebar, drawer, isDrawerOpen }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-transparent">
      <SpaceBackground />

      {/* Mobile top bar - only visible on small screens */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 border-b border-white/[0.08]">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-2xl z-[-1]" />
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2 text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
        >
          <Menu size={22} />
        </button>
        <span className="ml-3 font-mono text-sm font-bold text-[#FAFAFA] tracking-widest uppercase">
          Zenith
        </span>
      </div>

      {/* Mobile sidebar overlay backdrop */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - slides in on mobile, always visible on desktop */}
      <AnimatePresence>
        {(isMobileSidebarOpen) && (
          <motion.aside
            key="mobile-sidebar"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed top-0 left-0 h-full w-[280px] z-50 md:hidden"
          >
            <div className="absolute inset-0 bg-background/95 backdrop-blur-3xl z-[-1] border-r border-white/[0.08]" />
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors z-10"
            >
              <X size={18} />
            </button>
            {sidebar}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop layout - grid with permanent sidebar */}
      <div className="hidden md:grid md:grid-cols-[280px_1fr] h-full">
        {/* Desktop Sidebar */}
        <aside className="bg-transparent border-r border-white/[0.08] z-10 h-full relative">
          <div className="absolute inset-0 bg-background/40 backdrop-blur-3xl z-[-1]" />
          {sidebar}
        </aside>

        {/* Desktop Main Canvas */}
        <main className="h-full overflow-hidden relative flex flex-col bg-transparent">
          <div className="flex-1 overflow-hidden relative z-10 flex flex-col">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Main Canvas - full width, padded top for mobile bar */}
      <main className="md:hidden h-full pt-14 overflow-hidden relative flex flex-col bg-transparent">
        <div className="flex-1 overflow-hidden relative z-10 flex flex-col">
          {children}
        </div>
      </main>

      {/* Drawer - Premium Slide-in Module (both desktop and mobile) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-surface/80 backdrop-blur-3xl border-l border-white/[0.10] z-30 shadow-soft"
          >
            <div className="absolute inset-0 bg-background/20 z-[-1]" />
            {drawer}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};

import { motion, AnimatePresence } from 'framer-motion';
import { SpaceBackground } from '../components/ui/SpaceBackground';

export const AppShell = ({ children, sidebar, drawer, isDrawerOpen }) => {
  return (
    <div className="relative grid grid-cols-[auto_1fr] h-screen w-screen overflow-hidden bg-transparent">
      <SpaceBackground />
      
      {/* Sidebar - Floating Rail Navigation */}
      <aside className="w-[280px] bg-transparent border-r border-white/[0.08] z-10 h-full relative">
        <div className="absolute inset-0 bg-background/40 backdrop-blur-3xl z-[-1]" />
        {sidebar}
      </aside>

      {/* Main Canvas Area */}
      <main className="h-full overflow-hidden relative flex flex-col bg-transparent">
        <div className="flex-1 overflow-hidden relative z-10 flex flex-col">
          {children}
        </div>
      </main>

      {/* Drawer - Premium Slide-in Module */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.aside 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-[500px] bg-surface/80 backdrop-blur-3xl border-l border-white/[0.10] z-30 shadow-soft"
          >
            <div className="absolute inset-0 bg-background/20 z-[-1]" />
            {drawer}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};

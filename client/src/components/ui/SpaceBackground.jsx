import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const SpaceBackground = () => {
  const [ambientGlow, setAmbientGlow] = useState(localStorage.getItem('zenith_ambient_glows') !== 'false');
  const [gridStyle, setGridStyle] = useState(localStorage.getItem('zenith_canvas_grid') || 'dots');

  useEffect(() => {
    const handlePrefChange = () => {
      setAmbientGlow(localStorage.getItem('zenith_ambient_glows') !== 'false');
      setGridStyle(localStorage.getItem('zenith_canvas_grid') || 'dots');
    };
    window.addEventListener('zenith-pref-change', handlePrefChange);
    return () => window.removeEventListener('zenith-pref-change', handlePrefChange);
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-background pointer-events-none">
      {/* Mesh Auroras */}
      {ambientGlow && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-accent-blue/20 rounded-full blur-[130px] animate-aurora-1 opacity-70" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[65%] h-[65%] bg-indigo-500/15 rounded-full blur-[150px] animate-aurora-2 opacity-60" />
          <div className="absolute top-[20%] right-[-5%] w-[45%] h-[50%] bg-violet-600/15 rounded-full blur-[110px] animate-aurora-1 opacity-50" />
        </>
      )}
      
      {/* Canvas Grid Style */}
      {gridStyle === 'dots' && (
        <div className="absolute inset-0 canvas-dot-grid opacity-65" />
      )}
      {gridStyle === 'lines' && (
        <div className="absolute inset-0 opacity-40" 
             style={{ 
               backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
               backgroundSize: '40px 40px'
             }} 
        />
      )}
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,6,10,0.5)_100%)]" />
      
      {/* Global Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
    </div>
  );
};

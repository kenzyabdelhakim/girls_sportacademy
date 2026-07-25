import React, { useState, useEffect } from 'react';
import Sidebar, { MobileNav } from '../components/Navbar';

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);

  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const marginInlineStart = isDesktop ? (collapsed ? 72 : 240) : 0;

  return (
    <div className="app-bg min-h-screen">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <MobileNav />

      <main
        className="min-h-screen transition-[margin] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ marginInlineStart }}
      >
        <div className="lg:hidden h-14" />
        <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto lg:mx-0">
          {children}
        </div>
      </main>

      <div className="ambient-glow fixed pointer-events-none" style={{ top: '-15%', left: '8%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(236, 72, 153,0.14) 0%, transparent 70%)', zIndex: 0 }} />
      <div className="ambient-glow fixed pointer-events-none" style={{ bottom: '-18%', right: '3%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(244, 114, 182,0.12) 0%, transparent 70%)', zIndex: 0 }} />
    </div>
  );
};

export default MainLayout;

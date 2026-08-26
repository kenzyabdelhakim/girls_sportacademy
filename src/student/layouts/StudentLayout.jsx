import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  User,
  ClipboardList,
  BookOpen,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../../components/Logo';
import { Languages } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';

const navItems = [
  { path: '/student/dashboard', labelKey: 'student.navDashboard',  icon: LayoutDashboard, color: '#EC4899' },
  { path: '/student/profile',   labelKey: 'student.navProfile',    icon: User,            color: '#DB2777' },
  { path: '/student/attendance',labelKey: 'student.navAttendance', icon: ClipboardList,   color: '#22C55E' },
  { path: '/student/materials', labelKey: 'student.navMaterials',  icon: BookOpen,        color: '#F59E0B' },
];

const ThemeToggle = ({ collapsed }) => {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLang();
  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      title={isDark ? t('common.lightMode') : t('common.darkMode')}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-surface-hover)' }}>
        {isDark
          ? <Sun size={16} style={{ color: '#F59E0B' }} />
          : <Moon size={16} style={{ color: '#F472B6' }} />}
      </div>
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm font-semibold whitespace-nowrap"
            style={{ color: 'var(--text-secondary)' }}
          >
            {isDark ? t('common.lightMode') : t('common.darkMode')}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

const LangToggle = ({ collapsed }) => {
  const { toggleLang, t } = useLang();
  return (
    <motion.button
      onClick={toggleLang}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      title={t('common.language')}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-surface-hover)' }}>
        <Languages size={16} style={{ color: '#DB2777' }} />
      </div>
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm font-semibold whitespace-nowrap"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('common.language')}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

const StudentLayout = ({ children }) => {
  const { studentData, logout } = useStudentAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t, toggleLang, isRTL } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);

  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t('login.seeYou'));
      navigate('/student/login');
    } catch { toast.error(t('login.logoutFailed')); }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="app-bg min-h-screen">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="sidebar-bg hidden lg:flex flex-col fixed left-0 top-0 h-full z-40 overflow-hidden"
        style={{ borderRight: '1px solid var(--sidebar-border)', backdropFilter: 'blur(20px)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <Link to="/student/dashboard" className="flex items-center gap-3 flex-shrink-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 p-2"
              style={{ background: 'linear-gradient(135deg, #F472B6, #F9A8D4)', boxShadow: '0 4px 20px rgba(249, 168, 212,0.35)' }}
            >
              <Logo variant="mark" tone="white" className="w-full h-full" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="font-black text-[10px] leading-none tracking-wider" style={{ color: 'var(--text-muted)' }}>ROVY SWIMMING ACADEMY</p>
                  <p className="font-black text-sm leading-none tracking-tight mt-1" style={{ color: '#DB2777' }}>{t('nav.studentPortal')}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scroll-area">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200"
                  style={{
                    background: active ? 'var(--nav-active-bg)' : 'transparent',
                    borderInlineStart: active ? `2.5px solid ${item.color}` : '2.5px solid transparent',
                  }}
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: active ? `${item.color}22` : 'var(--bg-surface)' }}
                  >
                    <Icon size={17} style={{ color: active ? item.color : 'var(--text-muted)' }} />
                  </div>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="text-sm font-semibold whitespace-nowrap"
                        style={{ color: active ? item.color : 'var(--text-secondary)' }}
                      >
                        {t(item.labelKey)}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
          <LangToggle collapsed={collapsed} />
          <ThemeToggle collapsed={collapsed} />

          {/* User info */}
          <div className="flex items-center gap-3 px-2 py-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #F472B6, #ec4899)', color: '#fff' }}
            >
              {studentData?.fullName?.[0]?.toUpperCase() || 'S'}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{studentData?.fullName}</p>
                  <p className="text-xs" style={{ color: '#DB2777' }}>{studentData?.group}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Logout */}
          <motion.button
            onClick={handleLogout}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
            style={{ background: 'transparent' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <LogOut size={16} style={{ color: '#ef4444' }} />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                  {t('common.logout')}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Collapse toggle */}
          <motion.button
            onClick={() => setCollapsed(!collapsed)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full flex items-center justify-center h-8 rounded-xl transition-all"
            style={{ background: 'var(--bg-surface)' }}
          >
            {collapsed
              ? <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              : <ChevronLeft size={16} style={{ color: 'var(--text-muted)' }} />}
          </motion.button>
        </div>
      </motion.aside>

      {/* Mobile top bar */}
      <div
        className="topbar-bg lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14"
        style={{ borderBottom: '1px solid var(--sidebar-border)', backdropFilter: 'blur(20px)' }}
      >
        <Link to="/student/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center p-1.5" style={{ background: 'linear-gradient(135deg, #F472B6, #F9A8D4)' }}>
            <Logo variant="mark" tone="white" className="w-full h-full" />
          </div>
          <span className="font-black text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>{t('nav.studentPortal')}</span>
        </Link>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={toggleLang}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            title={t('common.language')}
          >
            {isRTL ? 'EN' : 'ع'}
          </motion.button>
          <motion.button
            onClick={toggleTheme}
            whileTap={{ scale: 0.9 }}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            {isDark ? <Sun size={15} style={{ color: '#F59E0B' }} /> : <Moon size={15} style={{ color: '#F472B6' }} />}
          </motion.button>
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-surface)' }}
          >
            <Menu size={20} style={{ color: 'var(--text-primary)' }} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: isRTL ? '100%' : '-100%' }} animate={{ x: 0 }} exit={{ x: isRTL ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="drawer-bg fixed left-0 top-0 bottom-0 w-72 z-50 flex flex-col"
              style={{ borderRight: '1px solid var(--sidebar-border)' }}
            >
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center p-1.5" style={{ background: 'linear-gradient(135deg, #F472B6, #F9A8D4)' }}>
                    <Logo variant="mark" tone="white" className="w-full h-full" />
                  </div>
                  <div>
                    <p className="font-black text-sm leading-none" style={{ color: 'var(--text-primary)' }}>{t('nav.studentPortal')}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#DB2777' }}>{studentData?.fullName}</p>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-surface)' }}>
                  <X size={16} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>

              <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}>
                      <div
                        className="flex items-center gap-3 px-3 py-3 rounded-xl"
                        style={{ background: active ? 'var(--nav-active-bg)' : 'transparent', borderInlineStart: active ? `2.5px solid ${item.color}` : '2.5px solid transparent' }}
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: active ? `${item.color}22` : 'var(--bg-surface)' }}>
                          <Icon size={18} style={{ color: active ? item.color : 'var(--text-muted)' }} />
                        </div>
                        <span className="font-semibold text-sm" style={{ color: active ? item.color : 'var(--text-secondary)' }}>{t(item.labelKey)}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3 px-2 mb-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'linear-gradient(135deg, #F472B6, #ec4899)', color: '#fff' }}>
                    {studentData?.fullName?.[0]?.toUpperCase() || 'S'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{studentData?.fullName}</p>
                    <p className="text-xs" style={{ color: '#DB2777' }}>{studentData?.group}</p>
                  </div>
                </div>
                <button
                  onClick={toggleLang}
                  className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl btn-secondary"
                >
                  <Languages size={16} style={{ color: '#DB2777' }} />
                  <span>{t('common.language')}</span>
                </button>
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl btn-secondary"
                >
                  {isDark ? <Sun size={16} style={{ color: '#F59E0B' }} /> : <Moon size={16} style={{ color: '#F472B6' }} />}
                  <span>{isDark ? t('common.lightMode') : t('common.darkMode')}</span>
                </button>
                <button onClick={handleLogout} className="w-full btn-danger">
                  <LogOut size={16} /> {t('common.logout')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.main
        animate={{ marginInlineStart: isDesktop ? (collapsed ? 72 : 240) : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen"
        style={{ marginInlineStart: isDesktop ? 240 : 0 }}
      >
        <div className="lg:hidden h-14" />
        <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto lg:mx-0">
          {children}
        </div>
      </motion.main>

      {/* Ambient glows: soft blurred pink blobs */}
      <div className="ambient-glow fixed pointer-events-none" style={{ top: '-15%', left: '8%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(244, 114, 182,0.14) 0%, transparent 70%)', zIndex: 0 }} />
      <div className="ambient-glow fixed pointer-events-none" style={{ bottom: '-18%', right: '3%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)', zIndex: 0 }} />
    </div>
  );
};

export default StudentLayout;

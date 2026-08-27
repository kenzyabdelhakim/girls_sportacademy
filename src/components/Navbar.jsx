import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Layers,
  ScanLine,
  ClipboardList,
  BookOpen,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sun,
  Moon,
  Languages,
  Pencil,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from './Logo';
import { useLang } from '../contexts/LanguageContext';

const navItems = [
  { path: '/dashboard', labelKey: 'nav.dashboard',  icon: LayoutDashboard, color: '#EC4899' },
  { path: '/students',  labelKey: 'nav.students',   icon: Users,          color: '#DB2777' },
  { path: '/groups',    labelKey: 'nav.groups',     icon: Layers,         color: '#F43F5E' },
  { path: '/scanner',   labelKey: 'nav.scanner',    icon: ScanLine,       color: '#22C55E' },
  { path: '/attendance',labelKey: 'nav.attendance', icon: ClipboardList,  color: '#F59E0B' },
  { path: '/materials', labelKey: 'nav.materials',  icon: BookOpen,        color: '#ec4899' },
];

/* ── Shared nav item component ── */
const NavItem = ({ item, isActive, collapsed, onClick }) => {
  const { t } = useLang();
  const active = isActive(item.path);
  const Icon = item.icon;
  return (
    <Link to={item.path} onClick={onClick}>
      <motion.div
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.97 }}
        className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200"
        style={{
          background: active ? 'var(--nav-active-bg)' : 'transparent',
          borderInlineStart: active ? `2.5px solid ${item.color}` : '2.5px solid transparent',
          boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.02)' : 'none',
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
};

/* ── Theme toggle button ── */
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

/* ── Language toggle button (sidebar style) ── */
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
        <Languages size={16} style={{ color: '#EC4899' }} />
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

/* ── Admin name: label + edit modal ── */
// Falls back to the email's local part until the admin sets a real name.
const adminLabel = (displayName, currentUser) =>
  displayName || currentUser?.email?.split('@')[0] || '';

const AdminNameModal = ({ open, onClose }) => {
  const { currentUser, displayName, updateDisplayName } = useAuth();
  const { t } = useLang();
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  // Seed the field with the current name each time the modal opens.
  useEffect(() => {
    if (open) setValue(displayName || '');
  }, [open, displayName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value.trim()) { toast.error(t('common.nameRequired')); return; }
    setSaving(true);
    try {
      await updateDisplayName(value);
      toast.success(t('common.nameUpdated'));
      onClose();
    } catch {
      toast.error(t('common.nameUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={saving ? undefined : onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="modal-bg relative w-full max-w-sm rounded-2xl"
            style={{ border: '1px solid var(--border)' }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{t('common.yourName')}</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{currentUser?.email}</p>
                </div>
                <button onClick={onClose} className="btn-secondary w-9 h-9 p-0 rounded-xl" disabled={saving}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">{t('common.displayNameLabel')}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={t('common.namePlaceholder')}
                    className="input-field"
                    maxLength={60}
                    autoFocus
                  />
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{t('common.displayNameHint')}</p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={onClose} className="flex-1 btn-secondary" disabled={saving}>
                    {t('common.cancel')}
                  </button>
                  <motion.button
                    type="submit"
                    className="flex-1 btn-primary"
                    disabled={saving}
                    whileHover={{ scale: saving ? 1 : 1.02 }}
                    whileTap={{ scale: saving ? 1 : 0.98 }}
                  >
                    {saving
                      ? <><Loader2 size={16} className="animate-spin" /> {t('common.saving')}</>
                      : t('common.save')}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* ═══════════════════════════════════════════
   Desktop Sidebar
═══════════════════════════════════════════ */
const Sidebar = ({ collapsed, onToggle }) => {
  const { currentUser, logout, displayName } = useAuth();
  const { t } = useLang();
  const [editingName, setEditingName] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t('login.seeYou'));
      navigate('/login');
    } catch {
      toast.error(t('login.logoutFailed'));
    }
  };

  return (
    <>
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="sidebar-bg hidden lg:flex flex-col fixed left-0 top-0 h-full z-40 overflow-hidden"
      style={{ borderRight: '1px solid var(--sidebar-border)', backdropFilter: 'blur(20px)' }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 py-5 ${collapsed ? 'px-3 justify-center' : 'px-4'}`} style={{ borderBottom: '1px solid var(--border)' }}>
        <Link to="/dashboard" className="flex items-center gap-3 flex-shrink-0">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 p-2.5"
            style={{ background: 'linear-gradient(135deg, #DB2777, #EC4899)', boxShadow: '0 6px 22px rgba(236, 72, 153,0.32)' }}
          >
            <Logo variant="mark" tone="white" className="w-full h-full" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                <p className="font-black text-base leading-none tracking-tight" style={{ color: 'var(--text-primary)' }}>ROVY</p>
                <p className="font-black text-xs leading-none tracking-wider mt-1" style={{ color: '#EC4899' }}>SWIMMING ACADEMY</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scroll-area">
        {navItems.map((item) => (
          <NavItem key={item.path} item={item} isActive={isActive} collapsed={collapsed} />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-3 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
        <LangToggle collapsed={collapsed} />
        <ThemeToggle collapsed={collapsed} />

        {/* User info — click to rename */}
        <motion.button
          onClick={() => setEditingName(true)}
          whileTap={{ scale: 0.97 }}
          className="group w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-all"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title={t('common.editName')}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #DB2777, #F9A8D4)', color: '#fff' }}
          >
            {adminLabel(displayName, currentUser)[0]?.toUpperCase() || 'A'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0 text-start">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{adminLabel(displayName, currentUser)}</p>
                <p className="text-xs" style={{ color: '#EC4899' }}>{t('common.admin')}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <Pencil size={13} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
          )}
        </motion.button>

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
          onClick={onToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full flex items-center justify-center h-8 rounded-xl transition-all"
          style={{ background: 'var(--bg-surface)' }}
        >
          {collapsed ? <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronLeft size={16} style={{ color: 'var(--text-muted)' }} />}
        </motion.button>
      </div>

    </motion.aside>

    <AdminNameModal open={editingName} onClose={() => setEditingName(false)} />
    </>
  );
};

/* ═══════════════════════════════════════════
   Mobile top bar + drawer
═══════════════════════════════════════════ */
export const MobileNav = () => {
  const { currentUser, logout, displayName } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { t, toggleLang, isRTL } = useLang();
  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t('login.seeYou'));
      navigate('/login');
    } catch {
      toast.error(t('login.logoutFailed'));
    }
  };

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="topbar-bg lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14"
        style={{ borderBottom: '1px solid var(--sidebar-border)', backdropFilter: 'blur(20px)' }}
      >
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center p-1.5" style={{ background: 'linear-gradient(135deg, #DB2777, #EC4899)' }}>
            <Logo variant="mark" tone="white" className="w-full h-full" />
          </div>
          <div className="flex flex-col leading-none min-w-0">
            <span className="font-black text-sm tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>ROVY</span>
            <span className="font-black text-[10px] tracking-wider truncate mt-0.5" style={{ color: '#EC4899' }}>SWIMMING ACADEMY</span>
          </div>
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
            onClick={() => setOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-surface)' }}
          >
            <Menu size={20} style={{ color: 'var(--text-primary)' }} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: isRTL ? '100%' : '-100%' }} animate={{ x: 0 }} exit={{ x: isRTL ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="drawer-bg fixed left-0 top-0 bottom-0 w-72 z-50 flex flex-col"
              style={{ borderRight: '1px solid var(--sidebar-border)' }}
            >
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center p-1.5" style={{ background: 'linear-gradient(135deg, #DB2777, #EC4899)' }}>
                    <Logo variant="mark" tone="white" className="w-full h-full" />
                  </div>
                  <div>
                    <p className="font-black text-sm leading-none" style={{ color: 'var(--text-primary)' }}>ROVY SWIMMING ACADEMY</p>
                    <p className="text-xs mt-0.5" style={{ color: '#EC4899' }}>{t('nav.adminPanel')}</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-surface)' }}>
                  <X size={16} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>

              <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setOpen(false)}>
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
                <button
                  onClick={() => { setOpen(false); setEditingName(true); }}
                  className="w-full flex items-center gap-3 px-2 py-2 mb-2 rounded-xl"
                  style={{ background: 'var(--bg-surface)' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #DB2777, #F9A8D4)', color: '#fff' }}>
                    {adminLabel(displayName, currentUser)[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1 min-w-0 text-start">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{adminLabel(displayName, currentUser)}</p>
                    <p className="text-xs" style={{ color: '#EC4899' }}>{t('common.admin')}</p>
                  </div>
                  <Pencil size={14} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                </button>
                <button
                  onClick={toggleLang}
                  className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl btn-secondary"
                >
                  <Languages size={16} style={{ color: '#EC4899' }} />
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

      <AdminNameModal open={editingName} onClose={() => setEditingName(false)} />
    </>
  );
};

export default Sidebar;

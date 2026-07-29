import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight, ArrowLeft, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import LanguageToggle from '../components/LanguageToggle';
import { useLang } from '../contexts/LanguageContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t, isRTL } = useLang();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('login.fillFields'));
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success(t('login.welcomeBack'));
      navigate('/dashboard');
    } catch (error) {
      console.error('[Login] auth failed:', error.code || error.message, error);
      if (error.message === 'student_account') {
        toast.error(t('login.isStudent'));
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error(t('login.invalidCreds'));
      } else if (error.code === 'auth/too-many-requests') {
        toast.error(t('login.tooMany'));
      } else {
        toast.error(t('login.failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="app-bg min-h-screen flex">
      {/* ── Brand panel (desktop) ── */}
      <div
        className="hidden lg:flex lg:w-[44%] xl:w-[40%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(160deg, #DB2777 0%, #EC4899 52%, #F472B6 100%)' }}
      >
        {/* soft decorative rings */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }} />
        <div className="absolute -bottom-32 -left-20 w-[28rem] h-[28rem] rounded-full pointer-events-none"
          style={{ border: '1px solid rgba(255,255,255,0.05)' }} />
        <div className="absolute bottom-8 right-8 opacity-[0.06] pointer-events-none">
          <Logo variant="mark" tone="white" className="w-72 h-auto" />
        </div>

        <div className="relative">
          <Logo variant="full" tone="white" className="h-16 w-auto" />
        </div>

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {t('login.brandKicker')}
          </p>
          <h2 className="text-3xl font-black leading-tight max-w-sm" style={{ letterSpacing: '-0.02em', color: '#fff' }}>
            {t('login.brandTagline')}
          </h2>
        </div>

        <p className="relative text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {t('login.rights')}
        </p>
      </div>

      {/* ── Form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10 relative">
        {/* Language + theme toggles */}
        <div className="absolute top-5 right-5 flex items-center gap-2">
          <LanguageToggle compact className="!w-10 !h-10 !rounded-xl" />
          <motion.button
            onClick={toggleTheme}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            {isDark ? <Sun size={16} style={{ color: '#F59E0B' }} /> : <Moon size={16} style={{ color: '#F472B6' }} />}
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[380px]"
        >
          {/* Logo on mobile only */}
          <div className="lg:hidden mb-8">
            <Logo variant="full" className="h-16 w-auto" />
          </div>

          <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {t('login.welcome')}
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            {t('login.signInTitle')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('login.email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')}
                  className="input-field pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="label">{t('login.password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login.passwordPlaceholder')}
                  className="input-field pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="btn-primary w-full !py-3 !rounded-xl mt-2"
              style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{t('login.authenticating')}</span>
                </>
              ) : (
                <>
                  <span>{t('login.signIn')}</span>
                  <Arrow size={18} />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {t('login.adminNote')}{' '}
              <Link to="/student/login" className="font-semibold" style={{ color: '#EC4899' }}>
                {t('login.studentPortalLink')}
              </Link>
              .
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;

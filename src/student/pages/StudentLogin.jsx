import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight, ArrowLeft, Sun, Moon } from 'lucide-react';
import Logo from '../../components/Logo';
import LanguageToggle from '../../components/LanguageToggle';
import { useLang } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';

const StudentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useStudentAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t, isRTL } = useLang();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error(t('student.fillFields')); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success(t('student.welcomeBackToast'));
      navigate('/student/dashboard', { replace: true });
    } catch (error) {
      if (error.message === 'not_student') {
        toast.error(t('student.notStudent'));
      } else if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(error.code)) {
        toast.error(t('student.invalidCreds'));
      } else if (error.code === 'auth/too-many-requests') {
        toast.error(t('student.tooMany'));
      } else {
        toast.error(t('student.loginFailed'));
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
        style={{ background: 'linear-gradient(160deg, #DB2777 0%, #F472B6 55%, #F9A8D4 100%)' }}
      >
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }} />
        <div className="absolute -bottom-32 -left-20 w-[28rem] h-[28rem] rounded-full pointer-events-none"
          style={{ border: '1px solid rgba(255,255,255,0.05)' }} />
        <div className="absolute bottom-8 right-8 opacity-[0.06] pointer-events-none">
          <Logo variant="mark" tone="white" className="w-72 h-auto" />
        </div>

        <div className="relative">
          <Logo variant="full" tone="white" className="h-16 w-auto" />
        </div>

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {t('studentLogin.title')}
          </p>
          <h2 className="text-3xl font-black leading-tight max-w-sm" style={{ letterSpacing: '-0.02em', color: '#fff' }}>
            {t('studentLogin.brandTagline')}
          </h2>
        </div>

        <p className="relative text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {t('studentLogin.subtitle')}
        </p>
      </div>

      {/* ── Form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10 relative">
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
          <div className="lg:hidden mb-8">
            <Logo variant="full" className="h-16 w-auto" />
          </div>

          <h1 className="text-2xl font-black mb-1" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {t('studentLogin.welcome')}
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            {t('student.signInTitle')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('student.email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('student.emailPh')}
                  className="input-field pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="label">{t('student.password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('student.passwordPh')}
                  className="input-field pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold mt-2 transition-all"
              style={{
                background: 'linear-gradient(135deg, #EC4899, #F472B6)',
                color: '#fff',
                boxShadow: '0 1px 2px rgba(219, 39, 119,0.24), 0 4px 14px -2px rgba(236, 72, 153,0.38)',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /><span>{t('student.signingIn')}</span></>
              ) : (
                <><span>{t('student.signIn')}</span><Arrow size={18} /></>
              )}
            </motion.button>
          </form>

          <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(249, 168, 212,0.06)', border: '1px solid rgba(249, 168, 212,0.14)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {t('student.loginHint')}
            </p>
          </div>

          <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {t('student.adminQ')}{' '}
              <Link to="/login" className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {t('student.adminLogin')}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentLogin;

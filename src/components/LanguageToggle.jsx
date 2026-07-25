import React from 'react';
import { motion } from 'framer-motion';
import { Languages } from 'lucide-react';
import { useLang } from '../contexts/LanguageContext';

/**
 * Switches between English and Arabic.
 * compact=true renders an icon-only square (for top bars);
 * otherwise renders an icon + the target-language label.
 */
const LanguageToggle = ({ compact = false, className = '', style }) => {
  const { toggleLang, t, lang } = useLang();
  const label = lang === 'ar' ? 'EN' : 'ع';

  if (compact) {
    return (
      <motion.button
        onClick={toggleLang}
        whileTap={{ scale: 0.9 }}
        title={t('common.language')}
        aria-label={t('common.language')}
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${className}`}
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', ...style }}
      >
        {label}
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={toggleLang}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${className}`}
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', ...style }}
    >
      <Languages size={16} />
      <span>{t('common.language')}</span>
    </motion.button>
  );
};

export default LanguageToggle;

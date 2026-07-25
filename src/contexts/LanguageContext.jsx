import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

const getInitial = () => {
  const saved = localStorage.getItem('sa-lang');
  return saved === 'ar' || saved === 'en' ? saved : 'en';
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(getInitial);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = dir;
    root.classList.toggle('rtl', lang === 'ar');
    localStorage.setItem('sa-lang', lang);
  }, [lang, dir]);

  const toggleLang = useCallback(() => setLang((l) => (l === 'ar' ? 'en' : 'ar')), []);

  /**
   * Translate a dot-path key, e.g. t('nav.dashboard').
   * Falls back to English, then to the key itself.
   * Supports {placeholder} interpolation via the params object.
   */
  const t = useCallback(
    (key, params) => {
      const lookup = (dict) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict);
      let str = lookup(translations[lang]);
      if (str == null) str = lookup(translations.en);
      if (str == null) return key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
        }
      }
      return str;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, dir, isRTL: lang === 'ar', setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
};

'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type Locale, t as translate, translateLabel as translateLabelFn, type TranslationKey } from './i18n';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
  tl: (label: string) => string;
  mounted: boolean;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
  tl: (label) => label,
  mounted: false,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Reading persisted locale from localStorage on mount is a standard pattern;
    // setLocaleState is only called once per mount when a saved value exists.
    const saved = localStorage.getItem('demand-tool-locale') as Locale | null;
    if (saved && ['en', 'da', 'sv', 'de'].includes(saved)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(saved);
    }
    setMounted(true);
  }, []);

  function setLocale(newLocale: Locale) {
    setLocaleState(newLocale);
    localStorage.setItem('demand-tool-locale', newLocale);
    document.documentElement.lang = newLocale;
  }

  // Sync lang attribute on mount
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function t(key: TranslationKey, params?: Record<string, string>) {
    return translate(key, locale, params);
  }

  function tl(label: string) {
    return translateLabelFn(label, locale);
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, tl, mounted }}>
      {mounted ? children : null}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

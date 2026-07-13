"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { detectSystemLocale, translate } from "@/lib/i18n/translate";
import {
  readLocalePreference,
  writeLocalePreference,
} from "@/lib/i18n/storage";
import {
  LOCALES,
  type LocaleCode,
  type LocalePreference,
} from "@/lib/i18n/types";

type LocaleContextValue = {
  preference: LocalePreference;
  locale: LocaleCode;
  locales: typeof LOCALES;
  setPreference: (value: LocalePreference) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<LocalePreference>("system");
  const [locale, setLocale] = useState<LocaleCode>("zh-CN");

  useEffect(() => {
    const pref = readLocalePreference();
    setPreferenceState(pref);
    setLocale(pref === "system" ? detectSystemLocale() : pref);
  }, []);

  const setPreference = useCallback((value: LocalePreference) => {
    writeLocalePreference(value);
    setPreferenceState(value);
    setLocale(value === "system" ? detectSystemLocale() : value);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale],
  );

  const value = useMemo(
    () => ({
      preference,
      locale,
      locales: LOCALES,
      setPreference,
      t,
    }),
    [preference, locale, setPreference, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useT() {
  return useLocale().t;
}

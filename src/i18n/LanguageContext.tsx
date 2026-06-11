// Language context + useT() hook.
// Keeps the chosen language in localStorage and on the <html lang> attribute.
// t() supports simple {placeholder} interpolation.

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { en } from "./en";
import { bn } from "./bn";
import type { Dictionary } from "./en";

export type Language = "en" | "bn";

const STORAGE_KEY = "sme_language_v1";
const dictionaries: Record<Language, Dictionary> = { en, bn };

// Walk a dotted path like "header.liveSite" against a nested object.
function resolvePath(obj: any, path: string): any {
  return path.split(".").reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
}

// Replace {placeholder} tokens in a string with values from vars.
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v == null ? `{${k}}` : String(v);
  });
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dict: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "bn") return saved;
    } catch {
      // localStorage may be unavailable (e.g. SSR or sandboxed iframe) — fall through.
    }
    return "en";
  });

  // Persist + sync the <html lang> attribute so screen readers, font hinting,
  // and CSS :lang() selectors all see the active language.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      /* ignore storage failures */
    }
    const root = document.documentElement;
    root.setAttribute("lang", language);
    root.setAttribute("data-language", language);
  }, [language]);

  const setLanguage = useCallback((lang: Language) => setLanguageState(lang), []);
  const toggleLanguage = useCallback(
    () => setLanguageState(prev => (prev === "en" ? "bn" : "en")),
    []
  );

  const dict = dictionaries[language];

  // t() returns the resolved string. If a key is missing, it returns the key
  // itself in a visible format ("⚠ missing: header.foo") so the gap shows up
  // in the UI rather than silently rendering nothing.
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const value = resolvePath(dict, key);
      if (value == null) {
        if (typeof console !== "undefined") {
          console.warn(`[i18n] missing key "${key}" for language "${language}"`);
        }
        return `⚠ ${key}`;
      }
      if (typeof value !== "string") {
        return String(value);
      }
      return interpolate(value, vars);
    },
    [dict, language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, dict }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage() must be used inside <LanguageProvider>");
  }
  return ctx;
}

// Convenience hook — most components only need the t() function.
export function useT() {
  return useLanguage().t;
}

// Helper to determine the time-of-day greeting key based on the user's hour.
export function greetingKeyForHour(hour: number): "greetingMorning" | "greetingAfternoon" | "greetingEvening" {
  if (hour < 12) return "greetingMorning";
  if (hour < 17) return "greetingAfternoon";
  return "greetingEvening";
}

// Format the current date for the dashboard subline in the active language.
export function formatSublineDate(language: Language, date = new Date()): string {
  try {
    return new Intl.DateTimeFormat(language === "bn" ? "bn-BD" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return date.toDateString();
  }
}

'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/context';
import { SupportedLocale } from '@/lib/i18n/translations';
import { Languages } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
}

interface LanguageOption {
  id: SupportedLocale;
  label: string;
  fullName: string;
}

const LANGUAGES: LanguageOption[] = [
  { id: 'en', label: 'English', fullName: 'English' },
  { id: 'hi', label: 'हिंदी', fullName: 'हिंदी (Hindi)' },
  { id: 'mr', label: 'मराठी', fullName: 'मराठी (Marathi)' },
];

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language selector"
      className={`inline-flex items-center space-x-1 text-xs bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-xs select-none ${className}`}
    >
      <Languages className="w-3.5 h-3.5 text-slate-500 ml-1 mr-0.5 shrink-0" aria-hidden="true" />
      {LANGUAGES.map(lang => {
        const isActive = locale === lang.id;
        return (
          <button
            key={lang.id}
            type="button"
            onClick={() => setLocale(lang.id)}
            aria-pressed={isActive}
            aria-label={`Switch language to ${lang.fullName}`}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              isActive
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
};

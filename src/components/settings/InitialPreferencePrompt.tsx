'use client';

import React, { useState } from 'react';
import { useTriage } from '../../context/TriageContext';
import { AppLanguage } from '../../types';
import { Languages, Check, X, Sparkles } from 'lucide-react';

export const InitialPreferencePrompt: React.FC = () => {
  const { settings, updateSettings, isHydrated } = useTriage();
  const [selectedLang, setSelectedLang] = useState<AppLanguage>(settings.language || 'en');
  const [dismissed, setDismissed] = useState(false);

  // If already hydrated and user has already configured preferences, or dismissed, do not show
  if (!isHydrated || settings.hasConfiguredPreferences || dismissed) {
    return null;
  }

  const handleConfirm = () => {
    updateSettings({
      language: selectedLang,
      hasConfiguredPreferences: true
    });
  };

  const handleDismiss = () => {
    // Dismissing also marks preferences configured so it does not repeatedly pop up
    updateSettings({
      hasConfiguredPreferences: true
    });
    setDismissed(true);
  };

  return (
    <aside aria-label="Language selection banner" className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-4 py-2.5 shadow-md relative z-30 shrink-0 border-b border-indigo-500/30">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <Languages className="h-4 w-4 text-blue-200" />
          </div>
          <div>
            <span className="font-bold tracking-tight">Choose your preferred language:</span>{' '}
            <span className="text-blue-200 font-normal">
              GrievanceTriage will remember your preference across sessions.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-black/20 p-0.5 rounded-lg border border-white/10">
            <button
              onClick={() => setSelectedLang('en')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                selectedLang === 'en'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setSelectedLang('hi')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                selectedLang === 'hi'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => setSelectedLang('ta')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                selectedLang === 'ta'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-blue-100 hover:text-white'
              }`}
            >
              தமிழ்
            </button>
          </div>

          <button
            id="confirm-lang-btn"
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-blue-800 hover:bg-blue-50 font-bold rounded-lg shadow-xs transition-all"
          >
            <Check className="h-3 w-3 stroke-[3]" />
            <span>Confirm</span>
          </button>

          <button
            id="dismiss-lang-btn"
            onClick={handleDismiss}
            className="p-1 text-blue-200 hover:text-white rounded-md hover:bg-white/10 transition-colors"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

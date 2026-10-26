'use client';

import React, { useState } from 'react';
import { useTriage } from '../../context/TriageContext';
import {
  Menu,
  RotateCcw,
  Search,
  Check,
  Landmark,
  ExternalLink,
  Globe,
  Bell,
  Settings
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    resetDemoData,
    settings,
    t
  } = useTriage();

  const [resetConfirm, setResetConfirm] = useState(false);

  const handleReset = () => {
    resetDemoData();
    setResetConfirm(true);
    setTimeout(() => setResetConfirm(false), 2000);
  };

  return (
    <header className="relative bg-white border-b border-slate-200 overflow-hidden shrink-0">
      {/* Top Graphic Header Banner matching the top of the reference image */}
      <div className="relative bg-gradient-to-r from-blue-50/80 via-sky-50/40 to-blue-50/80 px-4 lg:px-6 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        {/* Left Brand with Landmark Column Icon */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Landmark className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  GrievanceTriage
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 font-bold rounded">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Smarter complaints. Better cities.
              </p>
            </div>
          </div>
        </div>

        {/* Center / Right Skyline Illustration & Utility Bar */}
        <div className="flex items-center gap-3">
          {/* Subtle City Skyline CSS Silhouette Illustration */}
          <div className="hidden xl:flex items-end gap-1 h-8 px-4 opacity-50 select-none">
            <div className="w-2.5 h-6 bg-blue-300/40 rounded-t-sm" />
            <div className="w-3 h-8 bg-blue-400/50 rounded-t-sm" />
            <div className="w-5 h-5 bg-sky-300/40 rounded-t-md" />
            <div className="w-2 h-7 bg-blue-400/50 rounded-t-sm" />
            <div className="w-4 h-9 bg-blue-500/50 rounded-t-sm" />
            <div className="w-3 h-5 bg-sky-400/40 rounded-t-sm" />
            <div className="w-2.5 h-7 bg-blue-300/50 rounded-t-sm" />
          </div>

          {/* Prototype Badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>Prototype: Synthetic Data</span>
          </span>

          {/* Reset Demo Data Button */}
          <button
            onClick={handleReset}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              resetConfirm
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
            }`}
            title="Reset dataset and review decisions to factory initial state"
          >
            {resetConfirm ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Restored</span>
              </>
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                <span>{t('btn_reset_demo')}</span>
              </>
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
            }`}
            title="Language & Accessibility Settings"
          >
            <Settings className={`h-3.5 w-3.5 ${activeTab === 'settings' ? 'text-white' : 'text-slate-500'}`} />
            <span>{t('nav_settings')}</span>
            <span className={`text-[10px] font-mono px-1 py-0.2 rounded uppercase font-bold ${
              activeTab === 'settings' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {settings.language}
            </span>
          </button>

          {/* Toggle Public Landing Page (Section 9) */}
          <button
            onClick={() => setActiveTab(activeTab === 'landing' ? 'overview' : 'landing')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'landing'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 shadow-2xs'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{activeTab === 'landing' ? t('nav_back_to_app') : t('nav_landing')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
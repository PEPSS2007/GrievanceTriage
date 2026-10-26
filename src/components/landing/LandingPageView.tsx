'use client';

import React, { useState } from 'react';
import { useTriage } from '../../context/TriageContext';
import {
  Landmark,
  ArrowRight,
  Bot,
  Layers,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { NewComplaintModal } from '../complaints/NewComplaintModal';

export const LandingPageView: React.FC = () => {
  const { setActiveTab, t } = useTriage();
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto bg-white flex flex-col justify-between">
      {/* Top Navbar matching Reference Section 9 */}
      <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <Landmark className="h-4 w-4" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900">
            GrievanceTriage
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('settings')}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5"
          >
            {t('nav_settings')}
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5"
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg shadow-2xs transition-colors"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section with Cityscape Dome Illustration matching Reference */}
      <div className="relative overflow-hidden px-8 py-12 md:py-16 max-w-6xl mx-auto w-full flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left Text Column */}
          <div className="md:col-span-7 space-y-4">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              From complaints <br /> to action.
            </h1>

            <p className="text-sm md:text-base text-slate-600 font-medium max-w-lg leading-relaxed">
              AI-powered grievance triage for cleaner, safer and healthier cities.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setActiveTab('overview')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all hover:gap-3"
              >
                <span>Explore Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => setSubmitModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-extrabold text-xs rounded-xl shadow-xs transition-all"
              >
                <span>{t('btn_submit')}</span>
              </button>
            </div>
          </div>

          {/* Right Visual: Classical Municipal Capitol Dome & Cityscape Illustration */}
          <div className="md:col-span-5 relative">
            <div className="relative h-60 md:h-72 w-full rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-gradient-to-b from-sky-100 via-blue-50 to-emerald-50 flex items-end justify-center p-4">
              {/* Skyline & Classical Dome SVG Artwork */}
              <svg viewBox="0 0 400 240" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
                {/* Sky gradients & clouds */}
                <ellipse cx="200" cy="40" rx="90" ry="25" fill="#ffffff" fillOpacity="0.7" />
                <ellipse cx="280" cy="60" rx="70" ry="20" fill="#ffffff" fillOpacity="0.6" />

                {/* Background skyscrapers */}
                <rect x="30" y="80" width="40" height="160" fill="#94a3b8" rx="2" />
                <rect x="80" y="60" width="50" height="180" fill="#64748b" rx="2" />
                <rect x="290" y="70" width="45" height="170" fill="#64748b" rx="2" />
                <rect x="345" y="90" width="40" height="150" fill="#94a3b8" rx="2" />

                {/* Classical City Hall / Capitol Dome in Foreground */}
                {/* Main Dome base */}
                <rect x="150" y="140" width="100" height="100" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
                {/* Pillars / Columns */}
                <rect x="160" y="160" width="6" height="70" fill="#e2e8f0" />
                <rect x="175" y="160" width="6" height="70" fill="#e2e8f0" />
                <rect x="190" y="160" width="6" height="70" fill="#e2e8f0" />
                <rect x="205" y="160" width="6" height="70" fill="#e2e8f0" />
                <rect x="220" y="160" width="6" height="70" fill="#e2e8f0" />
                <rect x="235" y="160" width="6" height="70" fill="#e2e8f0" />
                {/* Pediment triangle */}
                <polygon points="150,160 200,130 250,160" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
                {/* Drum */}
                <rect x="170" y="100" width="60" height="30" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
                {/* Semi-circular Dome */}
                <path d="M 165 100 A 35 35 0 0 1 235 100 Z" fill="#3b82f6" fillOpacity="0.85" />
                {/* Cupola */}
                <rect x="197" y="55" width="6" height="12" fill="#1e293b" />
                <circle cx="200" cy="52" r="3" fill="#eab308" />

                {/* Green park trees in front */}
                <ellipse cx="60" cy="220" rx="35" ry="25" fill="#10b981" />
                <ellipse cx="120" cy="225" rx="28" ry="20" fill="#059669" />
                <ellipse cx="280" cy="225" rx="30" ry="20" fill="#059669" />
                <ellipse cx="340" cy="220" rx="36" ry="24" fill="#10b981" />
              </svg>

              <div className="absolute bottom-3 px-3 py-1 bg-white/90 backdrop-blur-xs rounded-full text-[10px] font-bold text-slate-700 shadow-sm border border-slate-200/80">
                GrievanceTriage Municipal Portal
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Feature Highlights matching Reference Section 9 */}
      <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Smarter Triage */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <Bot className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Smarter Triage</h4>
            <p className="text-[11px] text-slate-500 font-medium">AI + Human Review</p>
          </div>

          {/* Card 2: Find Related Issues */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="h-7 w-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center mb-2">
              <Layers className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Find Related Issues</h4>
            <p className="text-[11px] text-slate-500 font-medium">Stop Repeated Work</p>
          </div>

          {/* Card 3: Connect Departments */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <Building2 className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Connect Departments</h4>
            <p className="text-[11px] text-slate-500 font-medium">Faster Resolution</p>
          </div>

          {/* Card 4: Track Progress */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
            <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Track Progress</h4>
            <p className="text-[11px] text-slate-500 font-medium">Full Audit Trail</p>
          </div>
        </div>
      </div>

      <NewComplaintModal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
      />
    </div>
  );
};
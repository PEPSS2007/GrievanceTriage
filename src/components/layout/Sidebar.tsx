'use client';

import React from 'react';
import { useTriage, TabType } from '../../context/TriageContext';
import {
  LayoutDashboard,
  FileText,
  Layers,
  Building2,
  BarChart3,
  AlertTriangle,
  History,
  Landmark,
  X,
  UserCheck,
  Settings,
  MapPin,
  Inbox
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { activeTab, setActiveTab, setShowDetail, t, settings } = useTriage();

  const navItems: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: t('nav_overview'), icon: LayoutDashboard },
    { id: 'complaints', label: t('nav_complaints'), icon: FileText },
    { id: 'map', label: 'Interactive Map', icon: MapPin },
    { id: 'intake', label: 'Intake Channels', icon: Inbox },
    { id: 'incidents', label: t('nav_incidents'), icon: Layers },
    { id: 'departments', label: t('nav_departments'), icon: Building2 },
    { id: 'analytics', label: t('nav_analytics'), icon: BarChart3 },
    { id: 'escalations', label: t('nav_escalations'), icon: AlertTriangle },
    { id: 'history', label: t('nav_history'), icon: History },
    { id: 'settings', label: t('nav_settings'), icon: Settings }
  ];

  const handleNavClick = (id: TabType) => {
    setActiveTab(id);
    if (id === 'complaints') {
      setShowDetail(false);
    }
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0d1b2a] text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="px-5 py-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                GrievanceTriage
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight">
                Smarter complaints. Better cities.
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Officer Profile Card matching Reference */}
        <div className="p-4 border-t border-slate-800 bg-[#0a1522]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-700/80 border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-200">
              <UserCheck className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">Officer</p>
              <p className="text-[11px] text-slate-400 truncate">Municipal Admin</p>
            </div>
            <button
              onClick={() => handleNavClick('settings')}
              className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 hover:bg-blue-900 transition-colors"
              title="Open Settings"
            >
              {settings.language}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
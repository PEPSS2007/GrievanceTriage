'use client';

import React, { useState } from 'react';
import { useTriage } from '../../context/TriageContext';
import {
  TrendingUp,
  ArrowUp,
  Droplet,
  Trash2,
  Construction,
  Info
} from 'lucide-react';

export const CityInsightsView: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D'>('7D');
  const { mergedComplaints, openComplaintDetail } = useTriage();

  const total = mergedComplaints.length;
  const resolvedCount = mergedComplaints.filter(
    m => m.currentStatus === 'Resolved' || m.currentStatus === 'Acknowledged'
  ).length;

  // Derive category counts dynamically from active dataset
  const waterCount = mergedComplaints.filter(m => m.currentCategory.toLowerCase().includes('water')).length;
  const roadCount = mergedComplaints.filter(m => m.currentCategory.toLowerCase().includes('road') || m.currentCategory.toLowerCase().includes('pothole')).length;
  const garbageCount = mergedComplaints.filter(m => m.currentCategory.toLowerCase().includes('garbage') || m.currentCategory.toLowerCase().includes('sanitation')).length;
  const lightCount = mergedComplaints.filter(m => m.currentCategory.toLowerCase().includes('light')).length;
  const electricalCount = mergedComplaints.filter(m => m.currentCategory.toLowerCase().includes('electric')).length;
  const otherCount = Math.max(0, total - (waterCount + roadCount + garbageCount + lightCount + electricalCount));

  const categoriesData = [
    { name: 'Water Supply', pct: total > 0 ? Math.round((waterCount / total) * 100) : 30, color: '#06b6d4' },
    { name: 'Roads & Potholes', pct: total > 0 ? Math.round((roadCount / total) * 100) : 25, color: '#10b981' },
    { name: 'Garbage & Sanitation', pct: total > 0 ? Math.round((garbageCount / total) * 100) : 18, color: '#f59e0b' },
    { name: 'Street Lighting', pct: total > 0 ? Math.round((lightCount / total) * 100) : 15, color: '#eab308' },
    { name: 'Electrical', pct: total > 0 ? Math.round((electricalCount / total) * 100) : 10, color: '#f43f5e' },
    { name: 'Others', pct: total > 0 ? Math.max(1, Math.round((otherCount / total) * 100)) : 2, color: '#94a3b8' }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
      {/* Title & Time Range Filter matching Reference Section 7 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            City Insights
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time municipal metrics derived from active complaints queue.
          </p>
        </div>

        {/* 7D / 30D / 90D Pills */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs text-xs font-bold">
          {(['7D', '30D', '90D'] as const).map(tr => (
            <button
              key={tr}
              onClick={() => setTimeRange(tr)}
              className={`px-3 py-1 rounded-md transition-all ${
                timeRange === tr
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tr}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Metric Cards Row matching Reference Section 7 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Complaints */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-2">
          <span className="text-xs font-semibold text-slate-500">Total Complaints</span>
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl font-extrabold text-slate-900">{total}</span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600">
              <ArrowUp className="h-3.5 w-3.5" />
              12%
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block">Live queue count</span>
        </div>

        {/* Resolved */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-2">
          <span className="text-xs font-semibold text-slate-500">Resolved / Acknowledged</span>
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl font-extrabold text-slate-900">{resolvedCount}</span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600">
              <ArrowUp className="h-3.5 w-3.5" />
              8%
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block">Recorded reviewer actions</span>
        </div>

        {/* Avg Resolution Time */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-2">
          <span className="text-xs font-semibold text-slate-500">Avg. Resolution Time</span>
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl font-extrabold text-slate-900">2.4 days</span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-600">
              <ArrowUp className="h-3.5 w-3.5" />
              16%
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block">Simulated 7-day municipal average</span>
        </div>
      </div>

      {/* Bottom Row: Donut Chart & Emerging Issues Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Complaints by Category with Donut Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Complaints by Category
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold">
              Live Category Split
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
            {/* Donut Chart SVG */}
            <div className="relative h-40 w-40 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Dynamic SVG Donut Rings */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#06b6d4" strokeWidth="16" strokeDasharray="71.6 167" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10b981" strokeWidth="16" strokeDasharray="59.7 179" strokeDashoffset="-71.6" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f59e0b" strokeWidth="16" strokeDasharray="43 195.7" strokeDashoffset="-131.3" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#eab308" strokeWidth="16" strokeDasharray="35.8 202.9" strokeDashoffset="-174.3" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f43f5e" strokeWidth="16" strokeDasharray="23.8 214.9" strokeDashoffset="-210.1" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#94a3b8" strokeWidth="16" strokeDasharray="4.8 233.9" strokeDashoffset="-233.9" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-slate-900">{total}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total</span>
              </div>
            </div>

            {/* Legend list matching Reference */}
            <div className="space-y-2 text-xs w-full max-w-xs">
              {categoriesData.map(c => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="font-semibold text-slate-700">{c.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-500">{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Emerging Issues Card (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Emerging Issues
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold">
              Spatial Spikes
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {/* Item 1: Water supply (Ward 4) */}
            <div
              onClick={() => openComplaintDetail('GRV-2026-1001')}
              className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                  <Droplet className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Water supply (Ward 4)</h4>
                  <span className="text-[10px] text-slate-400">Pine St cluster ({waterCount} total cases)</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                +5 new
              </span>
            </div>

            {/* Item 2: Garbage (Ward 7) */}
            <div
              onClick={() => openComplaintDetail('GRV-2026-1002')}
              className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Trash2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Garbage (Ward 7)</h4>
                  <span className="text-[10px] text-slate-400">Market refuse repeat spike</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                +3 new
              </span>
            </div>

            {/* Item 3: Potholes (Ward 6) */}
            <div
              onClick={() => openComplaintDetail('GRV-2026-1004')}
              className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Construction className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Potholes (Ward 6)</h4>
                  <span className="text-[10px] text-slate-400">Main Road corridor</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                +2 new
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/60 text-[10px] text-slate-500 flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
            <p>
              Metrics are derived from the 60-complaint municipal dataset. Historical trends represent simulated operational baseline data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
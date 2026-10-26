'use client';

import React, { useState, useMemo } from 'react';
import { useTriage } from '../../context/TriageContext';
import {
  AlertCircle,
  Clock,
  Layers,
  CheckCircle2,
  Droplet,
  Construction,
  Trash2,
  Lightbulb,
  Zap,
  Phone,
  Mail,
  UserCheck,
  Globe,
  HelpCircle,
  PlusCircle,
  FileSpreadsheet,
  Inbox,
  Database,
  ShieldCheck
} from 'lucide-react';
import { OfficerComplaintRegistrationModal } from '../complaints/OfficerComplaintRegistrationModal';
import { CsvImportModal } from '../complaints/CsvImportModal';

export const OverviewDashboard: React.FC = () => {
  const {
    mergedComplaints,
    incidentGroups,
    setActiveTab,
    openComplaintDetail,
    t
  } = useTriage();

  // Modals
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  // Time Range & Filter States
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [hoveredPoint, setHoveredPoint] = useState<{
    day: string;
    total: number;
    resolved: number;
  } | null>(null);

  // Filter complaints based on user controls
  const filteredComplaints = useMemo(() => {
    return mergedComplaints.filter((item) => {
      if (selectedWard !== 'ALL' && !item.complaint.location.includes(selectedWard)) {
        return false;
      }
      if (selectedDept !== 'ALL' && item.currentDepartmentId !== selectedDept) {
        return false;
      }
      if (selectedChannel !== 'ALL' && item.complaint.source !== selectedChannel) {
        return false;
      }
      return true;
    });
  }, [mergedComplaints, selectedWard, selectedDept, selectedChannel]);

  // Demo vs Official Records breakdown
  const demoCount = useMemo(() => {
    return filteredComplaints.filter(c => c.complaint.is_demo !== false).length;
  }, [filteredComplaints]);

  const officialCount = useMemo(() => {
    return filteredComplaints.filter(c => c.complaint.is_demo === false).length;
  }, [filteredComplaints]);

  // Dynamic KPI Metrics derived directly from filtered complaints
  const urgentCount = useMemo(() => {
    return filteredComplaints.filter(
      (c) => c.currentPriority === 'Critical' || c.currentPriority === 'High'
    ).length;
  }, [filteredComplaints]);

  const pendingReviewCount = useMemo(() => {
    return filteredComplaints.filter(
      (c) =>
        c.currentStatus === 'Pending Review' ||
        c.currentStatus === 'Submitted' ||
        c.currentStatus === 'Under Review' ||
        c.currentStatus === 'Open'
    ).length;
  }, [filteredComplaints]);

  const verificationPendingCount = useMemo(() => {
    return filteredComplaints.filter(
      (c) => c.currentStatus === 'Verification Pending' || c.currentStatus === 'Resolution Submitted'
    ).length;
  }, [filteredComplaints]);

  const verifiedResolvedCount = useMemo(() => {
    return filteredComplaints.filter(
      (c) => c.currentStatus === 'Verified Resolved' || c.currentStatus === 'Resolved'
    ).length;
  }, [filteredComplaints]);

  // Intake Channel Distribution from ACTUAL records
  const channelBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredComplaints.forEach((c) => {
      const src = c.complaint.source || 'Web Portal';
      counts[src] = (counts[src] || 0) + 1;
    });

    const total = filteredComplaints.length || 1;
    return Object.entries(counts)
      .map(([channel, count]) => ({
        channel,
        count,
        percentage: ((count / total) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredComplaints]);

  // Dynamic Trend Curve Calculation
  const trendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts: Record<string, { total: number; resolved: number }> = {
      Mon: { total: 0, resolved: 0 },
      Tue: { total: 0, resolved: 0 },
      Wed: { total: 0, resolved: 0 },
      Thu: { total: 0, resolved: 0 },
      Fri: { total: 0, resolved: 0 },
      Sat: { total: 0, resolved: 0 },
      Sun: { total: 0, resolved: 0 },
    };

    filteredComplaints.forEach((item) => {
      const date = new Date(item.complaint.created_at);
      const dayIndex = date.getUTCDay();
      const dayName = days[(dayIndex + 6) % 7];

      if (counts[dayName]) {
        counts[dayName].total++;
        if (item.currentStatus === 'Verified Resolved' || item.currentStatus === 'Resolved') {
          counts[dayName].resolved++;
        }
      }
    });

    return days.map((day) => ({
      day,
      total: counts[day].total,
      resolved: counts[day].resolved,
    }));
  }, [filteredComplaints]);

  const chartWidth = 500;
  const chartHeight = 160;
  const paddingX = 35;
  const paddingY = 25;

  const maxTotal = useMemo(() => {
    const maxVal = Math.max(...trendData.map((d) => d.total), 5);
    return Math.ceil(maxVal / 5) * 5;
  }, [trendData]);

  const pointsTotal = useMemo(() => {
    return trendData.map((d, i) => {
      const x = paddingX + (i / (trendData.length - 1)) * (chartWidth - paddingX * 2);
      const y = chartHeight - paddingY - (d.total / maxTotal) * (chartHeight - paddingY * 2);
      return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), ...d };
    });
  }, [trendData, maxTotal]);

  const pointsResolved = useMemo(() => {
    return trendData.map((d, i) => {
      const x = paddingX + (i / (trendData.length - 1)) * (chartWidth - paddingX * 2);
      const y = chartHeight - paddingY - (d.resolved / maxTotal) * (chartHeight - paddingY * 2);
      return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), ...d };
    });
  }, [trendData, maxTotal]);

  const makePath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length === 0) return '';
    return pts.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = pts[i - 1];
      const cpX = (prev.x + pt.x) / 2;
      return `${acc} C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`;
    }, '');
  };

  const pathTotal = useMemo(() => makePath(pointsTotal), [pointsTotal]);
  const pathResolved = useMemo(() => makePath(pointsResolved), [pointsResolved]);

  // Top Issues calculated from complaints
  const topIssues = useMemo(() => {
    const map: Record<string, number> = {};
    filteredComplaints.forEach((c) => {
      const cat = c.currentCategory || 'Other';
      map[cat] = (map[cat] || 0) + 1;
    });

    return Object.entries(map)
      .map(([name, count]) => ({
        name,
        count,
        percentage: ((count / (filteredComplaints.length || 1)) * 100).toFixed(0),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredComplaints]);

  // Department Workload Distribution
  const departmentWorkload = useMemo(() => {
    const map: Record<string, number> = {};
    filteredComplaints.forEach((c) => {
      const dept = c.currentDepartmentId;
      map[dept] = (map[dept] || 0) + 1;
    });
    return map;
  }, [filteredComplaints]);

  const getChannelIcon = (ch: string) => {
    if (ch === 'Phone') return <Phone className="h-3.5 w-3.5 text-sky-600" />;
    if (ch === 'Email') return <Mail className="h-3.5 w-3.5 text-purple-600" />;
    if (ch === 'In Person') return <UserCheck className="h-3.5 w-3.5 text-amber-600" />;
    if (ch.includes('Portal')) return <Globe className="h-3.5 w-3.5 text-indigo-600" />;
    return <HelpCircle className="h-3.5 w-3.5 text-slate-500" />;
  };

  const getIssueIcon = (name: string) => {
    if (name.includes('Water')) return <Droplet className="h-4 w-4 text-cyan-600" />;
    if (name.includes('Road') || name.includes('Pothole'))
      return <Construction className="h-4 w-4 text-amber-600" />;
    if (name.includes('Garbage') || name.includes('Sanitation'))
      return <Trash2 className="h-4 w-4 text-emerald-600" />;
    if (name.includes('Light')) return <Lightbulb className="h-4 w-4 text-yellow-600" />;
    return <Zap className="h-4 w-4 text-rose-600" />;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
      {/* Top Greeting & Prominent Actions Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Municipal Operations Dashboard
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] tracking-wide">
              SYNTHETIC DEMO ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time aggregates from {mergedComplaints.length} stored records ({officialCount} official officer intakes, {demoCount} demo benchmarks).
          </p>
        </div>

        {/* Prominent Action Buttons: Register Complaint & Import CSV */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCsvModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
            title="Import complaints from CSV spreadsheet"
          >
            <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => setRegisterModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Register Complaint</span>
          </button>
        </div>
      </div>

      {/* Filter Row: Ward, Department, Intake Channel, Time Window */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        {/* Ward Filter */}
        <select
          value={selectedWard}
          onChange={(e) => setSelectedWard(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-700 font-semibold shadow-2xs focus:outline-hidden"
        >
          <option value="ALL">All Wards</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((w) => (
            <option key={w} value={`Ward ${w}`}>
              Ward {w}
            </option>
          ))}
        </select>

        {/* Department Filter */}
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-700 font-semibold shadow-2xs focus:outline-hidden"
        >
          <option value="ALL">All Departments</option>
          <option value="dept_water">Water Department</option>
          <option value="dept_roads">Roads Department</option>
          <option value="dept_sanitation">Sanitation Department</option>
          <option value="dept_electricity">Electrical & Lighting</option>
          <option value="dept_health">Public Health</option>
          <option value="dept_parks">Parks & Horticulture</option>
        </select>

        {/* Intake Channel Filter */}
        <select
          value={selectedChannel}
          onChange={(e) => setSelectedChannel(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-700 font-semibold shadow-2xs focus:outline-hidden"
        >
          <option value="ALL">All Intake Channels</option>
          <option value="Phone">📞 Phone</option>
          <option value="Email">✉️ Email</option>
          <option value="In Person">🚶 In Person</option>
          <option value="Existing Government Portal">🏛️ Gov Portal</option>
          <option value="Web Portal">🌐 Web Portal</option>
          <option value="Other">📋 Other</option>
        </select>

        {/* Time Window Buttons */}
        <div className="ml-auto flex items-center bg-slate-100 p-0.5 rounded-lg font-bold">
          {(['7d', '30d', '90d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-2.5 py-1 rounded-md text-[11px] uppercase transition-all ${
                timeRange === r
                  ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Dynamic KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Urgent / High Priority */}
        <div
          onClick={() => setActiveTab('complaints')}
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex items-center gap-4 cursor-pointer hover:border-slate-300 transition-all group"
        >
          <div className="h-11 w-11 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 group-hover:scale-105 transition-transform">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{urgentCount}</div>
            <div className="text-xs font-semibold text-slate-500">Urgent & High Priority</div>
          </div>
        </div>

        {/* Card 2: Pending Review */}
        <div
          onClick={() => setActiveTab('complaints')}
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex items-center gap-4 cursor-pointer hover:border-slate-300 transition-all group"
        >
          <div className="h-11 w-11 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-105 transition-transform">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{pendingReviewCount}</div>
            <div className="text-xs font-semibold text-slate-500">Pending Officer Review</div>
          </div>
        </div>

        {/* Card 3: Verification Pending (Resolution Workflow) */}
        <div
          onClick={() => setActiveTab('complaints')}
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex items-center gap-4 cursor-pointer hover:border-slate-300 transition-all group"
        >
          <div className="h-11 w-11 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-105 transition-transform">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{verificationPendingCount}</div>
            <div className="text-xs font-semibold text-slate-500">Verification Pending</div>
          </div>
        </div>

        {/* Card 4: Verified Resolved */}
        <div
          onClick={() => setActiveTab('complaints')}
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex items-center gap-4 cursor-pointer hover:border-slate-300 transition-all group"
        >
          <div className="h-11 w-11 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{verifiedResolvedCount}</div>
            <div className="text-xs font-semibold text-slate-500">Verified Resolved</div>
          </div>
        </div>
      </div>

      {/* Two Columns: Complaints Trend & Top Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Complaints Trend (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Data-Driven Complaints Trend</span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {timeRange.toUpperCase()} View
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Dynamic curve generated from recorded timestamp boundaries
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Total Intake
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                Verified Resolved
              </span>
            </div>
          </div>

          {/* Dynamic Vector SVG Chart */}
          <div className="relative pt-2 pb-1">
            <div className="flex justify-between text-[11px] text-slate-400 border-b border-slate-100 pb-1 mb-2 font-mono">
              <span>{maxTotal}</span>
              <span>{Math.round(maxTotal * 0.75)}</span>
              <span>{Math.round(maxTotal * 0.5)}</span>
              <span>{Math.round(maxTotal * 0.25)}</span>
              <span>0</span>
            </div>

            {filteredComplaints.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs italic">
                <Inbox className="w-8 h-8 text-slate-300 mb-1" />
                <span>No complaints match the selected filter criteria.</span>
              </div>
            ) : (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
                <line x1="0" y1="25" x2={chartWidth} y2="25" stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1="0" y1="60" x2={chartWidth} y2="60" stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1="0" y1="95" x2={chartWidth} y2="95" stroke="#f1f5f9" strokeDasharray="4 4" />
                <line x1="0" y1="135" x2={chartWidth} y2="135" stroke="#f1f5f9" />

                <path
                  d={pathTotal}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                <path
                  d={pathResolved}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {pointsTotal.map((pt, i) => (
                  <circle
                    key={`tot-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#ffffff"
                    stroke="#2563eb"
                    strokeWidth="2"
                    className="cursor-pointer hover:r-6 transition-all"
                    onMouseEnter={() =>
                      setHoveredPoint({ day: pt.day, total: pt.total, resolved: pt.resolved })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <title>{`${pt.day}: ${pt.total} total complaints`}</title>
                  </circle>
                ))}

                {pointsResolved.map((pt, i) => (
                  <circle
                    key={`res-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#ffffff"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    className="cursor-pointer hover:r-6 transition-all"
                    onMouseEnter={() =>
                      setHoveredPoint({ day: pt.day, total: pt.total, resolved: pt.resolved })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <title>{`${pt.day}: ${pt.resolved} resolved`}</title>
                  </circle>
                ))}
              </svg>
            )}

            <div className="flex justify-between px-6 text-[11px] font-semibold text-slate-400 mt-2">
              {trendData.map((t) => (
                <span key={t.day}>{t.day}</span>
              ))}
            </div>

            {hoveredPoint && (
              <div className="absolute top-2 right-4 bg-slate-900 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-3 border border-slate-700 animate-in fade-in duration-150">
                <span className="font-bold">{hoveredPoint.day}</span>
                <span className="text-blue-400">{hoveredPoint.total} Total</span>
                <span className="text-cyan-400">{hoveredPoint.resolved} Resolved</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Top Issues (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Top Grievance Categories
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">By Volume</span>
          </div>

          <div className="divide-y divide-slate-100">
            {topIssues.map((issue) => (
              <div
                key={issue.name}
                onClick={() => setActiveTab('complaints')}
                className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    {getIssueIcon(issue.name)}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block">{issue.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {issue.percentage}% of workload
                    </span>
                  </div>
                </div>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                  {issue.count}
                </span>
              </div>
            ))}
          </div>

          {/* Department Workload Summary Bar */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Department Active Queue Breakdown
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Water Works:</span>
                <strong className="text-slate-900">{departmentWorkload['dept_water'] || departmentWorkload['dept-water'] || 0}</strong>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Roads & Footpaths:</span>
                <strong className="text-slate-900">{departmentWorkload['dept_roads'] || departmentWorkload['dept-roads'] || 0}</strong>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Sanitation:</span>
                <strong className="text-slate-900">{departmentWorkload['dept_sanitation'] || departmentWorkload['dept-sanitation'] || 0}</strong>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Lighting & Power:</span>
                <strong className="text-slate-900">{departmentWorkload['dept_electricity'] || departmentWorkload['dept-power'] || 0}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Intake Channel Distribution Grid (Requirement 2 & 6) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>Intake Channels Breakdown</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Actual Saved Records
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live distribution of grievances across municipal reception channels
            </p>
          </div>
          <span className="text-xs font-bold text-slate-700">
            Total: {filteredComplaints.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {channelBreakdown.map((item) => (
            <div
              key={item.channel}
              onClick={() => setSelectedChannel(selectedChannel === item.channel ? 'ALL' : item.channel)}
              className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                selectedChannel === item.channel
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                {getChannelIcon(item.channel)}
              </div>
              <div className="text-lg font-black text-slate-900">{item.count}</div>
              <div className="text-[11px] font-bold text-slate-700 truncate">{item.channel}</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.percentage}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Transparency & Demo Notice */}
      <div className="p-3.5 bg-slate-100/90 border border-slate-200/90 rounded-xl text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            <strong>Data Provenance Verified:</strong> {officialCount} complaints registered via authorized officer intake. {demoCount} synthetic baseline complaints labelled with visible <span className="font-bold text-amber-800 bg-amber-100 px-1 py-0.5 rounded text-[10px]">DEMO DATA</span> tags.
          </span>
        </div>
      </div>

      {/* Modals */}
      <OfficerComplaintRegistrationModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
      />
      <CsvImportModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
      />
    </div>
  );
};

export default OverviewDashboard;
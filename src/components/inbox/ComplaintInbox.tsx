'use client';

import React, { useState, useEffect } from 'react';
import { useTriage } from '../../context/TriageContext';
import {
  Search,
  ChevronRight,
  Droplet,
  Trash2,
  Lightbulb,
  Construction,
  Zap,
  Filter,
  Plus,
  Mic,
  MicOff,
  FileSpreadsheet,
  PlusCircle,
  Database,
  Building,
  Phone,
  Mail,
  UserCheck,
  Globe,
  HelpCircle,
  Inbox
} from 'lucide-react';
import { getPriorityBadge, getStatusBadge, formatRefDate } from '../../lib/utils';
import { OfficerComplaintRegistrationModal } from '../complaints/OfficerComplaintRegistrationModal';
import { CsvImportModal } from '../complaints/CsvImportModal';
import { getCategoryLabel, getStatusLabel, getPriorityLabel } from '../../lib/i18n';
import { SpeechService } from '../../lib/speech';

export const ComplaintInbox: React.FC = () => {
  const {
    filteredComplaints,
    openComplaintDetail,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    priorityFilter,
    setPriorityFilter,
    statusFilter,
    setStatusFilter,
    channelFilter,
    setChannelFilter,
    demoFilter,
    setDemoFilter,
    settings,
    t
  } = useTriage();

  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [searchListening, setSearchListening] = useState(false);

  useEffect(() => {
    return () => {
      SpeechService.stopListening();
    };
  }, []);

  const toggleSearchSpeech = () => {
    if (searchListening) {
      SpeechService.stopListening();
      setSearchListening(false);
      return;
    }

    setSearchListening(true);
    SpeechService.startListening(settings.language, {
      onResult: (transcript) => {
        setSearchQuery(transcript);
      },
      onError: () => {
        setSearchListening(false);
      },
      onEnd: () => {
        setSearchListening(false);
      }
    });
  };

  const categories = [
    'ALL',
    'Water Supply & Sewage',
    'Garbage & Sanitation',
    'Street Lighting',
    'Roads & Potholes',
    'Electrical Hazards',
    'Public Health & Safety'
  ];
  const priorities = ['ALL', 'Critical', 'High', 'Medium', 'Low'];
  const statuses = [
    'ALL',
    'Pending',
    'Pending Review',
    'Under Review',
    'Approved',
    'In Progress',
    'Resolution Submitted',
    'Verification Pending',
    'Verified Resolved',
    'Rejected — Further Action Required',
    'Reopened',
    'Escalated'
  ];
  const channels = [
    { value: 'ALL', label: 'All Channels' },
    { value: 'Phone', label: '📞 Phone' },
    { value: 'Email', label: '✉️ Email' },
    { value: 'In Person', label: '🚶 In Person' },
    { value: 'Existing Government Portal', label: '🏛️ Gov Portal' },
    { value: 'Web Portal', label: '🌐 Web Portal' },
    { value: 'Other', label: '📋 Other' }
  ];

  const getRowIcon = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('water')) {
      return (
        <div className="h-7 w-7 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
          <Droplet className="h-3.5 w-3.5" />
        </div>
      );
    }
    if (cat.includes('garbage')) {
      return (
        <div className="h-7 w-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <Trash2 className="h-3.5 w-3.5" />
        </div>
      );
    }
    if (cat.includes('light')) {
      return (
        <div className="h-7 w-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
          <Lightbulb className="h-3.5 w-3.5" />
        </div>
      );
    }
    if (cat.includes('road')) {
      return (
        <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <Construction className="h-3.5 w-3.5" />
        </div>
      );
    }
    return (
      <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
        <Zap className="h-3.5 w-3.5" />
      </div>
    );
  };

  const getChannelBadge = (source?: string) => {
    const s = source || 'Web Portal';
    if (s === 'Phone') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-semibold">
          <Phone className="w-2.5 h-2.5" /> Phone
        </span>
      );
    }
    if (s === 'Email') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold">
          <Mail className="w-2.5 h-2.5" /> Email
        </span>
      );
    }
    if (s === 'In Person') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
          <UserCheck className="w-2.5 h-2.5" /> Walk-in
        </span>
      );
    }
    if (s === 'Existing Government Portal' || s === 'Web Portal') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-semibold">
          <Globe className="w-2.5 h-2.5" /> Portal
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-semibold">
        <HelpCircle className="w-2.5 h-2.5" /> {s}
      </span>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{t('nav_complaints')}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
              {filteredComplaints.length} Records
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Municipal grievance management, verified resolution workflows & triage ledger
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Import CSV Button */}
          <button
            onClick={() => setCsvModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
            title="Import grievances from spreadsheet"
          >
            <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
            <span>Import CSV</span>
          </button>

          {/* Register Complaint Button */}
          <button
            onClick={() => setRegisterModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Register Complaint</span>
          </button>
        </div>
      </div>

      {/* Filter Bar with Intake Channel & Demo Data Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs">
        {/* Search */}
        <div className="relative md:col-span-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50/60 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
          />
          {settings.voiceInput && (
            <button
              type="button"
              onClick={toggleSearchSpeech}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${
                searchListening ? 'text-rose-600 bg-rose-50 animate-pulse' : 'text-slate-400 hover:text-emerald-600'
              }`}
              title="Search complaints by voice"
            >
              <Mic className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Intake Channel Dropdown */}
        <div className="md:col-span-2">
          <select
            value={channelFilter}
            onChange={e => setChannelFilter(e.target.value)}
            className="w-full text-xs py-2 px-2.5 bg-slate-50/60 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            {channels.map(ch => (
              <option key={ch.value} value={ch.value}>
                {ch.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Dropdown */}
        <div className="md:col-span-2">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full text-xs py-2 px-2.5 bg-slate-50/60 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            {categories.map(c => (
              <option key={c} value={c}>
                {c === 'ALL' ? t('filter_all_categories') : getCategoryLabel(c, settings.language)}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Dropdown */}
        <div className="md:col-span-2">
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="w-full text-xs py-2 px-2.5 bg-slate-50/60 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            {priorities.map(p => (
              <option key={p} value={p}>
                {p === 'ALL' ? t('filter_all_priorities') : getPriorityLabel(p, settings.language)}
              </option>
            ))}
          </select>
        </div>

        {/* Status Dropdown */}
        <div className="md:col-span-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full text-xs py-2 px-2.5 bg-slate-50/60 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            {statuses.map(s => (
              <option key={s} value={s}>
                {s === 'ALL' ? t('filter_all_statuses') : getStatusLabel(s, settings.language)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Demo Data Filter Toggle Pill */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-[11px] text-slate-400 uppercase tracking-wider">Dataset Origin:</span>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              onClick={() => setDemoFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                demoFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Data
            </button>
            <button
              onClick={() => setDemoFilter('OFFICIAL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                demoFilter === 'OFFICIAL'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Official Intake Only
            </button>
            <button
              onClick={() => setDemoFilter('DEMO')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                demoFilter === 'DEMO'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Demo Data Only
            </button>
          </div>
        </div>
        <div className="text-[11px] text-slate-400">
          Showing <span className="font-bold text-slate-700">{filteredComplaints.length}</span> active cases
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-bold">ID & Origin</th>
                <th className="py-3 px-4 font-bold">Intake Channel</th>
                <th className="py-3 px-4 font-bold">{t('nav_complaints')}</th>
                <th className="py-3 px-4 font-bold">Category</th>
                <th className="py-3 px-4 font-bold">Priority</th>
                <th className="py-3 px-4 font-bold">Assigned Dept</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Location</th>
                <th className="py-3 px-4 font-bold">Received</th>
                <th className="py-3 px-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Inbox className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-700 text-sm">No complaints found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        No grievance records match your selected filter criteria. Try clearing search keywords or resetting intake-channel filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((item, idx) => {
                  const pBadge = getPriorityBadge(item.currentPriority);
                  const sBadge = getStatusBadge(item.currentStatus);
                  const isDemo = item.complaint.is_demo !== false;

                  return (
                    <tr
                      key={`${item.complaint.id}-${idx}`}
                      onClick={() => openComplaintDetail(item.complaint.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      {/* ID with Icon and Demo Tag */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getRowIcon(item.currentCategory)}
                          <div>
                            <div className="font-mono font-bold text-slate-900">
                              {item.complaint.shortId}
                            </div>
                            {isDemo ? (
                              <span className="inline-block px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold tracking-tight">
                                DEMO DATA
                              </span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold tracking-tight">
                                OFFICIAL
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Intake Channel */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getChannelBadge(item.complaint.source)}
                      </td>

                      {/* Complaint Title / Text */}
                      <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                        {item.complaint.title || item.analysis.summary}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {getCategoryLabel(item.currentCategory, settings.language)}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${pBadge.bg}`}>
                          {getPriorityLabel(item.currentPriority, settings.language)}
                        </span>
                      </td>

                      {/* Assigned Dept */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {(item.currentDepartmentId || 'Unassigned').replace('dept-', '').replace('dept_', '').toUpperCase()}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${sBadge.bg}`}>
                          {getStatusLabel(sBadge.label, settings.language)}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {item.complaint.location.split(' - ')[0]}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {formatRefDate(item.complaint.created_at)}
                      </td>

                      {/* Action Chevron */}
                      <td className="py-3 px-3 text-right text-slate-400">
                        <ChevronRight className="h-4 w-4 inline" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Officer Registration Modal */}
      <OfficerComplaintRegistrationModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
      />
    </div>
  );
};
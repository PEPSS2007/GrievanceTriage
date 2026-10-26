'use client';

import React, { useState } from 'react';
import { useTriage } from '../../context/TriageContext';
import {
  Droplet,
  Phone,
  Mail,
  Edit2,
  Check,
  Building2,
  ExternalLink,
  ChevronDown,
  Info,
  ShieldAlert
} from 'lucide-react';
import { createMailtoLink, createTelLink } from '../../lib/utils';

export const DepartmentContactPanel: React.FC = () => {
  const {
    departments,
    createHandoff,
    getMergedComplaint,
    selectedComplaintId
  } = useTriage();

  const item = getMergedComplaint(selectedComplaintId || 'GRV-2026-1001');

  const [selectedDeptId, setSelectedDeptId] = useState(
    item?.currentDepartmentId || 'dept-water'
  );
  const [draftMessage, setDraftMessage] = useState(
    `Please dispatch a repair crew to ${item?.complaint.title ? item.complaint.title.replace('Water leak on ', '') : 'Pine Street'}, ${item?.complaint.location || 'Ward 4'}. This is a water main leak requiring urgent attention.`
  );
  const [sendVia, setSendVia] = useState<'Email' | 'Phone' | 'Both'>('Email');
  const [handoffDone, setHandoffDone] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);

  const dept = departments.find(d => d.id === selectedDeptId) || departments[0];

  const handlePrepareHandoff = () => {
    createHandoff({
      complaint_id: item?.complaint.id || 'GRV-2026-1001',
      department_id: dept.id,
      channel: sendVia === 'Email' ? 'email' : sendVia === 'Phone' ? 'phone' : 'portal',
      message: draftMessage,
      status: 'Initiated',
      follow_up_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      type: 'handoff'
    });

    setHandoffDone(true);
    setTimeout(() => setHandoffDone(false), 3000);
  };

  const mailtoLink = createMailtoLink(
    dept.email,
    `[GRIEVANCETRIAGE] Handoff Dispatch: ${item?.complaint.shortId || 'CMP-001'} - ${item?.complaint.location || 'Ward 4'}`,
    draftMessage
  );
  const telLink = createTelLink(dept.phone);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
      {/* Title & Reassign Header matching Reference Section 5 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Department Contact
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate field dispatches for <strong className="text-slate-800">{item?.complaint.shortId}</strong> ({item?.complaint.title || 'Water leak on Pine Street'}).
          </p>
        </div>

        {/* Reassign Department Dropdown */}
        <div className="relative">
          <button
            onClick={() => setReassignOpen(!reassignOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <span>Reassign Department</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {reassignOpen && (
            <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-20">
              {departments.map(d => (
                <button
                  key={d.id}
                  onClick={() => {
                    setSelectedDeptId(d.id);
                    setReassignOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 ${
                    selectedDeptId === d.id ? 'font-bold text-blue-600 bg-blue-50/60' : 'text-slate-700'
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout matching Reference Section 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Department Contact Card */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                  <Droplet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{dept.name}</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Available
                  </span>
                </div>
              </div>
              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200 rounded">
                Demo Contact
              </span>
            </div>

            {/* Phone & Email Rows with Actual mailto: / tel: Links */}
            <div className="space-y-2.5 text-xs pt-2 border-t border-slate-100">
              <a
                href={telLink}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-blue-50/60 text-slate-700 hover:text-blue-700 font-medium transition-colors"
                title="Click to dial telephone link"
              >
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{dept.phone}</span>
                </div>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </a>

              <a
                href={mailtoLink}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-blue-50/60 text-slate-700 hover:text-blue-700 font-medium transition-colors truncate"
                title="Click to open default mail client"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">{dept.email}</span>
                </div>
                <ExternalLink className="h-3 w-3 text-slate-400 shrink-0" />
              </a>
            </div>

            {/* View Department Action Button */}
            <div className="pt-2">
              <button
                onClick={() => alert(`Agency Profile (Synthetic Demo):\nDepartment: ${dept.name}\nOperating Hours: ${dept.hours}\nEscalation Lead: ${dept.escalation_contact}`)}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
              >
                View Department Details
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Message Draft & Prepare Handoff */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                Message Draft
              </h3>
              <Edit2 className="h-3.5 w-3.5 text-slate-400" />
            </div>

            <textarea
              value={draftMessage}
              onChange={e => setDraftMessage(e.target.value)}
              rows={4}
              className="w-full p-3 bg-slate-50/70 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium leading-relaxed focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />

            {/* Send via Toggle Pills matching Reference */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Send via
              </span>
              <div className="flex items-center gap-2">
                {(['Email', 'Phone', 'Both'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setSendVia(mode)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      sendVia === mode
                        ? 'bg-[#0d1b2a] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Prepare Handoff Button matching Reference */}
            <div className="pt-2">
              <button
                onClick={handlePrepareHandoff}
                className={`w-full py-2.5 rounded-lg text-xs font-bold text-white transition-all shadow-sm ${
                  handoffDone ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {handoffDone ? '✓ Handoff Dispatched to Agency!' : 'Prepare Handoff'}
              </button>

              <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200/70 text-[11px] text-slate-500 flex items-start gap-2">
                <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Delivery Verification:</strong> Initiating handoff prepares the dispatch ticket and records the timestamp in your timeline. Actual physical receipt is confirmed when the target department acknowledges the record.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
'use client';

import React, { useState } from 'react';
import { useTriage } from '../../context/TriageContext';
import { AlertTriangle, ChevronRight, Eye, Flame } from 'lucide-react';

export const EscalationQueueView: React.FC = () => {
  const { escalations, openComplaintDetail } = useTriage();
  const [levelFilter, setLevelFilter] = useState<'All' | 1 | 2 | 3>('All');

  const filtered = escalations.filter(item => {
    if (levelFilter === 'All') return true;
    return item.level === levelFilter;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
      {/* Title & SLA Header matching Reference Section 8 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Escalation Queue
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            SLA: 24 hours
          </span>
        </div>

        {/* Filter Pills: All, Level 1, Level 2, Level 3 */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs text-xs font-bold">
          {(['All', 1, 2, 3] as const).map(lvl => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-3 py-1 rounded-md transition-all ${
                levelFilter === lvl
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lvl === 'All' ? 'All' : `Level ${lvl}`}
            </button>
          ))}
        </div>
      </div>

      {/* Escalation Queue Table matching Reference */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-bold">ID</th>
                <th className="py-3 px-4 font-bold">Issue</th>
                <th className="py-3 px-4 font-bold">Level</th>
                <th className="py-3 px-4 font-bold">Days Open</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filtered.map(row => (
                <tr
                  key={row.id}
                  onClick={() => openComplaintDetail(row.complaintId)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  {/* ID */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {row.shortId}
                  </td>

                  {/* Issue */}
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {row.issue}
                  </td>

                  {/* Level Pill */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center justify-center h-5 w-5 rounded-full font-bold text-[10px] ${
                        row.level === 3
                          ? 'bg-red-600 text-white'
                          : row.level === 2
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {row.level}
                    </span>
                  </td>

                  {/* Days Open */}
                  <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                    {row.daysOpen}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 font-bold">
                    <span
                      className={
                        row.status === 'Escalated' ? 'text-rose-600' : 'text-amber-600'
                      }
                    >
                      {row.status}
                    </span>
                  </td>

                  {/* View Action */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        openComplaintDetail(row.complaintId);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
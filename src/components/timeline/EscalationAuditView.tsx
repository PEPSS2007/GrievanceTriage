'use client';

import React from 'react';
import { useTriage } from '../../context/TriageContext';
import {
  CheckCircle2,
  Clock,
  Send,
  Flame,
  UserCheck,
  Building2,
  AlertTriangle,
  History
} from 'lucide-react';
import { formatFullDate } from '../../lib/utils';

export const EscalationAuditView: React.FC = () => {
  const { auditLogs } = useTriage();

  const timelineSteps = [
    { title: 'Pending Review', time: 'Apr 28, 10:15 AM', dotColor: 'bg-emerald-500', lineAfter: true },
    { title: 'Approved', time: 'Apr 28, 11:30 AM', dotColor: 'bg-emerald-500', lineAfter: true },
    { title: 'Contact Prepared', time: 'Apr 28, 12:05 PM', dotColor: 'bg-blue-500', lineAfter: true },
    { title: 'Contact Initiated', time: 'Apr 28, 2:30 PM', dotColor: 'bg-blue-500', lineAfter: true },
    { title: 'Escalated (Level 2)', time: 'Apr 29, 9:15 AM', dotColor: 'bg-rose-500', lineAfter: false }
  ];

  const auditEvents = [
    {
      title: 'Reviewer approved',
      actor: 'Officer Sarah',
      time: 'Apr 28, 11:30 AM',
      icon: UserCheck,
      color: 'bg-emerald-100 text-emerald-700'
    },
    {
      title: 'Department contacted',
      actor: 'System',
      time: 'Apr 28, 2:30 PM',
      icon: Building2,
      color: 'bg-blue-100 text-blue-700'
    },
    {
      title: 'Escalation added',
      actor: 'Officer Sarah',
      time: 'Apr 29, 9:15 AM',
      icon: Flame,
      color: 'bg-rose-100 text-rose-700'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Escalation & Audit History
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Chronological handoff transitions, supervisor escalations, and immutable reviewer log.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Complaint Timeline matching Reference Section 6 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-blue-600" />
            Complaint Timeline
          </h3>

          <div className="relative pl-6 space-y-6 pt-2">
            {timelineSteps.map((step, idx) => (
              <div key={idx} className="relative flex items-start gap-4 group">
                {/* Vertical connecting line */}
                {step.lineAfter && (
                  <div className="absolute -left-[17px] top-3.5 bottom-0 w-0.5 bg-slate-200" />
                )}

                {/* Step circle node */}
                <span
                  className={`absolute -left-[23px] top-1 h-3.5 w-3.5 rounded-full ${step.dotColor} ring-4 ring-white shadow-2xs`}
                />

                <div>
                  <h4 className="text-xs font-bold text-slate-900">{step.title}</h4>
                  <span className="text-[11px] text-slate-400 font-medium">{step.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Card: Audit Log matching Reference Section 6 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <History className="h-4 w-4 text-purple-600" />
            Audit Log
          </h3>

          <div className="space-y-3.5 pt-1">
            {auditEvents.map((ev, i) => {
              const Icon = ev.icon;
              return (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-start gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className={`h-8 w-8 rounded-lg ${ev.color} flex items-center justify-center shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{ev.title}</h4>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {ev.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      By: <strong className="text-slate-700">{ev.actor}</strong>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
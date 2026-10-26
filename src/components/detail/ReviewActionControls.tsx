'use client';

import React, { useState } from 'react';
import { useTriage } from '../../context/TriageContext';
import { MergedComplaintView, PriorityType } from '../../types';
import {
  Check,
  Edit,
  X,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import taxonomyData from '../../data/taxonomy.json';

interface ReviewActionControlsProps {
  complaintView: MergedComplaintView;
}

export const ReviewActionControls: React.FC<ReviewActionControlsProps> = ({ complaintView }) => {
  const {
    approveComplaint,
    editAndOverrideComplaint,
    rejectComplaint,
    requestMoreInfo,
    departments,
    t
  } = useTriage();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isRequestInfoOpen, setIsRequestInfoOpen] = useState(false);
  const [approvedToast, setApprovedToast] = useState(false);

  // Edit form state
  const [editCategory, setEditCategory] = useState(complaintView.currentCategory);
  const [editPriority, setEditPriority] = useState<PriorityType>(complaintView.currentPriority);
  const [editDeptId, setEditDeptId] = useState(complaintView.currentDepartmentId);
  const [editAction, setEditAction] = useState(complaintView.analysis.action || (complaintView.analysis as any).suggested_action || 'Dispatch field inspection crew');
  const [editNote, setEditNote] = useState('');

  // Reject / Info state
  const [rejectReason, setRejectReason] = useState('');
  const [infoQuery, setInfoQuery] = useState('');

  const handleApprove = () => {
    approveComplaint(complaintView.complaint.id);
    setApprovedToast(true);
    setTimeout(() => setApprovedToast(false), 2000);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    editAndOverrideComplaint(complaintView.complaint.id, {
      category: editCategory,
      priority: editPriority,
      departmentId: editDeptId,
      action: editAction,
      note: editNote || 'Reviewer updated triage values.'
    });
    setIsEditOpen(false);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    rejectComplaint(complaintView.complaint.id, rejectReason);
    setIsRejectOpen(false);
    setRejectReason('');
  };

  const handleConfirmRequestInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!infoQuery.trim()) return;
    requestMoreInfo(complaintView.complaint.id, infoQuery);
    setIsRequestInfoOpen(false);
    setInfoQuery('');
  };

  return (
    <div className="pt-2">
      {/* 4 Action Buttons matching Section 3 in Reference */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Approve (Solid Green) */}
        <button
          onClick={handleApprove}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all shadow-2xs ${
            approvedToast ? 'bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          <Check className="h-4 w-4" />
          <span>{approvedToast ? 'Approved!' : t('btn_approve')}</span>
        </button>

        {/* Edit (Solid Blue) */}
        <button
          onClick={() => {
            setEditCategory(complaintView.currentCategory);
            setEditPriority(complaintView.currentPriority);
            setEditDeptId(complaintView.currentDepartmentId);
            setEditAction(complaintView.analysis.action || (complaintView.analysis as any).suggested_action || 'Dispatch field inspection crew');
            setEditNote(complaintView.decision?.reviewer_note || '');
            setIsEditOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-2xs"
        >
          <Edit className="h-3.5 w-3.5" />
          <span>{t('btn_override')}</span>
        </button>

        {/* Reject (Pink/Red) */}
        <button
          onClick={() => setIsRejectOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 transition-all shadow-2xs"
        >
          <X className="h-4 w-4" />
          <span>{t('btn_reject')}</span>
        </button>

        {/* Request Info (White / Outline) */}
        <button
          onClick={() => setIsRequestInfoOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-all shadow-2xs"
        >
          <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
          <span>{t('btn_request_info')}</span>
        </button>
      </div>

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Edit & Override Decision — #{complaintView.complaint.shortId}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Separated from automated inference in database audit trail.
                </p>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  {taxonomyData.categories.map(c => {
                    const catName = typeof c === 'string' ? c : (c as any).name;
                    return <option key={catName} value={catName}>{catName}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Low', 'Medium', 'High', 'Critical'] as PriorityType[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditPriority(p)}
                      className={`py-1.5 text-center font-bold rounded-lg border text-xs ${
                        editPriority === p
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Recommended Department</label>
                <select
                  value={editDeptId}
                  onChange={e => setEditDeptId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Suggested Action</label>
                <input
                  type="text"
                  value={editAction}
                  onChange={e => setEditAction(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Override Reason</label>
                <textarea
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  placeholder="State reason for overriding AI recommendation..."
                  rows={2}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                >
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-rose-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-rose-900">Reject Grievance</h3>
              <button onClick={() => setIsRejectOpen(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleConfirmReject} className="p-5 space-y-3.5 text-xs">
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (e.g. out of municipal jurisdiction)..."
                rows={3}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-rose-500"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejectOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700"
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Info Modal */}
      {isRequestInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-amber-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-900">Request Information from Citizen</h3>
              <button onClick={() => setIsRequestInfoOpen(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleConfirmRequestInfo} className="p-5 space-y-3.5 text-xs">
              <textarea
                value={infoQuery}
                onChange={e => setInfoQuery(e.target.value)}
                placeholder="Please state what additional detail or photo is required..."
                rows={3}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-amber-500"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRequestInfoOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700"
                >
                  Send Clarification Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
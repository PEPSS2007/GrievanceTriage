'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTriage } from '../../context/TriageContext';
import {
  ArrowLeft,
  Droplet,
  MapPin,
  Building2,
  Wrench,
  Check,
  Edit,
  X,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Calendar,
  Layers,
  Volume2,
  VolumeX,
  Camera,
  Upload,
  AlertTriangle,
  Clock,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  UserCheck,
  RefreshCw,
  FileText
} from 'lucide-react';
import { ReviewActionControls } from './ReviewActionControls';
import { SpeechService } from '../../lib/speech';
import { getStatusLabel, getPriorityLabel } from '../../lib/i18n';
import { ComplaintAttachment, PriorityType, WardContact } from '../../types';

export const ComplaintDetail: React.FC = () => {
  const {
    selectedComplaintId,
    getMergedComplaint,
    setShowDetail,
    approveComplaint,
    departments,
    settings,
    updateComplaintLocation,
    addAttachmentToComplaint,
    reanalyzeWithVision,
    submitResolutionEvidence,
    verifyResolution,
    rejectResolution,
    reopenComplaint,
    disputeOrReopenResolution,
    replyInformationRequest,
    getAuditLogsForComplaint,
    t
  } = useTriage();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'ai' | 'contact' | 'info' | 'resolution' | 'audit'>('ai');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Re-analysis & upload state
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Citizen reply state
  const [citizenReplyText, setCitizenReplyText] = useState('');
  const [isReplyingInfo, setIsReplyingInfo] = useState(false);

  // Department resolution form state
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionActionTaken, setResolutionActionTaken] = useState('');
  const [resolutionWorkOrder, setResolutionWorkOrder] = useState('');
  const [resolutionDept, setResolutionDept] = useState('');
  const [resolutionOfficer, setResolutionOfficer] = useState('Eng. Vikram Sethi - Field Lead');
  const [resolutionPhoto, setResolutionPhoto] = useState<string | null>('https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80');

  // Reviewer Verification Modal state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyNote, setVerifyNote] = useState('');
  const [allowException, setAllowException] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');

  // Rejection Modal state
  const [isRejectResolutionModalOpen, setIsRejectResolutionModalOpen] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  // Reopen Modal state
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReasonText, setReopenReasonText] = useState('');

  // Citizen dispute state
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const item = getMergedComplaint(selectedComplaintId || 'GRV-2026-1001');

  // Location-aware contact resolution
  const matchedDepartment = departments.find(
    d => d.id === item?.currentDepartmentId || d.categories?.includes(item?.currentCategory || '')
  ) || departments[0];

  // Extract ward from location string (e.g. "Ward 4, Pine Street" -> "Ward 4")
  const wardMatch = item?.complaint.location.match(/Ward\s+(\d+)/i);
  const wardKey = wardMatch ? `Ward ${wardMatch[1]}` : null;

  const resolvedContact: WardContact | null =
    wardKey && matchedDepartment?.ward_contacts
      ? matchedDepartment.ward_contacts[wardKey] || null
      : null;

  // Speech Text Construction
  const getAudioText = () => {
    if (!item) return '';
    const cat = item.currentCategory || item.analysis.category;
    const prio = getPriorityLabel(item.currentPriority, settings.language);
    const status = getStatusLabel(item.currentStatus, settings.language);
    return `Complaint reference ${item.complaint.shortId}. Category: ${cat}. Priority: ${prio}. Status: ${status}. Location: ${item.complaint.location}. Summary: ${item.analysis.summary}. Recommended Action: ${item.analysis.action}.`;
  };

  const handlePlaySpeech = () => {
    if (isPlayingAudio) {
      SpeechService.stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }
    setIsPlayingAudio(true);
    SpeechService.speak(
      getAudioText(),
      settings.language,
      settings.speechSpeed,
      () => setIsPlayingAudio(false),
      () => setIsPlayingAudio(false)
    );
  };

  useEffect(() => {
    if (settings.voiceOutput && settings.autoRead && item) {
      handlePlaySpeech();
    }
    return () => {
      SpeechService.stopSpeaking();
    };
  }, [item?.complaint.id, settings.voiceOutput, settings.autoRead]);

  if (!item) {
    return (
      <div className="p-8 text-center text-slate-500">
        Complaint not found.
      </div>
    );
  }

  // Handle Photo File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image format (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUri = event.target?.result as string;
      const newAttachment: ComplaintAttachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        url: dataUri,
        size: file.size,
        type: file.type,
        uploaded_at: new Date().toISOString(),
        vision_summary: 'Uploaded citizen evidence awaiting inspection.',
      };

      addAttachmentToComplaint(item.complaint.id, newAttachment);
      showToast('Photo attached successfully! Ready for AI vision re-analysis.');
    };
    reader.readAsDataURL(file);
  };

  // Re-Analyze Complaint (Vision AI + Text)
  const handleReanalyzeWithVision = async (attachmentUrl?: string) => {
    setIsReanalyzing(true);
    const photoToAnalyze =
      attachmentUrl || item.complaint.attachments?.[0]?.url || 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=600&q=80';

    try {
      const res = await fetch('/api/analyze/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: item.complaint.id,
          image_url: photoToAnalyze,
          complaint_text: item.complaint.text,
          location: item.complaint.location,
          category: item.currentCategory,
        }),
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        reanalyzeWithVision(item.complaint.id, data.analysis);
        showToast('Complaint re-analyzed with multi-modal vision engine!');
      } else {
        alert(data.message || 'Vision re-analysis failed.');
      }
    } catch (e: any) {
      console.error('Vision re-analysis error:', e);
      alert('Network error while requesting vision analysis.');
    } finally {
      setIsReanalyzing(false);
    }
  };

  // Citizen Reply Handler
  const handleCitizenReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenReplyText.trim()) return;

    replyInformationRequest(item.complaint.id, citizenReplyText);
    setCitizenReplyText('');
    setIsReplyingInfo(false);
    showToast('Information response recorded! Complaint updated to Under Review.');
  };

  // Department Resolution Submit
  const handleResolutionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNote.trim() || !resolutionOfficer.trim()) {
      alert('Please provide officer name and completion note.');
      return;
    }

    submitResolutionEvidence(item.complaint.id, {
      note: resolutionNote,
      officer_name: resolutionOfficer,
      department_id: resolutionDept || item.currentDepartmentId,
      action_taken: resolutionActionTaken || resolutionNote,
      work_order_ref: resolutionWorkOrder || undefined,
      photo_url: resolutionPhoto || undefined,
      photo_name: resolutionPhoto ? 'field_resolution_after.jpg' : undefined
    });

    setIsResolutionModalOpen(false);
    showToast('Resolution evidence submitted! Case moved to Verification Pending.');
  };

  // Reviewer Verification Approval Handler
  const handleVerifyApproval = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      verifyResolution(
        item.complaint.id,
        'Officer Sarah (Municipal Reviewer)',
        verifyNote || 'Inspected resolution evidence and physical work order.',
        allowException,
        exceptionReason
      );
      setIsVerifyModalOpen(false);
      showToast('Resolution verified! Status updated to Verified Resolved.');
    } catch (err: any) {
      alert(err.message || 'Verification could not proceed.');
    }
  };

  // Reviewer Rejection Handler
  const handleRejectResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReasonText.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }

    rejectResolution(item.complaint.id, rejectionReasonText, 'Officer Sarah (Municipal Reviewer)');
    setIsRejectResolutionModalOpen(false);
    setRejectionReasonText('');
    showToast('Resolution rejected. Returned to department with status: Rejected — Further Action Required.');
  };

  // Reopen Case Handler
  const handleReopenComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReasonText.trim()) {
      alert('Please enter a reopening reason.');
      return;
    }

    reopenComplaint(item.complaint.id, reopenReasonText, 'Officer Sarah (Municipal Admin)');
    setIsReopenModalOpen(false);
    setReopenReasonText('');
    showToast('Complaint reopened. Status changed to Reopened. All previous history preserved.');
  };

  // Citizen Dispute Handler
  const handleCitizenDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;

    disputeOrReopenResolution(item.complaint.id, disputeReason);
    setIsDisputeModalOpen(false);
    setDisputeReason('');
    showToast('Citizen dispute recorded. Complaint has been reopened for investigation.');
  };

  // Audit Logs for this complaint
  const complaintAuditEvents = getAuditLogsForComplaint(item.complaint.id);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50 relative">
      {/* Toast Notice */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[3000] bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Full Photo Modal */}
      {selectedPhotoPreview && (
        <div
          className="fixed inset-0 z-[4000] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhotoPreview(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-xl overflow-hidden shadow-2xl p-2">
            <button
              onClick={() => setSelectedPhotoPreview(null)}
              className="absolute top-4 right-4 p-1.5 bg-slate-900/70 text-white rounded-full hover:bg-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={selectedPhotoPreview}
              alt="Grievance Evidence Full View"
              className="max-h-[80vh] w-auto rounded-lg object-contain"
            />
          </div>
        </div>
      )}

      {/* Top Navigation & Audio */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            SpeechService.stopSpeaking();
            setShowDetail(false);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{`← ${t('nav_complaints')}`}</span>
        </button>

        {settings.voiceOutput && (
          <button
            onClick={handlePlaySpeech}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isPlayingAudio
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="h-3.5 w-3.5" />
                <span>{t('btn_stop_audio')}</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5" />
                <span>{t('btn_listen')}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Header Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-base font-extrabold text-slate-900">
                {item.complaint.shortId}
              </span>
              {item.complaint.is_demo !== false ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  DEMO DATA
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  OFFICIAL INTAKE
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                {item.currentPriority} Priority
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {item.currentStatus}
              </span>
              {item.isOverridden && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Officer Override
                </span>
              )}
            </div>

            <h3 className="text-base font-extrabold text-slate-900 mt-1">
              {item.complaint.title || item.currentCategory}
            </h3>

            <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>{item.complaint.location}</span>
              </span>
              <span>&bull;</span>
              <span className="font-semibold text-slate-700">Channel: {item.complaint.source}</span>
              {item.complaint.source_reference && (
                <>
                  <span>&bull;</span>
                  <span className="font-mono text-[11px] text-slate-600">Ref: {item.complaint.source_reference}</span>
                </>
              )}
              {item.complaint.receiving_officer && (
                <>
                  <span>&bull;</span>
                  <span className="text-slate-600">Officer: {item.complaint.receiving_officer}</span>
                </>
              )}
            </div>

            {item.complaint.officer_notes && (
              <div className="mt-2 p-2 rounded-lg bg-blue-50/60 border border-blue-200/60 text-xs text-blue-900">
                <strong className="font-bold">Officer Intake Notes:</strong> {item.complaint.officer_notes}
              </div>
            )}
          </div>
        </div>

        {/* Location Coordinates & Pin Badge */}
        <div className="w-full md:w-56 p-3 rounded-xl border border-slate-200 bg-slate-50/70 shrink-0 text-xs space-y-1">
          <div className="flex items-center justify-between font-bold text-slate-700">
            <span>Coordinates</span>
            {item.complaint.lat ? (
              <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100 px-1.5 py-0.2 rounded">
                Verified GPS
              </span>
            ) : (
              <span className="text-[10px] text-amber-700 font-extrabold bg-amber-100 px-1.5 py-0.2 rounded">
                Unlocated
              </span>
            )}
          </div>
          <div className="font-mono text-[11px] text-slate-600">
            {item.complaint.lat ? `${item.complaint.lat}, ${item.complaint.lng}` : 'Pending Pin Drop'}
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-2.5 transition-all whitespace-nowrap ${
            activeTab === 'ai'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          AI Analysis & Vision Evidence
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`pb-2.5 transition-all whitespace-nowrap ${
            activeTab === 'contact'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Location-Aware Department Contact
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`pb-2.5 transition-all whitespace-nowrap ${
            activeTab === 'info'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Information Requests
        </button>
        <button
          onClick={() => setActiveTab('resolution')}
          className={`pb-2.5 transition-all whitespace-nowrap ${
            activeTab === 'resolution'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Resolution & Verification
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-2.5 transition-all whitespace-nowrap ${
            activeTab === 'audit'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Activity & Audit History
        </button>
      </div>

      {/* TAB 1: Dynamic AI Analysis + Photo Attachments Gallery */}
      {activeTab === 'ai' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column (7 cols): Dynamic Summary, Category, Recommended Dept, Action */}
            <div className="lg:col-span-7 space-y-3.5">
              {/* Summary */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Dynamic AI Summary
                  </span>
                  <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                    {item.analysis.summary}
                  </p>
                </div>
              </div>

              {/* Category */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Classified Category
                  </span>
                  <p className="text-xs font-semibold text-slate-800">
                    {item.currentCategory || item.analysis.category}
                  </p>
                </div>
              </div>

              {/* Recommended Dept */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Recommended Department
                  </span>
                  <p className="text-xs font-semibold text-slate-800">
                    {matchedDepartment?.name || item.analysis.department_id || item.analysis.recommended_department_id || 'Municipal Department'}
                  </p>
                </div>
              </div>

              {/* Suggested Action */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Wrench className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Recommended Action Plan
                  </span>
                  <p className="text-xs font-semibold text-slate-800">
                    {item.analysis.suggested_action || item.analysis.action}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Dynamic Priority Evidence & Confidence */}
            <div className="lg:col-span-5">
              <div className="bg-[#fffdf5] rounded-xl p-5 border border-amber-200/90 shadow-2xs flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                      Priority Evidence
                    </h4>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      {item.analysis.method === 'ai' ? 'Gemini 1.5' : 'Rule Engine Baseline'}
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs font-medium text-amber-900/90">
                    {Array.isArray(item.analysis.priority_evidence) && item.analysis.priority_evidence.length > 0 ? (
                      item.analysis.priority_evidence.map((ev: any, idx: number) => {
                        const text = typeof ev === 'string' ? ev : ev.rule_name || ev.matched_phrase || JSON.stringify(ev);
                        return (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                            <span>{text}</span>
                          </li>
                        );
                      })
                    ) : (
                      <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        <span>Matched complaint keywords in municipal taxonomy</span>
                      </li>
                    )}
                  </ul>

                  {/* Uncertainties */}
                  {item.analysis.uncertainties && item.analysis.uncertainties.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-amber-200/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                        Uncertainties & Disclaimers:
                      </span>
                      <ul className="space-y-1 text-[11px] text-amber-800/80 italic">
                        {item.analysis.uncertainties.map((u, i) => (
                          <li key={i}>&bull; {u}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Confidence Progress Bar */}
                <div className="pt-4 border-t border-amber-200/60">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                    <span>Model Confidence: {Math.round(item.analysis.confidence * 100)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.round(item.analysis.confidence * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Evidence Gallery & Re-Analyze Action */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Camera className="h-4 w-4 text-blue-600" />
                  <span>Photographic Evidence & Multi-Modal Vision</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload pictures from field inspection or camera. The vision model analyzes visual anomalies alongside text.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Picture</span>
                </button>

                <button
                  onClick={() => handleReanalyzeWithVision()}
                  disabled={isReanalyzing}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isReanalyzing ? 'Analyzing Vision...' : 'Re-analyze Complaint'}</span>
                </button>
              </div>
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
              {item.complaint.attachments && item.complaint.attachments.length > 0 ? (
                item.complaint.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-2xs"
                  >
                    <img
                      src={att.url}
                      alt={att.name}
                      onClick={() => setSelectedPhotoPreview(att.url)}
                      className="h-36 w-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="p-2.5 bg-white border-t border-slate-100 text-xs">
                      <div className="font-bold text-slate-800 truncate">{att.name}</div>
                      {att.vision_summary && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 italic">
                          "{att.vision_summary}"
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  <Camera className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
                  <span>No pictures attached to this complaint yet. Click Upload Picture above to attach evidence.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Location-Aware Department & Ward Directory */}
      {activeTab === 'contact' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Location-Aware Department & Contact Resolution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Maps complaint category and geographic ward jurisdiction against the official municipal directory.
              </p>
            </div>
            {resolvedContact ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="h-4 w-4" />
                Verified Municipal Contact
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertTriangle className="h-4 w-4" />
                Contact Not Verified
              </span>
            )}
          </div>

          {resolvedContact ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Assigned Ward Field Officer
                </span>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-sm">
                    {resolvedContact.officer_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <strong className="text-sm text-slate-900 block">{resolvedContact.officer_name}</strong>
                    <span className="text-xs text-slate-500 font-medium">{resolvedContact.role}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/70 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{resolvedContact.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{resolvedContact.email}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Jurisdiction & Verification Details
                </span>
                <div className="space-y-1 text-slate-700">
                  <div><strong>Jurisdiction:</strong> {resolvedContact.jurisdiction}</div>
                  <div><strong>Ward:</strong> {resolvedContact.ward} ({resolvedContact.zone})</div>
                  <div><strong>Source:</strong> {resolvedContact.source}</div>
                  <div><strong>Last Verified:</strong> {resolvedContact.last_verified}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3 text-xs text-rose-900">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <AlertCircle className="h-4 w-4" />
                <span>Contact Not Verified for Location: {item.complaint.location}</span>
              </div>
              <p className="leading-relaxed">
                The complaint location is not covered by the current Metroville municipal ward directory. To avoid fabricating government contacts, manual officer assignment is required.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <select className="px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-slate-700 font-medium">
                  <option>Select Authorized Department Officer...</option>
                  <option>Eng. Anita Roy (Central Zone Dispatch)</option>
                  <option>Eng. Vikram Sethi (North Zone Dispatch)</option>
                  <option>Dr. H. Kaur (Water Superintendent)</option>
                </select>
                <button
                  onClick={() => showToast('Officer manually assigned to complaint.')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold"
                >
                  Confirm Manual Assignment
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Information Requests & Citizen Reply Workflow */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Information Requests & Citizen Responses
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                When a grievance lacks clarity, officers can request specific clarifications. Citizen replies trigger automatic re-analysis.
              </p>
            </div>
            <button
              onClick={() => setIsReplyingInfo(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Simulate Citizen Response</span>
            </button>
          </div>

          {/* Citizen Reply Form Modal / Expandable */}
          {isReplyingInfo && (
            <form onSubmit={handleCitizenReply} className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3 text-xs">
              <strong className="block font-bold text-blue-900">Citizen Response Submission:</strong>
              <textarea
                value={citizenReplyText}
                onChange={(e) => setCitizenReplyText(e.target.value)}
                placeholder="Citizen provides additional location details, house number, or clarification..."
                rows={3}
                className="w-full p-2.5 bg-white border border-blue-200 rounded-lg text-slate-800"
                required
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReplyingInfo(false)}
                  className="px-3 py-1.5 bg-white text-slate-600 rounded-lg border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg shadow-xs"
                >
                  Submit Response & Re-analyze
                </button>
              </div>
            </form>
          )}

          {/* Outstanding Request Notice */}
          {item.currentStatus === 'Needs More Information' ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-700" />
                <span>Status: Awaiting Citizen Clarification (Response Deadline: 48h)</span>
              </div>
              <p>Officer requested: "{item.decision?.reviewer_note || 'Please provide supplementary details.'}"</p>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              No outstanding information requests pending for this grievance.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Resolution Evidence & Verification Lifecycle */}
      {activeTab === 'resolution' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Resolution Verification Lifecycle</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Dual-Stage Municipal Protocol
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Departments submit completion evidence. Independent municipal reviewers verify remediation before closing grievances.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {item.currentStatus !== 'Verified Resolved' && (
                <button
                  onClick={() => {
                    setResolutionDept(item.currentDepartmentId);
                    setResolutionActionTaken(item.analysis.action || '');
                    setResolutionWorkOrder(`WO-${Date.now().toString().slice(-4)}`);
                    setIsResolutionModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  <span>Submit Department Resolution</span>
                </button>
              )}
            </div>
          </div>

          {/* Current Resolution State Banner */}
          <div className="p-4 rounded-xl border space-y-2 text-xs bg-slate-50/80 border-slate-200">
            <div className="flex items-center justify-between font-bold flex-wrap gap-2">
              <span className="text-slate-700">Lifecycle Status:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                item.currentStatus === 'Verified Resolved'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : item.currentStatus === 'Verification Pending'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : item.currentStatus === 'Resolution Submitted'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : item.currentStatus === 'Rejected — Further Action Required'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : item.currentStatus === 'Reopened'
                  ? 'bg-orange-100 text-orange-800 border border-orange-300'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {item.currentStatus === 'Verified Resolved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                {item.currentStatus === 'Verification Pending' && <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />}
                {item.currentStatus === 'Rejected — Further Action Required' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                {item.currentStatus}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {item.currentStatus === 'Verified Resolved'
                ? 'Authorized municipal reviewer has inspected physical work order & photographs and certified complete resolution.'
                : item.currentStatus === 'Verification Pending'
                ? 'Department reported work complete and filed evidence. Awaiting independent review and photographic comparison before closure.'
                : item.currentStatus === 'Resolution Submitted'
                ? 'Department work submitted. Verification pending formal inspection.'
                : item.currentStatus === 'Rejected — Further Action Required'
                ? 'Submitted resolution was reviewed and rejected. Remainder of defect persists; department must take further action.'
                : item.currentStatus === 'Reopened'
                ? 'Case has been reopened with preserved audit trail. Issue requires active department reassessment.'
                : 'Active maintenance and review underway. Department crew must record action taken and upload completion evidence.'}
            </p>

            {/* Action Buttons for Current Status */}
            <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
              {item.currentStatus === 'Verification Pending' && (
                <>
                  <button
                    onClick={() => {
                      setVerifyNote(`Inspected field remediation for #${item.complaint.shortId}. Work conforms to municipal standards.`);
                      setAllowException(false);
                      setExceptionReason('');
                      setIsVerifyModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Verify Resolution (Authorized Reviewer)</span>
                  </button>

                  <button
                    onClick={() => {
                      setRejectionReasonText('');
                      setIsRejectResolutionModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Reject Resolution — Require Further Action</span>
                  </button>
                </>
              )}

              {item.currentStatus === 'Verified Resolved' && (
                <button
                  onClick={() => {
                    setReopenReasonText('');
                    setIsReopenModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-300 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Reopen Grievance</span>
                </button>
              )}

              {item.currentStatus === 'Rejected — Further Action Required' && (
                <button
                  onClick={() => setIsResolutionModalOpen(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  <span>File Updated Remedial Evidence</span>
                </button>
              )}
            </div>
          </div>

          {/* Evidence Inspection Card with Before & After Comparison */}
          {item.resolutionEvidence ? (
            <div className="p-5 rounded-xl border border-indigo-100 bg-indigo-50/30 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-100/70">
                <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Filed Resolution Evidence Dossier</span>
                </span>
                <span className="text-[11px] font-mono text-indigo-700">
                  Submitted: {new Date(item.resolutionEvidence.submitted_at || item.resolutionEvidence.completed_at || Date.now()).toLocaleString()}
                </span>
              </div>

              {/* Resolution Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Responsible Department</span>
                  <span className="font-semibold text-slate-800">{item.resolutionEvidence.department_id}</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Reporting Officer</span>
                  <span className="font-semibold text-slate-800">{item.resolutionEvidence.officer_name}</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Work-Order Ref #</span>
                  <span className="font-mono font-bold text-slate-800">{item.resolutionEvidence.work_order_ref || 'WO-PENDING'}</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Action Description</span>
                <p className="text-slate-800 font-medium leading-relaxed">
                  {item.resolutionEvidence.action_taken || item.resolutionEvidence.notes}
                </p>
              </div>

              {/* Before & After Photo Comparison */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block mb-2 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Photographic Evidence Comparison (Before vs After)</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Before Photo */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div className="bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700 border-b border-slate-200 flex items-center justify-between">
                      <span>BEFORE: Citizen Incident Report</span>
                      <span className="text-[10px] text-slate-500 font-mono">Original</span>
                    </div>
                    <img
                      src={item.complaint.attachments?.[0]?.url || 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=400&q=80'}
                      alt="Before Repair"
                      onClick={() => setSelectedPhotoPreview(item.complaint.attachments?.[0]?.url || 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=400&q=80')}
                      className="h-44 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                    />
                  </div>

                  {/* After Photo */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div className="bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800 border-b border-emerald-200 flex items-center justify-between">
                      <span>AFTER: Department Remediation</span>
                      <span className="text-[10px] text-emerald-700 font-mono">Restored</span>
                    </div>
                    <img
                      src={item.resolutionEvidence.photo_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'}
                      alt="After Repair"
                      onClick={() => setSelectedPhotoPreview(item.resolutionEvidence?.photo_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80')}
                      className="h-44 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                    />
                  </div>
                </div>
              </div>

              {/* Reviewer Stamp if Verified */}
              {item.resolutionEvidence.status === 'verified' && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1 text-emerald-950">
                  <div className="flex items-center justify-between font-bold text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Certified Verified by Authorized Reviewer</span>
                    </span>
                    <span className="font-mono text-[10px] text-emerald-700">
                      {item.resolutionEvidence.reviewed_at ? new Date(item.resolutionEvidence.reviewed_at).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-[11px]">
                    <strong>Reviewer:</strong> {item.resolutionEvidence.reviewed_by} &bull; <strong>Note:</strong> "{item.resolutionEvidence.verification_note}"
                  </p>
                  {item.resolutionEvidence.exception_documented && (
                    <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px]">
                      <strong>Policy Exception Documented:</strong> {item.resolutionEvidence.exception_reason}
                    </div>
                  )}
                </div>
              )}

              {/* Rejection Stamp if Rejected */}
              {item.resolutionEvidence.status === 'rejected' && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1 text-rose-950">
                  <div className="flex items-center justify-between font-bold text-rose-900">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Resolution Rejected by Reviewer</span>
                    </span>
                    <span className="font-mono text-[10px] text-rose-700">
                      {item.resolutionEvidence.reviewed_at ? new Date(item.resolutionEvidence.reviewed_at).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-[11px]">
                    <strong>Reviewer:</strong> {item.resolutionEvidence.reviewed_by} &bull; <strong>Defect persisted:</strong> "{item.resolutionEvidence.rejection_reason}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl space-y-2">
              <Wrench className="w-7 h-7 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600">No resolution evidence recorded yet.</p>
              <p className="max-w-md mx-auto text-slate-400">
                Authorized municipal crews can submit repair notes, work order references, and after-repair inspection photographs using the button above.
              </p>
            </div>
          )}

          {/* Department Resolution Modal */}
          {isResolutionModalOpen && (
            <div className="fixed inset-0 z-[4000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <form
                onSubmit={handleResolutionSubmit}
                className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs animate-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-indigo-600" />
                    <span>Department Resolution Evidence Submission</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsResolutionModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Submitting Officer / Field Lead</label>
                  <input
                    type="text"
                    value={resolutionOfficer}
                    onChange={(e) => setResolutionOfficer(e.target.value)}
                    placeholder="e.g. Eng. Vikram Sethi - Crew Lead"
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Department</label>
                    <select
                      value={resolutionDept}
                      onChange={(e) => setResolutionDept(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl"
                    >
                      <option value="dept_water">Water Department</option>
                      <option value="dept_roads">Roads Department</option>
                      <option value="dept_sanitation">Sanitation Department</option>
                      <option value="dept_electricity">Electrical & Lighting</option>
                      <option value="dept_health">Public Health</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Work-Order / Reference #</label>
                    <input
                      type="text"
                      value={resolutionWorkOrder}
                      onChange={(e) => setResolutionWorkOrder(e.target.value)}
                      placeholder="e.g. WO-9041"
                      className="w-full p-2.5 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Detailed Action Taken</label>
                  <textarea
                    value={resolutionActionTaken}
                    onChange={(e) => setResolutionActionTaken(e.target.value)}
                    placeholder="Describe specific repair steps taken, parts replaced, and site cleanup details..."
                    rows={3}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">After-Repair Photo URL</label>
                  <input
                    type="text"
                    value={resolutionPhoto || ''}
                    onChange={(e) => setResolutionPhoto(e.target.value)}
                    placeholder="https://... photo URL"
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                  <strong>Notice:</strong> Submitting will transition the case to <span className="font-bold">Verification Pending</span>. It will not be marked Verified Resolved until an authorized municipal reviewer certifies the work.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResolutionModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm"
                  >
                    Submit Evidence & Request Verification
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reviewer Verification Approval Modal */}
          {isVerifyModalOpen && (
            <div className="fixed inset-0 z-[4000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <form
                onSubmit={handleVerifyApproval}
                className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs animate-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-extrabold text-sm text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Certify Verified Resolution</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsVerifyModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Reviewer Verification Note</label>
                  <textarea
                    value={verifyNote}
                    onChange={(e) => setVerifyNote(e.target.value)}
                    placeholder="Enter observation notes confirming defect resolved..."
                    rows={3}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                {/* Evidence Check / Exception Enforcement */}
                {!item.resolutionEvidence?.photo_url && !item.resolutionEvidence?.work_order_ref ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-[11px] text-amber-900">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Photographic Evidence Missing</span>
                    </div>
                    <p>Municipal policy prevents false resolution verification without physical evidence unless an authorized policy exception is documented.</p>
                    <label className="flex items-center gap-2 font-bold cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={allowException}
                        onChange={(e) => setAllowException(e.target.checked)}
                        className="rounded text-amber-600"
                      />
                      <span>Document Policy Exception (Emergency / Verbal Certification)</span>
                    </label>
                    {allowException && (
                      <textarea
                        value={exceptionReason}
                        onChange={(e) => setExceptionReason(e.target.value)}
                        placeholder="Mandatory exception justification..."
                        rows={2}
                        required
                        className="w-full p-2 bg-white border border-amber-300 rounded-lg text-slate-800"
                      />
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Evidence verified: Photographic comparison and work-order data present.</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsVerifyModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
                  >
                    Approve as Verified Resolved
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reviewer Rejection Modal */}
          {isRejectResolutionModalOpen && (
            <div className="fixed inset-0 z-[4000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <form
                onSubmit={handleRejectResolution}
                className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs animate-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-extrabold text-sm text-rose-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Reject Resolution (Further Action Required)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsRejectResolutionModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mandatory Rejection Reason</label>
                  <textarea
                    value={rejectionReasonText}
                    onChange={(e) => setRejectionReasonText(e.target.value)}
                    placeholder="Specify why the submitted resolution is incomplete (e.g. 'Leak remains active upon inspector visit; paving not completed')..."
                    rows={4}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRejectResolutionModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm"
                  >
                    Reject & Demand Further Action
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Reopen Modal */}
          {isReopenModalOpen && (
            <div className="fixed inset-0 z-[4000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <form
                onSubmit={handleReopenComplaint}
                className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-xs animate-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="font-extrabold text-sm text-orange-950 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-orange-600" />
                    <span>Reopen Municipal Grievance</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsReopenModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mandatory Reason for Reopening</label>
                  <textarea
                    value={reopenReasonText}
                    onChange={(e) => setReopenReasonText(e.target.value)}
                    placeholder="Provide grounds for reopening (e.g. 'Citizen reports defect recurred 24h after closure; valve seal leaking again')..."
                    rows={4}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <p className="text-[11px] text-slate-500 italic">
                  Note: Reopening preserves all historical resolution submissions, inspector certifications, and audit events.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReopenModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-sm"
                  >
                    Confirm Reopen
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Genuine Persistent Review & Audit History Timeline */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Chronological Activity & Audit Log
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every review, edit, override, reassignment, and status transition is recorded in the audit trail.
              </p>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {complaintAuditEvents.length} Recorded Events
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {complaintAuditEvents.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                <span>No audit events recorded for this complaint yet. Review decisions will be appended automatically.</span>
              </div>
            ) : (
              complaintAuditEvents.map((ev, idx) => (
                <div key={ev.id || idx} className="py-3 flex items-start gap-3 text-xs">
                  <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">{ev.note || ev.entity}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(ev.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Actor: <span className="font-semibold text-slate-700">{ev.actor}</span> &bull; Entity: {ev.entity}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 leading-relaxed italic">
            In-Memory Prototype Persistence Notice: In offline demo mode without Supabase Postgres credentials, audit events are preserved in local storage and will reset upon browser cache clearing or server restart.
          </div>
        </div>
      )}

      {/* Review Action Controls Row */}
      <ReviewActionControls complaintView={item} />
    </div>
  );
};

export default ComplaintDetail;
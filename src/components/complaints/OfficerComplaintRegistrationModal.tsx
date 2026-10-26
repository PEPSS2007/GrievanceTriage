'use client';

import React, { useState } from 'react';
import { useTriage } from '../../context/TriageContext';
import {
  X,
  PlusCircle,
  FileText,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  Building,
  Hash,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { IntakeChannel, PriorityType, ComplaintAttachment } from '../../types';

interface OfficerComplaintRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INTAKE_CHANNELS: { value: IntakeChannel; label: string; icon: string }[] = [
  { value: 'Phone', label: 'Phone Call / Helpline', icon: '📞' },
  { value: 'Email', label: 'Official Email', icon: '✉️' },
  { value: 'In Person', label: 'In Person / Walk-in', icon: '🚶' },
  { value: 'Existing Government Portal', label: 'Gov Portal / CRM Sync', icon: '🏛️' },
  { value: 'Other', label: 'Other Channel', icon: '📋' }
];

const MUNICIPAL_CATEGORIES = [
  'Water Supply & Sewage',
  'Roads & Potholes',
  'Garbage & Sanitation',
  'Street Lighting',
  'Electrical Hazards',
  'Public Health & Safety',
  'Drainage & Waterlogging',
  'Encroachment & Traffic',
  'Other / Uncategorized'
];

export const OfficerComplaintRegistrationModal: React.FC<OfficerComplaintRegistrationModalProps> = ({
  isOpen,
  onClose
}) => {
  const { registerOfficerComplaint } = useTriage();

  // Required Fields
  const [text, setText] = useState('');
  const [sourceChannel, setSourceChannel] = useState<IntakeChannel>('Phone');
  const [address, setAddress] = useState('');
  const [ward, setWard] = useState('Ward 4');
  const [municipality, setMunicipality] = useState('Metroville Municipal Corporation');
  const [district, setDistrict] = useState('Central District');
  const [dateTimeReceived, setDateTimeReceived] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [category, setCategory] = useState('');

  // Coordinates
  const [lat, setLat] = useState<string>('28.6139');
  const [lng, setLng] = useState<string>('77.2090');

  // Optional Collapsible Sections
  const [showReportingPerson, setShowReportingPerson] = useState(false);
  const [reportingName, setReportingName] = useState('');
  const [reportingContact, setReportingContact] = useState('');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sourceReference, setSourceReference] = useState('');
  const [receivingOfficer, setReceivingOfficer] = useState('Officer Sarah (Municipal Admin)');
  const [officerNotes, setOfficerNotes] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ id: string; shortId?: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation
    if (!text.trim() || text.trim().length < 5) {
      setErrorMsg('Please enter a complaint description (at least 5 characters).');
      return;
    }
    if (!address.trim()) {
      setErrorMsg('Please specify the incident location / street address.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const fullLocation = `${address.trim()}, ${ward}, ${municipality}`;
      const attachments: ComplaintAttachment[] = attachmentName.trim()
        ? [
            {
              id: `att-${Date.now()}`,
              name: attachmentName.trim(),
              url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?auto=format&fit=crop&w=400&q=80',
              size: 204800,
              type: 'image/jpeg',
              uploaded_at: new Date().toISOString()
            }
          ]
        : [];

      const created = await registerOfficerComplaint({
        text: text.trim(),
        location: fullLocation,
        ward,
        lat: parseFloat(lat) || undefined,
        lng: parseFloat(lng) || undefined,
        source: sourceChannel,
        category: category || undefined,
        date_received: dateTimeReceived ? new Date(dateTimeReceived).toISOString() : new Date().toISOString(),
        reporting_person: reportingName.trim() || reportingContact.trim()
          ? {
              name: reportingName.trim() || undefined,
              contact: reportingContact.trim() || undefined
            }
          : undefined,
        source_reference: sourceReference.trim() || undefined,
        receiving_officer: receivingOfficer.trim() || 'Officer Sarah (Municipal Admin)',
        officer_notes: officerNotes.trim() || undefined,
        attachments
      });

      setSuccessInfo({ id: created.id, shortId: created.shortId });
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to register officer complaint. Please retry.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
              <PlusCircle className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Officer Complaint Registration</h2>
              <p className="text-xs text-blue-100">
                Official Municipal Intake • Authenticated Officer Action
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner */}
        {successInfo && (
          <div className="m-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center space-x-3 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 animate-bounce" />
            <div>
              <p className="font-semibold text-sm">Complaint Registered Successfully!</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Generated ID: <span className="font-mono font-bold">{successInfo.id}</span>. AI triage pipeline executed and logged to municipal audit ledger. Opening detail page...
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center space-x-2 text-rose-800 dark:text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Intake Channel Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Intake Channel <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INTAKE_CHANNELS.map(ch => (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => setSourceChannel(ch.value)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                    sourceChannel === ch.value
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-base">{ch.icon}</span>
                  <span className="truncate">{ch.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Complaint Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Complaint Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Enter exact verbatim details received from the citizen or channel (e.g., 'Severe water pipe rupture near school gate on 5th cross, water flooding into basements')..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          {/* Location & Ward Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Incident Address / Street <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. 42 MG Road, near Bus Stand"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Ward Jurisdiction</span>
              </label>
              <select
                value={ward}
                onChange={e => setWard(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {['Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5', 'Ward 6', 'Ward 7', 'Ward 8', 'Ward 9', 'Ward 10'].map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Received & Preliminary Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Date & Time Received</span>
              </label>
              <input
                type="datetime-local"
                value={dateTimeReceived}
                onChange={e => setDateTimeReceived(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Preliminary Category (Optional)
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- Let AI Infer Category --</option>
                {MUNICIPAL_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Collapsible: Reporting Person Details */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowReportingPerson(!showReportingPerson)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Reporting Citizen Details (Optional / If lawfully collected)</span>
              </div>
              {showReportingPerson ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showReportingPerson && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Citizen Name
                  </label>
                  <input
                    type="text"
                    value={reportingName}
                    onChange={e => setReportingName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>Contact Phone / Email</span>
                  </label>
                  <input
                    type="text"
                    value={reportingContact}
                    onChange={e => setReportingContact(e.target.value)}
                    placeholder="e.g. +91 9876543210 or email"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Collapsible: Advanced & Reference Details */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Hash className="w-3.5 h-3.5 text-slate-500" />
                <span>Reference Number, Evidence & Officer Notes</span>
              </div>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showAdvanced && (
              <div className="p-4 space-y-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Channel Reference # (Ticket / Call ID)
                    </label>
                    <input
                      type="text"
                      value={sourceReference}
                      onChange={e => setSourceReference(e.target.value)}
                      placeholder="e.g. HELPLINE-CALL-8841"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Receiving Officer
                    </label>
                    <input
                      type="text"
                      value={receivingOfficer}
                      onChange={e => setReceivingOfficer(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Latitude Coordinates
                    </label>
                    <input
                      type="text"
                      value={lat}
                      onChange={e => setLat(e.target.value)}
                      placeholder="28.6139"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Longitude Coordinates
                    </label>
                    <input
                      type="text"
                      value={lng}
                      onChange={e => setLng(e.target.value)}
                      placeholder="77.2090"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center space-x-1">
                    <Paperclip className="w-3 h-3 text-slate-400" />
                    <span>Evidence Document / Photo Label</span>
                  </label>
                  <input
                    type="text"
                    value={attachmentName}
                    onChange={e => setAttachmentName(e.target.value)}
                    placeholder="e.g. site_inspection_photo_01.jpg"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Internal Officer Notes
                  </label>
                  <textarea
                    rows={2}
                    value={officerNotes}
                    onChange={e => setOfficerNotes(e.target.value)}
                    placeholder="Internal officer observation, priority hint, or follow-up instructions..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              <span>Generates real database record with AI triage analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !text.trim() || !address.trim()}
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:active:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering & Triaging...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Register Complaint & Run AI Triage</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

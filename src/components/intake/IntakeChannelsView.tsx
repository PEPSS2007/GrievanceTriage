'use client';

import React, { useState } from 'react';
import { useTriage } from '../../context/TriageContext';
import {
  Inbox,
  FileSpreadsheet,
  Webhook,
  Globe,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Send,
  Upload,
  AlertTriangle,
  FileText,
  Terminal,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { PriorityType, IntakeChannel } from '../../types';

export const IntakeChannelsView: React.FC = () => {
  const { mergedComplaints, submitComplaint, openComplaintDetail } = useTriage();

  // Active Tab: 'csv' | 'webhook' | 'overview'
  const [activeTab, setActiveTab] = useState<'csv' | 'webhook' | 'overview'>('csv');

  // CSV State
  const [csvRawText, setCsvRawText] = useState<string>(
    `text,location,category,priority
"Deep pothole on 4th Ave near bus stop causing traffic slowdown","Ward 3, 4th Ave","Roads & Potholes","Medium"
"Raw sewage overflowing from main drain onto pavement","Ward 2, Oak St","Water Supply & Sewage","High"
"Streetlight flickering and broken outside primary school","Ward 5, School Rd","Street Lighting","High"
"Illegal trash dumping behind commercial market block","Ward 7, Market Rd","Garbage & Sanitation","Medium"
"","Ward 1","Roads & Footpaths","Low"`
  );
  const [parsedRows, setParsedRows] = useState<
    Array<{
      id: number;
      text: string;
      location: string;
      category: string;
      priority: PriorityType;
      isValid: boolean;
      error?: string;
    }>
  >([]);
  const [hasParsed, setHasParsed] = useState<boolean>(false);
  const [importReport, setImportReport] = useState<{
    successCount: number;
    skippedDuplicates: number;
    rejectedCount: number;
  } | null>(null);

  // Webhook Tester State
  const [webhookPayload, setWebhookPayload] = useState<string>(
    JSON.stringify(
      {
        external_source: 'CPGRAMS Portal (Integration Sandbox)',
        external_reference_id: `CPGRAMS-DEMO-${Date.now().toString().slice(-4)}`,
        text: 'Citizen grievance transferred from state grievance cell: Underground water pipe fracture causing flooding on residential access ramp.',
        location: 'Ward 4, Pine Street',
        category_hint: 'Water Supply & Sewage',
        contact_phone: '+1-555-0199',
      },
      null,
      2
    )
  );
  const [webhookResponse, setWebhookResponse] = useState<any>(null);
  const [isSubmittingWebhook, setIsSubmittingWebhook] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);

  // Parse CSV
  const handleParseCsv = () => {
    const lines = csvRawText.trim().split('\n');
    if (lines.length <= 1) {
      alert('CSV must contain a header and at least one data row.');
      return;
    }

    const header = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map((line, idx) => {
      // Regex CSV parse to handle quoted values
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      const cleanCols = matches.map((m) => m.trim().replace(/^"|"$/g, ''));

      const text = cleanCols[0] || '';
      const location = cleanCols[1] || '';
      const category = cleanCols[2] || 'General / Other';
      const rawPriority = cleanCols[3] || 'Medium';

      let priority: PriorityType = 'Medium';
      if (['Critical', 'High', 'Medium', 'Low'].includes(rawPriority)) {
        priority = rawPriority as PriorityType;
      }

      let isValid = true;
      let error: string | undefined = undefined;

      if (!text || text.trim().length < 5) {
        isValid = false;
        error = 'Text is missing or shorter than 5 characters.';
      } else if (!location || location.trim().length < 2) {
        isValid = false;
        error = 'Location is missing.';
      }

      // Check if duplicate of existing complaints
      const isDup = mergedComplaints.some(
        (c) => c.complaint.text.toLowerCase().trim() === text.toLowerCase().trim()
      );
      if (isDup) {
        isValid = false;
        error = 'Duplicate: Identical text already exists in grievance repository.';
      }

      return {
        id: idx + 1,
        text,
        location,
        category,
        priority,
        isValid,
        error,
      };
    });

    setParsedRows(rows);
    setHasParsed(true);
    setImportReport(null);
  };

  // Execute CSV Import
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('No valid rows available to import.');
      return;
    }

    let successCount = 0;
    for (const r of validRows) {
      try {
        await submitComplaint({
          title: `${r.category} import`,
          text: r.text,
          location: r.location,
          category: r.category,
          source: 'CSV Import',
        });
        successCount++;
      } catch (e) {
        console.error('Import error on row:', r, e);
      }
    }

    const duplicates = parsedRows.filter((r) => r.error?.includes('Duplicate')).length;
    const rejected = parsedRows.filter((r) => !r.isValid && !r.error?.includes('Duplicate')).length;

    setImportReport({
      successCount,
      skippedDuplicates: duplicates,
      rejectedCount: rejected,
    });
  };

  // Test Webhook
  const handleSendTestWebhook = async () => {
    setIsSubmittingWebhook(true);
    setWebhookResponse(null);

    try {
      const parsedBody = JSON.parse(webhookPayload);
      const res = await fetch('/api/intake/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer gt_webhook_demo_token_2026',
        },
        body: JSON.stringify(parsedBody),
      });

      const data = await res.json();
      setWebhookResponse({
        status: res.status,
        statusText: res.statusText,
        data,
      });
    } catch (err: any) {
      setWebhookResponse({
        status: 500,
        statusText: 'Client Error',
        data: { error: err.message },
      });
    } finally {
      setIsSubmittingWebhook(false);
    }
  };

  const curlSnippet = `curl -X POST http://localhost:3000/api/intake/webhook \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer gt_webhook_demo_token_2026" \\
  -d '${webhookPayload.replace(/\n/g, ' ')}'`;

  const copyCurlToClipboard = () => {
    navigator.clipboard.writeText(curlSnippet);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2500);
  };

  // Intake Channel Distribution from real stored records
  const channelCounts = mergedComplaints.reduce(
    (acc, item) => {
      const src = item.complaint.source || 'Web Portal';
      acc[src] = (acc[src] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Inbox className="h-6 w-6 text-blue-600" />
            <span>Complaint Intake & Ingestion Hub</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure citizen web portals, authorized bulk CSV imports, and integration-ready API webhooks.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'csv'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>CSV Bulk Import</span>
          </button>
          <button
            onClick={() => setActiveTab('webhook')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'webhook'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Webhook className="h-3.5 w-3.5" />
            <span>External Webhook & API</span>
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Channel Distribution</span>
          </button>
        </div>
      </div>

      {/* Tab 1: CSV Bulk Import Tool */}
      {activeTab === 'csv' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Authorized Municipal CSV Ingestion
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paste raw CSV text or upload a spreadsheet file. Columns required: text, location, category, priority.
                </p>
              </div>
              <button
                onClick={handleParseCsv}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <FileText className="h-4 w-4" />
                <span>Parse & Validate Records</span>
              </button>
            </div>

            <textarea
              value={csvRawText}
              onChange={(e) => setCsvRawText(e.target.value)}
              rows={6}
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              placeholder="Paste CSV contents here..."
            />

            {/* Validation & Import Summary Notice */}
            {importReport && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>
                    Import Complete: {importReport.successCount} grievances ingested successfully into database.
                    {importReport.skippedDuplicates > 0 && ` (${importReport.skippedDuplicates} duplicates safely skipped).`}
                    {importReport.rejectedCount > 0 && ` (${importReport.rejectedCount} malformed rows rejected).`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Parsed Preview Table */}
          {hasParsed && (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Pre-Import Validation Preview ({parsedRows.length} Rows)
                  </h4>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {parsedRows.filter((r) => r.isValid).length} Valid
                  </span>
                  {parsedRows.filter((r) => !r.isValid).length > 0 && (
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      {parsedRows.filter((r) => !r.isValid).length} Rejected
                    </span>
                  )}
                </div>

                <button
                  onClick={handleExecuteImport}
                  disabled={parsedRows.filter((r) => r.isValid).length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Upload className="h-4 w-4" />
                  <span>Commit Import to Repository</span>
                </button>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="p-3">#</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Complaint Text</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Validation Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r) => (
                      <tr
                        key={r.id}
                        className={r.isValid ? 'hover:bg-slate-50/80' : 'bg-rose-50/30'}
                      >
                        <td className="p-3 font-mono font-semibold text-slate-400">{r.id}</td>
                        <td className="p-3">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px]">
                              <AlertCircle className="h-3.5 w-3.5" />
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-medium text-slate-800 max-w-xs truncate">
                          {r.text || '<Empty>'}
                        </td>
                        <td className="p-3 text-slate-600">{r.location || '<Missing>'}</td>
                        <td className="p-3 text-slate-600">{r.category}</td>
                        <td className="p-3 font-bold text-slate-700">{r.priority}</td>
                        <td className="p-3 text-[11px] text-slate-500">
                          {r.error ? (
                            <span className="text-rose-600 font-medium">{r.error}</span>
                          ) : (
                            <span className="text-emerald-600">Schema compliant & deduped</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: External Webhook & Integration Gateway */}
      {activeTab === 'webhook' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Integration API & External Webhook Gateway
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  POST /api/intake/webhook
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Authorized endpoint for external systems (state grievance portals, WhatsApp chatbots, automated IoT sensors).
                Includes automatic PII redaction, duplicate suppression, and structured AI triage.
              </p>
            </div>

            {/* Curl Command Snippet */}
            <div className="p-3 bg-slate-900 rounded-xl text-slate-200 font-mono text-xs relative overflow-x-auto">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 font-bold text-slate-300">
                  <Terminal className="h-3.5 w-3.5" />
                  cURL Request Specification
                </span>
                <button
                  onClick={copyCurlToClipboard}
                  className="hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copiedCurl ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-emerald-400 select-all whitespace-pre-wrap">{curlSnippet}</pre>
            </div>

            {/* Live Interactive Payload Tester */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Interactive Request Body (JSON)
                </label>
                <textarea
                  value={webhookPayload}
                  onChange={(e) => setWebhookPayload(e.target.value)}
                  rows={9}
                  className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendTestWebhook}
                  disabled={isSubmittingWebhook}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmittingWebhook ? 'Ingesting Grievance...' : 'Dispatch Live Webhook Ingestion'}</span>
                </button>
              </div>

              {/* Response Inspector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Server Response Inspector
                </label>
                <div className="h-[210px] p-3 font-mono text-xs bg-slate-900 text-slate-200 rounded-lg overflow-y-auto border border-slate-800">
                  {webhookResponse ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-800">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            webhookResponse.status === 201
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          HTTP {webhookResponse.status} {webhookResponse.statusText}
                        </span>
                      </div>
                      <pre className="text-slate-300 whitespace-pre-wrap">
                        {JSON.stringify(webhookResponse.data, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 italic">
                      Click Dispatch Live Webhook to test ingestion response
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Planned Government Integration Notice */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold mb-0.5">Government Integration Roadmap Notice:</strong>
                <p className="leading-relaxed">
                  Direct links to CPGRAMS, state portals, and WhatsApp municipal numbers operate in <strong>Sandbox Mode</strong>.
                  Production authorization requires bilateral municipal API credential signing, digital token generation, and compliance with national cybersecurity standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Intake Channel Distribution (Data-Driven) */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(channelCounts).map(([channel, count]) => (
              <div
                key={channel}
                className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs space-y-1"
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {channel}
                </div>
                <div className="text-2xl font-extrabold text-slate-900">{count}</div>
                <div className="text-[11px] text-slate-500">
                  {((count / mergedComplaints.length) * 100).toFixed(1)}% of total intake
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Channel Reliability & Traceability Architecture
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every complaint record stores its authentic intake channel metadata. GrievanceTriage does not fabricate government portal origin; each record explicitly logs whether it entered through the Citizen Web Portal, Officer Manual Desk, Bulk CSV Ingestion, or Integration Webhook.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntakeChannelsView;

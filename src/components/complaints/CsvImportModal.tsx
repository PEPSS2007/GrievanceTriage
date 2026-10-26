'use client';

import React, { useState, useRef } from 'react';
import { useTriage } from '../../context/TriageContext';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Loader2,
  Check,
  ChevronRight,
  Database,
  ArrowRight
} from 'lucide-react';
import { PriorityType } from '../../types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  index: number;
  text: string;
  location: string;
  ward?: string;
  category?: string;
  priority?: PriorityType;
  source_reference?: string;
  isValid: boolean;
  errors: string[];
  isLikelyDuplicate?: boolean;
  duplicateReason?: string;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose
}) => {
  const { complaints, importCsvComplaints } = useTriage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{
    imported: number;
    duplicates: number;
    failed: number;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError('Please upload a valid .csv file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setParseError('File size exceeds the 5MB limit.');
      return;
    }

    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');
    setParseError(null);
    setImportSummary(null);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        parseCsv(content);
      } catch (err: any) {
        setParseError(`Failed to parse CSV: ${err.message}`);
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setParseError('Failed to read the selected file.');
      setIsParsing(false);
    };
    reader.readAsText(file);
  };

  const parseCsv = (csvText: string) => {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      setParseError('CSV file must contain a header row and at least one data row.');
      setIsParsing(false);
      return;
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
    
    // Map column indices
    const textIdx = headers.findIndex(h => h.includes('text') || h.includes('desc') || h.includes('complaint') || h.includes('issue'));
    const locIdx = headers.findIndex(h => h.includes('loc') || h.includes('address') || h.includes('place') || h.includes('street'));
    const wardIdx = headers.findIndex(h => h.includes('ward') || h.includes('zone'));
    const catIdx = headers.findIndex(h => h.includes('cat') || h.includes('type') || h.includes('department'));
    const prioIdx = headers.findIndex(h => h.includes('prior') || h.includes('severity') || h.includes('urgency'));
    const refIdx = headers.findIndex(h => h.includes('ref') || h.includes('ticket') || h.includes('id') || h.includes('source_id'));

    if (textIdx === -1) {
      setParseError('Required column "text" or "description" was not found in CSV header.');
      setIsParsing(false);
      return;
    }

    if (locIdx === -1) {
      setParseError('Required column "location" or "address" was not found in CSV header.');
      setIsParsing(false);
      return;
    }

    const existingRefs = new Set(complaints.map(c => c.source_reference?.toLowerCase()).filter(Boolean));
    const seenBatchRefs = new Set<string>();

    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Split preserving quotes where possible
      const rawLine = lines[i];
      const cols = rawLine.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      
      const rowText = cols[textIdx] || '';
      const rowLoc = cols[locIdx] || '';
      const rowWard = wardIdx !== -1 ? cols[wardIdx] : undefined;
      const rowCat = catIdx !== -1 ? cols[catIdx] : undefined;
      const rawPrio = prioIdx !== -1 ? cols[prioIdx] : undefined;
      const rowRef = refIdx !== -1 ? cols[refIdx] : undefined;

      const errors: string[] = [];
      if (!rowText || rowText.length < 5) {
        errors.push('Text must be at least 5 characters');
      }
      if (!rowLoc || rowLoc.length < 2) {
        errors.push('Location is required');
      }

      let priority: PriorityType | undefined;
      if (rawPrio) {
        const p = rawPrio.toLowerCase();
        if (p.includes('urg') || p.includes('crit')) priority = 'Critical';
        else if (p.includes('high')) priority = 'High';
        else if (p.includes('med')) priority = 'Medium';
        else if (p.includes('low')) priority = 'Low';
      }

      // Duplicate check
      let isLikelyDuplicate = false;
      let duplicateReason: string | undefined;

      if (rowRef) {
        const lowerRef = rowRef.toLowerCase();
        if (existingRefs.has(lowerRef)) {
          isLikelyDuplicate = true;
          duplicateReason = `Ref "${rowRef}" already exists in municipal system`;
        } else if (seenBatchRefs.has(lowerRef)) {
          isLikelyDuplicate = true;
          duplicateReason = `Duplicate ref "${rowRef}" inside this CSV batch`;
        } else {
          seenBatchRefs.add(lowerRef);
        }
      }

      rows.push({
        index: i,
        text: rowText,
        location: rowLoc,
        ward: rowWard,
        category: rowCat,
        priority,
        source_reference: rowRef,
        isValid: errors.length === 0,
        errors,
        isLikelyDuplicate,
        duplicateReason
      });
    }

    setParsedRows(rows);
    setIsParsing(false);
  };

  const validRows = parsedRows.filter(r => r.isValid && !r.isLikelyDuplicate);
  const duplicateRows = parsedRows.filter(r => r.isLikelyDuplicate);
  const invalidRows = parsedRows.filter(r => !r.isValid);

  const handleConfirmImport = async () => {
    if (validRows.length === 0 || isCommitting) return;

    setIsCommitting(true);
    setParseError(null);

    try {
      const rowsToImport = validRows.map(r => ({
        text: r.text,
        location: r.location,
        ward: r.ward,
        category: r.category,
        priority: r.priority,
        source_reference: r.source_reference
      }));

      const res = await importCsvComplaints(rowsToImport, 'Officer Sarah (Municipal Admin)');
      setImportSummary({
        imported: res.successCount,
        duplicates: res.duplicateCount + duplicateRows.length,
        failed: res.failedCount + invalidRows.length,
        message: res.message
      });
      setIsCommitting(false);
    } catch (err: any) {
      setParseError(err.message || 'Import failed. Please check network/backend.');
      setIsCommitting(false);
    }
  };

  const loadSampleCsv = () => {
    const sample = `description,address,ward,category,reference\n"Water main rupture flooding market square","45 Commercial Street, Ward 3","Ward 3","Water Supply & Sewage","PHONE-SYNC-9011"\n"Exposed street electrical wire after thunderstorm","72 Nehru Marg near School Gate","Ward 4","Electrical Hazards","PHONE-SYNC-9012"\n"Garbage pile uncollected for 5 days overflowing into street","Block B Residential Park","Ward 2","Garbage & Sanitation","PHONE-SYNC-9013"\n"Broken streetlight causing accidents at night","Ward 1 Crossroad 4","Ward 1","Street Lighting","PHONE-SYNC-9014"`;
    setFileName('sample_officer_complaints.csv');
    setFileSize('1.2 KB');
    setParseError(null);
    setImportSummary(null);
    setIsParsing(true);
    setTimeout(() => {
      parseCsv(sample);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-800 via-indigo-900 to-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-md">
              <FileSpreadsheet className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Import Complaints from CSV</h2>
              <p className="text-xs text-slate-300">
                Batch Grievance Ingestion • Validation, Duplicate Detection & AI Triage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isCommitting}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Summary Banner after import */}
          {importSummary ? (
            <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-base text-emerald-900 dark:text-emerald-200">
                    CSV Batch Ingestion Completed!
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    {importSummary.message}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <span className="block text-xl font-bold text-emerald-600 dark:text-emerald-400">{importSummary.imported}</span>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Imported & Triaged</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
                  <span className="block text-xl font-bold text-amber-600 dark:text-amber-400">{importSummary.duplicates}</span>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Duplicates Skipped</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800">
                  <span className="block text-xl font-bold text-rose-600 dark:text-rose-400">{importSummary.failed}</span>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Invalid Rows</span>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
                >
                  Close & View in Inbox
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Upload Zone */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-500 transition-colors bg-slate-50/50 dark:bg-slate-800/40">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-full text-indigo-600 dark:text-indigo-400">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    {fileName ? `Selected: ${fileName} (${fileSize})` : 'Choose a CSV file or drag & drop'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md">
                    Required headers: <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">text</code>, <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">location</code>. Optional: <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">ward</code>, <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">category</code>, <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">reference</code>
                  </p>
                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                    >
                      Browse Computer
                    </button>
                    <button
                      type="button"
                      onClick={loadSampleCsv}
                      className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all"
                    >
                      Load Sample Demo CSV
                    </button>
                  </div>
                </div>
              </div>

              {/* Parsing status / error */}
              {isParsing && (
                <div className="flex items-center justify-center space-x-2 text-indigo-600 text-xs py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Parsing headers and validating row schemas...</span>
                </div>
              )}

              {parseError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center space-x-2 text-rose-800 dark:text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Parsed Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Import Preview ({parsedRows.length} total rows)
                    </h4>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded font-semibold text-[11px]">
                        {validRows.length} Valid
                      </span>
                      {duplicateRows.length > 0 && (
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded font-semibold text-[11px]">
                          {duplicateRows.length} Duplicates
                        </span>
                      )}
                      {invalidRows.length > 0 && (
                        <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded font-semibold text-[11px]">
                          {invalidRows.length} Invalid
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 sticky top-0">
                        <tr>
                          <th className="p-2.5 w-12 font-semibold">Row</th>
                          <th className="p-2.5 font-semibold">Complaint Text</th>
                          <th className="p-2.5 font-semibold">Location</th>
                          <th className="p-2.5 font-semibold">Ward</th>
                          <th className="p-2.5 font-semibold">Ref #</th>
                          <th className="p-2.5 font-semibold">Validation Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parsedRows.map(row => (
                          <tr
                            key={row.index}
                            className={
                              !row.isValid
                                ? 'bg-rose-50/50 dark:bg-rose-950/20'
                                : row.isLikelyDuplicate
                                ? 'bg-amber-50/50 dark:bg-amber-950/20'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }
                          >
                            <td className="p-2.5 font-mono text-[11px] text-slate-500">#{row.index}</td>
                            <td className="p-2.5 max-w-xs truncate text-slate-900 dark:text-slate-100 font-medium">
                              {row.text}
                            </td>
                            <td className="p-2.5 text-slate-600 dark:text-slate-400 max-w-[140px] truncate">
                              {row.location}
                            </td>
                            <td className="p-2.5 text-slate-600 dark:text-slate-400">
                              {row.ward || '—'}
                            </td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-500">
                              {row.source_reference || '—'}
                            </td>
                            <td className="p-2.5">
                              {!row.isValid ? (
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 text-[10px] font-semibold">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>{row.errors.join(', ')}</span>
                                </span>
                              ) : row.isLikelyDuplicate ? (
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] font-semibold">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Duplicate: {row.duplicateReason}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] font-semibold">
                                  <Check className="w-3 h-3" />
                                  <span>Ready to Import</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-[11px] text-slate-500">
                      {validRows.length} complaint{validRows.length === 1 ? '' : 's'} will be created and processed with AI triage.
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isCommitting}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmImport}
                        disabled={validRows.length === 0 || isCommitting}
                        className="flex items-center space-x-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:active:scale-100"
                      >
                        {isCommitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Importing & Triaging Batch...</span>
                          </>
                        ) : (
                          <>
                            <Database className="w-4 h-4" />
                            <span>Confirm Import ({validRows.length} Records)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

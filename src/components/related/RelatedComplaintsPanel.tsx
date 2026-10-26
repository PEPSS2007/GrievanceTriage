'use client';

import React, { useMemo } from 'react';
import { useTriage } from '../../context/TriageContext';
import {
  Droplet,
  Check,
  X,
  Layers,
  MapPin,
  Sliders,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { calculateRuntimeSimilarity } from '../../lib/similarity';

export const RelatedComplaintsPanel: React.FC = () => {
  const {
    complaints,
    selectedComplaintId,
    incidentMembers,
    confirmIncidentMember,
    rejectIncidentMember,
    openComplaintDetail
  } = useTriage();

  const currentComplaint = complaints.find(
    c => c.id === selectedComplaintId || c.shortId === selectedComplaintId
  ) || complaints[0];

  // Calculate runtime TF-IDF similarity across the dataset
  const runtimeMatches = useMemo(() => {
    return calculateRuntimeSimilarity(currentComplaint, complaints);
  }, [currentComplaint, complaints]);

  // Top matches (up to 4 candidates to match Section 4)
  const displayedCandidates = runtimeMatches.slice(0, 4);

  // Highest similarity score for the slider
  const topScore = displayedCandidates[0]?.score || 0.87;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
      {/* Title & Heuristic Notice */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Related Complaints
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Potentially related complaints for <strong className="text-slate-800">{currentComplaint.shortId} ({currentComplaint.title || currentComplaint.location})</strong> (human confirmation required)
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Sparkles className="h-3.5 w-3.5 text-blue-500" />
          <span>Runtime TF-IDF Cosine Engine</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): List of Related Complaints */}
        <div className="lg:col-span-7 space-y-3">
          {displayedCandidates.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
              No strong similar complaints found above the 0.40 threshold for this record.
            </div>
          ) : (
            displayedCandidates.map(match => {
              const cand = match.complaint;
              const member = incidentMembers.find(m => m.complaint_id === cand.id || m.complaint_id === cand.shortId);
              const status = member?.relationship_status || 'suggested';

              return (
                <div
                  key={cand.id}
                  className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0 font-bold text-xs">
                      <Droplet className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openComplaintDetail(cand.id)}
                          className="font-mono text-xs font-bold text-blue-600 hover:underline"
                        >
                          {cand.shortId}
                        </button>
                        <span className="text-xs font-bold text-slate-900">
                          {cand.title || cand.text.substring(0, 36) + '...'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>{cand.location}</span>
                        <span>•</span>
                        <span className="font-mono font-bold text-blue-600">
                          {match.score.toFixed(2)}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          (Cosine: {match.rawCosine})
                        </span>
                        {status === 'confirmed' && (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                            ✓ Confirmed
                          </span>
                        )}
                        {status === 'rejected' && (
                          <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.2 rounded text-[10px]">
                            ✕ Unlinked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Confirm & Reject Buttons matching Reference */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => confirmIncidentMember('INC-WTR-401', cand.id)}
                      className={`px-3 py-1 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors ${
                        status === 'confirmed'
                          ? 'bg-emerald-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {status === 'confirmed' ? 'Confirmed' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => rejectIncidentMember('INC-WTR-401', cand.id)}
                      className={`px-3 py-1 border text-xs font-bold rounded-lg transition-colors ${
                        status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-white hover:bg-rose-50 text-rose-600 border-rose-300'
                      }`}
                    >
                      {status === 'rejected' ? 'Rejected' : 'Reject'}
                    </button>
                  </div>
                </div>
              );
            })
          )}

          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/60 text-[11px] text-blue-900 flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              <strong>Heuristic Note:</strong> TF-IDF cosine scores compute lexical overlap with spatial distance adjustments. Similarity is a candidate signal only; manual confirmation guarantees that complaints are not prematurely merged.
            </p>
          </div>
        </div>

        {/* Right Column (5 cols): Incident Cluster Card matching Reference */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Incident Cluster
              </h3>
              <span className="text-[10px] text-slate-400 font-semibold">
                Cluster #INC-WTR-401
              </span>
            </div>

            {/* Map Preview with Concentric Cluster Circles & Location Pins */}
            <div className="relative w-full h-44 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#eef2f6" />
                <line x1="0" y1="30" x2="300" y2="30" stroke="#cbd5e1" strokeWidth="5" />
                <line x1="0" y1="90" x2="300" y2="90" stroke="#ffffff" strokeWidth="8" />
                <line x1="0" y1="130" x2="300" y2="130" stroke="#cbd5e1" strokeWidth="4" />
                <line x1="60" y1="0" x2="60" y2="200" stroke="#cbd5e1" strokeWidth="5" />
                <line x1="150" y1="0" x2="150" y2="200" stroke="#ffffff" strokeWidth="8" />
                <line x1="240" y1="0" x2="240" y2="200" stroke="#cbd5e1" strokeWidth="4" />
              </svg>

              {/* Concentric Cluster Radar */}
              <div className="relative flex items-center justify-center">
                <div className="absolute h-32 w-32 rounded-full bg-blue-500/15 animate-pulse" />
                <div className="absolute h-24 w-24 rounded-full bg-blue-500/25" />
                <div className="absolute h-16 w-16 rounded-full bg-blue-500/35" />

                {/* Cluster Badge */}
                <span className="relative z-10 px-2.5 py-1 bg-blue-600 text-white font-bold text-[11px] rounded-full shadow-md">
                  {displayedCandidates.length} related complaints
                </span>

                {/* Floating location dots */}
                <span className="absolute top-2 left-6 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white" />
                <span className="absolute bottom-3 right-8 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white" />
                <span className="absolute top-4 right-6 h-2 w-2 rounded-full bg-rose-500 border-2 border-white" />
              </div>
            </div>

            {/* Similarity Score Slider Bar matching Reference */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-blue-600" />
                  Similarity Score
                </span>
                <span className="font-mono text-blue-600 font-extrabold">
                  {topScore.toFixed(2)}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${Math.round(topScore * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
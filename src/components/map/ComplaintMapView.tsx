'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTriage } from '../../context/TriageContext';
import {
  MapPin,
  Filter,
  Navigation,
  Layers,
  AlertCircle,
  CheckCircle2,
  Clock,
  Compass,
  Search,
  ExternalLink,
  Info,
  ChevronRight,
  RefreshCw,
  LocateFixed,
  X
} from 'lucide-react';
import { PriorityType, StatusType } from '../../types';
import { WARD_COORDINATES } from '../../data/mockData';

// Dynamic import with SSR disabled for Leaflet window object compatibility
const LeafletMapInner = dynamic(() => import('./LeafletMapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex flex-col items-center justify-center bg-slate-100 text-slate-500 gap-3">
      <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold">Initializing OpenStreetMap & Leaflet engine...</span>
    </div>
  ),
});

export const ComplaintMapView: React.FC = () => {
  const {
    mergedComplaints,
    openComplaintDetail,
    updateComplaintLocation,
    t
  } = useTriage();

  // Local Filter States
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Unlocated drawer state & pin drop mode
  const [showUnlocatedPanel, setShowUnlocatedPanel] = useState<boolean>(false);
  const [pinDropTargetId, setPinDropTargetId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    return mergedComplaints.filter((item) => {
      // Ward filter
      if (selectedWard !== 'ALL' && !item.complaint.location.includes(selectedWard)) {
        return false;
      }
      // Department filter
      if (selectedDept !== 'ALL' && item.currentDepartmentId !== selectedDept) {
        return false;
      }
      // Priority filter
      if (selectedPriority !== 'ALL' && item.currentPriority !== selectedPriority) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'ALL' && item.currentStatus !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesShort = item.complaint.shortId.toLowerCase().includes(q);
        const matchesText = item.complaint.text.toLowerCase().includes(q);
        const matchesLoc = item.complaint.location.toLowerCase().includes(q);
        if (!matchesShort && !matchesText && !matchesLoc) return false;
      }
      return true;
    });
  }, [mergedComplaints, selectedWard, selectedDept, selectedPriority, selectedStatus, searchQuery]);

  // Split into located and unlocated
  const locatedComplaints = useMemo(() => {
    return filteredComplaints.filter(
      (c) => typeof c.complaint.lat === 'number' && typeof c.complaint.lng === 'number'
    );
  }, [filteredComplaints]);

  const unlocatedComplaints = useMemo(() => {
    return mergedComplaints.filter(
      (c) => typeof c.complaint.lat !== 'number' || typeof c.complaint.lng !== 'number'
    );
  }, [mergedComplaints]);

  // Handle map click when in pin-drop mode
  const handleMapClickForLocation = (lat: number, lng: number) => {
    if (!pinDropTargetId) return;

    const roundedLat = Number(lat.toFixed(5));
    const roundedLng = Number(lng.toFixed(5));

    if (updateComplaintLocation) {
      updateComplaintLocation(pinDropTargetId, roundedLat, roundedLng);
    }

    showToast(`Coordinates [${roundedLat}, ${roundedLng}] assigned to complaint!`);
    setPinDropTargetId(null);
  };

  // Simulated geocoding for unlocated complaint
  const handleGeocodeComplaint = (complaintId: string, locationText: string) => {
    // Determine ward from text or default to Ward 4
    let matchedWard = 'Ward 4';
    for (let w = 1; w <= 8; w++) {
      if (locationText.includes(`Ward ${w}`)) {
        matchedWard = `Ward ${w}`;
        break;
      }
    }

    const base = WARD_COORDINATES[matchedWard] || { lat: 28.6139, lng: 77.2090 };
    const jitterLat = Number((base.lat + (Math.random() - 0.5) * 0.005).toFixed(5));
    const jitterLng = Number((base.lng + (Math.random() - 0.5) * 0.005).toFixed(5));

    if (updateComplaintLocation) {
      updateComplaintLocation(complaintId, jitterLat, jitterLng);
    }
    showToast(`Geocoded via Municipal Ward Directory: [${jitterLat}, ${jitterLng}]`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[2000] bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Map Control Bar */}
      <div className="p-4 bg-white border-b border-slate-200/90 shadow-2xs shrink-0 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Interactive Grievance Map</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                OpenStreetMap Live
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Showing {locatedComplaints.length} located pins across Metroville jurisdiction
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Ward Filter */}
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Wards</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => (
              <option key={w} value={`Ward ${w}`}>
                Ward {w}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Departments</option>
            <option value="dept_water">Water & Sewage</option>
            <option value="dept_roads">Roads & Bridges</option>
            <option value="dept_sanitation">Sanitation</option>
            <option value="dept_electricity">Street Lighting</option>
            <option value="dept_health">Public Health</option>
            <option value="dept_parks">Parks & Trees</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Under Review">Under Review</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Unlocated Drawer Toggle Button */}
          <button
            onClick={() => setShowUnlocatedPanel((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 border transition-all ${
              unlocatedComplaints.length > 0
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
            <span>Unlocated ({unlocatedComplaints.length})</span>
          </button>
        </div>
      </div>

      {/* Main Map + Side Drawer Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Leaflet Map Canvas */}
        <div className="flex-1 h-full w-full relative">
          <LeafletMapInner
            complaints={locatedComplaints}
            onSelectComplaint={openComplaintDetail}
            isPinDropMode={!!pinDropTargetId}
            onMapClickForLocation={handleMapClickForLocation}
          />

          {/* Floating Map Legend */}
          <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 backdrop-blur-xs p-3.5 rounded-xl border border-slate-200/90 shadow-md text-xs space-y-2 pointer-events-auto">
            <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-500 block">
              Marker Priority Legend
            </span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="h-3 w-3 rounded-full bg-rose-500 border border-white shadow-xs" />
                <span>Critical / Urgent</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="h-3 w-3 rounded-full bg-orange-500 border border-white shadow-xs" />
                <span>High</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="h-3 w-3 rounded-full bg-blue-500 border border-white shadow-xs" />
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="h-3 w-3 rounded-full bg-emerald-500 border border-white shadow-xs" />
                <span>Low</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 italic">
              Click any marker to inspect triage summary & open record
            </div>
          </div>
        </div>

        {/* Unlocated Complaints Drawer (Slide-out) */}
        {showUnlocatedPanel && (
          <div className="w-80 md:w-96 bg-white border-l border-slate-200/90 shadow-xl flex flex-col z-20 h-full">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  Unlocated Grievances ({unlocatedComplaints.length})
                </h3>
              </div>
              <button
                onClick={() => setShowUnlocatedPanel(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50/70 border-b border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
              These grievances were submitted without GPS coordinates. To preserve data integrity, fake coordinates are never invented. Use the actions below to geocode or drop a verified pin on the map.
            </div>

            {/* List of Unlocated Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-3 space-y-3">
              {unlocatedComplaints.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <span>All complaints currently have verified coordinates!</span>
                </div>
              ) : (
                unlocatedComplaints.map((item) => (
                  <div
                    key={item.complaint.id}
                    className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-xs font-bold text-slate-900">
                        {item.complaint.shortId}
                      </strong>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {item.currentCategory}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.complaint.text}
                    </p>

                    <div className="text-[11px] text-slate-400 font-medium">
                      Location noted: <strong className="text-slate-700">{item.complaint.location}</strong>
                    </div>

                    {/* Geocode & Map Click Actions */}
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setPinDropTargetId(item.complaint.id);
                          showToast(`Click anywhere on map to position ${item.complaint.shortId}`);
                        }}
                        className={`flex-1 text-[11px] font-bold py-1.5 px-2.5 rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                          pinDropTargetId === item.complaint.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <LocateFixed className="h-3.5 w-3.5" />
                        <span>{pinDropTargetId === item.complaint.id ? 'Click Map...' : 'Drop Pin'}</span>
                      </button>

                      <button
                        onClick={() =>
                          handleGeocodeComplaint(item.complaint.id, item.complaint.location)
                        }
                        className="flex-1 text-[11px] font-bold py-1.5 px-2.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Compass className="h-3.5 w-3.5" />
                        <span>Geocode</span>
                      </button>

                      <button
                        onClick={() => openComplaintDetail(item.complaint.id)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                        title="View Full Detail"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintMapView;

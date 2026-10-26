'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MergedComplaintView, PriorityType } from '../../types';

interface LeafletMapInnerProps {
  complaints: MergedComplaintView[];
  selectedComplaintId?: string | null;
  onSelectComplaint: (id: string) => void;
  isPinDropMode?: boolean;
  onMapClickForLocation?: (lat: number, lng: number) => void;
}

const getPriorityColor = (priority: PriorityType): string => {
  switch (priority) {
    case 'Critical':
      return '#ef4444'; // Red
    case 'High':
      return '#f97316'; // Orange
    case 'Medium':
      return '#3b82f6'; // Blue
    case 'Low':
    default:
      return '#10b981'; // Emerald
  }
};

const createCustomIcon = (shortId: string, priority: PriorityType, isSelected: boolean) => {
  const color = getPriorityColor(priority);
  const ring = isSelected ? 'border: 3px solid #1e293b; transform: scale(1.15);' : 'border: 2px solid #ffffff;';

  const html = `
    <div style="
      background-color: ${color};
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      font-family: ui-sans-serif, system-ui, sans-serif;
      padding: 3px 6px;
      border-radius: 9999px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.25), 0 2px 4px -2px rgba(0, 0, 0, 0.2);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
      white-space: nowrap;
      cursor: pointer;
      ${ring}
    ">
      <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#fff;"></span>
      <span>${shortId}</span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [60, 24],
    iconAnchor: [30, 12],
    popupAnchor: [0, -14],
  });
};

export const LeafletMapInner: React.FC<LeafletMapInnerProps> = ({
  complaints,
  selectedComplaintId,
  onSelectComplaint,
  isPinDropMode,
  onMapClickForLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Metroville center coordinates
    const map = L.map(mapContainerRef.current, {
      center: [28.6139, 77.2090],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Fix map render sizing
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Map Clicks (Pin Drop Mode)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (isPinDropMode && onMapClickForLocation) {
        onMapClickForLocation(e.latlng.lat, e.latlng.lng);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [isPinDropMode, onMapClickForLocation]);

  // Update Markers when complaints change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const located = complaints.filter(
      (c) => typeof c.complaint.lat === 'number' && typeof c.complaint.lng === 'number'
    );

    located.forEach((item) => {
      const lat = item.complaint.lat!;
      const lng = item.complaint.lng!;
      const isSelected = item.complaint.id === selectedComplaintId;

      const marker = L.marker([lat, lng], {
        icon: createCustomIcon(item.complaint.shortId, item.currentPriority, isSelected),
      });

      const popupHtml = `
        <div style="font-family: ui-sans-serif, system-ui, sans-serif; min-width: 220px; padding: 4px 2px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <strong style="font-size: 13px; color:#0f172a;">${item.complaint.shortId}</strong>
            <span style="font-size: 10px; font-weight:700; padding: 2px 6px; border-radius: 4px; background:#f1f5f9; color:#334155;">
              ${item.currentStatus}
            </span>
          </div>
          <div style="font-size: 12px; font-weight: 600; color:#1e293b; margin-bottom: 4px;">
            ${item.complaint.title || item.currentCategory}
          </div>
          <div style="font-size: 11px; color:#64748b; margin-bottom: 8px;">
            ${item.complaint.location} &bull; <span style="color:${getPriorityColor(item.currentPriority)}; font-weight:700;">${item.currentPriority} Priority</span>
          </div>
          <p style="font-size: 11px; color:#475569; margin: 0 0 10px 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${item.complaint.text}
          </p>
          <button
            id="btn-detail-${item.complaint.id}"
            style="width: 100%; font-size: 11px; font-weight: 700; background: #2563eb; color: #fff; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; text-align: center;"
          >
            Open Complaint Detail &rarr;
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-detail-${item.complaint.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectComplaint(item.complaint.id);
          };
        }
      });

      markersGroup.addLayer(marker);
    });
  }, [complaints, selectedComplaintId, onSelectComplaint]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={mapContainerRef}
        className={`h-full w-full ${isPinDropMode ? 'cursor-crosshair' : 'cursor-default'}`}
      />
      {isPinDropMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-blue-400 flex items-center gap-2 animate-pulse">
          <span className="h-2 w-2 rounded-full bg-white animate-ping" />
          <span>Pin-Drop Mode: Click anywhere on the map to set location</span>
        </div>
      )}
    </div>
  );
};

export default LeafletMapInner;

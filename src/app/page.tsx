'use client';

import React, { useState } from 'react';
import { useTriage } from '../context/TriageContext';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { OverviewDashboard } from '../components/dashboard/OverviewDashboard';
import { ComplaintInbox } from '../components/inbox/ComplaintInbox';
import { ComplaintDetail } from '../components/detail/ComplaintDetail';
import { RelatedComplaintsPanel } from '../components/related/RelatedComplaintsPanel';
import { DepartmentContactPanel } from '../components/contact/DepartmentContactPanel';
import { EscalationAuditView } from '../components/timeline/EscalationAuditView';
import { CityInsightsView } from '../components/analytics/CityInsightsView';
import { EscalationQueueView } from '../components/escalations/EscalationQueueView';
import { LandingPageView } from '../components/landing/LandingPageView';
import { SettingsView } from '../components/settings/SettingsView';
import { InitialPreferencePrompt } from '../components/settings/InitialPreferencePrompt';
import { ComplaintMapView } from '../components/map/ComplaintMapView';
import { IntakeChannelsView } from '../components/intake/IntakeChannelsView';

export default function HomePage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { activeTab, showDetail } = useTriage();

  // If user opened Public Landing Page (Section 9)
  if (activeTab === 'landing') {
    return (
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-white">
        <LandingPageView />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans">
      {/* Sidebar Navigation matching Reference */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-slate-50/60">
        {/* Top Header Banner with City Skyline Silhouette & Tools */}
        <Header onToggleSidebar={() => setMobileSidebarOpen(prev => !prev)} />

        {/* Initial First-Time Preference Selection Banner */}
        <InitialPreferencePrompt />

        {/* Dynamic Workspace corresponding to Reference Sections 1 through 8 */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'overview' && <OverviewDashboard />}
          {activeTab === 'map' && <ComplaintMapView />}
          {activeTab === 'intake' && <IntakeChannelsView />}

          {activeTab === 'complaints' && (
            showDetail ? <ComplaintDetail /> : <ComplaintInbox />
          )}

          {activeTab === 'incidents' && <RelatedComplaintsPanel />}

          {activeTab === 'departments' && <DepartmentContactPanel />}

          {activeTab === 'analytics' && <CityInsightsView />}

          {activeTab === 'escalations' && <EscalationQueueView />}

          {activeTab === 'history' && <EscalationAuditView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}
import type { Metadata } from 'next';
import './globals.css';
import { TriageProvider } from '../context/TriageContext';

export const metadata: Metadata = {
  title: 'GrievanceTriage - Municipal Grievance Triage & Resolution Platform',
  description: 'AI-assisted Municipal Grievance Triage and Resolution Platform with verified department handoffs, audit history, and real-time GIS mapping.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-50 antialiased overflow-hidden text-slate-900">
        <TriageProvider>
          {children}
        </TriageProvider>
      </body>
    </html>
  );
}

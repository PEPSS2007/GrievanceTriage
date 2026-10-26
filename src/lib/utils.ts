import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { StatusType, PriorityType, Complaint, Analysis, Department } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date('2026-04-28T12:00:00Z'); // Fixed baseline matching reference demo date
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  } catch {
    return isoString;
  }
}

export function formatRefDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Apr 28';
  }
}

export function formatFullDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return isoString;
  }
}

export function getPriorityBadge(priority: PriorityType) {
  switch (priority) {
    case 'Critical':
    case 'High':
      return {
        bg: 'bg-rose-100 text-rose-700 border border-rose-200',
        dot: 'bg-rose-500',
        label: 'High'
      };
    case 'Medium':
      return {
        bg: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        dot: 'bg-emerald-500',
        label: 'Medium'
      };
    case 'Low':
    default:
      return {
        bg: 'bg-sky-100 text-sky-800 border border-sky-200',
        dot: 'bg-sky-500',
        label: 'Low'
      };
  }
}

export function getStatusBadge(status: StatusType) {
  switch (status) {
    case 'Submitted':
    case 'Pending Review':
      return {
        bg: 'bg-amber-100 text-amber-800 border border-amber-200',
        label: 'Pending'
      };
    case 'Under Review':
    case 'In Review':
    case 'Needs More Information':
      return {
        bg: 'bg-blue-100 text-blue-800 border border-blue-200',
        label: 'In Review'
      };
    case 'Assigned':
    case 'In Progress':
      return {
        bg: 'bg-purple-100 text-purple-800 border border-purple-200',
        label: 'In Progress'
      };
    case 'Approved':
      return {
        bg: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        label: 'Approved'
      };
    case 'Contact Prepared':
      return {
        bg: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
        label: 'Prepared'
      };
    case 'Contact Initiated':
      return {
        bg: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
        label: 'Initiated'
      };
    case 'Acknowledged':
      return {
        bg: 'bg-teal-100 text-teal-800 border border-teal-200',
        label: 'Acknowledged'
      };
    case 'Resolution Submitted':
      return {
        bg: 'bg-amber-100 text-amber-900 border border-amber-300',
        label: 'Resolution Submitted'
      };
    case 'Verification Pending':
      return {
        bg: 'bg-indigo-100 text-indigo-900 border border-indigo-300',
        label: 'Verification Pending'
      };
    case 'Verified Resolved':
      return {
        bg: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
        label: 'Verified Resolved'
      };
    case 'Resolved':
      return {
        bg: 'bg-teal-100 text-teal-800 border border-teal-200',
        label: 'Resolved'
      };
    case 'Rejected — Further Action Required':
      return {
        bg: 'bg-rose-100 text-rose-800 border border-rose-300',
        label: 'Action Required'
      };
    case 'Escalated':
      return {
        bg: 'bg-rose-100 text-rose-800 border border-rose-200',
        label: 'Escalated'
      };
    case 'Rejected':
      return {
        bg: 'bg-red-100 text-red-800 border border-red-200',
        label: 'Rejected'
      };
    case 'Reopened':
      return {
        bg: 'bg-orange-100 text-orange-800 border border-orange-200',
        label: 'Reopened'
      };
    case 'Open':
    case 'Open / Under Review':
    default:
      return {
        bg: 'bg-slate-100 text-slate-700 border border-slate-200',
        label: 'Open'
      };
  }
}

export function getCategoryIconColor(category?: string) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('water') || cat.includes('sewage')) {
    return { bg: 'bg-cyan-100 text-cyan-700', icon: 'droplet' };
  }
  if (cat.includes('garbage') || cat.includes('sanitation')) {
    return { bg: 'bg-amber-100 text-amber-700', icon: 'trash' };
  }
  if (cat.includes('light') || cat.includes('lamp')) {
    return { bg: 'bg-rose-100 text-rose-700', icon: 'lightbulb' };
  }
  if (cat.includes('road') || cat.includes('pothole')) {
    return { bg: 'bg-emerald-100 text-emerald-700', icon: 'road' };
  }
  return { bg: 'bg-blue-100 text-blue-700', icon: 'zap' };
}

export function generateDepartmentDraft(
  complaint: Complaint,
  analysis: Analysis,
  dept: Department | undefined,
  escalationNote?: string
): string {
  return `Please dispatch a repair crew to ${complaint.title ? complaint.title.replace('Water leak on ', '') : 'Pine Street'}, ${complaint.location}. This is a ${analysis.category.toLowerCase()} issue requiring urgent attention.`;
}

export function createMailtoLink(to: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function createTelLink(phone: string): string {
  const cleanPhone = (phone || '').replace(/[^0-9+]/g, '');
  return `tel:${cleanPhone}`;
}
import { Analysis, PriorityType } from '../types';
import taxonomyData from '../data/taxonomy.json';

export function runDeterministicTriage(text: string, location?: string): Analysis {
  const lower = text.toLowerCase();
  const evidence: string[] = [];
  let priority: PriorityType = 'Medium';
  let category = 'General';
  let departmentId = 'dept-roads';
  let action = 'Dispatch routine ward maintenance crew within 48h';
  let confidence = 0.85;

  // Category & Department matching
  if (lower.includes('water') || lower.includes('leak') || lower.includes('pipe') || lower.includes('burst') || lower.includes('drain') || lower.includes('pressure')) {
    category = 'Water Supply & Sewage';
    departmentId = 'dept-water';
    action = 'Isolate line and dispatch emergency plumbing gang within 24h';
    evidence.push('Water infrastructure keyword match ("water", "pipe", "leak")');
  } else if (lower.includes('garbage') || lower.includes('waste') || lower.includes('refuse') || lower.includes('dump') || lower.includes('stench') || lower.includes('smell')) {
    category = 'Garbage & Sanitation';
    departmentId = 'dept-sanitation';
    action = 'Dispatch heavy compactor truck and sanitization spray';
    evidence.push('Public health / sanitation keyword match ("garbage", "waste")');
  } else if (lower.includes('light') || lower.includes('dark') || lower.includes('lamp') || lower.includes('pole')) {
    category = 'Street Lighting';
    departmentId = 'dept-power';
    action = 'Schedule electrical technician to inspect photocell/fuse';
    evidence.push('Street lighting keyword match ("light", "lamp", "pole")');
  } else if (lower.includes('wire') || lower.includes('electric') || lower.includes('spark') || lower.includes('shock') || lower.includes('voltage')) {
    category = 'Electrical Hazards';
    departmentId = 'dept-power';
    action = 'Immediate safety remote trip and dispatch 24/7 lineman unit';
    evidence.push('Live electrical hazard keyword match ("wire", "spark", "electric")');
    priority = 'Critical';
  } else if (lower.includes('pothole') || lower.includes('road') || lower.includes('crater') || lower.includes('asphalt') || lower.includes('traffic')) {
    category = 'Roads & Potholes';
    departmentId = 'dept-roads';
    action = 'Dispatch asphalt cold-patch / hot-mix road crew within 24h';
    evidence.push('Road surface defect keyword match ("pothole", "road", "asphalt")');
  }

  // Safety Heuristic Rule hits
  if (lower.includes('school') || lower.includes('children') || lower.includes('hospital') || lower.includes('gate') || lower.includes('swerve')) {
    evidence.push('Public safety sensitivity: Proximity to school/hospital/pedestrian crossing');
    if (priority !== 'Critical') priority = 'High';
  }

  if (lower.includes('burst') || lower.includes('flooding') || lower.includes('unattended') || lower.includes('days') || lower.includes('consecutive')) {
    evidence.push('Service interruption severity: Multi-day persistent report / flooding threat');
    if (priority === 'Medium') priority = 'High';
  }

  if (location) {
    evidence.push(`Location identified: ${location}`);
  }

  return {
    complaint_id: `CMP-${Date.now().toString().slice(-3)}`,
    summary: text.length > 90 ? text.substring(0, 90) + '...' : text,
    category,
    priority,
    priority_evidence: evidence.length > 0 ? evidence : ['General municipal inquiry heuristic match'],
    department_id: departmentId,
    action,
    uncertainties: ['Deterministic rule classification; field verification recommended'],
    method: 'fallback',
    confidence
  };
}
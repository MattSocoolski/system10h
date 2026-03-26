// System 10H Mobile — BFF API Client
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { DashboardData, Lead, Draft, DraftDetail, ApiResponse } from '@/types';

// SecureStore doesn't work on web — fallback to localStorage.
// SECURITY NOTE: localStorage is vulnerable to XSS on web platform.
// For production web deployment, migrate to httpOnly cookies with SameSite=Strict.
// Native (iOS/Android) uses SecureStore (Keychain/Keystore) which is secure.
async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  }
  return SecureStore.getItemAsync(key);
}
async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    return;
  }
  return SecureStore.setItemAsync(key, value);
}
async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    return;
  }
  return SecureStore.deleteItemAsync(key);
}

// Always use production Worker — works from anywhere (home, mobile, office).
// For local Worker dev, temporarily switch to http://192.168.x.x:8787/api/mobile
const API_BASE = 'https://live-preview-api.hajlajf-art.workers.dev/api/mobile';

async function getToken(): Promise<string | null> {
  try {
    return await secureGet('auth_token');
  } catch {
    return null;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    // Auto-clear expired/revoked token on 401
    if (res.status === 401) {
      await secureDelete('auth_token').catch(() => {});
    }
    const error = await res.text();
    throw new Error(`API ${res.status}: ${error}`);
  }

  return res.json();
}

// ─── Status mapping: Notion CRM → mobile simplified ─────────────────────────

const STATUS_MAP: Record<string, Lead['status']> = {
  'Baza (research)': 'active',
  'Pierwszy kontakt': 'active',
  'Kwalifikacja potrzeby': 'nurture',
  'Wysłana próbka': 'nurture',
  'Dogrywanie': 'active',
  'Zamknięta - Wygrana': 'closed_won',
  'Klient / Rozwój (Account Management)': 'closed_won',
  'To-do': 'active',
  'In progress': 'active',
  'Complete': 'closed_won',
};

function mapStatus(notionStatus: string | null): Lead['status'] {
  if (!notionStatus) return 'active';
  return STATUS_MAP[notionStatus] || 'active';
}

// ─── Response mappers: BFF snake_case → mobile camelCase ─────────────────────

function mapLead(raw: any): Lead {
  return {
    id: raw.id,
    name: raw.name || '',
    company: raw.company || '',
    status: mapStatus(raw.status),
    value: raw.value || 0,
    score: raw.score || 0,
    due: raw.due_date || raw.due || null,
    lastContact: raw.last_contact || raw.lastContact || null,
    nextStep: raw.next_step || raw.nextStep || null,
    email: raw.email || null,
    phone: raw.phone || null,
    channel: raw.channel || null,
    daysOverdue: raw.days_overdue || raw.daysOverdue || 0,
    notes: raw.notes || null,
    contactPerson: raw.contact_person || raw.contactPerson || null,
  };
}

function mapDashboard(raw: any): DashboardData {
  return {
    pipeline: {
      active: raw.pipeline?.active || 0,
      overdue: raw.pipeline?.overdue || 0,
      value: raw.pipeline?.value || 0,
      dueToday: raw.pipeline?.due_today || raw.pipeline?.dueToday || 0,
    },
    closedThisMonth: {
      count: raw.closed_this_month?.count ?? raw.closedThisMonth?.count ?? 0,
      value: raw.closed_this_month?.value ?? raw.closedThisMonth?.value ?? 0,
    },
    overdueLeads: (raw.overdue_leads || raw.overdueLeads || []).filter(Boolean).map(mapLead),
    dueTodayLeads: (raw.due_today || raw.dueTodayLeads || []).filter(Boolean).map(mapLead),
    recentDrafts: raw.pending_drafts ?? raw.recent_drafts ?? raw.recentDrafts ?? 0,
    updatedAt: raw.updated_at || raw.updatedAt || new Date().toISOString(),
  };
}

function mapDraft(raw: any): Draft {
  return {
    id: raw.id,
    to: raw.to || '',
    subject: raw.subject || '',
    preview: raw.preview || raw.snippet || '',
    leadId: raw.lead_id || raw.leadId || null,
    leadName: raw.lead_name || raw.leadName || null,
    source: raw.source || 'manual',
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
  };
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export interface ActivityEvent {
  type: string;
  summary: string;
  leadName: string | null;
  draftSubject: string | null;
  timestamp: string;
}

export async function getActivity(): Promise<ActivityEvent[]> {
  try {
    const raw = await request<any>('/activity');
    return raw.activity || [];
  } catch {
    // Graceful fallback if endpoint doesn't exist yet
    return [];
  }
}

// ─── Push Token ───────────────────────────────────────────────────────────────

export async function registerPushToken(token: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>('/push-token', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

// ─── Auth ────────────────────────────────────────────────────────────────────

async function getOrCreateDeviceId(): Promise<string> {
  try {
    const stored = await secureGet('device_id');
    if (stored) return stored;
  } catch { /* first launch or store error */ }

  // Generate cryptographically secure device ID, persist across app restarts
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  try {
    await secureSet('device_id', id);
  } catch { /* best effort */ }
  return id;
}

export async function authenticate(secretKey: string): Promise<{ token: string }> {
  const deviceId = await getOrCreateDeviceId();

  const result = await request<{ token: string }>('/auth', {
    method: 'POST',
    body: JSON.stringify({
      device_id: deviceId,
      secret_key: secretKey,
    }),
  });
  await secureSet('auth_token', result.token);
  return result;
}

// ─── Logout ──────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  try {
    await request<any>('/logout', { method: 'POST' });
  } catch {
    // Best-effort — server revocation may fail if offline
  }
  await secureDelete('auth_token');
  await secureDelete('push_token');
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getDashboard(): Promise<DashboardData> {
  const raw = await request<any>('/dashboard');
  return mapDashboard(raw);
}

// ─── Leads ───────────────────────────────────────────────────────────────────

export async function getLeads(status?: string): Promise<Lead[]> {
  const params = status ? `?status=${status}` : '';
  const raw = await request<any>(`/leads${params}`);
  // BFF returns { leads: [...], has_more, next_cursor, total }
  const leadsArray = raw.leads || raw;
  return (Array.isArray(leadsArray) ? leadsArray : []).filter(Boolean).map(mapLead);
}

export async function getLead(id: string): Promise<Lead> {
  const raw = await request<any>(`/leads/${id}`);
  return mapLead(raw);
}

export async function updateLead(
  id: string,
  data: Partial<Pick<Lead, 'due' | 'status' | 'nextStep'>> & { note?: string }
): Promise<Lead> {
  // Map camelCase fields to snake_case for BFF
  const body: any = {};
  if (data.due) body.due = data.due;
  if (data.status) body.status = data.status;
  if (data.nextStep) body.next_step = data.nextStep;
  if (data.note) body.note = data.note;

  const raw = await request<any>(`/leads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return mapLead(raw.lead || raw);
}

// ─── Drafts ──────────────────────────────────────────────────────────────────

export async function getDraft(id: string): Promise<DraftDetail> {
  const raw = await request<any>(`/drafts/${id}`);
  return {
    ...mapDraft(raw.draft || raw),
    from: raw.draft?.from || raw.from || null,
    bodyPlain: raw.draft?.body_plain || raw.body_plain || raw.bodyPlain || null,
    bodyHtml: raw.draft?.body_html || raw.body_html || raw.bodyHtml || null,
  };
}

export async function updateDraftContent(
  id: string,
  data: { subject?: string; body?: string }
): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/drafts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getDrafts(): Promise<Draft[]> {
  const raw = await request<any>('/drafts');
  const draftsArray = raw.drafts || raw;
  return (Array.isArray(draftsArray) ? draftsArray : []).map(mapDraft);
}

export async function approveDraft(id: string): Promise<{ success: boolean }> {
  const raw = await request<any>(`/drafts/${id}/approve`, {
    method: 'POST',
  });
  return { success: raw.ok ?? true };
}

export async function rejectDraft(id: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/drafts/${id}/reject`, {
    method: 'POST',
  });
}

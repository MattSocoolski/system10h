// System 10H Mobile — Zustand store (CLIENT STATE ONLY)
//
// Server data (dashboard, leads, drafts) lives in TanStack Query — see lib/hooks.ts.
// This store handles UI-only state that doesn't come from the BFF.
import { create } from 'zustand';
import type { Lead, Draft, DashboardData } from '@/types';

// ─── Mock data ───────────────────────────────────────────────────────────────
// Retained here as the single source of mock data until BFF is ready.
// The API layer (api.ts) and hooks (hooks.ts) consume these via getMock* helpers.

export const MOCK_DASHBOARD: DashboardData = {
  pipeline: { active: 3, overdue: 2, value: 22500, dueToday: 1 },
  closedThisMonth: { count: 0, value: 0 },
  overdueLeads: [
    {
      id: '1', name: 'Ola', company: 'Modul Soft', status: 'active',
      value: 18500, score: 2.1, due: '2026-03-20', lastContact: '2026-03-20',
      nextStep: 'Check-in po demo', email: null, phone: null, channel: 'cold',
      daysOverdue: 5, notes: null, contactPerson: null,
    },
    {
      id: '2', name: 'Karolina', company: 'Durmaj', status: 'nurture',
      value: 2999, score: 1.8, due: '2026-03-19', lastContact: '2026-03-05',
      nextStep: 'Follow-up po demo', email: null, phone: null, channel: 'cold',
      daysOverdue: 6, notes: null, contactPerson: null,
    },
  ],
  dueTodayLeads: [
    {
      id: '3', name: 'Krystian', company: 'Szczypek', status: 'active',
      value: 2999, score: 2.0, due: '2026-03-25', lastContact: '2026-03-18',
      nextStep: 'Czekam na odp DM', email: null, phone: null, channel: 'linkedin',
      daysOverdue: 0, notes: null, contactPerson: null,
    },
  ],
  recentDrafts: 2,
  updatedAt: new Date().toISOString(),
};

export const MOCK_LEADS: Lead[] = [
  ...MOCK_DASHBOARD.overdueLeads,
  ...MOCK_DASHBOARD.dueTodayLeads,
  {
    id: '4', name: 'Gawlik', company: 'Gawlik', status: 'active',
    value: 999, score: 1.5, due: '2026-03-28', lastContact: '2026-03-04',
    nextStep: 'Relacja osobista, nie cisnąć', email: null, phone: null,
    channel: 'warm', daysOverdue: 0, notes: null, contactPerson: null,
  },
  {
    id: '5', name: 'Zbigniew', company: 'COMMI', status: 'nurture',
    value: 2999, score: 2.5, due: '2026-05-01', lastContact: '2026-03-05',
    nextStep: 'NURTURE MAJ — COMMI rebuild', email: null, phone: null,
    channel: 'warm', daysOverdue: 0, notes: null, contactPerson: null,
  },
];

export const MOCK_DRAFTS: Draft[] = [
  {
    id: 'd1', to: 'ola@modulsoft.pl', subject: 'Re: System 10H — demo follow-up',
    preview: 'Cześć Ola, jak wrażenia po weekendowym testowaniu? Chętnie...',
    leadId: '1', leadName: 'Modul Soft', source: 'autopilot',
    createdAt: '2026-03-25T08:30:00Z',
  },
  {
    id: 'd2', to: 'krystian@szczypek.pl', subject: 'Re: Bliźniak Biznesowy — pytanie',
    preview: 'Hej Krystian, widziałem że zajrzałeś na stronę. Masz pytania...',
    leadId: '3', leadName: 'Szczypek', source: 'ghost',
    createdAt: '2026-03-25T09:15:00Z',
  },
];

// ─── Client-only UI state ────────────────────────────────────────────────────

interface UIState {
  // Active tab filter for pipeline screen
  activeTab: string | undefined;
  setActiveTab: (tab: string | undefined) => void;

  // Selected lead for detail view / actions
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;

  // Draft edit buffer — local edits before save, keyed by draft ID
  draftEditBuffer: Record<string, { subject?: string; body?: string }>;
  setDraftEdit: (draftId: string, edits: { subject?: string; body?: string }) => void;
  clearDraftEdit: (draftId: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: undefined,
  setActiveTab: (tab) => set({ activeTab: tab }),

  selectedLeadId: null,
  setSelectedLeadId: (id) => set({ selectedLeadId: id }),

  draftEditBuffer: {},
  setDraftEdit: (draftId, edits) =>
    set((state) => ({
      draftEditBuffer: { ...state.draftEditBuffer, [draftId]: edits },
    })),
  clearDraftEdit: (draftId) =>
    set((state) => {
      const { [draftId]: _, ...rest } = state.draftEditBuffer;
      return { draftEditBuffer: rest };
    }),
}));

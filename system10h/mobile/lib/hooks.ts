// System 10H Mobile — TanStack Query hooks (server state)
//
// Each hook wraps a useQuery/useMutation for a specific BFF endpoint.
// While BFF is not ready, the API functions fall back to mock data.
// When BFF ships, only api.ts changes — these hooks stay the same.

import { useEffect } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import * as api from '@/lib/api';
import type { DashboardData, Lead, Draft, DraftDetail } from '@/types';
import type { ActivityEvent } from '@/lib/api';
import { MOCK_DASHBOARD, MOCK_LEADS, MOCK_DRAFTS } from '@/lib/stores';
import { useDraftStore } from '@/stores/draftStore';

// ─── Stale times (per Deep Research recommendations) ─────────────────────────

const STALE_TIMES = {
  dashboard: 30_000,           // 30s — most time-sensitive screen
  leads: 5 * 60_000,          // 5 min — pipeline list
  drafts: 60_000,             // 1 min — drafts list
  leadDetail: 2 * 60_000,     // 2 min — single lead/draft detail
} as const;

// ─── Query key factories ─────────────────────────────────────────────────────
// Structured keys for targeted invalidation.

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  leads: (status?: string) => status ? ['leads', status] as const : ['leads'] as const,
  lead: (id: string) => ['lead', id] as const,
  drafts: ['drafts'] as const,
  draft: (id: string) => ['draft', id] as const,
} as const;

// ─── Mock-aware fetch functions ──────────────────────────────────────────────
// These try the real API first; if it fails (BFF not ready), return mock data.
// When BFF ships, the try block succeeds and mocks are never hit.

const USE_MOCK = false; // BFF is live — connected to real Notion CRM

async function fetchDashboard(): Promise<DashboardData> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return { ...MOCK_DASHBOARD, updatedAt: new Date().toISOString() };
  }
  return api.getDashboard();
}

async function fetchLeads(status?: string): Promise<Lead[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 250));
    return status ? MOCK_LEADS.filter((l) => l.status === status) : [...MOCK_LEADS];
  }
  return api.getLeads(status);
}

async function fetchDrafts(): Promise<Draft[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 250));
    return [...MOCK_DRAFTS];
  }
  return api.getDrafts();
}

async function fetchLead(id: string): Promise<Lead> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 250));
    const found = MOCK_LEADS.find((l) => l.id === id);
    if (!found) throw new Error('Lead not found');
    return { ...found };
  }
  return api.getLead(id);
}

// ─── Query hooks ─────────────────────────────────────────────────────────────

/**
 * Dashboard data: pipeline stats, overdue leads, due-today leads.
 * Also prefetches leads and drafts for adjacent tabs.
 */
export function useDashboard() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: fetchDashboard,
    staleTime: STALE_TIMES.dashboard,
    refetchInterval: 60_000, // poll every 60s — most time-sensitive screen
    refetchIntervalInBackground: false,
  });

  // Prefetch adjacent screens when dashboard loads successfully
  if (query.data && !query.isRefetching) {
    prefetchAdjacentScreens(queryClient);
  }

  return query;
}

/**
 * Leads list, optionally filtered by status.
 * Refreshed on screen focus (via component), not polled.
 */
export function useLeads(status?: string) {
  return useQuery({
    queryKey: queryKeys.leads(status),
    queryFn: () => fetchLeads(status),
    staleTime: STALE_TIMES.leads,
  });
}

/**
 * Email drafts awaiting approval.
 * Short staleTime (30s) — user expects fresh data on this screen.
 */
export function useDrafts() {
  const query = useQuery({
    queryKey: queryKeys.drafts,
    queryFn: fetchDrafts,
    staleTime: STALE_TIMES.drafts,
  });

  const setDraftCount = useDraftStore.getState().setDraftCount;
  useEffect(() => {
    if (query.data) {
      setDraftCount(Array.isArray(query.data) ? query.data.length : 0);
    }
  }, [query.data]);

  return query;
}

export function useDraft(id: string) {
  return useQuery({
    queryKey: queryKeys.draft(id),
    queryFn: () => api.getDraft(id),
    staleTime: STALE_TIMES.leadDetail,
    enabled: !!id,
  });
}

/**
 * Single lead detail by ID.
 * Used by the lead detail screen (/lead/[id]).
 */
export function useLead(id: string) {
  return useQuery({
    queryKey: queryKeys.lead(id),
    queryFn: () => fetchLead(id),
    staleTime: STALE_TIMES.leadDetail,
    enabled: !!id,
  });
}

// ─── Mutation hooks ──────────────────────────────────────────────────────────

/**
 * Approve a draft with optimistic update.
 * Removes the draft from cache instantly; rolls back on error.
 */
export function useApproveDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draftId: string) => {
      if (USE_MOCK) {
        return new Promise<{ success: boolean }>((resolve) =>
          setTimeout(() => resolve({ success: true }), 300)
        );
      }
      return api.approveDraft(draftId);
    },

    onMutate: async (draftId) => {
      // Cancel in-flight drafts query to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.drafts });

      // Snapshot previous drafts for rollback
      const previousDrafts = queryClient.getQueryData<Draft[]>(queryKeys.drafts);

      // Optimistic: remove the approved draft from cache
      queryClient.setQueryData<Draft[]>(queryKeys.drafts, (old) =>
        old ? old.filter((d) => d.id !== draftId) : []
      );

      // Also decrement dashboard recentDrafts count
      queryClient.setQueryData<DashboardData>(queryKeys.dashboard, (old) =>
        old ? { ...old, recentDrafts: Math.max(0, old.recentDrafts - 1) } : old
      );

      return { previousDrafts };
    },

    onError: (_err, _draftId, context) => {
      // Rollback: restore previous drafts
      if (context?.previousDrafts) {
        queryClient.setQueryData(queryKeys.drafts, context.previousDrafts);
      }
      // Re-fetch dashboard to restore correct count
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },

    onSettled: () => {
      // Always refetch to ensure server state is synced
      queryClient.invalidateQueries({ queryKey: queryKeys.drafts });
    },
  });
}

/**
 * Reject a draft with optimistic update.
 * Same pattern as approve — removes from cache, rolls back on error.
 */
export function useRejectDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draftId: string) => {
      if (USE_MOCK) {
        return new Promise<{ success: boolean }>((resolve) =>
          setTimeout(() => resolve({ success: true }), 300)
        );
      }
      return api.rejectDraft(draftId);
    },

    onMutate: async (draftId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.drafts });

      const previousDrafts = queryClient.getQueryData<Draft[]>(queryKeys.drafts);

      queryClient.setQueryData<Draft[]>(queryKeys.drafts, (old) =>
        old ? old.filter((d) => d.id !== draftId) : []
      );

      queryClient.setQueryData<DashboardData>(queryKeys.dashboard, (old) =>
        old ? { ...old, recentDrafts: Math.max(0, old.recentDrafts - 1) } : old
      );

      return { previousDrafts };
    },

    onError: (_err, _draftId, context) => {
      if (context?.previousDrafts) {
        queryClient.setQueryData(queryKeys.drafts, context.previousDrafts);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.drafts });
    },
  });
}

/**
 * Add a note to a lead. Invalidates both single-lead and leads-list caches.
 */
export function useAddNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, note }: { leadId: string; note: string }) =>
      api.updateLead(leadId, { note }),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lead(variables.leadId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.leads() });
    },
  });
}

// ─── Activity feed ──────────────────────────────────────────────────────────

export function useActivity() {
  return useQuery({
    queryKey: ['activity'] as const,
    queryFn: () => api.getActivity(),
    staleTime: 30_000, // 30s
  });
}

// ─── Prefetch helper ─────────────────────────────────────────────────────────

function prefetchAdjacentScreens(queryClient: QueryClient) {
  // Prefetch leads (all) and drafts so tab switches are instant
  queryClient.prefetchQuery({
    queryKey: queryKeys.leads(),
    queryFn: () => fetchLeads(),
    staleTime: STALE_TIMES.leads,
  });

  queryClient.prefetchQuery({
    queryKey: queryKeys.drafts,
    queryFn: fetchDrafts,
    staleTime: STALE_TIMES.drafts,
  });
}

import { create } from 'zustand';

interface DraftState {
  draftCount: number;
  setDraftCount: (count: number) => void;
}

export const useDraftStore = create<DraftState>((set) => ({
  draftCount: 0,
  setDraftCount: (count) => set({ draftCount: count }),
}));

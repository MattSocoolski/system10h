// constants/tokens.ts — System 10H Design Token System
export const colors = {
  bg: {
    sunken: '#080E1C', base: '#0F172A', surface: '#1E293B',
    surfaceHover: '#263244', elevated: '#334155', overlay: '#3B4D66', highest: '#475569',
  },
  text: {
    primary: '#F1F5F9', secondary: '#CBD5E1', tertiary: '#94A3B8', muted: '#64748B',
  },
  accent: {
    default: '#C084FC', decorative: '#A855F7', hover: '#D8B4FE',
    muted: 'rgba(168,85,247,0.15)',
  },
  success: '#4ADE80', danger: '#FCA5A5', warning: '#FCD34D', info: '#93C5FD',
  successMuted: 'rgba(74,222,128,0.12)', dangerMuted: 'rgba(248,113,113,0.12)',
  warningMuted: 'rgba(251,191,36,0.12)', infoMuted: 'rgba(96,165,250,0.12)',
  chip: { overdue: '#7F1D1D', drafts: '#2E1065', closed: '#14532D' },
  border: { subtle: 'rgba(255,255,255,0.06)', default: 'rgba(255,255,255,0.10)', strong: 'rgba(255,255,255,0.16)' },
  status: { active: '#4ADE80', nurture: '#FBBF24', frozen: '#6b7280', closedWon: '#C084FC', closedLost: '#FCA5A5' },
  swipe: { approve: '#16a34a', reject: '#dc2626' },
  source: {
    autopilot: '#C084FC', autopilotBg: 'rgba(168,85,247,0.2)',
    ghost: '#93C5FD', ghostBg: 'rgba(96,165,250,0.2)',
    manual: '#94A3B8', manualBg: 'rgba(148,163,184,0.2)',
  },
} as const;

export const typography = {
  size: {
    caption2: 11, caption1: 12, footnote: 13, subheadline: 15, callout: 16,
    body: 17, title3: 20, title2: 22, title1: 28, largeTitle: 34,
  },
  weight: {
    regular: '400' as const, medium: '500' as const, semibold: '600' as const,
    bold: '700' as const, extrabold: '800' as const,
  },
  lineHeight: { tight: 20, normal: 24, loose: 28 },
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24,
  '2xl': 32, '3xl': 40, '4xl': 48, '5xl': 64,
} as const;

export const radius = { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 } as const;

export const springs = {
  buttonPress: { mass: 0.2, damping: 15, stiffness: 150, overshootClamping: true },
  cardSwipe: { mass: 1, damping: 15, stiffness: 100, overshootClamping: false },
  sheetPresent: { mass: 1, damping: 20, stiffness: 150, overshootClamping: false },
  snappy: { mass: 0.3, damping: 20, stiffness: 250, overshootClamping: true },
} as const;

export const scale = {
  primaryButton: 0.95, secondaryButton: 0.97, cardPress: 0.98, iconButton: 0.90,
} as const;

export const iconSize = { tabBar: 24, listItem: 20, navHeader: 22, inline: 16, feature: 32, emptyState: 48 } as const;

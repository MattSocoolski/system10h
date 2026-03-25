// System 10H Mobile — typy danych

export interface Lead {
  id: string;
  name: string;
  company: string;
  status: 'active' | 'nurture' | 'frozen' | 'closed_won' | 'closed_lost';
  value: number;
  score: number;
  due: string | null;
  lastContact: string | null;
  nextStep: string | null;
  email: string | null;
  phone: string | null;
  channel: string | null;
  daysOverdue: number;
  notes: string | null;
  contactPerson: string | null;
}

export interface Draft {
  id: string;
  to: string;
  subject: string;
  preview: string;
  leadId: string | null;
  leadName: string | null;
  source: 'autopilot' | 'ghost' | 'manual';
  createdAt: string;
}

export interface DraftDetail extends Draft {
  from: string | null;
  bodyPlain: string | null;
  bodyHtml: string | null;
}

export interface DashboardData {
  pipeline: {
    active: number;
    overdue: number;
    value: number;
    dueToday: number;
  };
  closedThisMonth: {
    count: number;
    value: number;
  };
  overdueLeads: Lead[];
  dueTodayLeads: Lead[];
  recentDrafts: number;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

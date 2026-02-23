export interface CanonicalSource {
  id: string;
  name: string;
  type: 'PPC' | 'Direct Mail' | 'Yard Sign' | 'Organic' | 'Referral' | 'Repeat';
  is_active: boolean;
}

export interface MappingRule {
  id: string;
  input_type: 'campaign_name' | 'utm_campaign' | 'utm_source' | 'utm_medium' | 'landing_page' | 'manual_label';
  input_value: string;
  source_id: string;
  priority: number;
  is_active: boolean;
}

export interface SpendDaily {
  id: string;
  date: string;
  platform: 'google' | 'meta' | 'manual';
  campaign_name: string;
  amount: number;
  location: string;
  notes?: string;
}

export interface Lead {
  id: string;
  created_date: string;
  location: string;
  rep: string;
  appointment_set: boolean;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  landing_page: string;
  lead_type: 'call' | 'form' | 'chat' | 'walk-in';
  status: 'new' | 'contacted' | 'scheduled' | 'ran' | 'no-show' | 'unqualified';
}

export interface Deal {
  id: string;
  lead_id: string;
  rep: string;
  status: 'won' | 'lost';
  revenue: number;
  close_date: string;
  job_type: 'retail' | 'insurance';
  days_to_close: number;
}

export interface Rep {
  id: string;
  name: string;
  role: 'ISR' | 'OSR';
  is_active: boolean;
}

export interface ContentAsset {
  id: string;
  title: string;
  type: 'video' | 'photo' | 'post' | 'ad-creative';
  status: 'idea' | 'in-production' | 'editing' | 'scheduled' | 'published';
  owner: string;
  due_date: string;
  publish_date?: string;
  channels: string[];
  linked_source_id?: string;
  notes: string;
  performance?: { views: number; clicks: number; leads: number };
}

export interface WebAgenda {
  id: string;
  week_start: string;
  theme: string;
  goal: string;
  primary_offer: string;
  target_area: string;
  landing_page_url: string;
  talking_points: string[];
  ctas: string[];
  associated_sources: string[];
  content_assets: string[];
  budget_plan: { google: number; meta: number; mail: number; signs: number };
  kpis: { leads_target: number; cpl_target: number; revenue_target: number };
}

export interface Scorecard {
  id: string;
  period: 'weekly' | 'monthly';
  start_date: string;
  end_date: string;
  owner: string;
  summary: string;
  metrics: {
    spend: number;
    leads: number;
    cpl: number;
    appointments: number;
    close_rate: number;
    revenue: number;
    roas: number;
    gross_profit_est: number;
  };
  grade: 'green' | 'yellow' | 'red';
  notes: string;
  action_items: { text: string; owner: string; due_date: string; status: string }[];
}

export interface ConnectorStatus {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  last_sync: string;
  health_message: string;
  mock_requirements_needed: string[];
}

export interface MockData {
  sources: CanonicalSource[];
  reps: Rep[];
  mappingRules: MappingRule[];
  spend: SpendDaily[];
  leads: Lead[];
  deals: Deal[];
  contentAssets: ContentAsset[];
  webAgendas: WebAgenda[];
  scorecards: Scorecard[];
  connectors: ConnectorStatus[];
}

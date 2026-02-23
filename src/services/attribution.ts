import type { Lead, SpendDaily, MappingRule, Session } from '../data/types';

export function resolveSource(
  lead: Pick<Lead, 'utm_source' | 'utm_medium' | 'utm_campaign' | 'landing_page'>,
  rules: MappingRule[],
): string | null {
  const active = rules.filter(r => r.is_active).sort((a, b) => b.priority - a.priority);
  for (const rule of active) {
    let value = '';
    switch (rule.input_type) {
      case 'utm_source': value = lead.utm_source; break;
      case 'utm_medium': value = lead.utm_medium; break;
      case 'utm_campaign': value = lead.utm_campaign; break;
      case 'landing_page': value = lead.landing_page; break;
      default: continue;
    }
    if (value && value.toLowerCase().includes(rule.input_value.toLowerCase())) return rule.source_id;
  }
  return null;
}

export function resolveSpendSource(spend: SpendDaily, rules: MappingRule[]): string | null {
  const active = rules.filter(r => r.is_active && r.input_type === 'campaign_name').sort((a, b) => b.priority - a.priority);
  for (const rule of active) {
    if (spend.campaign_name.toLowerCase().includes(rule.input_value.toLowerCase())) return rule.source_id;
  }
  if (spend.platform === 'google') return 'src-01';
  if (spend.platform === 'meta') return 'src-03';
  return null;
}

export function resolveSessionSource(
  session: Pick<Session, 'utm_source' | 'utm_medium' | 'utm_campaign' | 'landing_page'>,
  rules: MappingRule[],
): string | null {
  return resolveSource(session as any, rules);
}

export function getUnmappedLeads(leads: Lead[], rules: MappingRule[]): Lead[] {
  return leads.filter(l => resolveSource(l, rules) === null);
}

export function getUnmappedSpend(spend: SpendDaily[], rules: MappingRule[]): SpendDaily[] {
  return spend.filter(s => resolveSpendSource(s, rules) === null);
}

export function getUnmappedSessions(sessions: Session[], rules: MappingRule[]): Session[] {
  return sessions.filter(s => resolveSessionSource(s, rules) === null);
}

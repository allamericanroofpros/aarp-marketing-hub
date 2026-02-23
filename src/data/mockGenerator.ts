import type { MockData, CanonicalSource, Rep, MappingRule, SpendDaily, Lead, Deal, ContentAsset, WebAgenda, Scorecard, ConnectorStatus } from './types';

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function generateMockData(): MockData {
  const r = mulberry32(42);
  const pick = <T,>(a: T[]): T => a[Math.floor(r() * a.length)];
  const randInt = (min: number, max: number) => Math.floor(r() * (max - min + 1)) + min;
  const randFloat = (min: number, max: number) => +(r() * (max - min) + min).toFixed(2);
  const uid = (pre: string, i: number) => `${pre}-${String(i).padStart(4, '0')}`;

  const today = new Date('2026-02-23');
  const dayMs = 86400000;
  const startDate = new Date(today.getTime() - 180 * dayMs);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const addD = (d: Date, n: number) => new Date(d.getTime() + n * dayMs);

  const sources: CanonicalSource[] = [
    { id: 'src-01', name: 'PPC – Google Search', type: 'PPC', is_active: true },
    { id: 'src-02', name: 'PPC – Google LSA', type: 'PPC', is_active: true },
    { id: 'src-03', name: 'PPC – Facebook', type: 'PPC', is_active: true },
    { id: 'src-04', name: 'Direct Mail – EDDM Feb 2026', type: 'Direct Mail', is_active: true },
    { id: 'src-05', name: 'Direct Mail – Targeted Mail', type: 'Direct Mail', is_active: true },
    { id: 'src-06', name: 'Yard Sign – Sandusky Center', type: 'Yard Sign', is_active: true },
    { id: 'src-07', name: 'Organic', type: 'Organic', is_active: true },
    { id: 'src-08', name: 'Referral', type: 'Referral', is_active: true },
    { id: 'src-09', name: 'Repeat Customer', type: 'Repeat', is_active: true },
  ];

  const reps: Rep[] = [
    { id: 'rep-01', name: 'Jake Martinez', role: 'ISR', is_active: true },
    { id: 'rep-02', name: 'Sarah Chen', role: 'ISR', is_active: true },
    { id: 'rep-03', name: 'Mike Johnson', role: 'OSR', is_active: true },
    { id: 'rep-04', name: 'Lisa Park', role: 'ISR', is_active: true },
    { id: 'rep-05', name: 'Tom Williams', role: 'OSR', is_active: true },
    { id: 'rep-06', name: 'Rachel Adams', role: 'OSR', is_active: true },
  ];

  const locations = ['Mansfield', 'Sandusky', 'Huron'];
  const repLoc: Record<string, string> = {
    'rep-01': 'Mansfield', 'rep-02': 'Sandusky', 'rep-03': 'Mansfield',
    'rep-04': 'Huron', 'rep-05': 'Sandusky', 'rep-06': 'Mansfield',
  };

  const mappingRules: MappingRule[] = [
    { id: 'mr-01', input_type: 'utm_source', input_value: 'google', source_id: 'src-01', priority: 10, is_active: true },
    { id: 'mr-02', input_type: 'utm_medium', input_value: 'lsa', source_id: 'src-02', priority: 20, is_active: true },
    { id: 'mr-03', input_type: 'utm_source', input_value: 'facebook', source_id: 'src-03', priority: 10, is_active: true },
    { id: 'mr-04', input_type: 'utm_campaign', input_value: 'eddm-feb-2026', source_id: 'src-04', priority: 15, is_active: true },
    { id: 'mr-05', input_type: 'utm_campaign', input_value: 'targeted-mail', source_id: 'src-05', priority: 15, is_active: true },
    { id: 'mr-06', input_type: 'utm_source', input_value: 'yard-sign', source_id: 'src-06', priority: 10, is_active: true },
    { id: 'mr-07', input_type: 'utm_source', input_value: 'organic', source_id: 'src-07', priority: 5, is_active: true },
    { id: 'mr-08', input_type: 'utm_source', input_value: 'referral', source_id: 'src-08', priority: 5, is_active: true },
    { id: 'mr-09', input_type: 'utm_source', input_value: 'repeat', source_id: 'src-09', priority: 5, is_active: true },
    { id: 'mr-10', input_type: 'utm_medium', input_value: 'cpc', source_id: 'src-01', priority: 8, is_active: true },
    { id: 'mr-11', input_type: 'campaign_name', input_value: 'google-search-roofing', source_id: 'src-01', priority: 12, is_active: true },
    { id: 'mr-12', input_type: 'campaign_name', input_value: 'fb-roofing', source_id: 'src-03', priority: 12, is_active: true },
    { id: 'mr-13', input_type: 'landing_page', input_value: '/free-estimate', source_id: 'src-01', priority: 3, is_active: true },
    { id: 'mr-14', input_type: 'landing_page', input_value: '/storm-damage', source_id: 'src-01', priority: 3, is_active: true },
  ];

  // UTM sets with weights for lead generation
  const utmSets = [
    { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'google-search-roofing', landing_page: '/free-estimate', w: 25 },
    { utm_source: 'google', utm_medium: 'lsa', utm_campaign: 'google-lsa-roofing', landing_page: '/free-estimate', w: 15 },
    { utm_source: 'facebook', utm_medium: 'paid', utm_campaign: 'fb-roofing-mansfield', landing_page: '/storm-damage', w: 18 },
    { utm_source: 'direct-mail', utm_medium: 'mail', utm_campaign: 'eddm-feb-2026', landing_page: '/eddm-offer', w: 8 },
    { utm_source: 'direct-mail', utm_medium: 'mail', utm_campaign: 'targeted-mail', landing_page: '/spring-special', w: 6 },
    { utm_source: 'yard-sign', utm_medium: 'offline', utm_campaign: 'yard-signs-q1', landing_page: '/', w: 5 },
    { utm_source: 'organic', utm_medium: 'organic', utm_campaign: '', landing_page: '/', w: 10 },
    { utm_source: 'referral', utm_medium: 'referral', utm_campaign: '', landing_page: '/', w: 8 },
    { utm_source: 'repeat', utm_medium: 'direct', utm_campaign: '', landing_page: '/', w: 3 },
    { utm_source: 'unknown', utm_medium: 'none', utm_campaign: 'mystery-campaign', landing_page: '/lp-test', w: 2 },
  ];
  const totalW = utmSets.reduce((s, u) => s + u.w, 0);
  function pickUtm() {
    let v = r() * totalW;
    for (const u of utmSets) { v -= u.w; if (v <= 0) return u; }
    return utmSets[0];
  }

  const leadTypes: Lead['lead_type'][] = ['call', 'form', 'chat', 'walk-in'];

  const leads: Lead[] = [];
  for (let i = 0; i < 1200; i++) {
    const dayOff = randInt(0, 179);
    const date = addD(startDate, dayOff);
    const rep = pick(reps);
    const utm = pickUtm();
    const apptSet = r() > 0.35;
    const status: Lead['status'] = apptSet
      ? pick(['scheduled', 'ran', 'no-show'] as const)
      : pick(['new', 'contacted', 'unqualified'] as const);
    leads.push({
      id: uid('lead', i),
      created_date: fmt(date),
      location: repLoc[rep.id] || pick(locations),
      rep: rep.id,
      appointment_set: apptSet,
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      landing_page: utm.landing_page,
      lead_type: pick(leadTypes),
      status,
    });
  }

  // Deals from eligible leads
  const eligible = leads.filter(l => l.status === 'ran' || l.status === 'scheduled');
  const shuffled = eligible.sort(() => r() - 0.5).slice(0, Math.min(320, eligible.length));
  const deals: Deal[] = shuffled.map((lead, i) => {
    const won = r() > 0.35;
    const dtc = randInt(3, 45);
    return {
      id: uid('deal', i),
      lead_id: lead.id,
      rep: lead.rep,
      status: won ? 'won' as const : 'lost' as const,
      revenue: won ? randInt(4000, 28000) : 0,
      close_date: fmt(addD(new Date(lead.created_date), dtc)),
      job_type: r() > 0.4 ? 'retail' as const : 'insurance' as const,
      days_to_close: dtc,
    };
  });

  // Daily spend
  const campaigns = [
    { name: 'google-search-roofing', platform: 'google' as const, base: [80, 200] as [number, number] },
    { name: 'google-lsa-roofing', platform: 'google' as const, base: [40, 120] as [number, number] },
    { name: 'fb-roofing-mansfield', platform: 'meta' as const, base: [50, 150] as [number, number] },
    { name: 'fb-roofing-sandusky', platform: 'meta' as const, base: [30, 100] as [number, number] },
    { name: 'eddm-feb-2026', platform: 'manual' as const, base: [0, 0] as [number, number] },
    { name: 'targeted-mail', platform: 'manual' as const, base: [0, 0] as [number, number] },
  ];
  const spend: SpendDaily[] = [];
  let si = 0;
  for (let d = 0; d < 180; d++) {
    const date = addD(startDate, d);
    const ds = fmt(date);
    const wknd = date.getDay() === 0 || date.getDay() === 6;
    for (const c of campaigns) {
      if (c.base[1] === 0) {
        if (r() < 0.02) spend.push({ id: uid('spend', si++), date: ds, platform: c.platform, campaign_name: c.name, amount: randInt(500, 3000), location: pick(locations) });
        continue;
      }
      const amt = randFloat(c.base[0], c.base[1]) * (wknd ? 0.6 : 1);
      spend.push({ id: uid('spend', si++), date: ds, platform: c.platform, campaign_name: c.name, amount: +amt.toFixed(2), location: pick(locations) });
    }
  }

  // Content assets
  const contentTitles = [
    'Storm Damage Before/After', 'Customer Testimonial - Smith Family', 'Drone Roof Inspection',
    'Team Intro Video', 'Veterans Day Special', 'Spring Roofing Tips', 'Insurance Claim Guide',
    'Community Giveback Highlight', 'Metal Roof Installation', 'Gutter Guard Promo',
    'Pet Safety During Roof Work', 'Kids Safety Campaign', 'Behind the Scenes',
    'Winter Prep Checklist', 'Free Estimate CTA', 'Referral Program Launch',
    'Google Review Compilation', 'Facebook Ad - Storm Season', 'Instagram Reel - Quick Fix',
    'YouTube - Full Install', 'TikTok - Roofing Fails', 'Email Newsletter Banner',
    'Direct Mail Design - Spring', 'Yard Sign Photo', 'Website Hero Update',
    'Landing Page - Storm', 'Landing Page - Spring', 'Blog Post - Roof Lifespan',
    'Infographic - Roof Types', 'Radio Spot Script', 'Customer Thank You',
    'Before/After Compilation', 'Crew Spotlight - Jake', 'Crew Spotlight - Mike',
    'Community Event Photos', 'Charity Build Video', 'Product Showcase - Shingles',
    'FAQ Video Series #1', 'FAQ Video Series #2', 'Seasonal Offer Banner',
    'Social Proof Carousel', 'Neighborhood Showcase', 'Time-lapse Install',
    'Drone B-Roll Pack', 'Client Interview Template',
  ];
  const ctypes: ContentAsset['type'][] = ['video', 'photo', 'post', 'ad-creative'];
  const cstatuses: ContentAsset['status'][] = ['idea', 'in-production', 'editing', 'scheduled', 'published'];
  const chOpts = ['facebook', 'instagram', 'youtube', 'tiktok', 'website', 'mail'];

  const contentAssets: ContentAsset[] = contentTitles.map((title, i) => {
    const status = pick(cstatuses);
    return {
      id: uid('content', i),
      title,
      type: pick(ctypes),
      status,
      owner: pick(reps).name,
      due_date: fmt(addD(today, randInt(-30, 60))),
      publish_date: status === 'published' ? fmt(addD(startDate, randInt(0, 170))) : undefined,
      channels: Array.from(new Set([pick(chOpts), pick(chOpts)])),
      linked_source_id: r() > 0.4 ? pick(sources).id : undefined,
      notes: '',
      performance: status === 'published' ? { views: randInt(200, 50000), clicks: randInt(10, 2000), leads: randInt(0, 30) } : undefined,
    };
  });

  // Web agendas
  const themes = [
    'Storm Season Kickoff', 'Spring Refresh', 'Insurance Awareness', 'Community Giveback',
    'Referral Blitz', 'Summer Push', 'Metal Roof Promo', 'Back to School Safety',
    'Fall Inspection', 'Holiday Gratitude', 'Year-End Close', 'New Year Launch',
    "Valentine's Home Love", 'March Madness Deals', 'Easter Special', 'Earth Day Green Roofs',
    "Mother's Day Promo", 'Memorial Day Sale', "Father's Day Special", 'July 4th Push',
    'Dog Days Deals', 'Labor Day Blitz', 'October Fest', 'Veterans Week',
    'Thanksgiving Thanks', 'Winter Prep Final',
  ];
  const webAgendas: WebAgenda[] = themes.map((theme, i) => ({
    id: uid('agenda', i),
    week_start: fmt(addD(startDate, i * 7)),
    theme,
    goal: `Drive ${randInt(15, 40)} leads in ${pick(locations)}`,
    primary_offer: pick(['Free Estimate', '$500 Off', 'Free Inspection', '0% Financing', 'Referral Bonus']),
    target_area: pick(locations),
    landing_page_url: `https://allamericanroofpros.com/${theme.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    talking_points: ['Highlight seasonal urgency', 'Mention limited-time offer', 'Push Google reviews', 'Reference local weather events'],
    ctas: ['Call Now', 'Book Free Estimate', 'Get Your Roof Score'],
    associated_sources: [pick(sources).id, pick(sources).id],
    content_assets: [pick(contentAssets).id],
    budget_plan: { google: randInt(800, 3000), meta: randInt(400, 2000), mail: randInt(0, 1500), signs: randInt(0, 500) },
    kpis: { leads_target: randInt(15, 50), cpl_target: randInt(40, 120), revenue_target: randInt(30000, 120000) },
  }));

  // Scorecards
  const scorecards: Scorecard[] = [];
  for (let i = 0; i < 10; i++) {
    const isM = i < 3;
    const gap = isM ? 30 : 7;
    const sd = addD(today, -(i + 1) * gap);
    const ed = addD(sd, gap - 1);
    const sp = randInt(3000, 15000);
    const ld = randInt(30, 120);
    const rev = randInt(20000, 150000);
    scorecards.push({
      id: uid('sc', i),
      period: isM ? 'monthly' : 'weekly',
      start_date: fmt(sd),
      end_date: fmt(ed),
      owner: pick(reps).name,
      summary: `${isM ? 'Monthly' : 'Weekly'} performance review`,
      metrics: {
        spend: sp, leads: ld, cpl: +(sp / ld).toFixed(2),
        appointments: Math.round(ld * (0.4 + r() * 0.3)),
        close_rate: +(0.15 + r() * 0.35).toFixed(2),
        revenue: rev, roas: +(rev / sp).toFixed(2), gross_profit_est: +(rev * 0.48).toFixed(2),
      },
      grade: pick(['green', 'yellow', 'red'] as const),
      notes: 'Review completed.',
      action_items: [
        { text: 'Increase Google budget by 15%', owner: pick(reps).name, due_date: fmt(addD(today, 7)), status: 'open' },
        { text: 'Fix tracking on storm landing page', owner: 'Marketing', due_date: fmt(addD(today, 3)), status: 'open' },
        { text: 'Schedule rep coaching session', owner: pick(reps).name, due_date: fmt(addD(today, 5)), status: 'open' },
      ],
    });
  }

  const connectors: ConnectorStatus[] = [
    { id: 'conn-01', name: 'Google Ads', status: 'connected', last_sync: fmt(today), health_message: 'Syncing normally. Last 24h data imported.', mock_requirements_needed: [] },
    { id: 'conn-02', name: 'Meta Ads', status: 'connected', last_sync: fmt(addD(today, -1)), health_message: 'Connected. Minor delay in attribution data.', mock_requirements_needed: [] },
    { id: 'conn-03', name: 'GiddyUp CRM', status: 'connected', last_sync: fmt(today), health_message: 'Real-time sync active.', mock_requirements_needed: [] },
    { id: 'conn-04', name: 'GA4', status: 'error', last_sync: fmt(addD(today, -3)), health_message: 'Token expired. Re-auth required.', mock_requirements_needed: ['Re-authenticate with Google', 'Verify GA4 property ID'] },
    { id: 'conn-05', name: 'Call Tracking', status: 'connected', last_sync: fmt(today), health_message: 'All call sources tracked.', mock_requirements_needed: [] },
    { id: 'conn-06', name: 'Mail/DOPE', status: 'disconnected', last_sync: '', health_message: 'Not configured. Connect to import mail campaign data.', mock_requirements_needed: ['API key from DOPE provider', 'Campaign ID mapping'] },
  ];

  return { sources, reps, mappingRules, spend, leads, deals, contentAssets, webAgendas, scorecards, connectors };
}

import type { MockData, CanonicalSource, Rep, MappingRule, SpendDaily, Lead, Deal, ContentAsset, WebAgenda, Scorecard, ConnectorStatus, Contact, Session, WebEvent, Video, VideoEvent } from './types';

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
  const fmtTs = (d: Date) => d.toISOString();
  const addD = (d: Date, n: number) => new Date(d.getTime() + n * dayMs);
  const addH = (d: Date, h: number) => new Date(d.getTime() + h * 3600000);
  const addM = (d: Date, m: number) => new Date(d.getTime() + m * 60000);

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
  const pages = ['/', '/free-estimate', '/storm-damage', '/services', '/about', '/contact', '/reviews', '/eddm-offer', '/spring-special', '/gallery', '/insurance-claims', '/blog/roof-lifespan', '/blog/storm-prep'];
  const firstNames = ['James','Mary','Robert','Patricia','John','Jennifer','Michael','Linda','David','Barbara','William','Elizabeth','Chris','Susan','Daniel','Jessica','Tom','Sarah','Mark','Karen','Steve','Nancy','Brian','Lisa','Gary','Betty','Kevin','Dorothy','Jason','Margaret'];
  const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Clark','Lewis','Robinson','Walker','Young','Allen'];

  // Generate contacts
  const contacts: Contact[] = [];
  for (let i = 0; i < 800; i++) {
    const dayOff = randInt(0, 179);
    const created = addD(startDate, dayOff);
    const firstSrc = pick(sources);
    const lastSrc = r() > 0.5 ? firstSrc : pick(sources);
    const stage: Contact['lifecycle_stage'] = pick(['anonymous', 'lead', 'opportunity', 'customer']);
    const fn = pick(firstNames);
    const ln = pick(lastNames);
    contacts.push({
      id: uid('ct', i),
      created_at: fmtTs(created),
      email: stage !== 'anonymous' ? `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@email.com` : undefined,
      phone: stage !== 'anonymous' && r() > 0.3 ? `555-${randInt(100,999)}-${randInt(1000,9999)}` : undefined,
      name: stage !== 'anonymous' ? `${fn} ${ln}` : undefined,
      first_seen_at: fmtTs(created),
      last_seen_at: fmtTs(addD(created, randInt(0, 30))),
      first_touch_source_id: firstSrc.id,
      last_touch_source_id: lastSrc.id,
      lifecycle_stage: stage,
    });
  }

  // Generate leads with contact_id linkage
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
    const contactIdx = i < 800 ? i : randInt(0, 799);
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
      contact_id: uid('ct', contactIdx),
    });
  }

  // Deals
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

  // Sessions (5000+)
  const sessions: Session[] = [];
  const referrers = ['https://google.com', 'https://facebook.com', '', 'https://yelp.com', 'https://nextdoor.com', ''];
  for (let i = 0; i < 5200; i++) {
    const dayOff = randInt(0, 179);
    const date = addD(startDate, dayOff);
    const hour = randInt(6, 23);
    const start = addH(date, hour);
    const dur = randInt(1, 45);
    const end = addM(start, dur);
    const utm = pickUtm();
    const hasContact = r() > 0.4;
    const cIdx = hasContact ? randInt(0, Math.min(i, 799)) : -1;
    sessions.push({
      id: uid('sess', i),
      started_at: fmtTs(start),
      ended_at: fmtTs(end),
      anonymous_id: uid('anon', i % 2000),
      contact_id: cIdx >= 0 ? uid('ct', cIdx) : undefined,
      landing_page: pick(pages),
      referrer: pick(referrers),
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      device: r() > 0.55 ? 'mobile' : 'desktop',
      location: pick(locations),
    });
  }

  // Web events (40000+)
  const eventNames: WebEvent['name'][] = ['session_start', 'page_view', 'scroll', 'click', 'form_start', 'form_submit', 'cta_click', 'exit', 'time_on_page'];
  const events: WebEvent[] = [];
  for (let i = 0; i < 42000; i++) {
    const sess = sessions[i % sessions.length];
    const evtName = pick(eventNames);
    const tOffset = randInt(0, 30) * 60000;
    const ts = new Date(new Date(sess.started_at).getTime() + tOffset);
    events.push({
      id: uid('evt', i),
      ts: fmtTs(ts),
      session_id: sess.id,
      anonymous_id: sess.anonymous_id,
      contact_id: sess.contact_id,
      name: evtName,
      props: {
        url: evtName === 'page_view' || evtName === 'exit' ? pick(pages) : undefined,
        title: evtName === 'page_view' ? pick(['Home', 'Free Estimate', 'Storm Damage', 'Services', 'About Us', 'Reviews', 'Contact']) : undefined,
        scroll_pct: evtName === 'scroll' ? pick([25, 50, 75, 100]) : undefined,
        button_id: evtName === 'click' || evtName === 'cta_click' ? pick(['cta-hero', 'cta-sidebar', 'phone-click', 'chat-open', 'nav-services']) : undefined,
        form_id: evtName === 'form_start' || evtName === 'form_submit' ? pick(['estimate-form', 'contact-form', 'callback-form']) : undefined,
        duration_sec: evtName === 'time_on_page' ? randInt(5, 300) : undefined,
      },
    });
  }

  // Videos
  const videoTitles = [
    'Storm Damage Roof Repair', 'Customer Testimonial - Johnson Family', 'Why Choose AARP',
    'Metal Roof Installation Guide', 'Insurance Claims Made Easy', 'Spring Roofing Tips',
    'Behind the Scenes: A Day with the Crew', 'Drone Inspection Showcase',
    'Before & After: Complete Tear-Off', 'Community Giveback Highlight',
    'Gutter Guard Benefits', 'Veterans Appreciation Special', 'Roof Maintenance 101',
    'Emergency Leak Repair', 'Financing Options Explained',
  ];
  const videos: Video[] = videoTitles.map((title, i) => ({
    id: uid('vid', i),
    title,
    platform: pick(['youtube', 'vimeo', 'hosted'] as const),
    url: `https://example.com/videos/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    linked_source_id: r() > 0.5 ? pick(sources).id : undefined,
  }));

  // Video events (8000+)
  const videoEventNames: VideoEvent['name'][] = ['impression', 'play', 'progress', 'complete', 'dropoff'];
  const milestones: (25 | 50 | 75 | 90 | 100)[] = [25, 50, 75, 90, 100];
  const videoEvents: VideoEvent[] = [];
  for (let i = 0; i < 8500; i++) {
    const sess = sessions[i % sessions.length];
    const vid = pick(videos);
    const evtName = pick(videoEventNames);
    const tOffset = randInt(0, 20) * 60000;
    const ts = new Date(new Date(sess.started_at).getTime() + tOffset);
    videoEvents.push({
      id: uid('vevt', i),
      ts: fmtTs(ts),
      video_id: vid.id,
      session_id: sess.id,
      anonymous_id: sess.anonymous_id,
      contact_id: sess.contact_id,
      name: evtName,
      props: {
        percent: evtName === 'progress' || evtName === 'complete' ? (evtName === 'complete' ? 100 : pick(milestones)) : undefined,
        timecode_sec: evtName === 'dropoff' ? randInt(5, 180) : undefined,
      },
    });
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
  for (let i = 0; i < 12; i++) {
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

  return { sources, reps, mappingRules, spend, leads, deals, contacts, sessions, events, videos, videoEvents, contentAssets, webAgendas, scorecards, connectors };
}

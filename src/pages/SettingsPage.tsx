import { Settings as SettingsIcon, Building2, MapPin, Users, Shield, Activity } from 'lucide-react';
import { useSystemHealth } from '@/hooks/useApi';

const sections = [
  { icon: Building2, title: 'Company Settings', desc: 'Business name, logo, contact info, timezone', status: 'Placeholder' },
  { icon: MapPin, title: 'Locations', desc: 'Manage service areas: Mansfield, Sandusky, Huron', status: 'Placeholder' },
  { icon: Users, title: 'Team & Roles', desc: 'Admin, Marketing, Sales Manager, Rep role assignments', status: 'Placeholder' },
  { icon: Shield, title: 'Permissions', desc: 'Control who can view/edit dashboards, budgets, and data', status: 'Placeholder' },
];

export default function SettingsPage() {
  const { data: health } = useSystemHealth();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Settings</h2>
      <p className="text-xs text-muted-foreground">Configuration and administration (scaffolded for future implementation)</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
        {sections.map(s => (
          <div key={s.title} className="bg-card rounded-lg border border-border p-4 hover:border-primary/20 transition-colors">
            <div className="flex items-start gap-3">
              <div className="bg-secondary rounded p-2"><s.icon size={18} className="text-muted-foreground" /></div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">{s.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                <span className="inline-block mt-2 px-2 py-0.5 text-[10px] rounded bg-secondary text-muted-foreground font-medium">{s.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {health && (
        <div className="max-w-3xl">
          <h3 className="text-sm font-bold flex items-center gap-1.5 mb-3"><Activity size={14} className="text-primary" /> System Health</h3>
          <div className="bg-card rounded-lg border border-border p-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'DB Version', value: String(health.db.version) },
                { label: 'Cache Entries', value: String(health.cache.entries) },
                { label: 'Active Jobs', value: String(health.db.activeJobs) },
                { label: 'Total Jobs', value: String(health.db.totalJobs) },
                { label: 'Contacts', value: health.db.contacts.toLocaleString() },
                { label: 'Sessions', value: health.db.sessions.toLocaleString() },
                { label: 'Web Events', value: health.db.events.toLocaleString() },
                { label: 'Video Events', value: health.db.videoEvents.toLocaleString() },
                { label: 'Leads', value: health.db.leads.toLocaleString() },
                { label: 'Deals', value: health.db.deals.toLocaleString() },
                { label: 'Spend Records', value: health.db.spend.toLocaleString() },
                { label: 'Sync Logs', value: String(health.db.syncLogs) },
              ].map(m => (
                <div key={m.label} className="bg-secondary/50 rounded p-2 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase">{m.label}</p>
                  <p className="text-sm font-bold">{m.value}</p>
                </div>
              ))}
            </div>
            {health.cache.lastRefresh && (
              <p className="text-[10px] text-muted-foreground">Last cache refresh: {health.cache.lastRefresh.slice(0, 19).replace('T', ' ')}</p>
            )}
            <div>
              <h4 className="text-xs font-semibold mb-1.5">Connector Status</h4>
              <div className="flex gap-2 flex-wrap">
                {health.connectors.map(c => (
                  <span key={c.name} className={`px-2 py-1 rounded text-[10px] font-medium ${c.status === 'connected' ? 'bg-status-green/20 text-status-green' : c.status === 'error' ? 'bg-status-yellow/20 text-status-yellow' : 'bg-status-red/20 text-status-red'}`}>
                    {c.name}: {c.status}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

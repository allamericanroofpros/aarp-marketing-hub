import { Settings as SettingsIcon, Building2, MapPin, Users, Shield } from 'lucide-react';

const sections = [
  { icon: Building2, title: 'Company Settings', desc: 'Business name, logo, contact info, timezone', status: 'Placeholder' },
  { icon: MapPin, title: 'Locations', desc: 'Manage service areas: Mansfield, Sandusky, Huron', status: 'Placeholder' },
  { icon: Users, title: 'Team & Roles', desc: 'Admin, Marketing, Sales Manager, Rep role assignments', status: 'Placeholder' },
  { icon: Shield, title: 'Permissions', desc: 'Control who can view/edit dashboards, budgets, and data', status: 'Placeholder' },
];

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Settings</h2>
      <p className="text-xs text-muted-foreground">Configuration and administration (scaffolded for future implementation)</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
        {sections.map(s => (
          <div key={s.title} className="bg-card rounded-lg border border-border p-4 hover:border-primary/20 transition-colors">
            <div className="flex items-start gap-3">
              <div className="bg-secondary rounded p-2">
                <s.icon size={18} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">{s.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                <span className="inline-block mt-2 px-2 py-0.5 text-[10px] rounded bg-secondary text-muted-foreground font-medium">
                  {s.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

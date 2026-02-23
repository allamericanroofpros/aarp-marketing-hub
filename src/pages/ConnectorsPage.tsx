import { useState } from 'react';
import { getMockData } from '@/data/mockState';
import { Cable, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const connectorIcons: Record<string, string> = {
  'Google Ads': '🔍', 'Meta Ads': '📘', 'GiddyUp CRM': '🤠', 'GA4': '📊', 'Call Tracking': '📞', 'Mail/DOPE': '✉️',
};

const connectorData: Record<string, string> = {
  'Google Ads': 'Spend, clicks, impressions, conversions',
  'Meta Ads': 'Spend, reach, leads, conversions',
  'GiddyUp CRM': 'Leads, deals, appointments, rep activity',
  'GA4': 'Sessions, page views, events, goals',
  'Call Tracking': 'Inbound calls, duration, source, recordings',
  'Mail/DOPE': 'Mail drops, delivery rates, response tracking',
};

export default function ConnectorsPage() {
  const data = getMockData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? data.connectors.find(c => c.id === selectedId) : null;

  const statusIcon = (s: string) => {
    if (s === 'connected') return <CheckCircle2 size={16} className="text-status-green" />;
    if (s === 'error') return <AlertTriangle size={16} className="text-status-yellow" />;
    return <XCircle size={16} className="text-status-red" />;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Connectors</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.connectors.map(c => (
          <button key={c.id} onClick={() => setSelectedId(c.id)}
            className={`text-left bg-card rounded-lg border p-4 transition-colors hover:border-primary/30 ${selectedId === c.id ? 'border-primary/50' : 'border-border'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{connectorIcons[c.name] || '🔌'}</span>
                <span className="text-sm font-semibold">{c.name}</span>
              </div>
              {statusIcon(c.status)}
            </div>
            <p className="text-[10px] text-muted-foreground">{c.health_message}</p>
            {c.last_sync && <p className="text-[10px] text-muted-foreground mt-1">Last sync: {c.last_sync}</p>}
          </button>
        ))}
      </div>

      {selected && (
        <div className="bg-card rounded-lg border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{connectorIcons[selected.name] || '🔌'}</span>
              <div>
                <h3 className="text-sm font-bold">{selected.name}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {statusIcon(selected.status)}
                  <span className={`text-xs font-medium ${selected.status === 'connected' ? 'text-status-green' : selected.status === 'error' ? 'text-status-yellow' : 'text-status-red'}`}>
                    {selected.status}
                  </span>
                </div>
              </div>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded font-medium border border-border text-muted-foreground hover:bg-secondary transition-colors">
              {selected.status === 'connected' ? <><RefreshCw size={12} /> Re-sync</> : <><Cable size={12} /> Connect</>}
            </button>
          </div>

          <div>
            <h4 className="text-xs font-semibold mb-1">Data Provided</h4>
            <p className="text-xs text-muted-foreground">{connectorData[selected.name] || 'Various data points'}</p>
          </div>

          {selected.status === 'error' && (
            <div className="bg-status-yellow/10 border border-status-yellow/20 rounded p-3">
              <h4 className="text-xs font-semibold text-status-yellow mb-1">⚠️ Error Details</h4>
              <p className="text-xs text-muted-foreground">{selected.health_message}</p>
            </div>
          )}

          {selected.mock_requirements_needed.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold mb-1.5">Requirements to Connect</h4>
              <ul className="space-y-1">
                {selected.mock_requirements_needed.map((req, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="text-primary">•</span> {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selected.status !== 'connected' && (
            <div className="bg-secondary/50 rounded p-3 border border-border">
              <h4 className="text-xs font-semibold mb-1">Permissions Needed</h4>
              <p className="text-[10px] text-muted-foreground">Read access to campaign data, spend reports, and conversion tracking. No write permissions required.</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-card rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold mb-3">Sync Logs</h3>
        <div className="space-y-2">
          {[
            { time: '2026-02-23 08:15', connector: 'Google Ads', status: 'success', msg: 'Imported 4 campaigns, 847 clicks' },
            { time: '2026-02-23 08:10', connector: 'GiddyUp CRM', status: 'success', msg: 'Synced 12 new leads, 3 deal updates' },
            { time: '2026-02-23 07:45', connector: 'Meta Ads', status: 'success', msg: 'Imported 2 ad sets, 312 impressions' },
            { time: '2026-02-22 14:30', connector: 'GA4', status: 'error', msg: 'OAuth token expired. Re-authentication required.' },
            { time: '2026-02-22 08:00', connector: 'Call Tracking', status: 'success', msg: 'Synced 28 calls, 6 with recordings' },
          ].map((log, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <span className="text-muted-foreground w-32 shrink-0">{log.time}</span>
              <span className="font-medium w-24 shrink-0">{log.connector}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${log.status === 'success' ? 'bg-status-green/20 text-status-green' : 'bg-status-red/20 text-status-red'}`}>
                {log.status}
              </span>
              <span className="text-muted-foreground">{log.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

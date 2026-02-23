import { useState } from 'react';
import { getMockData } from '@/data/mockState';
import type { ContentAsset } from '@/data/types';
import { Film, Image, FileText, Palette, Eye, MousePointerClick, Users } from 'lucide-react';

const statusCols: { key: ContentAsset['status']; label: string; color: string }[] = [
  { key: 'idea', label: 'Ideas', color: 'border-muted-foreground/30' },
  { key: 'in-production', label: 'Production', color: 'border-primary/50' },
  { key: 'editing', label: 'Editing', color: 'border-status-yellow/50' },
  { key: 'scheduled', label: 'Scheduled', color: 'border-chart-5/50' },
  { key: 'published', label: 'Published', color: 'border-status-green/50' },
];

const typeIcon: Record<string, any> = { video: Film, photo: Image, post: FileText, 'ad-creative': Palette };

export default function ContentStudio() {
  const data = getMockData();
  const [view, setView] = useState<'board' | 'performance' | 'checklist'>('board');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Content Studio</h2>
        <div className="flex gap-1">
          {(['board', 'performance', 'checklist'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
              {v === 'board' ? 'Kanban' : v === 'performance' ? 'Performance' : 'Shoot Checklist'}
            </button>
          ))}
        </div>
      </div>

      {view === 'board' && (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {statusCols.map(col => {
            const items = data.contentAssets.filter(a => a.status === col.key);
            return (
              <div key={col.key} className={`min-w-[220px] flex-1 bg-card rounded-lg border-t-2 ${col.color} border border-border`}>
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider">{col.label}</span>
                  <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{items.length}</span>
                </div>
                <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                  {items.map(item => {
                    const Icon = typeIcon[item.type] || FileText;
                    return (
                      <div key={item.id} className="bg-secondary/50 rounded p-2.5 border border-border/50 hover:border-primary/30 transition-colors">
                        <div className="flex items-start gap-2">
                          <Icon size={13} className="text-muted-foreground mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{item.title}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{item.owner} · Due {item.due_date}</p>
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {item.channels.map(ch => (
                                <span key={ch} className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground">{ch}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {items.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-4">No items</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'performance' && (
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold mb-3">Published Content Performance</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                <th className="text-left py-2 px-2">Title</th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Published</th>
                <th className="text-left py-2 px-2">Channels</th>
                <th className="text-right py-2 px-2"><Eye size={10} className="inline" /> Views</th>
                <th className="text-right py-2 px-2"><MousePointerClick size={10} className="inline" /> Clicks</th>
                <th className="text-right py-2 px-2"><Users size={10} className="inline" /> Leads</th>
              </tr>
            </thead>
            <tbody>
              {data.contentAssets.filter(a => a.status === 'published' && a.performance).map(a => (
                <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-1.5 px-2 font-medium">{a.title}</td>
                  <td className="py-1.5 px-2 text-muted-foreground">{a.type}</td>
                  <td className="py-1.5 px-2">{a.publish_date}</td>
                  <td className="py-1.5 px-2">{a.channels.join(', ')}</td>
                  <td className="text-right py-1.5 px-2">{a.performance!.views.toLocaleString()}</td>
                  <td className="text-right py-1.5 px-2">{a.performance!.clicks.toLocaleString()}</td>
                  <td className="text-right py-1.5 px-2 font-medium">{a.performance!.leads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'checklist' && (
        <div className="bg-card rounded-lg border border-border p-5 max-w-2xl">
          <h3 className="text-sm font-semibold mb-4">🎬 Shoot Day Checklist</h3>
          {[
            { cat: 'B-Roll List', items: ['Crew arriving on site', 'Roof tear-off close-up', 'Material staging area', 'Installation progress shots', 'Final completed roof (multiple angles)', 'Drone flyover of completed work', 'Neighborhood establishing shot'] },
            { cat: 'Customer Testimonials', items: ['Pre-interview: homeowner story & pain points', 'During: reaction to progress', 'Post: satisfaction & recommendation quote', 'Sign release form'] },
            { cat: 'Before/After Shots', items: ['Wide angle before (same position)', 'Detail shots of damage', 'Wide angle after (exact same position)', 'Detail shots of new materials'] },
            { cat: 'Team Intros', items: ['Project manager intro & role', 'Lead installer intro', 'Company values soundbite'] },
            { cat: 'Community Giveback', items: ['Veterans appreciation content', 'Pet safety during roofing tips', 'Kids safety zone walkthrough', 'Neighborhood cleanup shots'] },
          ].map(section => (
            <div key={section.cat} className="mb-4">
              <h4 className="text-xs font-semibold text-primary mb-2">{section.cat}</h4>
              <div className="space-y-1">
                {section.items.map(item => (
                  <label key={item} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                    <input type="checkbox" className="rounded border-border bg-secondary" />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

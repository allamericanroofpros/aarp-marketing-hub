import { Outlet, Link, useLocation } from 'react-router-dom';
import { useFilter, DatePreset } from '@/contexts/FilterContext';
import { resetMockData } from '@/data/mockState';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, TrendingUp, Filter, Film, CalendarDays,
  MessageSquareText, GitBranch, Cable, ClipboardList, Settings,
  Monitor, RotateCcw,
} from 'lucide-react';

const navItems = [
  { label: 'Home', path: '/', icon: LayoutDashboard },
  { label: 'Performance', path: '/performance', icon: TrendingUp },
  { label: 'Pipeline', path: '/pipeline', icon: Filter },
  { label: 'Content Studio', path: '/content', icon: Film },
  { label: 'Web Agendas', path: '/agendas', icon: CalendarDays },
  { label: 'Assistant', path: '/assistant', icon: MessageSquareText },
  { label: 'Sources', path: '/sources', icon: GitBranch },
  { label: 'Connectors', path: '/connectors', icon: Cable },
  { label: 'Scorecards', path: '/scorecards', icon: ClipboardList },
  { label: 'Settings', path: '/settings', icon: Settings },
];

const datePresets: { value: DatePreset; label: string }[] = [
  { value: 'last7', label: '7d' },
  { value: 'last30', label: '30d' },
  { value: 'mtd', label: 'MTD' },
  { value: 'qtd', label: 'QTD' },
  { value: 'ytd', label: 'YTD' },
];

const allLocations = ['Mansfield', 'Sandusky', 'Huron'];

export default function AppLayout() {
  const location = useLocation();
  const f = useFilter();

  const handleReset = () => { resetMockData(); window.location.reload(); };

  return (
    <div className={cn('flex flex-col h-screen', f.tvMode && 'tv-mode')}>
      {/* Demo banner */}
      <div className="bg-accent/10 text-center py-1 text-xs font-medium text-accent shrink-0 border-b border-accent/20">
        Demo Mode – Mock Data
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={cn(
          'shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col transition-all duration-200',
          f.tvMode ? 'w-14' : 'w-52'
        )}>
          <div className="p-3 border-b border-sidebar-border">
            {!f.tvMode ? (
              <>
                <h1 className="text-xs font-bold text-sidebar-primary tracking-wide">AARP MARKETING OS</h1>
                <p className="text-[10px] text-sidebar-foreground/50 mt-0.5">All American Roof Pros</p>
              </>
            ) : (
              <span className="text-sm font-bold text-sidebar-primary block text-center">A</span>
            )}
          </div>
          <nav className="flex-1 py-1.5 overflow-y-auto">
            {navItems.map(item => {
              const active = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors',
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground border-r-2 border-sidebar-primary font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  )}
                >
                  <item.icon size={16} className="shrink-0" />
                  {!f.tvMode && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
          {!f.tvMode && (
            <div className="p-3 border-t border-sidebar-border">
              <p className="text-[9px] text-sidebar-foreground/30 italic leading-tight">
                "Know what's working. Scale what wins."
              </p>
            </div>
          )}
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="h-11 border-b border-border px-3 flex items-center gap-1.5 shrink-0 bg-card">
            {datePresets.map(p => (
              <button
                key={p.value}
                onClick={() => f.setDatePreset(p.value)}
                className={cn(
                  'px-2 py-1 text-[11px] rounded font-medium transition-colors',
                  f.datePreset === p.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                )}
              >
                {p.label}
              </button>
            ))}

            <div className="w-px h-5 bg-border mx-1" />

            <button
              onClick={() => f.setLocations([])}
              className={cn(
                'px-2 py-1 text-[11px] rounded font-medium transition-colors',
                f.locations.length === 0 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
              )}
            >
              All
            </button>
            {allLocations.map(loc => (
              <button
                key={loc}
                onClick={() => f.setLocations(
                  f.locations.includes(loc) ? f.locations.filter(l => l !== loc) : [...f.locations, loc]
                )}
                className={cn(
                  'px-2 py-1 text-[11px] rounded font-medium transition-colors',
                  f.locations.includes(loc) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                )}
              >
                {loc}
              </button>
            ))}

            <div className="flex-1" />

            <button
              onClick={() => f.setTvMode(!f.tvMode)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 text-[11px] rounded font-medium transition-colors',
                f.tvMode ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-secondary'
              )}
            >
              <Monitor size={12} />
              TV
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2 py-1 text-[11px] rounded font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          </header>

          <main className={cn('flex-1 overflow-auto', f.tvMode ? 'p-3' : 'p-5')}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

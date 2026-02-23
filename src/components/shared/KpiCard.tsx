import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  delta?: number;
  invertDelta?: boolean;
  className?: string;
}

export function KpiCard({ label, value, delta, invertDelta, className }: KpiCardProps) {
  const displayDelta = invertDelta && delta !== undefined ? -delta : delta;
  const isPositive = displayDelta !== undefined && displayDelta >= 0;

  return (
    <div className={cn('bg-card rounded-lg border border-border p-3.5', className)}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
      {delta !== undefined && (
        <div className="flex items-center gap-1 mt-1">
          {isPositive
            ? <ArrowUp size={11} className="text-status-green" />
            : <ArrowDown size={11} className="text-status-red" />}
          <span className={cn('text-[11px] font-medium', isPositive ? 'text-status-green' : 'text-status-red')}>
            {Math.abs(displayDelta!).toFixed(1)}%
          </span>
          <span className="text-[10px] text-muted-foreground">vs prev</span>
        </div>
      )}
    </div>
  );
}

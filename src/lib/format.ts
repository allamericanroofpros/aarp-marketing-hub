export const fmt$ = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
export const fmtN = (n: number) => new Intl.NumberFormat('en-US').format(Math.round(n));
export const fmtP = (n: number) => (n * 100).toFixed(1) + '%';

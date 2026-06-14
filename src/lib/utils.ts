export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function getRiskColor(risk: 'Low' | 'Medium' | 'High' | string): string {
  switch (risk.toLowerCase()) {
    case 'low':
      return 'text-emerald-400';
    case 'medium':
      return 'text-amber-400';
    case 'high':
      return 'text-rose-500';
    default:
      return 'text-slate-400';
  }
}

export function getRiskBg(risk: 'Low' | 'Medium' | 'High' | string): string {
  switch (risk.toLowerCase()) {
    case 'low':
      return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    case 'medium':
      return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    case 'high':
      return 'bg-rose-500/10 border-rose-500/20 text-rose-500';
    default:
      return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
  }
}

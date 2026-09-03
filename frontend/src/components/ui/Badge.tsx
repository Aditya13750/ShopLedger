import React from 'react';

export interface BadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'sm', className = '' }) => {
  const normalized = status.toUpperCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';

  if (normalized === 'PAID') {
    styles = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  } else if (normalized === 'PARTIALLY_PAID') {
    styles = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  } else if (normalized === 'UNPAID') {
    styles = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  } else if (normalized === 'SENT') {
    styles = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  } else if (normalized === 'DELIVERED') {
    styles = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
  } else if (normalized === 'READ') {
    styles = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  } else if (normalized === 'FAILED') {
    styles = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  } else if (normalized === 'PENDING') {
    styles = 'bg-slate-700/40 text-slate-300 border-slate-600';
  }

  const sizeStyle = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  const label = normalized.replace('_', ' ');

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border uppercase tracking-wider ${sizeStyle} ${styles} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {label}
    </span>
  );
};

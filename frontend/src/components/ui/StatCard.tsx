import React, { ReactNode } from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  colorScheme?: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendUp,
  colorScheme = 'emerald',
}) => {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-950/40',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-blue-950/40',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-purple-950/40',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-950/40',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-rose-950/40',
  };

  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px] hover:border-slate-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
            {value}
          </h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              <span
                className={`font-semibold ${
                  trendUp ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {trend}
              </span>
            </div>
          )}
        </div>
        <div
          className={`p-3 rounded-2xl border shadow-inner ${colorMap[colorScheme]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

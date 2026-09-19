import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiStatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  badgeText?: string;
  badgeColor?: 'teal' | 'amber' | 'red' | 'purple' | 'blue';
  icon: LucideIcon;
  iconBgColor?: string;
}

export function KpiStatCard({
  title,
  value,
  subtext,
  badgeText,
  badgeColor = 'teal',
  icon: Icon,
  iconBgColor = 'bg-teal-50 text-teal-700'
}: KpiStatCardProps) {
  const badgeClasses = {
    teal: 'bg-teal-100 text-teal-800 border-teal-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200'
  }[badgeColor];

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-2">
      <div className="flex justify-between items-start">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${iconBgColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        {badgeText && (
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badgeClasses}`}>
            {badgeText}
          </span>
        )}
      </div>
      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider line-clamp-1">
          {title}
        </p>
        <p className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
          {value}
        </p>
        {subtext && (
          <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

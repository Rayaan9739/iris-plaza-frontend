import React from "react";

interface StatItem {
  value: string;
  label: string;
  suffix?: string;
}

interface StatsGridProps {
  stats: StatItem[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {stats.map((stat, index) => (
        <div key={index} className="text-center">
          <div className="text-4xl md:text-5xl font-bold text-white mb-2">
            {stat.value}
            {stat.suffix && (
              <span className="text-emerald-400">{stat.suffix}</span>
            )}
          </div>
          <div className="text-slate-300 text-lg">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

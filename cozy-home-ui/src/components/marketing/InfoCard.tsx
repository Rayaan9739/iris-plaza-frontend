import React from "react";

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

export function InfoCard({
  icon,
  title,
  description,
  delay = 0,
}: InfoCardProps) {
  return (
    <div
      className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-slate-100"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

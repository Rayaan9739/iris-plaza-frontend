import React from "react";

interface ContactInfo {
  icon: React.ReactNode;
  title: string;
  details: string[];
}

interface ContactInfoCardProps {
  info: ContactInfo;
}

export function ContactInfoCard({ info }: ContactInfoCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
      <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
        {info.icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">{info.title}</h3>
      {info.details.map((detail, index) => (
        <p key={index} className="text-slate-600 mb-1">
          {detail}
        </p>
      ))}
    </div>
  );
}

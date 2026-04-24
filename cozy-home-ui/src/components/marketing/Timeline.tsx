import React from "react";

interface TimelineItem {
  year: string;
  title: string;
  description: string;
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-emerald-200 hidden md:block" />

      {items.map((item, index) => (
        <div
          key={index}
          className={`relative flex items-center mb-12 last:mb-0 ${
            index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
          }`}
        >
          {/* Content */}
          <div
            className={`flex-1 ${index % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"}`}
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
              <span className="inline-block px-4 py-1 bg-emerald-100 text-emerald-700 font-semibold rounded-full text-sm mb-3">
                {item.year}
              </span>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {item.title}
              </h3>
              <p className="text-slate-600">{item.description}</p>
            </div>
          </div>

          {/* Dot */}
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-lg z-10" />

          {/* Empty space for opposite side */}
          <div className="flex-1 hidden md:block" />
        </div>
      ))}
    </div>
  );
}

import React, { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <button
            onClick={() => toggle(index)}
            className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <span className="font-semibold text-slate-900 pr-4">{item.question}</span>
            <span
              className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 transition-transform duration-200 ${
                openIndex === index ? "rotate-180" : ""
              }`}
            >
              <svg
                className="w-4 h-4 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </span>
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              openIndex === index ? "max-h-40" : "max-h-0"
            }`}
          >
            <p className="px-6 pb-5 text-slate-600 leading-relaxed">
              {item.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

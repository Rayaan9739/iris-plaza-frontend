import React from "react";
import { Link } from "react-router-dom";

interface CTASectionProps {
  title: string;
  description?: string;
  primaryCTA?: {
    text: string;
    link: string;
  };
  secondaryCTA?: {
    text: string;
    link: string;
  };
  light?: boolean;
}

export function CTASection({
  title,
  description,
  primaryCTA,
  secondaryCTA,
  light = false,
}: CTASectionProps) {
  return (
    <section className={`py-20 ${light ? "bg-white" : "bg-slate-900"}`}>
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2
          className={`text-4xl md:text-5xl font-bold mb-6 ${
            light ? "text-slate-900" : "text-white"
          }`}
        >
          {title}
        </h2>
        {description && (
          <p
            className={`text-xl mb-10 ${
              light ? "text-slate-600" : "text-slate-300"
            }`}
          >
            {description}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {primaryCTA && (
            <Link
              to={primaryCTA.link}
              className="px-8 py-4 hover:bg-emerald-600 text-white font-semibold bg-emerald-500 rounded-xl text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {primaryCTA.text}
            </Link>
          )}
          {secondaryCTA && (
            <Link
              to={secondaryCTA.link}
              className={`px-8 py-4 font-semibold rounded-xl text-lg transition-all duration-300 ${
                light
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-900"
                  : "bg-white/10 hover:bg-white/20 text-white border border-white/30"
              }`}
            >
              {secondaryCTA.text}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

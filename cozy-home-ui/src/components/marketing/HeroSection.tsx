import React from "react";
import { Link } from "react-router-dom";

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  backgroundImage?: string;
}

export function HeroSection({
  title,
  subtitle,
  ctaText = "Get Started",
  ctaLink = "/",
  secondaryCtaText,
  secondaryCtaLink,
  backgroundImage,
}: HeroSectionProps) {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: backgroundImage
            ? `url(${backgroundImage})`
            : "linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d7ab5 100%)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/70 to-slate-900/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in-up">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xl md:text-2xl text-slate-200 mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-100">
            {subtitle}
          </p>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-200">
          <Link
            to={ctaLink}
            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            {ctaText}
          </Link>
          {secondaryCtaText && (
            <Link
              to={secondaryCtaLink || "/contact"}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-lg transition-all duration-300 border border-white/30 backdrop-blur-sm"
            >
              {secondaryCtaText}
            </Link>
          )}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900/50 to-transparent" />
    </section>
  );
}

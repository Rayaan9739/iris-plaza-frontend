import React from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  alignment?: "left" | "center" | "right";
  light?: boolean;
}

export function SectionHeader({
  title,
  subtitle,
  alignment = "center",
  light = false,
}: SectionHeaderProps) {
  const alignmentClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <div className={`mb-12 ${alignmentClasses[alignment]}`}>
      <h2
        className={`text-4xl md:text-5xl font-bold mb-4 ${
          light ? "text-white" : "text-slate-900"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`text-lg md:text-xl max-w-2xl ${
            alignment === "center" ? "mx-auto" : ""
          } ${light ? "text-slate-300" : "text-slate-600"}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

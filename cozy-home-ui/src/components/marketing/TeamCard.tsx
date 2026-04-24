import React from "react";

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image?: string;
}

interface TeamCardProps {
  member: TeamMember;
}

export function TeamCard({ member }: TeamCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
      {/* Image placeholder */}
      <div className="h-64 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
        {member.image ? (
          <img
            src={member.image}
            alt={member.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-24 h-24 bg-slate-400 rounded-full flex items-center justify-center">
            <span className="text-4xl text-white font-bold">
              {member.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-1">{member.name}</h3>
        <p className="text-emerald-600 font-medium mb-4">{member.role}</p>
        <p className="text-slate-600 text-sm leading-relaxed">{member.bio}</p>
      </div>
    </div>
  );
}

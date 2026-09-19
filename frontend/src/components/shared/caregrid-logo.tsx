import React from 'react';

interface CareGridSymbolProps {
  className?: string;
  size?: number | string;
}

/**
 * Official CAREGRID Standalone Brand Mark: The Care Matrix Shield
 * Represents:
 * - Protective Shield Canopy (Institutional Public Health Governance & Safety)
 * - Referral Continuum Mesh (Care Coordination Grid)
 * - Four Coordinate Network Nodes (ASHA, MO Doctor, Specialist, Health Admin)
 * - Central Luminous Nexus (Citizen / Patient-Centric Healthcare Core)
 */
export function CareGridSymbol({ className = 'w-10 h-10', size }: CareGridSymbolProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div
      className={`rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 p-1.5 shadow-md flex items-center justify-center shrink-0 ${className}`}
      style={style}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-xs"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cg-sym-path" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ccfbf1" />
          </linearGradient>
          <linearGradient id="cg-sym-shield" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>

        {/* Protective Outer Shield Canopy Arc */}
        <path
          d="M50 14 C68 14, 82 24, 82 46 C82 66, 64 80, 50 86 C36 80, 18 66, 18 46 C18 24, 32 14, 50 14 Z"
          stroke="url(#cg-sym-shield)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="#0f766e"
          fillOpacity="0.35"
        />

        {/* Lateral Referral Continuum Arc (Grassroots-to-Specialist) */}
        <path
          d="M26 48 C36 36, 64 36, 74 48 C64 60, 36 60, 26 48 Z"
          stroke="url(#cg-sym-path)"
          strokeWidth="5"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Vertical Protective Spine (Governance & Supervision) */}
        <path
          d="M50 22 L50 78"
          stroke="url(#cg-sym-path)"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Central Luminous Care Nexus (Citizen Core) */}
        <circle cx="50" cy="48" r="7" fill="#ffffff" />
        <circle cx="50" cy="48" r="3.5" fill="#0d9488" />

        {/* 4 Coordinate Network Nodes */}
        <circle cx="26" cy="48" r="5" fill="#ffffff" />
        <circle cx="74" cy="48" r="5" fill="#ffffff" />
        <circle cx="50" cy="22" r="5" fill="#ffffff" />
        <circle cx="50" cy="78" r="5" fill="#ffffff" />
      </svg>
    </div>
  );
}

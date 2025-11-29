import React from 'react';

const FlagIcon: React.FC<{ countryCode: string; className?: string }> = ({ countryCode, className }) => {
  const flags: Record<string, React.ReactNode> = {
    VE: (
      <svg viewBox="0 0 5 3" className={className}>
        <rect width="5" height="3" y="0" fill="#FFCF00" />
        <rect width="5" height="2" y="1" fill="#00247D" />
        <rect width="5" height="1" y="2" fill="#CF142B" />
      </svg>
    ),
    PE: (
      <svg viewBox="0 0 3 2" className={className}>
        <rect width="1" height="2" fill="#D91023" />
        <rect width="1" height="2" x="1" fill="#FFFFFF" />
        <rect width="1" height="2" x="2" fill="#D91023" />
      </svg>
    ),
    CO: (
      <svg viewBox="0 0 3 2" className={className}>
        <rect width="3" height="1" y="0" fill="#FFCD00" />
        <rect width="3" height="0.5" y="1" fill="#003893" />
        <rect width="3" height="0.5" y="1.5" fill="#CE1126" />
      </svg>
    ),
    MX: (
      <svg viewBox="0 0 3 2" className={className}>
        <rect width="1" height="2" fill="#006847" />
        <rect width="1" height="2" x="1" fill="#FFFFFF" />
        <rect width="1" height="2" x="2" fill="#CE1126" />
      </svg>
    ),
    EC: (
      <svg viewBox="0 0 3 2" className={className}>
        <rect width="3" height="1" y="0" fill="#FFCD00" />
        <rect width="3" height="0.5" y="1" fill="#003893" />
        <rect width="3" height="0.5" y="1.5" fill="#CE1126" />
      </svg>
    ),
    CL: (
      <svg viewBox="0 0 3 2" className={className}>
        <rect width="3" height="1" fill="#FFFFFF" />
        <rect width="3" height="1" y="1" fill="#D52B1E" />
        <rect width="1" height="1" fill="#0039A6" />
      </svg>
    ),
    AR: (
      <svg viewBox="0 0 9 5" className={className}>
        <rect width="9" height="5" fill="#74ACDF" />
        <rect width="9" height="3" y="1" fill="#FFFFFF" />
      </svg>
    ),
    US: (
      <svg viewBox="0 0 20 12" className={className}>
        <defs>
          <g id="stripe">
            <rect width="20" height="1" fill="#B22234" />
            <rect width="20" height="1" y="2" fill="#B22234" />
            <rect width="20" height="1" y="4" fill="#B22234" />
            <rect width="20" height="1" y="6" fill="#B22234" />
            <rect width="20" height="1" y="8" fill="#B22234" />
            <rect width="20" height="1" y="10" fill="#B22234" />
          </g>
        </defs>
        <rect width="20" height="12" fill="#FFFFFF" />
        <use href="#stripe" />
        <rect width="9" height="6" fill="#3C3B6E" />
      </svg>
    ),
    ES: (
      <svg viewBox="0 0 3 2" className={className}>
        <rect width="3" height="2" fill="#C60B1E" />
        <rect width="3" height="1" y="0.5" fill="#FFC400" />
      </svg>
    ),
    BR: (
      <svg viewBox="0 0 20 14" className={className}>
        <rect width="20" height="14" fill="#009C3B" />
        <polygon points="10,2 18,7 10,12 2,7" fill="#FFDF00" />
        <circle cx="10" cy="7" r="3" fill="#002776" />
      </svg>
    ),
    DE: (
      <svg viewBox="0 0 5 3" className={className}>
        <rect width="5" height="1" y="0" fill="#000000" />
        <rect width="5" height="1" y="1" fill="#DD0000" />
        <rect width="5" height="1" y="2" fill="#FFCE00" />
      </svg>
    ),
    FR: (
      <svg viewBox="0 0 3 2" className={className}>
        <rect width="1" height="2" fill="#002395" />
        <rect width="1" height="2" x="1" fill="#FFFFFF" />
        <rect width="1" height="2" x="2" fill="#ED2939" />
      </svg>
    ),
    IT: (
      <svg viewBox="0 0 3 2" className={className}>
        <rect width="1" height="2" fill="#009246" />
        <rect width="1" height="2" x="1" fill="#FFFFFF" />
        <rect width="1" height="2" x="2" fill="#CE2B37" />
      </svg>
    ),
    PT: (
      <svg viewBox="0 0 3 2" className={className}>
        <rect width="3" height="2" fill="#FF0000" />
        <rect width="1.2" height="2" fill="#006600" />
      </svg>
    ),
    NL: (
      <svg viewBox="0 0 3 2" className={className}>
        <rect width="3" height="0.667" fill="#AE1C28" />
        <rect width="3" height="0.667" y="0.667" fill="#FFFFFF" />
        <rect width="3" height="0.666" y="1.334" fill="#21468B" />
      </svg>
    ),
    BE: (
      <svg viewBox="0 0 3 2" className={className}>
        <rect width="1" height="2" fill="#000000" />
        <rect width="1" height="2" x="1" fill="#FDDA24" />
        <rect width="1" height="2" x="2" fill="#EF3340" />
      </svg>
    ),
    PL: (
      <svg viewBox="0 0 5 3" className={className}>
        <rect width="5" height="1.5" fill="#FFFFFF" />
        <rect width="5" height="1.5" y="1.5" fill="#DC143C" />
      </svg>
    ),
    GR: (
      <svg viewBox="0 0 3 2" className={className}>
        <rect width="3" height="2" fill="#0D5EAF" />
        <rect width="3" height="0.222" fill="#FFFFFF" />
        <rect width="3" height="0.222" y="0.444" fill="#FFFFFF" />
        <rect width="3" height="0.222" y="0.889" fill="#FFFFFF" />
        <rect width="3" height="0.222" y="1.333" fill="#FFFFFF" />
        <rect width="3" height="0.222" y="1.778" fill="#FFFFFF" />
      </svg>
    ),
    GB: (
      <svg viewBox="0 0 60 30" className={className}>
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 L30,30 M0,15 L60,15" stroke="#FFFFFF" strokeWidth="10" />
        <path d="M30,0 L30,30 M0,15 L60,15" stroke="#C8102E" strokeWidth="6" />
      </svg>
    ),
    CA: (
      <svg viewBox="0 0 5 3" className={className}>
        <rect width="1.5" height="3" fill="#FF0000" />
        <rect width="2" height="3" x="1.5" fill="#FFFFFF" />
        <rect width="1.5" height="3" x="3.5" fill="#FF0000" />
        <polygon points="2.5,1 2.6,1.3 2.9,1.3 2.7,1.5 2.8,1.8 2.5,1.6 2.2,1.8 2.3,1.5 2.1,1.3 2.4,1.3" fill="#FF0000" />
      </svg>
    ),
    BO: (
      <svg viewBox="0 0 3 2" className={className}>
        <rect width="3" height="0.667" fill="#D52B1E" />
        <rect width="3" height="0.667" y="0.667" fill="#F9E300" />
        <rect width="3" height="0.666" y="1.334" fill="#007A33" />
      </svg>
    ),
    CR: (
      <svg viewBox="0 0 5 3" className={className}>
        <rect width="5" height="3" fill="#002B7F" />
        <rect width="5" height="2.4" y="0.3" fill="#FFFFFF" />
        <rect width="5" height="1.2" y="0.9" fill="#CE1126" />
      </svg>
    ),
    CU: (
      <svg viewBox="0 0 10 6" className={className}>
        <rect width="10" height="6" fill="#002A8F" />
        <rect width="10" height="1.2" fill="#FFFFFF" />
        <rect width="10" height="1.2" y="2.4" fill="#FFFFFF" />
        <rect width="10" height="1.2" y="4.8" fill="#FFFFFF" />
        <polygon points="0,0 4,3 0,6" fill="#CF142B" />
        <polygon points="1.5,3 2,2.5 2,3.5" fill="#FFFFFF" />
      </svg>
    ),
    DO: (
      <svg viewBox="0 0 3 2" className={className}>
        <rect width="3" height="2" fill="#002D62" />
        <rect width="3" height="1" y="0.5" fill="#FFFFFF" />
        <rect width="1.5" height="2" x="1.5" fill="#CE1126" />
      </svg>
    ),
    GT: (
      <svg viewBox="0 0 3 2" className={className}>
        <rect width="1" height="2" fill="#4997D0" />
        <rect width="1" height="2" x="1" fill="#FFFFFF" />
        <rect width="1" height="2" x="2" fill="#4997D0" />
      </svg>
    ),
    HN: (
      <svg viewBox="0 0 5 3" className={className}>
        <rect width="5" height="1" fill="#0073CF" />
        <rect width="5" height="1" y="1" fill="#FFFFFF" />
        <rect width="5" height="1" y="2" fill="#0073CF" />
      </svg>
    ),
    NI: (
      <svg viewBox="0 0 5 3" className={className}>
        <rect width="5" height="1" fill="#0067C6" />
        <rect width="5" height="1" y="1" fill="#FFFFFF" />
        <rect width="5" height="1" y="2" fill="#0067C6" />
      </svg>
    ),
    PA: (
      <svg viewBox="0 0 3 2" className={className}>
        <rect width="3" height="2" fill="#FFFFFF" />
        <rect width="1.5" height="1" fill="#DA121A" />
        <rect width="1.5" height="1" x="1.5" y="1" fill="#0000AB" />
        <polygon points="0.5,0.3 0.6,0.6 0.9,0.6 0.7,0.8 0.8,1.1 0.5,0.9 0.2,1.1 0.3,0.8 0.1,0.6 0.4,0.6" fill="#0000AB" />
        <polygon points="2.5,1.3 2.6,1.6 2.9,1.6 2.7,1.8 2.8,2.1 2.5,1.9 2.2,2.1 2.3,1.8 2.1,1.6 2.4,1.6" fill="#DA121A" />
      </svg>
    ),
    PY: (
      <svg viewBox="0 0 5 3" className={className}>
        <rect width="5" height="1" fill="#D52B1E" />
        <rect width="5" height="1" y="1" fill="#FFFFFF" />
        <rect width="5" height="1" y="2" fill="#0038A8" />
      </svg>
    ),
    SV: (
      <svg viewBox="0 0 5 3" className={className}>
        <rect width="5" height="1" fill="#0F47AF" />
        <rect width="5" height="1" y="1" fill="#FFFFFF" />
        <rect width="5" height="1" y="2" fill="#0F47AF" />
      </svg>
    ),
    UY: (
      <svg viewBox="0 0 9 6" className={className}>
        <rect width="9" height="6" fill="#FFFFFF" />
        <rect width="9" height="0.667" fill="#0038A8" />
        <rect width="9" height="0.667" y="1.333" fill="#0038A8" />
        <rect width="9" height="0.667" y="2.666" fill="#0038A8" />
        <rect width="9" height="0.667" y="4" fill="#0038A8" />
        <rect width="9" height="0.667" y="5.333" fill="#0038A8" />
        <rect width="4" height="3" fill="#FFFFFF" />
        <circle cx="2" cy="1.5" r="0.8" fill="#FCD116" stroke="#7B3F00" strokeWidth="0.1" />
      </svg>
    ),
    EU: (
      <svg viewBox="0 0 30 20" className={className}>
        <rect width="30" height="20" fill="#003399" />
        <circle cx="15" cy="10" r="6" fill="none" stroke="#FFCC00" strokeWidth="2" />
      </svg>
    ),
  };

  return flags[countryCode] || <div className={`bg-gray-300 ${className}`} />;
};

export default FlagIcon;
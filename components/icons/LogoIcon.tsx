import React from 'react';

const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Logo de Remesas A&M"
  >
    <defs>
      {/* Gradient for the inner circle fill, adjusted to top-to-bottom flow */}
      <linearGradient id="aymLogoGradient" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#0b63b2" />
        <stop offset="100%" stopColor="#2e8555" />
      </linearGradient>

      {/* Gradient for the outer circle border */}
      <linearGradient id="logoBorderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0b63b2" />
        <stop offset="100%" stopColor="#2e8555" />
      </linearGradient>
      
      {/* Paths for the curved text */}
      <path
        id="textPathTop"
        d="M 52 100 A 48 48 0 1 1 148 100"
        fill="none"
      />
      <path
        id="textPathBottom"
        d="M 40 100 A 60 60 0 1 0 160 100"
        fill="none"
      />
    </defs>

    {/* --- Logo Layers (from back to front) --- */}

    {/* 1. Outer white ring with gradient border */}
    <circle cx="100" cy="100" r="90" fill="#FFFFFF" stroke="url(#logoBorderGradient)" strokeWidth="6" />
    
    {/* 2. Inner gradient circle */}
    <circle cx="100" cy="100" r="82" fill="url(#aymLogoGradient)" />

    {/* 3. Central A&M letters (Outlined, dark teal color) */}
    <g fill="none" stroke="#003841" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" transform="translate(0, 2)">
      {/* A */}
      <path d="M 68 122 L 80 82 L 92 122" />
      <line x1="73" y1="110" x2="87" y2="110" />
      {/* M */}
      <path d="M 108 122 L 108 82 L 120 105 L 132 82 L 132 122" />
      {/* & */}
      <path d="M 99.5 109 C 99.5 102 94 100 90.5 100 C 85.5 100 85.5 105 90.5 105 C 96.5 105 96.5 112 90.5 112 C 84.5 112 84.5 119 92.5 119 L 96.5 115" />
    </g>

    {/* 4. Curved Text (dark teal color) */}
    <text fill="#003841" fontSize="13.5" fontWeight="bold" letterSpacing="3.5" fontFamily="sans-serif">
      <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">REMESAS</textPath>
    </text>
    
    <text fill="#003841" fontSize="10" fontWeight="bold" letterSpacing="1.8" fontFamily="sans-serif">
      <textPath href="#textPathBottom" startOffset="50%" textAnchor="middle">CONECTANDO CORAZONES</textPath>
    </text>

    {/* 5. Paper airplane (two-tone outline) */}
    <g transform="translate(13, -8) rotate(-15, 145, 45)">
      <path
        d="M 145 45 L 125 62 L 138 70 L 165 50 Z"
        fill="#FFFFFF"
        stroke="#0b63b2"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <line x1="138" y1="70" x2="130" y2="60" stroke="#2e8555" strokeWidth="3" />
    </g>
  </svg>
);

export default LogoIcon;
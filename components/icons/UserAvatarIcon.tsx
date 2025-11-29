import React from 'react';

const UserAvatarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4f46e5" /> 
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
    </defs>
    <g fill="url(#avatarGradient)">
        <circle cx="12" cy="12" r="12" />
    </g>
    <path 
      fill="#FFFFFF" 
      d="M12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm0-2c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"
      transform="scale(0.8) translate(3, 2)"
    />
  </svg>
);

export default UserAvatarIcon;
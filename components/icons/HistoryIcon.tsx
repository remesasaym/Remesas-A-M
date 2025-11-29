import React from 'react';

const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
    <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h.01M15 12h.01M12 6.01V6"
    />
  </svg>
);

export default HistoryIcon;
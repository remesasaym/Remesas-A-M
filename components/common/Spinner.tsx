import React from 'react';

interface SpinnerProps {
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ className = 'w-5 h-5 border-white' }) => (
  <div
    className={`animate-spin rounded-full border-2 border-t-transparent ${className}`}
    role="status"
    aria-live="polite"
    aria-label="Cargando"
  ></div>
);

export default Spinner;
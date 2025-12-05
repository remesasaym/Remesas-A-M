import React from 'react';

const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <img
    src="/logo.png"
    alt="Logo de Remesas A&M"
    className={className}
  />
);

export default LogoIcon;
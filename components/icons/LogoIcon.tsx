import React from 'react';
import logoImage from '../../src/assets/logo.png';

const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <img
    src={logoImage}
    alt="Logo de Remesas A&M"
    className={className}
  />
);

export default LogoIcon;
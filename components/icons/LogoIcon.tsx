import { LOGO_BASE64 } from '../../src/assets/logoData';

const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <img
    src={LOGO_BASE64}
    alt="Logo de Remesas A&M"
    className={className}
  />
);

export default LogoIcon;
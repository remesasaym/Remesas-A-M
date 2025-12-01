// frontend/components/Info.tsx
import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useExchangeRates } from '../contexts/ExchangeRateContext';
import { REMITTANCE_FEE_PERCENTAGE, PAYPAL_FEE_PERCENTAGE, WORLDCOIN_MINIMUM_EXCHANGE, USDC_FEE_PERCENTAGE, USDC_MINIMUM_EXCHANGE } from '../constants';
import FlagIcon from './icons/FlagIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import LegalModal from './legal/LegalModal';
import { PrivacyPolicyContent, TermsAndConditionsContent, CookiePolicyContent } from './legal/content';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './animations/PageTransition';

const SkeletonRow: React.FC = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
    </td>
  </tr>
);

const Info: React.FC = () => {
  const { countriesWithLatestRates: COUNTRIES, lastUpdated, isLoading, error } = useExchangeRates();
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [currentPolicyTitle, setCurrentPolicyTitle] = useState('');
  const [currentPolicyContent, setCurrentPolicyContent] = useState<React.ReactNode>(null);

  const formattedTimestamp = lastUpdated
    ? `Última actualización: ${lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    : 'Actualizando...';

  const openPolicy = (title: string, content: React.ReactNode) => {
    setCurrentPolicyTitle(title);
    setCurrentPolicyContent(content);
    setIsLegalModalOpen(true);
  };

  return (
    <PageTransition>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Información y Tasas</h2>
          <p className="text-slate-500 font-medium">Consulta los bancos, comisiones y tasas de cambio.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sección de Comisiones Detalladas */}
          <Card variant="default" padding="lg" className="h-full">
            <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <span className="w-2 h-8 bg-primary rounded-full"></span>
              Comisiones Detalladas
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="px-4 py-3 rounded-l-lg">Servicio</th>
                    <th scope="col" className="px-4 py-3">Comisión</th>
                    <th scope="col" className="px-4 py-3 rounded-r-lg">Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  <tr>
                    <th scope="row" className="px-4 py-4 font-medium text-slate-900 whitespace-nowrap dark:text-white">Remesas Internacionales</th>
                    <td className="px-4 py-4 font-mono font-bold text-primary">{REMITTANCE_FEE_PERCENTAGE * 100}%</td>
                    <td className="px-4 py-4 text-xs">Sin tarifa mínima fija.</td>
                  </tr>
                  <tr>
                    <th scope="row" className="px-4 py-4 font-medium text-slate-900 whitespace-nowrap dark:text-white">Intercambio PayPal</th>
                    <td className="px-4 py-4 font-mono font-bold text-primary">{PAYPAL_FEE_PERCENTAGE * 100}%</td>
                    <td className="px-4 py-4 text-xs">Total (incluye envío y retiro)</td>
                  </tr>
                  <tr>
                    <th scope="row" className="px-4 py-4 font-medium text-slate-900 whitespace-nowrap dark:text-white">Intercambio Worldcoin</th>
                    <td className="px-4 py-4 font-bold text-secondary">Variable</td>
                    <td className="px-4 py-4 text-xs">Mínimo {WORLDCOIN_MINIMUM_EXCHANGE} WLD</td>
                  </tr>
                  <tr>
                    <th scope="row" className="px-4 py-4 font-medium text-slate-900 whitespace-nowrap dark:text-white">Intercambio USDC</th>
                    <td className="px-4 py-4 font-mono font-bold text-primary">{USDC_FEE_PERCENTAGE * 100}%</td>
                    <td className="px-4 py-4 text-xs">Mínimo {USDC_MINIMUM_EXCHANGE} USDC</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Sección de Montos Mínimos y Tiempos de Entrega */}
          <Card variant="default" padding="lg" className="h-full">
            <h3 className="text-lg font-bold text-secondary mb-4 flex items-center gap-2">
              <span className="w-2 h-8 bg-secondary rounded-full"></span>
              Montos y Tiempos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th scope="col" className="px-4 py-3 rounded-l-lg">País</th>
                    <th scope="col" className="px-4 py-3">Mínimo</th>
                    <th scope="col" className="px-4 py-3 rounded-r-lg">Entrega</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {COUNTRIES.map((country) => (
                    <tr key={country.code}>
                      <th scope="row" className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap dark:text-white flex items-center gap-2">
                        <FlagIcon countryCode={country.code} className="w-5 h-auto rounded-sm shadow-sm" />
                        {country.name}
                      </th>
                      <td className="px-4 py-3 font-mono text-xs">{`${country.minimumSendAmount.toLocaleString('es-ES')} ${country.currency}`}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${country.region === 'LatAm' ? 'bg-accent/10 text-accent-dark' : 'bg-slate-100 text-slate-500'}`}>
                          {country.region === 'LatAm' ? '⚡ Instantáneo' : '🕒 2 días'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sección de Tasas de Cambio de Referencia */}
        <Card variant="default" padding="lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-accent-dark flex items-center gap-2">
              <span className="w-2 h-8 bg-accent rounded-full"></span>
              Tasas de Referencia (1 USD)
            </h3>
            <span className={`text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-500 transition-opacity duration-300 ${isLoading && lastUpdated ? 'opacity-50' : 'opacity-100'}`}>
              {error ? <span className="text-error">Error al actualizar</span> : formattedTimestamp}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-6 py-3 rounded-l-lg">País</th>
                  <th scope="col" className="px-6 py-3">Moneda</th>
                  <th scope="col" className="px-6 py-3 rounded-r-lg">Tasa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {isLoading && !lastUpdated ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : (
                  COUNTRIES.filter(c => c.currency !== 'USD').map((country) => (
                    <tr key={country.code}>
                      <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap dark:text-white flex items-center gap-2">
                        <FlagIcon countryCode={country.code} className="w-6 h-auto rounded-sm shadow-sm" />
                        {country.name}
                      </th>
                      <td className="px-6 py-4 font-mono text-slate-500">{country.currency}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-800 dark:text-white text-lg">
                        {country.exchangeRateToUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">Las tasas son referenciales y se actualizan en tiempo real.</p>
        </Card>

        {/* Sección de Bancos Disponibles por País */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 pl-2 border-l-4 border-warning">Bancos Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {COUNTRIES.map(country => (
              <Card key={country.code} variant="default" padding="md" className="hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <FlagIcon countryCode={country.code} className="w-6 h-auto rounded-sm shadow-sm" />
                  <h4 className="font-bold text-slate-800 dark:text-white">{country.name}</h4>
                </div>
                <ul className="space-y-1">
                  {country.banks.slice(0, 3).map(bank => (
                    <li key={bank.name} className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      {bank.name}
                    </li>
                  ))}
                  {country.banks.length > 3 && (
                    <li className="text-xs text-slate-400 italic pl-3">y {country.banks.length - 3} más...</li>
                  )}
                </ul>
              </Card>
            ))}
          </div>
        </div>

        {/* Nueva Sección de Políticas y Documentos Legales */}
        <Card variant="glass" className="bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-primary" />
            Legal y Privacidad
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="secondary"
              onClick={() => openPolicy('Política de Privacidad', <PrivacyPolicyContent />)}
              className="w-full"
            >
              Política de Privacidad
            </Button>
            <Button
              variant="secondary"
              onClick={() => openPolicy('Términos y Condiciones', <TermsAndConditionsContent />)}
              className="w-full"
            >
              Términos y Condiciones
            </Button>
            <Button
              variant="secondary"
              onClick={() => openPolicy('Política de Cookies', <CookiePolicyContent />)}
              className="w-full"
            >
              Política de Cookies
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center max-w-2xl mx-auto">
            Es obligatorio que todos los usuarios completen la verificación de identidad antes de procesar envíos para cumplir con las regulaciones de seguridad. Todas las transacciones son registradas y los comprobantes se almacenan de forma segura.
          </p>
        </Card>
      </div>

      <AnimatePresence>
        {isLegalModalOpen && (
          <LegalModal title={currentPolicyTitle} onClose={() => setIsLegalModalOpen(false)}>
            {currentPolicyContent}
          </LegalModal>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};

export default Info;
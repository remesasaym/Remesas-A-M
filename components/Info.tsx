import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useExchangeRates } from '../contexts/ExchangeRateContext';
import { REMITTANCE_FEE_PERCENTAGE, PAYPAL_FEE_PERCENTAGE, WORLDCOIN_MINIMUM_EXCHANGE, USDC_FEE_PERCENTAGE, USDC_MINIMUM_EXCHANGE } from '../constants';
import FlagIcon from './icons/FlagIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import LegalModal from './legal/LegalModal';
import { PrivacyPolicyContent, TermsAndConditionsContent, CookiePolicyContent } from './legal/content';
import { AnimatePresence, motion } from 'framer-motion';
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
  const [activeTab, setActiveTab] = useState<'rates' | 'banks' | 'legal'>('rates');

  const formattedTimestamp = lastUpdated
    ? `Última actualización: ${lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    : 'Actualizando...';

  const openPolicy = (title: string, content: React.ReactNode) => {
    setCurrentPolicyTitle(title);
    setCurrentPolicyContent(content);
    setIsLegalModalOpen(true);
  };

  const tabs = [
    { id: 'rates', label: 'Tasas y Tarifas', icon: '📊' },
    { id: 'banks', label: 'Bancos', icon: '🏦' },
    { id: 'legal', label: 'Legal', icon: '⚖️' },
  ] as const;

  return (
    <PageTransition>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Información</h2>
          <p className="text-slate-500 font-medium">Todo lo que necesitas saber sobre nuestros servicios.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 space-x-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl max-w-md mx-auto mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                w-full py-2.5 text-sm font-bold leading-5 rounded-lg transition-all duration-200
                flex items-center justify-center gap-2
                ${activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                }
              `}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'rates' && (
            <motion.div
              key="rates"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sección de Comisiones Detalladas */}
                <Card variant="default" padding="lg" className="h-full">
                  <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                    <span className="w-2 h-8 bg-primary rounded-full"></span>
                    Comisiones Detalladas
                  </h3>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700">
                    <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-800/50 dark:text-slate-400">
                        <tr>
                          <th scope="col" className="px-4 py-3">Servicio</th>
                          <th scope="col" className="px-4 py-3">Comisión</th>
                          <th scope="col" className="px-4 py-3">Notas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <th scope="row" className="px-4 py-4 font-medium text-slate-900 dark:text-white">Remesas Internacionales</th>
                          <td className="px-4 py-4 font-mono font-bold text-primary tabular-nums">{REMITTANCE_FEE_PERCENTAGE * 100}%</td>
                          <td className="px-4 py-4 text-xs text-slate-500">Sin tarifa mínima fija.</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <th scope="row" className="px-4 py-4 font-medium text-slate-900 dark:text-white">Intercambio PayPal</th>
                          <td className="px-4 py-4 font-mono font-bold text-primary tabular-nums">{PAYPAL_FEE_PERCENTAGE * 100}%</td>
                          <td className="px-4 py-4 text-xs text-slate-500">Total (incluye envío y retiro)</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <th scope="row" className="px-4 py-4 font-medium text-slate-900 dark:text-white">Intercambio Worldcoin</th>
                          <td className="px-4 py-4 font-mono font-bold text-secondary tabular-nums">Variable</td>
                          <td className="px-4 py-4 text-xs text-slate-500">Mínimo {WORLDCOIN_MINIMUM_EXCHANGE} WLD</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <th scope="row" className="px-4 py-4 font-medium text-slate-900 dark:text-white">Intercambio USDC</th>
                          <td className="px-4 py-4 font-mono font-bold text-primary tabular-nums">{USDC_FEE_PERCENTAGE * 100}%</td>
                          <td className="px-4 py-4 text-xs text-slate-500">Mínimo {USDC_MINIMUM_EXCHANGE} USDC</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white">Remesas Internacionales</h4>
                        <span className="font-mono font-bold text-primary text-lg tabular-nums">{REMITTANCE_FEE_PERCENTAGE * 100}%</span>
                      </div>
                      <p className="text-xs text-slate-500">Sin tarifa mínima fija.</p>
                    </div>

                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white">Intercambio PayPal</h4>
                        <span className="font-mono font-bold text-primary text-lg tabular-nums">{PAYPAL_FEE_PERCENTAGE * 100}%</span>
                      </div>
                      <p className="text-xs text-slate-500">Total (incluye envío y retiro)</p>
                    </div>

                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white">Intercambio Worldcoin</h4>
                        <span className="font-mono font-bold text-secondary text-lg tabular-nums">Variable</span>
                      </div>
                      <p className="text-xs text-slate-500">Mínimo {WORLDCOIN_MINIMUM_EXCHANGE} WLD</p>
                    </div>

                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white">Intercambio USDC</h4>
                        <span className="font-mono font-bold text-primary text-lg tabular-nums">{USDC_FEE_PERCENTAGE * 100}%</span>
                      </div>
                      <p className="text-xs text-slate-500">Mínimo {USDC_MINIMUM_EXCHANGE} USDC</p>
                    </div>
                  </div>
                </Card>

                {/* Sección de Montos Mínimos y Tiempos de Entrega */}
                <Card variant="default" padding="lg" className="h-full">
                  <h3 className="text-lg font-bold text-secondary mb-4 flex items-center gap-2">
                    <span className="w-2 h-8 bg-secondary rounded-full"></span>
                    Países de Origen y Mínimos
                  </h3>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700 mb-4">
                    <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-800/50 dark:text-slate-400">
                        <tr>
                          <th scope="col" className="px-4 py-3">País de Origen</th>
                          <th scope="col" className="px-4 py-3">Mínimo de Envío</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {COUNTRIES.filter(c => ['VE', 'BR', 'CO', 'PE', 'US'].includes(c.code) || c.region === 'Europe').map((country) => (
                          <tr key={country.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <th scope="row" className="px-4 py-3 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                              <FlagIcon countryCode={country.code} className="w-5 h-auto rounded-sm shadow-sm" />
                              {country.name}
                            </th>
                            <td className="px-4 py-3 font-mono text-xs tabular-nums">{`${country.minimumSendAmount.toLocaleString('es-ES')} ${country.currency}`}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3 mb-4">
                    {COUNTRIES.filter(c => ['VE', 'BR', 'CO', 'PE', 'US'].includes(c.code) || c.region === 'Europe').map((country) => (
                      <div key={country.code} className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-3">
                          <FlagIcon countryCode={country.code} className="w-6 h-auto rounded-sm shadow-sm" />
                          <h4 className="font-semibold text-slate-900 dark:text-white">{country.name}</h4>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-slate-500">Mínimo de envío</p>
                          <p className="font-mono text-sm font-medium tabular-nums">{`${country.minimumSendAmount.toLocaleString('es-ES')} ${country.currency}`}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Time Info */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2">Tiempos de Entrega Estimados</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-accent rounded-full"></span>
                        <span className="text-slate-600 dark:text-slate-300">Latinoamérica: <span className="font-bold text-slate-800 dark:text-white">Instantáneo</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                        <span className="text-slate-600 dark:text-slate-300">Resto del mundo: <span className="font-bold text-slate-800 dark:text-white">2 días hábiles</span></span>
                      </div>
                    </div>
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

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700">
                  <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 dark:bg-slate-800/50 dark:text-slate-400">
                      <tr>
                        <th scope="col" className="px-6 py-3">País</th>
                        <th scope="col" className="px-6 py-3">Moneda</th>
                        <th scope="col" className="px-6 py-3">Tasa</th>
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
                          <tr key={country.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <th scope="row" className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                              <FlagIcon countryCode={country.code} className="w-6 h-auto rounded-sm shadow-sm" />
                              {country.name}
                            </th>
                            <td className="px-6 py-4 font-mono text-slate-500">{country.currency}</td>
                            <td className="px-6 py-4 font-mono font-bold text-slate-800 dark:text-white text-lg tabular-nums">
                              {country.exchangeRateToUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {isLoading && !lastUpdated ? (
                    <>
                      <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 animate-pulse">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                      </div>
                      <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 animate-pulse">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                      </div>
                    </>
                  ) : (
                    COUNTRIES.filter(c => c.currency !== 'USD').map((country) => (
                      <div key={country.code} className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-3">
                          <FlagIcon countryCode={country.code} className="w-6 h-auto rounded-sm shadow-sm" />
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white">{country.name}</h4>
                            <p className="text-xs text-slate-500 font-mono">{country.currency}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">1 USD =</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-white text-xl tabular-nums">
                            {country.exchangeRateToUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-4 text-center">Las tasas son referenciales y se actualizan en tiempo real.</p>
              </Card>
            </motion.div>
          )}

          {activeTab === 'banks' && (
            <motion.div
              key="banks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card variant="default" padding="lg">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 pl-2 border-l-4 border-warning">Bancos Disponibles</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {COUNTRIES.filter(c => ['VE', 'BR', 'CO', 'PE', 'US'].includes(c.code) || c.region === 'Europe').map(country => (
                    <Card key={country.code} variant="default" padding="md" className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2 mb-3">
                        <FlagIcon countryCode={country.code} className="w-6 h-auto rounded-sm shadow-sm" />
                        <h4 className="font-bold text-slate-800 dark:text-white">{country.name}</h4>
                      </div>
                      <ul className="space-y-1.5">
                        {country.banks.slice(0, 3).map(bank => (
                          <li key={bank.name} className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></span>
                            {bank.name}
                          </li>
                        ))}
                        {country.banks.length > 3 && (
                          <li className="text-xs text-slate-400 italic pl-3.5">y {country.banks.length - 3} más...</li>
                        )}
                      </ul>
                    </Card>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'legal' && (
            <motion.div
              key="legal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card variant="glass" className="bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-primary" />
                  Legal y Privacidad
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button
                    variant="secondary"
                    onClick={() => openPolicy('Política de Privacidad', <PrivacyPolicyContent />)}
                    className="w-full h-auto py-6 text-left justify-start bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm"
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-bold text-lg text-slate-800 dark:text-white">Política de Privacidad</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">Cómo protegemos tus datos</span>
                    </div>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => openPolicy('Términos y Condiciones', <TermsAndConditionsContent />)}
                    className="w-full h-auto py-6 text-left justify-start bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm"
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-bold text-lg text-slate-800 dark:text-white">Términos y Condiciones</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">Acuerdo de uso del servicio</span>
                    </div>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => openPolicy('Política de Cookies', <CookiePolicyContent />)}
                    className="w-full h-auto py-6 text-left justify-start bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm"
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-bold text-lg text-slate-800 dark:text-white">Política de Cookies</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">Uso de cookies en el sitio</span>
                    </div>
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-8 text-center max-w-2xl mx-auto leading-relaxed">
                  Es obligatorio que todos los usuarios completen la verificación de identidad antes de procesar envíos para cumplir con las regulaciones de seguridad. Todas las transacciones son registradas y los comprobantes se almacenan de forma segura.
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
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
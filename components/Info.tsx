// frontend/components/Info.tsx
import React, { useState } from 'react';
import Card from './common/Card';
import { useExchangeRates } from '../contexts/ExchangeRateContext'; // Hook para obtener las tasas de cambio.
import { REMITTANCE_FEE_PERCENTAGE, PAYPAL_FEE_PERCENTAGE, WORLDCOIN_MINIMUM_EXCHANGE, USDC_FEE_PERCENTAGE, USDC_MINIMUM_EXCHANGE } from '../constants'; // Constantes de tarifas.
import FlagIcon from './icons/FlagIcon'; // Icono de bandera.
import DocumentTextIcon from './icons/DocumentTextIcon'; // Nuevo icono para documentos.
import LegalModal from './legal/LegalModal'; // Nuevo componente de modal.
import { PrivacyPolicyContent, TermsAndConditionsContent, CookiePolicyContent } from './legal/content'; // Nuevo contenido de políticas.
import { AnimatePresence } from 'framer-motion'; // Para animaciones del modal.

/**
 * @description Componente SkeletonLoader para mostrar un estado de carga en las tablas.
 * @returns {React.FC} Una fila de esqueleto.
 */
const SkeletonRow: React.FC = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </td>
        <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </td>
        <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </td>
    </tr>
);

/**
 * @description Componente de información general de la aplicación.
 * Muestra tarifas, montos mínimos, tiempos de entrega y tasas de cambio.
 * @returns {React.FC} El componente Info.
 */
const Info: React.FC = () => {
  const { countriesWithLatestRates: COUNTRIES, lastUpdated, isLoading, error } = useExchangeRates(); // Obtiene datos del contexto de tasas.
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false); // Estado para controlar la visibilidad del modal legal.
  const [currentPolicyTitle, setCurrentPolicyTitle] = useState(''); // Título de la política actual.
  const [currentPolicyContent, setCurrentPolicyContent] = useState<React.ReactNode>(null); // Contenido de la política actual.
  
  // Formatea la marca de tiempo de la última actualización.
  const formattedTimestamp = lastUpdated 
    ? `Última actualización: ${lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    : 'Actualizando...';

  /**
   * @description Abre el modal de políticas con el título y contenido especificados.
   * @param {string} title Título del modal.
   * @param {React.ReactNode} content Contenido React a mostrar dentro del modal.
   */
  const openPolicy = (title: string, content: React.ReactNode) => {
    setCurrentPolicyTitle(title);
    setCurrentPolicyContent(content);
    setIsLegalModalOpen(true);
  };

  return (
    <Card>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Información y Tasas</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Consulta los bancos, comisiones, tasas de cambio y nuestras políticas.</p>

      <div className="space-y-8">
        
        {/* Sección de Comisiones Detalladas */}
        <div>
          <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-3">Comisiones Detalladas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                <tr>
                  <th scope="col" className="px-6 py-3 rounded-l-lg">Servicio</th>
                  <th scope="col" className="px-6 py-3">Comisión</th>
                  <th scope="col" className="px-6 py-3 rounded-r-lg">Notas</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">Remesas Internacionales</th>
                  <td className="px-6 py-4 font-mono">{REMITTANCE_FEE_PERCENTAGE * 100}%</td>
                  <td className="px-6 py-4">Sin tarifa mínima fija.</td>
                </tr>
                <tr className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">Intercambio PayPal</th>
                  <td className="px-6 py-4 font-mono">{PAYPAL_FEE_PERCENTAGE * 100}%</td>
                  <td className="px-6 py-4">Total (incluye envío y retiro)</td>
                </tr>
                <tr className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">Intercambio Worldcoin (WLD)</th>
                  <td className="px-6 py-4">Variable</td>
                  <td className="px-6 py-4">Mínimo {WORLDCOIN_MINIMUM_EXCHANGE} WLD</td>
                </tr>
                <tr className="bg-white dark:bg-gray-800">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">Intercambio USDC</th>
                  <td className="px-6 py-4 font-mono">{USDC_FEE_PERCENTAGE * 100}%</td>
                  <td className="px-6 py-4">Mínimo {USDC_MINIMUM_EXCHANGE} USDC</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Sección de Montos Mínimos y Tiempos de Entrega */}
        <div>
            <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-3">Montos Mínimos y Tiempos de Entrega</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                        <tr>
                            <th scope="col" className="px-6 py-3 rounded-l-lg">País</th>
                            <th scope="col" className="px-6 py-3">Monto Mínimo</th>
                            <th scope="col" className="px-6 py-3 rounded-r-lg">Tiempo de Entrega</th>
                        </tr>
                    </thead>
                    <tbody>
                        {COUNTRIES.map((country, index, arr) => (
                            <tr key={country.code} className={`bg-white dark:bg-gray-800 ${index !== arr.length - 1 ? 'border-b dark:border-gray-700' : ''}`}>
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white flex items-center gap-2">
                                   <FlagIcon countryCode={country.code} className="w-5 h-auto rounded-sm" />
                                   {country.name}
                                </th>
                                <td className="px-6 py-4 font-mono">{`${country.minimumSendAmount.toLocaleString('es-ES')} ${country.currency}`}</td>
                                <td className="px-6 py-4">{country.region === 'LatAm' ? 'Instantáneo' : '2 días hábiles'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        
        {/* Sección de Tasas de Cambio de Referencia */}
        <div>
          <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-3">Tasas de Cambio de Referencia (desde USD)</h3>
           <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                <tr>
                  <th scope="col" className="px-6 py-3 rounded-l-lg">País</th>
                  <th scope="col" className="px-6 py-3">Moneda</th>
                  <th scope="col" className="px-6 py-3 rounded-r-lg">Tasa (1 USD ≈)</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && !lastUpdated ? ( // Muestra esqueletos mientras carga por primera vez.
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : ( // Muestra las tasas reales.
                  COUNTRIES.filter(c => c.currency !== 'USD').map((country, index, arr) => (
                    <tr key={country.code} className={`bg-white dark:bg-gray-800 ${index !== arr.length -1 ? 'border-b dark:border-gray-700' : ''}`}>
                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{country.name}</th>
                        <td className="px-6 py-4">{country.currency}</td>
                        <td className="px-6 py-4 font-mono">{country.exchangeRateToUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {/* Pie de tabla con información de actualización y errores */}
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex justify-between items-center">
                <span>Las tasas son referenciales y pueden cambiar.</span>
                <span className={`transition-opacity duration-300 ${isLoading && lastUpdated ? 'opacity-50' : 'opacity-100'}`}>
                    {error ? <span className="text-red-500 font-medium">Error al actualizar</span> : formattedTimestamp}
                </span>
            </div>
          </div>
        </div>

        {/* Sección de Bancos Disponibles por País */}
        <div>
          <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3">Bancos Disponibles por País</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {COUNTRIES.map(country => (
              <div key={country.code} className="bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg">
                <h4 className="font-bold text-gray-800 dark:text-white">{country.name}</h4>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 text-sm mt-2">
                  {country.banks.map(bank => (
                    <li key={bank.name}>{bank.name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Nueva Sección de Políticas y Documentos Legales */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            Políticas y Documentos Legales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => openPolicy('Política de Privacidad', <PrivacyPolicyContent />)} 
              className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              Política de Privacidad
            </button>
            <button 
              onClick={() => openPolicy('Términos y Condiciones', <TermsAndConditionsContent />)} 
              className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              Términos y Condiciones
            </button>
            <button 
              onClick={() => openPolicy('Política de Cookies', <CookiePolicyContent />)} 
              className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors md:col-span-2"
            >
              Política de Cookies
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Es obligatorio que todos los usuarios completen la verificación de identidad antes de procesar envíos para cumplir con las regulaciones de seguridad. Todas las transacciones son registradas y los comprobantes se almacenan de forma segura. Puedes consultarlos en tu historial.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {isLegalModalOpen && (
          <LegalModal title={currentPolicyTitle} onClose={() => setIsLegalModalOpen(false)}>
            {currentPolicyContent}
          </LegalModal>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default Info;
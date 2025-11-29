import React from 'react';
import { useExchangeRates } from '../contexts/ExchangeRateContext';
import { REMITTANCE_FEE_PERCENTAGE, FX_SPREAD_PERCENTAGE } from '../constants';

const ExchangeRateBanner: React.FC = () => {
    const { lastUpdated, isLoading, error, refreshRates } = useExchangeRates();

    if (isLoading && !lastUpdated) {
        return (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Cargando tasas en tiempo real...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                    <button
                        onClick={refreshRates}
                        className="text-xs px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                                Tasas en Tiempo Real
                            </span>
                        </div>
                        {lastUpdated && (
                            <span className="text-xs text-green-600 dark:text-green-400">
                                Actualizado: {formatTime(lastUpdated)}
                            </span>
                        )}
                    </div>

                    <div className="text-xs text-green-700 dark:text-green-300 space-y-0.5">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">💰 Comisión:</span>
                            <span className="bg-green-100 dark:bg-green-800/50 px-2 py-0.5 rounded-md font-bold">
                                {(REMITTANCE_FEE_PERCENTAGE * 100).toFixed(1)}%
                            </span>
                            <span className="text-green-600/80 dark:text-green-400/80 italic">
                                (antes 9%)
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">📊 Spread FX:</span>
                            <span className="bg-green-100 dark:bg-green-800/50 px-2 py-0.5 rounded-md font-bold">
                                +{(FX_SPREAD_PERCENTAGE * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 pt-1 border-t border-green-200 dark:border-green-700">
                            <span className="font-semibold">🎯 Costo Total:</span>
                            <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-md font-bold">
                                ~{((REMITTANCE_FEE_PERCENTAGE + FX_SPREAD_PERCENTAGE) * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={refreshRates}
                    className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center gap-1.5"
                    title="Refrescar tasas"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refrescar
                </button>
            </div>
        </div>
    );
};

export default ExchangeRateBanner;

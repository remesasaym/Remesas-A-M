import React from 'react';
import { useExchangeRates } from '../contexts/ExchangeRateContext';
import { REMITTANCE_FEE_PERCENTAGE, FX_SPREAD_PERCENTAGE } from '../constants';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

const ExchangeRateBanner: React.FC = () => {
    const { lastUpdated, isLoading, error, refreshRates } = useExchangeRates();

    if (isLoading && !lastUpdated) {
        return (
            <Card variant="colored" padding="sm" className="mb-6 border-secondary/20 bg-secondary/5">
                <div className="flex items-center gap-3 text-sm text-secondary-dark">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Cargando tasas en tiempo real...</span>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card variant="colored" padding="sm" className="mb-6 border-warning/20 bg-warning/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-warning-dark">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                    <Button
                        onClick={refreshRates}
                        variant="ghost"
                        size="sm"
                        className="text-warning-dark hover:bg-warning/10"
                    >
                        Reintentar
                    </Button>
                </div>
            </Card>
        );
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Card variant="colored" padding="md" className="mb-8 border-accent/20 bg-gradient-to-r from-accent/5 to-secondary/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 bg-accent rounded-full animate-pulse shadow-[0_0_8px_rgba(125,206,160,0.6)]"></div>
                            <span className="text-sm font-bold text-text-primary">
                                Tasas en Tiempo Real
                            </span>
                        </div>
                        {lastUpdated && (
                            <span className="text-xs text-text-secondary bg-white/50 px-2 py-0.5 rounded-full">
                                {formatTime(lastUpdated)}
                            </span>
                        )}
                    </div>

                    <div className="text-xs text-text-secondary space-y-1">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="font-medium">Comisión:</span>
                                <span className="bg-accent/10 text-accent-dark px-1.5 py-0.5 rounded font-bold">
                                    {(REMITTANCE_FEE_PERCENTAGE * 100).toFixed(1)}%
                                </span>
                                <span className="text-text-tertiary line-through text-[10px]">
                                    (9%)
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-medium">Spread FX:</span>
                                <span className="bg-accent/10 text-accent-dark px-1.5 py-0.5 rounded font-bold">
                                    +{(FX_SPREAD_PERCENTAGE * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-accent/10">
                            <span className="font-bold text-text-primary">Costo Total Estimado:</span>
                            <span className="bg-gradient-to-r from-accent to-secondary text-white px-2 py-0.5 rounded font-bold shadow-sm">
                                ~{((REMITTANCE_FEE_PERCENTAGE + FX_SPREAD_PERCENTAGE) * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={refreshRates}
                    variant="ghost"
                    size="sm"
                    className="text-accent-dark hover:bg-accent/10 self-start sm:self-center"
                    leftIcon={
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    }
                >
                    Refrescar
                </Button>
            </div>
        </Card>
    );
};

export default ExchangeRateBanner;

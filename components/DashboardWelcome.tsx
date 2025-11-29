import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { supabase } from '../supabaseClient';
import { useExchangeRates } from '../contexts/ExchangeRateContext';
import Card from './common/Card';

interface DashboardWelcomeProps {
  user: User;
  onNewTransaction: () => void;
}

interface SummaryData {
  transactionCount: number;
  totalSentUSD: number;
}

const getFirstName = (fullName: string): string => {
  if (!fullName) return 'Usuario';
  return fullName.split(' ')[0];
};

const SkeletonLoader: React.FC = () => (
    <div className="animate-pulse">
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-3/5 mb-4"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mb-6"></div>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-48"></div>
    </div>
);


const DashboardWelcome: React.FC<DashboardWelcomeProps> = ({ user, onNewTransaction }) => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const { countriesWithLatestRates } = useExchangeRates();

  useEffect(() => {
    const fetchSummary = async () => {
      if (!user?.id || countriesWithLatestRates.length === 0) return;

      setLoading(true);
      try {
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('amount_sent, currency_sent')
          .eq('user_id', user.id);

        if (error) throw error;
        
        const transactionCount = transactions.length;

        const totalSentUSD = transactions.reduce((total, tx) => {
            const country = countriesWithLatestRates.find(c => c.currency === tx.currency_sent);
            const rate = country?.exchangeRateToUSD || 1; // Fallback to 1 if rate not found
            const amountInUSD = tx.amount_sent / rate;
            return total + amountInUSD;
        }, 0);

        setSummary({ transactionCount, totalSentUSD });

      } catch (err) {
        console.error("Error fetching transaction summary:", err);
        // Do not set an error state, just show a generic message or zero values
        setSummary({ transactionCount: 0, totalSentUSD: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [user.id, countriesWithLatestRates]);

  return (
    <Card className="mb-8 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 dark:from-slate-800 dark:via-gray-800 dark:to-slate-900">
      {loading ? (
         <SkeletonLoader />
      ) : (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Hola de nuevo, {getFirstName(user.fullName)} 👋
                </h2>
                {summary && summary.transactionCount > 0 ? (
                     <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Has enviado un total de <strong className="text-indigo-600 dark:text-indigo-400">{summary.totalSentUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</strong> en <strong className="text-indigo-600 dark:text-indigo-400">{summary.transactionCount} transacciones</strong>.
                    </p>
                ) : (
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        ¡Listo para tu primer envío! Realiza una transacción para ver tu resumen aquí.
                    </p>
                )}
            </div>
             <button
                onClick={onNewTransaction}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 shadow-lg whitespace-nowrap flex-shrink-0"
            >
                Realizar un Nuevo Envío
            </button>
        </div>
      )}
    </Card>
  );
};

export default DashboardWelcome;
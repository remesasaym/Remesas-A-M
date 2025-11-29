import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { User } from '../types';
import { supabase } from '../supabaseClient';
import { useExchangeRates } from '../contexts/ExchangeRateContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

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
  <div className="space-y-4">
    <div className="h-8 bg-gradient-to-r from-bg-secondary via-bg-tertiary to-bg-secondary rounded-lg animate-pulse" style={{ backgroundSize: '200% 100%' }} />
    <div className="h-6 bg-gradient-to-r from-bg-secondary via-bg-tertiary to-bg-secondary rounded-lg w-3/4 animate-pulse" style={{ backgroundSize: '200% 100%' }} />
    <div className="h-12 bg-gradient-to-r from-bg-secondary via-bg-tertiary to-bg-secondary rounded-lg w-48 animate-pulse" style={{ backgroundSize: '200% 100%' }} />
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
          const rate = country?.exchangeRateToUSD || 1;
          const amountInUSD = tx.amount_sent / rate;
          return total + amountInUSD;
        }, 0);

        setSummary({ transactionCount, totalSentUSD });

      } catch (err) {
        console.error("Error fetching transaction summary:", err);
        setSummary({ transactionCount: 0, totalSentUSD: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [user.id, countriesWithLatestRates]);

  return (
    <Card
      variant="gradient"
      padding="lg"
      className="mb-8 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 dark:from-slate-800 dark:via-gray-800 dark:to-slate-900 border-2 border-border/30"
    >
      {loading ? (
        <SkeletonLoader />
      ) : (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-3xl font-bold text-text-primary dark:text-white mb-2">
              Hola de nuevo, {getFirstName(user.fullName)} 👋
            </h2>
            {summary && summary.transactionCount > 0 ? (
              <motion.p
                className="text-text-secondary dark:text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Has enviado un total de{' '}
                <span className="font-bold text-primary dark:text-primary-light">
                  {summary.totalSentUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>{' '}
                en{' '}
                <span className="font-bold text-secondary dark:text-secondary-light">
                  {summary.transactionCount} {summary.transactionCount === 1 ? 'transacción' : 'transacciones'}
                </span>
                .
              </motion.p>
            ) : (
              <motion.p
                className="text-text-secondary dark:text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                ¡Listo para tu primer envío! Realiza una transacción para ver tu resumen aquí.
              </motion.p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={onNewTransaction}
              className="whitespace-nowrap shadow-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Envío
            </Button>
          </motion.div>
        </div>
      )}
    </Card>
  );
};

export default DashboardWelcome;
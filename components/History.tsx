import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import type { User, Transaction } from '../types';
import { COUNTRIES } from '../constants';
import FlagIcon from './icons/FlagIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import TransactionModal from './TransactionModal';
import SortIcon from './icons/SortIcon';
import { supabase } from '../supabaseClient';
import PaginationControls from './PaginationControls';
import { PageTransition } from './animations/PageTransition';

interface HistoryProps {
  user: User;
}

type SortKey = 'created_at' | 'recipient_name' | 'amount_sent' | 'status';
type SortDirection = 'asc' | 'desc';

const SortableHeader: React.FC<{
  label: string;
  sortKey: SortKey;
  currentSortKey: SortKey;
  currentDirection: SortDirection;
  onSort: (key: SortKey) => void;
  className?: string;
}> = ({ label, sortKey, currentSortKey, currentDirection, onSort, className = '' }) => {
  const isActive = currentSortKey === sortKey;
  return (
    <th scope="col" className={`px-4 py-3 text-left ${className}`}>
      <button
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1.5 group transition-colors font-semibold text-xs uppercase tracking-wider ${isActive ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
          }`}
      >
        <span>{label}</span>
        <SortIcon direction={isActive ? currentDirection : undefined} isActive={isActive} />
      </button>
    </th>
  );
};

const History: React.FC<HistoryProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No hay sesión activa');

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/remittances/history?userId=${user.id}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        if (!response.ok) throw new Error('Error al obtener el historial');

        const data = await response.json();
        setTransactions(data || []);
      } catch (err: any) {
        console.error('Error fetching history:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user.id]);

  const handleSortAndResetPage = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const sortedTransactions = useMemo(() => {
    const sortable = [...transactions];
    sortable.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (typeof valA === 'number' && typeof valB === 'number') return valA - valB;
      if (typeof valA === 'string' && typeof valB === 'string') {
        if (sortKey === 'created_at') return new Date(valA).getTime() - new Date(valB).getTime();
        return valA.localeCompare(valB);
      }
      return 0;
    });

    if (sortDirection === 'desc') sortable.reverse();
    return sortable;
  }, [transactions, sortKey, sortDirection]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedTransactions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-text-secondary">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          <p>Cargando historial...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-8 text-center bg-error/5 rounded-xl border border-error/20">
          <p className="text-error font-medium">{error}</p>
          <Button variant="ghost" className="mt-4 text-error hover:bg-error/10" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <div className="text-center p-12 text-text-secondary">
          <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">Sin Transacciones</h3>
          <p className="text-sm mb-6">Aún no has realizado ningún envío.</p>
          <Button variant="primary">Empezar ahora</Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-bg-secondary border-b border-border">
                <tr>
                  <SortableHeader label="Fecha" sortKey="created_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSortAndResetPage} />
                  <SortableHeader label="Destinatario" sortKey="recipient_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSortAndResetPage} />
                  <SortableHeader label="Monto" sortKey="amount_sent" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSortAndResetPage} className="hidden sm:table-cell" />
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-text-secondary">Ruta</th>
                  <SortableHeader label="Estado" sortKey="status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSortAndResetPage} />
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white dark:bg-gray-800">
                {paginatedTransactions.map((tx, index) => (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    onClick={() => setSelectedTransaction(tx)}
                    index={index}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
        />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Historial</h2>
            <p className="text-text-secondary">Tus envíos recientes</p>
          </div>
        </div>

        <Card variant="default" padding="none" className="overflow-hidden">
          <div className="p-6">
            {renderContent()}
          </div>
        </Card>

        <AnimatePresence>
          {selectedTransaction && (
            <TransactionModal
              transaction={selectedTransaction}
              onClose={() => setSelectedTransaction(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

const TransactionRow: React.FC<{ transaction: Transaction; onClick: () => void; index: number }> = ({ transaction, onClick, index }) => {
  const fromCountry = COUNTRIES.find(c => c.code === transaction.from_country_code);
  const toCountry = COUNTRIES.find(c => c.code === transaction.to_country_code);

  const statusStyles = {
    'COMPLETADO': 'bg-success/10 text-success-dark border-success/20',
    'RECHAZADO': 'bg-error/10 text-error border-error/20',
    'VERIFICADO': 'bg-accent/10 text-accent-dark border-accent/20',
    'PENDIENTE': 'bg-warning/10 text-warning-dark border-warning/20',
  };

  const statusStyle = statusStyles[transaction.status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800';

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="group hover:bg-bg-secondary/50 cursor-pointer transition-colors"
    >
      <td className="px-4 py-4 text-text-secondary whitespace-nowrap">
        <div className="font-medium text-text-primary">
          {new Date(transaction.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
        </div>
        <div className="text-xs opacity-70">
          {new Date(transaction.created_at).getFullYear()}
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="font-medium text-text-primary">{transaction.recipient_name}</div>
        <div className="text-xs text-text-secondary truncate max-w-[150px]">
          {transaction.recipient_bank} • {transaction.recipient_account.slice(-4)}
        </div>
      </td>

      <td className="px-4 py-4 hidden sm:table-cell">
        <div className="font-bold text-text-primary">
          {transaction.amount_sent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          <span className="text-xs ml-1 text-text-secondary font-normal">{transaction.currency_sent}</span>
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="flex items-center gap-2 bg-bg-tertiary w-fit px-2 py-1 rounded-full border border-border/50">
          {fromCountry && <FlagIcon countryCode={fromCountry.code} className="w-4 h-4 rounded-full shadow-sm" />}
          <ArrowRightIcon className="w-3 h-3 text-text-tertiary" />
          {toCountry && <FlagIcon countryCode={toCountry.code} className="w-4 h-4 rounded-full shadow-sm" />}
        </div>
      </td>

      <td className="px-4 py-4">
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${statusStyle} inline-flex items-center gap-1`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.replace('bg-', 'bg-current ').split(' ')[0]}`} />
          {transaction.status}
        </span>
      </td>
    </motion.tr>
  );
};

export default History;

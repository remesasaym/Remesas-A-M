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

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'COMPLETADO' | 'PENDIENTE' | 'RECHAZADO'>('ALL');

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

  const filteredTransactions = useMemo(() => {
    if (filterStatus === 'ALL') return transactions;
    return transactions.filter(t => t.status === filterStatus);
  }, [transactions, filterStatus]);

  const sortedTransactions = useMemo(() => {
    const sortable = [...filteredTransactions];
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
  }, [filteredTransactions, sortKey, sortDirection]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedTransactions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          <p>Cargando historial...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-8 text-center bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
          <p className="text-error font-medium">{error}</p>
          <Button variant="ghost" className="mt-4 text-error hover:bg-error/10" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <div className="text-center p-12 text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Sin Transacciones</h3>
          <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">Aún no has realizado ningún envío. ¡Tu primera remesa te espera!</p>
          <Button variant="primary" className="shadow-xl shadow-primary/30 px-8 py-3">
            Realizar mi primer envío
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Quick Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {(['ALL', 'COMPLETADO', 'PENDIENTE', 'RECHAZADO'] as const).map((status) => (
            <button
              key={status}
              onClick={() => { setFilterStatus(status); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${filterStatus === status
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
            >
              {status === 'ALL' ? 'Todos' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <SortableHeader label="Fecha" sortKey="created_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSortAndResetPage} />
                  <SortableHeader label="Destinatario" sortKey="recipient_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSortAndResetPage} />
                  <SortableHeader label="Monto" sortKey="amount_sent" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSortAndResetPage} className="hidden sm:table-cell" />
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-slate-400">Ruta</th>
                  <SortableHeader label="Estado" sortKey="status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSortAndResetPage} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                <AnimatePresence mode="popLayout">
                  {paginatedTransactions.length > 0 ? (
                    paginatedTransactions.map((tx, index) => (
                      <TransactionRow
                        key={tx.id}
                        transaction={tx}
                        onClick={() => setSelectedTransaction(tx)}
                        index={index}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400">
                        No se encontraron transacciones con este filtro.
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
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
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Historial</h2>
            <p className="text-slate-500 font-medium">Tus envíos recientes</p>
          </div>
        </div>

        {renderContent()}

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

  // Stitch color mapping for statuses
  const statusStyles = {
    'COMPLETADO': 'bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-900/30',
    'RECHAZADO': 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30',
    'VERIFICADO': 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30',
    'PENDIENTE': 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30',
  };

  const statusStyle = statusStyles[transaction.status as keyof typeof statusStyles] || 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="group hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
    >
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="font-bold text-slate-700 dark:text-slate-200">
          {new Date(transaction.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
        </div>
        <div className="text-xs text-slate-400 font-medium">
          {new Date(transaction.created_at).getFullYear()}
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="font-bold text-slate-800 dark:text-white">{transaction.recipient_name}</div>
        <div className="text-xs text-slate-500 truncate max-w-[150px]">
          {transaction.recipient_bank} • {transaction.recipient_account.slice(-4)}
        </div>
      </td>

      <td className="px-4 py-4 hidden sm:table-cell">
        <div className="font-bold text-slate-800 dark:text-white">
          {transaction.amount_sent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          <span className="text-xs ml-1 text-slate-500 font-medium">{transaction.currency_sent}</span>
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 w-fit px-2 py-1 rounded-full border border-slate-200 dark:border-slate-600">
          {fromCountry && <FlagIcon countryCode={fromCountry.code} className="w-4 h-4 rounded-full shadow-sm" />}
          <ArrowRightIcon className="w-3 h-3 text-slate-400" />
          {toCountry && <FlagIcon countryCode={toCountry.code} className="w-4 h-4 rounded-full shadow-sm" />}
        </div>
      </td>

      <td className="px-4 py-4">
        <span className={`px-3 py-1 text-[10px] font-bold rounded-full border ${statusStyle} inline-flex items-center gap-1.5 uppercase tracking-wide`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.includes('text-teal') ? 'bg-teal-500' : statusStyle.includes('text-red') ? 'bg-red-500' : statusStyle.includes('text-blue') ? 'bg-blue-500' : 'bg-amber-500'}`} />
          {transaction.status}
        </span>
      </td>
    </motion.tr>
  );
};

export default History;

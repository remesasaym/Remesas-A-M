import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import Card from './common/Card';
import type { User, Transaction } from '../types';
import { COUNTRIES } from '../constants';
import FlagIcon from './icons/FlagIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import TransactionModal from './TransactionModal';
import SortIcon from './icons/SortIcon';
import { supabase } from '../supabaseClient';
import PaginationControls from './PaginationControls';

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
    <th scope="col" className={`px-4 py-3 ${className}`}>
      <button
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1.5 group transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        aria-label={`Ordenar por ${label}`}
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

        // Obtener token de autenticación
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No hay sesión activa');
        }

        // Usar endpoint del backend que devuelve datos ya desencriptados
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/remittances/history?userId=${user.id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al obtener el historial');
        }

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
    setCurrentPage(1); // Restablecer a la primera página al ordenar
  };

  const sortedTransactions = useMemo(() => {
    const sortable = [...transactions];
    sortable.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return valA - valB;
      }
      if (typeof valA === 'string' && typeof valB === 'string') {
        if (sortKey === 'created_at') {
          return new Date(valA).getTime() - new Date(valB).getTime();
        }
        return valA.localeCompare(valB);
      }
      return 0;
    });

    if (sortDirection === 'desc') {
      sortable.reverse();
    }
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
        <div className="text-center p-12 text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          Cargando historial...
        </div>
      );
    }

    if (error) {
      return <div className="text-center p-12 text-red-500 bg-red-50 dark:bg-red-900/30 rounded-lg">{error}</div>;
    }

    if (transactions.length === 0) {
      return (
        <div className="text-center p-12 text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <h3 className="mt-2 text-xl font-semibold text-gray-800 dark:text-white">Sin Transacciones</h3>
          <p className="mt-1 text-sm">Aún no has realizado ningún envío. ¡Empieza hoy!</p>
        </div>
      );
    }

    return (
      <div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
              <tr>
                <SortableHeader label="Fecha" sortKey="created_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSortAndResetPage} />
                <SortableHeader label="Destinatario" sortKey="recipient_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSortAndResetPage} />
                <SortableHeader label="Monto Enviado" sortKey="amount_sent" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSortAndResetPage} className="hidden sm:table-cell" />
                <th scope="col" className="px-4 py-3">Ruta</th>
                <SortableHeader label="Estado" sortKey="status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSortAndResetPage} />
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.map(tx => (
                <TransactionRow key={tx.id} transaction={tx} onClick={() => setSelectedTransaction(tx)} />
              ))}
            </tbody>
          </table>
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
    <>
      <Card>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Historial de Transacciones</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Aquí puedes ver todos tus envíos realizados. Haz clic en una fila para ver detalles u ordénalos por columna.</p>
        {renderContent()}
      </Card>

      <AnimatePresence>
        {selectedTransaction && (
          <TransactionModal
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};


const TransactionRow: React.FC<{ transaction: Transaction; onClick: () => void; }> = ({ transaction, onClick }) => {
  const fromCountry = COUNTRIES.find(c => c.code === transaction.from_country_code);
  const toCountry = COUNTRIES.find(c => c.code === transaction.to_country_code);

  return (
    <tr
      onClick={onClick}
      className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
    >
      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
        {new Date(transaction.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
      </td>
      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
        {transaction.recipient_name}
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className="font-mono">{transaction.amount_sent.toLocaleString('en-US', { minimumFractionDigits: 2 })} {transaction.currency_sent}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {fromCountry && <FlagIcon countryCode={fromCountry.code} className="w-5 h-auto rounded-full" />}
          <ArrowRightIcon className="w-4 h-4 text-gray-400" />
          {toCountry && <FlagIcon countryCode={toCountry.code} className="w-5 h-auto rounded-full" />}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${transaction.status === 'COMPLETADO' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
          transaction.status === 'RECHAZADO' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
            transaction.status === 'VERIFICADO' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
          }`}>
          {transaction.status}
        </span>
      </td>
    </tr>
  );
};


export default History;

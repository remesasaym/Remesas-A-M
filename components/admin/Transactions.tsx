import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Transaction } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      // Obtener token de autenticación
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      // Usar endpoint del backend que devuelve datos ya desencriptados
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/admin/transactions`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener transacciones');
      }

      const data = await response.json();
      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleStatusChange = async (transaction_id: string, newStatus: string) => {
    console.log('handleStatusChange called:', { transaction_id, newStatus });

    try {
      console.log('Updating status in Supabase...');
      // Update in Supabase directly for Admin actions (or use backend endpoint if preferred)
      const { error } = await supabase
        .from('transactions')
        .update({
          status: newStatus,
          processed_at: new Date().toISOString(),
          // processed_by: 'admin' // TODO: Add admin ID
        })
        .eq('transaction_id', transaction_id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Status updated successfully, refreshing list...');
      // Refresh list
      await fetchTransactions();
      alert(`✅ Estado cambiado a ${newStatus} exitosamente`);
    } catch (error: any) {
      console.error('handleStatusChange error:', error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTx(expandedTx === id ? null : id);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'PROCESANDO': 'bg-blue-100 text-blue-800',
      'COMPLETADO': 'bg-green-100 text-green-800',
      'FALLIDO': 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  if (loading) return <div className="p-4 text-center">Cargando operaciones...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Mesa de Operaciones</h3>
        <button onClick={fetchTransactions} className="text-sm text-indigo-600 hover:text-indigo-800">Actualizar</button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-300">Fecha / ID</th>
              <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-300">Usuario</th>
              <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-300">Envía</th>
              <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-300">Recibe</th>
              <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-300">Estado</th>
              <th className="py-3 px-4 text-left font-medium text-gray-500 dark:text-gray-300">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map((tx) => (
              <React.Fragment key={tx.id}>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => toggleExpand(tx.id)}>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {format(new Date(tx.created_at), 'dd MMM HH:mm', { locale: es })}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">{tx.transaction_id.slice(0, 8)}...</div>
                  </td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    {tx.user_id.slice(0, 8)}...
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                    {tx.amount_sent.toLocaleString()} {tx.currency_sent}
                  </td>
                  <td className="py-3 px-4 font-medium text-green-600 dark:text-green-400">
                    {tx.amount_received.toLocaleString()} {tx.currency_received}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(tx.status)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      {tx.status === 'PENDIENTE' && (
                        <button
                          onClick={() => handleStatusChange(tx.transaction_id, 'PROCESANDO')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                        >
                          Verificar
                        </button>
                      )}
                      {tx.status === 'PROCESANDO' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(tx.transaction_id, 'COMPLETADO')}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                          >
                            Completar
                          </button>
                          <button
                            onClick={() => handleStatusChange(tx.transaction_id, 'FALLIDO')}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedTx === tx.id && (
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <td colSpan={6} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-700 dark:text-gray-300 border-b pb-1">Detalles del Beneficiario</h4>
                          <p><span className="text-gray-500">Nombre:</span> {tx.recipient_name}</p>
                          <p><span className="text-gray-500">Banco:</span> {tx.recipient_bank}</p>
                          <p><span className="text-gray-500">Cuenta:</span> {tx.recipient_account}</p>
                          <p><span className="text-gray-500">Documento:</span> {tx.recipient_id}</p>
                          <p><span className="text-gray-500">País Destino:</span> {tx.to_country_code}</p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-bold text-gray-700 dark:text-gray-300 border-b pb-1">Detalles Financieros</h4>
                          <p><span className="text-gray-500">Comisión:</span> {tx.fee} {tx.currency_sent}</p>
                          <p><span className="text-gray-500">Tasa Implícita:</span> 1 {tx.currency_sent} = {(tx.amount_received / (tx.amount_sent - tx.fee)).toFixed(4)} {tx.currency_received}</p>
                          <p><span className="text-gray-500">ID Completo:</span> {tx.transaction_id}</p>

                          {/* Receipt Viewer */}
                          {tx.receipt_url ? (
                            <div className="mt-4">
                              <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Comprobante de Pago</p>
                              <a href={tx.receipt_url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={tx.receipt_url}
                                  alt="Comprobante"
                                  className="max-w-full h-auto max-h-64 rounded-lg border border-gray-200 dark:border-gray-700 hover:opacity-90 transition-opacity"
                                />
                              </a>
                            </div>
                          ) : (
                            <div className="mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg text-center">
                              <p className="text-gray-400 text-xs">Sin comprobante adjunto</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;

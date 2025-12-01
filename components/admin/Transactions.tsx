import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Transaction } from '../../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { RefreshCw, Search, Filter, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

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
      // alert(`✅ Estado cambiado a ${newStatus} exitosamente`);
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
      'PENDIENTE': 'bg-warning/10 text-warning-dark border-warning/20',
      'PROCESANDO': 'bg-secondary/10 text-secondary-dark border-secondary/20',
      'COMPLETADO': 'bg-accent/10 text-accent-dark border-accent/20',
      'FALLIDO': 'bg-red-50 text-red-600 border-red-100',
    };

    const icons: Record<string, React.ReactNode> = {
      'PENDIENTE': <Clock size={12} />,
      'PROCESANDO': <RefreshCw size={12} className="animate-spin" />,
      'COMPLETADO': <CheckCircle size={12} />,
      'FALLIDO': <XCircle size={12} />,
    };

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit ${styles[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
        {icons[status]}
        {status}
      </span>
    );
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-3">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-medium">Error: {error}</p>
    </div>
  );

  return (
    <Card variant="default" padding="none" className="overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/50">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Mesa de Operaciones</h3>
          <p className="text-xs text-slate-500">Gestiona y supervisa todas las transacciones</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar ID..."
              className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all w-full sm:w-48"
            />
          </div>
          <Button variant="ghost" size="sm" onClick={fetchTransactions} className="text-slate-500 hover:text-primary">
            <RefreshCw size={16} />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase text-slate-500 font-semibold">
            <tr>
              <th className="px-6 py-3">Fecha / ID</th>
              <th className="px-6 py-3">Usuario</th>
              <th className="px-6 py-3">Envía</th>
              <th className="px-6 py-3">Recibe</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {transactions.map((tx) => (
              <React.Fragment key={tx.id}>
                <tr
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${expandedTx === tx.id ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}
                  onClick={() => toggleExpand(tx.id)}
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 dark:text-white">
                      {format(new Date(tx.created_at), 'dd MMM HH:mm', { locale: es })}
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                      {tx.transaction_id.slice(0, 8)}...
                      {expandedTx === tx.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono text-xs">
                    {tx.user_id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                    {tx.amount_sent.toLocaleString()} <span className="text-xs font-normal text-slate-500">{tx.currency_sent}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-accent-dark">
                    {tx.amount_received.toLocaleString()} <span className="text-xs font-normal text-accent-dark/70">{tx.currency_received}</span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(tx.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                      {tx.status === 'PENDIENTE' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleStatusChange(tx.transaction_id, 'PROCESANDO')}
                        >
                          Verificar
                        </Button>
                      )}
                      {tx.status === 'PROCESANDO' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-accent hover:bg-accent-dark text-white border-none"
                            onClick={() => handleStatusChange(tx.transaction_id, 'COMPLETADO')}
                          >
                            Completar
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleStatusChange(tx.transaction_id, 'FALLIDO')}
                          >
                            Rechazar
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedTx === tx.id && (
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                    <td colSpan={6} className="p-0">
                      <div className="p-6 border-t border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                        <div className="space-y-4">
                          <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="w-1 h-4 bg-primary rounded-full"></span>
                            Detalles del Beneficiario
                          </h4>
                          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-700 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Nombre:</span>
                              <span className="font-medium text-slate-800 dark:text-white">{tx.recipient_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Banco:</span>
                              <span className="font-medium text-slate-800 dark:text-white">{tx.recipient_bank}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Cuenta:</span>
                              <span className="font-mono font-medium text-slate-800 dark:text-white">{tx.recipient_account}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Documento:</span>
                              <span className="font-medium text-slate-800 dark:text-white">{tx.recipient_id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">País Destino:</span>
                              <span className="font-medium text-slate-800 dark:text-white">{tx.to_country_code}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="w-1 h-4 bg-secondary rounded-full"></span>
                            Detalles Financieros
                          </h4>
                          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-700 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Comisión:</span>
                              <span className="font-medium text-slate-800 dark:text-white">{tx.fee} {tx.currency_sent}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Tasa Implícita:</span>
                              <span className="font-medium text-slate-800 dark:text-white">1 {tx.currency_sent} = {(tx.amount_received / (tx.amount_sent - tx.fee)).toFixed(4)} {tx.currency_received}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">ID Completo:</span>
                              <span className="font-mono text-xs text-slate-400">{tx.transaction_id}</span>
                            </div>
                          </div>

                          {/* Receipt Viewer */}
                          {tx.receipt_url ? (
                            <div className="mt-4">
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Comprobante de Pago</p>
                              <a href={tx.receipt_url} target="_blank" rel="noopener noreferrer" className="block group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                                <img
                                  src={tx.receipt_url}
                                  alt="Comprobante"
                                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-white font-medium text-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Ver original</span>
                                </div>
                              </a>
                            </div>
                          ) : (
                            <div className="mt-4 p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center bg-slate-50 dark:bg-slate-800/50">
                              <p className="text-slate-400 text-xs">Sin comprobante adjunto</p>
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
    </Card>
  );
};

export default Transactions;

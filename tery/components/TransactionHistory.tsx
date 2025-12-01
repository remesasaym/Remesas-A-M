
import React from 'react';
import { ArrowUpRight, Filter, ChevronDown } from 'lucide-react';
import { Transaction } from '../types';

export const TransactionHistory: React.FC = () => {
  const transactions: Transaction[] = [
    { id: '1', date: 'Hoy, 10:45 AM', recipient: 'Meyling Diaz', amount: 100.00, currency: 'USD', status: 'completed', flag: '🇻🇪' },
    { id: '2', date: 'Ayer, 4:20 PM', recipient: 'Juan Perez', amount: 50.00, currency: 'USD', status: 'pending', flag: '🇨🇴' },
    { id: '3', date: '25 Nov, 2025', recipient: 'Maria Silva', amount: 300.00, currency: 'USD', status: 'failed', flag: '🇵🇪' },
    { id: '4', date: '20 Nov, 2025', recipient: 'Pedro Pascal', amount: 1200.00, currency: 'USD', status: 'completed', flag: '🇨🇱' },
  ];

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-stitch-mint/10 text-stitch-mint border-stitch-mint/20';
      case 'pending': return 'bg-stitch-yellow/10 text-stitch-yellow border-stitch-yellow/20';
      case 'failed': return 'bg-stitch-coral/10 text-stitch-coral border-stitch-coral/20';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'completed': return 'Completado';
      case 'pending': return 'Procesando';
      case 'failed': return 'Fallido';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in bg-[#FCFBF8]">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Historial</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
          <Filter size={16} />
          Filtrar
          <ChevronDown size={14} />
        </button>
      </div>

      <div className="space-y-4">
        {transactions.map((tx) => (
          <div key={tx.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#F8FAFC] rounded-2xl flex items-center justify-center text-2xl border border-slate-100 group-hover:scale-105 transition-transform relative">
                {tx.flag}
                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full border border-slate-100">
                    <div className={`w-3 h-3 rounded-full ${tx.status === 'completed' ? 'bg-stitch-mint' : tx.status === 'pending' ? 'bg-stitch-yellow' : 'bg-stitch-coral'}`}></div>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{tx.recipient}</h3>
                <p className="text-slate-400 text-sm font-medium">{tx.date}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-extrabold text-slate-800 text-lg">-${tx.amount}</div>
              <div className={`text-xs font-bold px-3 py-1 rounded-full border inline-block mt-1 ${getStatusStyle(tx.status)}`}>
                {getStatusLabel(tx.status)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

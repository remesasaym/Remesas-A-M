
import React from 'react';
import { Plus, Search, MoreVertical } from 'lucide-react';
import { Beneficiary } from '../types';

export const BeneficiariesList: React.FC = () => {
  // Mock Data - toggle this array to see empty state
  const beneficiaries: Beneficiary[] = []; 
  
  // const beneficiaries: Beneficiary[] = [
  //   { id: '1', name: 'Maria Perez', bank: 'Banesco', accountNumber: '...1234', flag: '🇻🇪' },
  //   { id: '2', name: 'Juan Silva', bank: 'Mercantil', accountNumber: '...5678', flag: '🇻🇪' },
  // ];

  return (
    <div className="space-y-6 animate-fade-in bg-[#FCFBF8]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Mis Beneficiarios</h2>
        <button className="bg-stitch-sky text-white p-3 rounded-full shadow-lg shadow-stitch-sky/30 hover:bg-[#5bb0d4] transition-colors">
          <Plus size={24} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input 
          type="text" 
          placeholder="Buscar persona..." 
          className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-700 outline-none focus:border-stitch-sky focus:ring-2 focus:ring-stitch-sky/20 transition-all placeholder:text-slate-300 font-medium"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
      </div>

      {beneficiaries.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6 relative">
            <div className="absolute w-full h-full bg-stitch-coral/10 rounded-full animate-ping opacity-20" />
            <UsersIllustration />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Aún no tienes beneficiarios</h3>
          <p className="text-slate-400 max-w-xs mx-auto mb-8">Agrega a tus familiares y amigos para enviarles dinero rápidamente.</p>
          <button className="px-8 py-4 bg-white border-2 border-stitch-coral text-stitch-coral rounded-full font-bold hover:bg-stitch-coral hover:text-white transition-all">
            + Añadir el primero
          </button>
        </div>
      ) : (
        // List State (Hidden in this demo default, but coded)
        <div className="grid gap-4">
          {beneficiaries.map(ben => (
            <div key={ben.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-2xl border border-slate-200">
                  {ben.flag}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 group-hover:text-stitch-sky transition-colors">{ben.name}</h4>
                  <p className="text-sm text-slate-400">{ben.bank} • {ben.accountNumber}</p>
                </div>
              </div>
              <button className="text-slate-300 hover:text-slate-600 p-2">
                <MoreVertical size={20} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Simple SVG Component for Empty State
const UsersIllustration = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FF6B9D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

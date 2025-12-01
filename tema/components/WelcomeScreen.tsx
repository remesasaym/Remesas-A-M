
import React from 'react';
import { ArrowRight, Wallet, TrendingUp, Clock } from 'lucide-react';
import { ViewState } from '../types';

interface WelcomeScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 animate-fade-in-up bg-[#FCFBF8]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
            Hola, Anthony <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Bienvenido a Remesas A&M</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-stitch-sky/20 border-2 border-stitch-sky p-1">
          <img 
            src="https://picsum.photos/200" 
            alt="Profile" 
            className="w-full h-full rounded-full object-cover"
          />
        </div>
      </div>

      {/* Main Stats Card */}
      <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
        <div className="absolute top-0 right-0 w-64 h-64 bg-stitch-yellow/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 group-hover:bg-stitch-yellow/20 transition-colors" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-stitch-mint/20 text-stitch-mint rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-sm">Total Enviado</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-extrabold text-slate-800 tracking-tighter">$757.53</span>
            <span className="text-xl text-slate-400 font-bold">USD</span>
          </div>
          <div className="mt-6 flex items-center gap-2 text-slate-500 bg-slate-50 w-fit px-4 py-2 rounded-full">
            <span className="w-2 h-2 rounded-full bg-stitch-mint animate-pulse" />
            <span className="text-sm font-medium">10 transacciones exitosas</span>
          </div>
        </div>
      </div>

      {/* Primary Action */}
      <button 
        onClick={() => onNavigate('send')}
        className="w-full bg-stitch-coral hover:bg-[#ff5c93] text-white py-6 rounded-full text-xl font-bold shadow-xl shadow-stitch-coral/30 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:scale-95 group"
      >
        <span>Realizar un Nuevo Envío</span>
        <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
          <ArrowRight size={24} />
        </div>
      </button>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onNavigate('beneficiaries')} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-stitch-sky/50 hover:shadow-md transition-all text-left group">
          <div className="w-12 h-12 bg-stitch-sky/20 text-stitch-sky rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Wallet size={24} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Beneficiarios</h3>
          <p className="text-slate-400 text-sm mt-1">Gestionar cuentas</p>
        </button>
        <button onClick={() => onNavigate('history')} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-stitch-yellow/50 hover:shadow-md transition-all text-left group">
          <div className="w-12 h-12 bg-stitch-yellow/20 text-stitch-yellow rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Clock size={24} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Historial</h3>
          <p className="text-slate-400 text-sm mt-1">Ver movimientos</p>
        </button>
      </div>
    </div>
  );
};

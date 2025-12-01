
import React from 'react';
import { ArrowLeft, ArrowRightLeft, Info, CheckCircle2 } from 'lucide-react';
import { ViewState } from '../types';

interface SendMoneyFormProps {
  onNavigate: (view: ViewState) => void;
}

export const SendMoneyForm: React.FC<SendMoneyFormProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6 animate-slide-up bg-[#FCFBF8]">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onNavigate('welcome')}
          className="p-3 bg-white rounded-full border border-slate-100 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ArrowLeft size={24} className="text-slate-600" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800">Enviar Dinero</h2>
      </div>

      {/* Exchange Rate Card */}
      <div className="bg-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-stitch-mint/20 rounded-full blur-2xl" />
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-stitch-mint rounded-full animate-pulse" />
          <span className="text-stitch-mint text-sm font-bold tracking-wide">TASA EN TIEMPO REAL</span>
        </div>
        <div className="flex justify-between items-end relative z-10">
          <div>
            <p className="text-slate-400 text-sm">1 USD equivale a</p>
            <p className="text-3xl font-bold mt-1">36.84 VES</p>
          </div>
          <div className="text-right">
            <p className="text-stitch-sky text-sm font-medium flex items-center gap-1">
              <CheckCircle2 size={14} />
              Mejor tasa garantizada
            </p>
          </div>
        </div>
      </div>

      {/* Main Input Form */}
      <div className="bg-white rounded-[2rem] p-2 shadow-sm border border-slate-100">
        
        {/* Origin Country */}
        <div className="p-6 pb-2">
          <label className="text-slate-400 text-sm font-bold uppercase tracking-wider ml-1">Tú envías</label>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
              <span className="text-2xl">🇺🇸</span>
              <span className="font-bold text-slate-700">USD</span>
            </div>
            <input 
              type="text" 
              defaultValue="100.00" 
              className="w-full text-right text-4xl font-extrabold text-slate-800 outline-none placeholder-slate-200 bg-transparent"
            />
          </div>
        </div>

        {/* Divider with Swap Icon */}
        <div className="relative h-px bg-slate-100 my-2 mx-6">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full border border-slate-100 text-stitch-sky shadow-sm">
            <ArrowRightLeft size={20} />
          </div>
        </div>

        {/* Destination Country */}
        <div className="p-6 pt-2">
          <label className="text-slate-400 text-sm font-bold uppercase tracking-wider ml-1">Ellos reciben</label>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
              <span className="text-2xl">🇻🇪</span>
              <span className="font-bold text-slate-700">VES</span>
            </div>
            <input 
              type="text" 
              value="3,684.00" 
              readOnly
              className="w-full text-right text-4xl font-extrabold text-stitch-mint outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Fee Summary */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 space-y-3">
        <div className="flex justify-between items-center text-slate-600">
          <span className="flex items-center gap-2 text-sm">
            Comisión de servicio
            <Info size={14} className="text-slate-400" />
          </span>
          <span className="font-bold">2.50 USD</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span className="text-sm">Total a pagar</span>
          <span className="font-bold">102.50 USD</span>
        </div>
        <div className="h-px bg-slate-100 my-2" />
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-slate-800">Tiempo de entrega</span>
          <span className="font-bold text-stitch-mint bg-stitch-mint/10 px-3 py-1 rounded-full text-xs">⚡ Instantáneo</span>
        </div>
      </div>

      {/* CTA */}
      <div className="pt-4">
        <button className="w-full bg-stitch-coral hover:bg-[#ff5c93] text-white py-6 rounded-full text-xl font-bold shadow-xl shadow-stitch-coral/30 transition-all transform hover:-translate-y-1 active:scale-95">
          Continuar con el Envío
        </button>
      </div>
    </div>
  );
};

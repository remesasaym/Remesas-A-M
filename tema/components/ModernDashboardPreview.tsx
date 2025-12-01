
import React from 'react';
import { Bell, ArrowUpRight, ArrowDownLeft, Wallet, CreditCard, Scan, MoreHorizontal, Search } from 'lucide-react';

export const ModernDashboardPreview: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FCFBF8] text-slate-800 p-6 md:p-12 font-sans relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-stitch-coral/10 rounded-full blur-[100px] -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-stitch-sky/10 rounded-full blur-[100px] -z-10" />

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* --- HEADER SECTION --- */}
        <div className="md:col-span-12 flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Hola, Anthony</h1>
            <p className="text-slate-400 font-medium">Tienes 4 notificaciones nuevas</p>
          </div>
          <div className="flex gap-4">
            <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 hover:scale-105 transition-transform relative">
              <Bell size={20} className="text-slate-600" />
              <span className="absolute top-3 right-3 w-2 h-2 bg-stitch-coral rounded-full border border-white"></span>
            </button>
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-stitch-coral to-stitch-yellow p-[2px]">
              <img src="https://picsum.photos/200" className="w-full h-full rounded-full border-2 border-white object-cover" alt="Profile" />
            </div>
          </div>
        </div>

        {/* --- BENTO BOX 1: MAIN CARD (Infinite Card) --- */}
        <div className="md:col-span-8 bg-white rounded-[2.5rem] p-1 shadow-sm border border-slate-100 relative group overflow-hidden">
          <div className="absolute inset-0 bg-white/50 backdrop-blur-xl z-10 hidden md:block" /> 
          {/* Using a functional component structure inside for demo */}
          <div className="bg-slate-900 rounded-[2.3rem] p-8 text-white h-full relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            {/* Mesh Gradient Background */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-stitch-coral rounded-full blur-[80px] opacity-60 translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-stitch-sky rounded-full blur-[80px] opacity-60 -translate-x-1/3 translate-y-1/3"></div>
            
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-white/60 font-medium mb-1">Balance Total</p>
                <h2 className="text-5xl font-bold tracking-tight">$12,450.00</h2>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center gap-2">
                <div className="w-2 h-2 bg-stitch-mint rounded-full animate-pulse"></div>
                <span className="text-sm font-bold">Activo</span>
              </div>
            </div>

            <div className="relative z-10 flex items-end justify-between">
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-white/50 uppercase tracking-widest">Titular</span>
                  <span className="font-medium tracking-wide">ANTHONY PIÑERO</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-white/50 uppercase tracking-widest">Expira</span>
                  <span className="font-medium tracking-wide">09/28</span>
                </div>
              </div>
              <img src="https://raw.githubusercontent.com/muhammederdem/credit-card-form/master/src/assets/images/visa.png" className="h-12 opacity-80" alt="Visa" />
            </div>
          </div>
        </div>

        {/* --- BENTO BOX 2: QUICK ACTIONS --- */}
        <div className="md:col-span-4 grid grid-rows-2 gap-6">
          {/* Send Money Action */}
          <div className="bg-stitch-coral text-white rounded-[2.5rem] p-8 relative overflow-hidden group cursor-pointer hover:shadow-xl hover:shadow-stitch-coral/30 transition-all">
             <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
             <div className="relative z-10 h-full flex flex-col justify-between">
               <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                 <ArrowUpRight size={24} />
               </div>
               <div>
                 <h3 className="text-2xl font-bold">Enviar</h3>
                 <p className="text-white/80">Transferencia rápida</p>
               </div>
             </div>
          </div>

          {/* Request Money Action */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 relative overflow-hidden group cursor-pointer hover:border-stitch-sky/50 transition-all">
             <div className="relative z-10 h-full flex flex-col justify-between">
               <div className="w-12 h-12 bg-stitch-sky/10 text-stitch-sky rounded-2xl flex items-center justify-center mb-4">
                 <ArrowDownLeft size={24} />
               </div>
               <div>
                 <h3 className="text-2xl font-bold text-slate-800">Recibir</h3>
                 <p className="text-slate-400">Solicitar pago</p>
               </div>
             </div>
          </div>
        </div>

        {/* --- BENTO BOX 3: QUICK CONTACTS (Stories Style) --- */}
        <div className="md:col-span-12 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Envío Rápido</h3>
            <button className="text-stitch-coral font-bold text-sm">Ver todos</button>
          </div>
          <div className="flex gap-8 overflow-x-auto no-scrollbar pb-2">
            {/* Add New */}
            <div className="flex flex-col items-center gap-2 min-w-[64px] cursor-pointer group">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 group-hover:border-stitch-coral group-hover:text-stitch-coral transition-colors bg-slate-50">
                <Scan size={24} />
              </div>
              <span className="text-xs font-bold text-slate-500">Nuevo</span>
            </div>
            
            {/* Contacts */}
            {[1,2,3,4,5].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 min-w-[64px] cursor-pointer group">
                <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-stitch-coral to-stitch-yellow group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full border-2 border-white overflow-hidden">
                    <img src={`https://picsum.photos/200?random=${i}`} className="w-full h-full object-cover" alt="User" />
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-600">User {i+1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* --- BENTO BOX 4: RECENT ACTIVITY --- */}
        <div className="md:col-span-7 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm h-fit">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Actividad Reciente</h3>
            <div className="bg-slate-50 p-1 rounded-xl flex">
              <button className="px-3 py-1 bg-white shadow-sm rounded-lg text-xs font-bold text-slate-800">Todas</button>
              <button className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-slate-600">Ingresos</button>
              <button className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-slate-600">Gastos</button>
            </div>
          </div>
          
          <div className="space-y-2">
            {[1,2,3].map((_, i) => (
              <div key={i} className="group flex items-center justify-between p-4 hover:bg-slate-50 rounded-3xl transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${i === 1 ? 'bg-stitch-mint/10 text-stitch-mint' : 'bg-slate-100 text-slate-500'}`}>
                    {i === 1 ? <ArrowDownLeft size={20} /> : <Wallet size={20} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Transferencia {i === 1 ? 'Recibida' : 'Enviada'}</h4>
                    <p className="text-xs text-slate-400 font-medium">Hace 2 horas • Netflix Subscription</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`block font-bold ${i === 1 ? 'text-stitch-mint' : 'text-slate-800'}`}>
                    {i === 1 ? '+' : '-'}$14.99
                  </span>
                  <span className="text-xs text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-full">Completado</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- BENTO BOX 5: ANALYTICS PREVIEW --- */}
        <div className="md:col-span-5 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-stitch-yellow/20 rounded-full blur-3xl"></div>
           <h3 className="text-lg font-bold mb-1 relative z-10">Gastos vs. Ingresos</h3>
           <p className="text-slate-400 text-sm mb-6 relative z-10">Noviembre 2025</p>

           <div className="flex items-end gap-2 h-40 justify-between relative z-10 px-2">
             {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
               <div key={i} className="w-full bg-slate-800 rounded-t-lg relative group">
                 <div 
                    className="absolute bottom-0 left-0 w-full bg-stitch-sky rounded-t-lg transition-all duration-500 group-hover:bg-stitch-coral"
                    style={{ height: `${h}%` }}
                 ></div>
               </div>
             ))}
           </div>
           
           <div className="mt-6 flex justify-between items-center bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-stitch-mint flex items-center justify-center">
                 <ArrowUpRight size={16} className="text-white" />
               </div>
               <div>
                  <p className="text-xs text-slate-400">Ahorro Mensual</p>
                  <p className="font-bold">+$1,204</p>
               </div>
             </div>
             <span className="text-stitch-mint font-bold text-sm">+12%</span>
           </div>
        </div>

      </div>
    </div>
  );
};

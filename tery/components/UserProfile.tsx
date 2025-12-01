
import React from 'react';
import { ShieldCheck, Edit2, LogOut, Settings, Bell, Lock } from 'lucide-react';

export const UserProfile: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in bg-[#FCFBF8]">
      <h2 className="text-2xl font-bold text-slate-800">Mi Perfil</h2>

      {/* Identity Card */}
      <div className="bg-slate-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl">
         <div className="absolute top-0 right-0 w-48 h-48 bg-stitch-sky/20 rounded-full blur-3xl transform translate-x-1/4 -translate-y-1/4" />
         
         <div className="flex items-center gap-4 mb-6 relative z-10">
           <div className="w-20 h-20 rounded-full border-4 border-slate-700 bg-slate-600 overflow-hidden">
             <img src="https://picsum.photos/200" alt="Avatar" className="w-full h-full object-cover" />
           </div>
           <div>
             <h3 className="text-xl font-bold">Anthony Piñero</h3>
             <p className="text-slate-400">anthony@example.com</p>
           </div>
         </div>

         <div className="bg-stitch-mint/10 border border-stitch-mint/20 rounded-2xl p-4 flex items-center gap-3 relative z-10">
           <div className="w-10 h-10 bg-stitch-mint text-white rounded-full flex items-center justify-center shadow-lg shadow-stitch-mint/20">
             <ShieldCheck size={20} />
           </div>
           <div>
             <h4 className="font-bold text-stitch-mint">Identidad Verificada</h4>
             <p className="text-xs text-slate-400">Puedes enviar hasta $5,000/mes</p>
           </div>
         </div>
      </div>

      {/* Settings List */}
      <div className="bg-white rounded-[2rem] p-2 border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <ProfileMenuItem icon={Edit2} label="Editar Datos Personales" />
          <ProfileMenuItem icon={Bell} label="Notificaciones" badge="2" />
          <ProfileMenuItem icon={Lock} label="Seguridad y Privacidad" />
          <ProfileMenuItem icon={Settings} label="Configuración General" />
        </div>
      </div>

      <button className="w-full py-4 text-stitch-coral font-bold hover:bg-stitch-coral/5 rounded-2xl transition-colors flex items-center justify-center gap-2">
        <LogOut size={20} />
        Cerrar Sesión
      </button>

      <p className="text-center text-slate-300 text-sm">Versión 2.5.0 (Build 2025)</p>
    </div>
  );
};

const ProfileMenuItem = ({ icon: Icon, label, badge }: { icon: React.ElementType, label: string, badge?: string }) => (
  <button className="w-full p-4 hover:bg-slate-50 rounded-2xl flex items-center justify-between transition-colors group">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
        <Icon size={20} />
      </div>
      <span className="font-bold text-slate-700">{label}</span>
    </div>
    {badge ? (
      <span className="bg-stitch-coral text-white text-xs font-bold px-2 py-1 rounded-full">{badge}</span>
    ) : (
      <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-stitch-sky transition-colors" />
    )}
  </button>
);

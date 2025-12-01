import React from 'react';
import { Home, Send, Users, Clock, User, ShieldCheck } from 'lucide-react';
import { ViewState } from '../types';

interface NavigationProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: 'welcome', icon: Home, label: 'Inicio' },
    { id: 'send', icon: Send, label: 'Enviar' },
    { id: 'beneficiaries', icon: Users, label: 'Contactos' },
    { id: 'history', icon: Clock, label: 'Historial' },
    { id: 'profile', icon: User, label: 'Perfil' },
    { id: 'admin', icon: ShieldCheck, label: 'Admin' },
  ];

  return (
    <>
      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-6 left-6 right-6 md:hidden z-50">
        <div className="bg-white/90 backdrop-blur-lg rounded-full shadow-xl border border-white/50 px-4 py-3 flex justify-between items-center">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as ViewState)}
              className={`p-3 rounded-full transition-all duration-300 ${
                currentView === item.id
                  ? 'bg-stitch-coral text-white shadow-lg shadow-stitch-coral/30 scale-110'
                  : 'text-slate-400 hover:text-stitch-coral hover:bg-stitch-coral/10'
              }`}
            >
              <item.icon size={20} />
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col fixed left-0 top-0 h-full w-24 bg-white border-r border-slate-100 items-center py-8 z-50">
        <div className="mb-12">
          <div className="w-12 h-12 bg-gradient-to-tr from-stitch-coral to-stitch-yellow rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
            AM
          </div>
        </div>
        <div className="flex flex-col gap-6 w-full px-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as ViewState)}
              className={`p-3 rounded-2xl flex flex-col items-center gap-1 transition-all duration-300 group ${
                currentView === item.id
                  ? 'bg-stitch-coral text-white shadow-lg shadow-stitch-coral/30'
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <item.icon size={24} className={`transition-transform duration-300 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute left-20 bg-slate-800 text-white px-2 py-1 rounded-lg">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
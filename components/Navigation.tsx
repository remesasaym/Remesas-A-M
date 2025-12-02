import React from 'react';
import { Home, Send, Users, Clock, User, ShieldCheck, Info, LogOut } from 'lucide-react';
import { Screen } from '../types';
import { User as UserType } from '../types';
import { isAdmin } from '../services/adminService';
import { supabase } from '../supabaseClient';

interface NavigationProps {
    activeScreen: Screen;
    setActiveScreen: (screen: Screen) => void;
    user: UserType;
}

export const Navigation: React.FC<NavigationProps> = ({ activeScreen, setActiveScreen, user }) => {
    const handleLogout = async () => {
        await supabase.auth.signOut();
        // The App component listener will handle the redirect to AuthScreen
    };

    const navItems = [
        { id: Screen.Home, icon: Home, label: 'Inicio' },
        { id: Screen.Calculator, icon: Send, label: 'Enviar' },
        { id: Screen.Beneficiaries, icon: Users, label: 'Contactos' },
        { id: Screen.History, icon: Clock, label: 'Historial' },
        { id: Screen.Profile, icon: User, label: 'Perfil' },
        { id: Screen.Info, icon: Info, label: 'Info' },
    ];

    if (isAdmin(user)) {
        navItems.push({ id: Screen.Admin, icon: ShieldCheck, label: 'Admin' });
    }

    const uniqueNavItems = navItems.filter((item, index, self) =>
        index === self.findIndex((t) => (
            t.label === item.label
        ))
    );

    return (
        <>
            {/* Mobile Bottom Bar */}
            <div className="fixed bottom-6 left-6 right-6 md:hidden z-50">
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg rounded-full shadow-xl border border-white/50 dark:border-slate-700 px-4 py-3 flex justify-between items-center overflow-x-auto no-scrollbar">
                    {uniqueNavItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => item.action ? item.action() : setActiveScreen(item.id)}
                            className={`p-3 rounded-full transition-all duration-300 flex-shrink-0 ${activeScreen === item.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110'
                                : 'text-slate-400 dark:text-slate-500 hover:text-primary hover:bg-primary/10'
                                }`}
                        >
                            <item.icon size={20} />
                        </button>
                    ))}
                    {/* Mobile Logout - Added to the end of the scrollable list */}
                    <button
                        onClick={handleLogout}
                        className="p-3 rounded-full transition-all duration-300 flex-shrink-0 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col fixed left-0 top-0 h-full w-24 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 items-center py-8 z-50 transition-colors duration-300 justify-between">
                <div className="flex flex-col items-center w-full">
                    <div className="mb-12">
                        <div className="w-12 h-12 bg-gradient-to-tr from-primary to-warning rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            AM
                        </div>
                    </div>
                    <div className="flex flex-col gap-6 w-full px-4">
                        {uniqueNavItems.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => item.action ? item.action() : setActiveScreen(item.id)}
                                className={`p-3 rounded-2xl flex flex-col items-center gap-1 transition-all duration-300 group relative ${activeScreen === item.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                    : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <item.icon size={24} className={`transition-transform duration-300 ${activeScreen === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                                <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute left-20 bg-slate-800 text-white px-2 py-1 rounded-lg whitespace-nowrap z-50 pointer-events-none">
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Desktop Logout Button */}
                <div className="px-4 w-full">
                    <button
                        onClick={handleLogout}
                        className="p-3 rounded-2xl flex flex-col items-center gap-1 transition-all duration-300 group relative text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 w-full"
                    >
                        <LogOut size={24} className="transition-transform duration-300 group-hover:scale-110" />
                        <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute left-20 bg-slate-800 text-white px-2 py-1 rounded-lg whitespace-nowrap z-50 pointer-events-none">
                            Salir
                        </span>
                    </button>
                </div>
            </div>
        </>
    );
};

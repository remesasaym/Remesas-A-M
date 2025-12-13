import React, { useState } from 'react';
import { Home, Send, Users, Clock, User, ShieldCheck, Info, LogOut, Gift, MoreHorizontal } from 'lucide-react';

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
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // The App component listener will handle the redirect to AuthScreen
    };

    const navItems = [
        { id: Screen.Home, icon: Home, label: 'Inicio' },
        { id: Screen.Calculator, icon: Send, label: 'Enviar' },
        { id: Screen.Beneficiaries, icon: Users, label: 'Contactos' },
        { id: Screen.History, icon: Clock, label: 'Historial' },
        { id: Screen.Referrals, icon: Gift, label: 'Invita y Gana' },
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

    // For mobile: show first 4 items, rest go in "More" menu
    const mobileVisibleItems = uniqueNavItems.slice(0, 4);
    const mobileMoreItems = uniqueNavItems.slice(4);

    return (
        <>
            {/* Mobile Bottom Bar */}
            <div className="fixed bottom-6 left-6 right-6 md:hidden z-50">
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg rounded-full shadow-xl border border-white/50 dark:border-slate-700 px-4 py-3 flex justify-between items-center">
                    {mobileVisibleItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => setActiveScreen(item.id)}
                            className={`p-3 rounded-full transition-all duration-300 flex-shrink-0 ${activeScreen === item.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110'
                                : 'text-slate-400 dark:text-slate-500 hover:text-primary hover:bg-primary/10'
                                }`}
                        >
                            <item.icon size={20} />
                        </button>
                    ))}

                    {/* More Button (only if there are hidden items) */}
                    {mobileMoreItems.length > 0 && (
                        <div className="relative">
                            <button
                                onClick={() => setShowMoreMenu(!showMoreMenu)}
                                className="p-3 rounded-full transition-all duration-300 flex-shrink-0 text-slate-400 dark:text-slate-500 hover:text-primary hover:bg-primary/10"
                            >
                                <MoreHorizontal size={20} />
                            </button>

                            {/* More Menu Popup */}
                            {showMoreMenu && (
                                <>
                                    {/* Backdrop to close menu */}
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowMoreMenu(false)}
                                    />

                                    {/* Menu */}
                                    <div className="absolute bottom-full right-0 mb-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 min-w-[180px] z-50">
                                        {mobileMoreItems.map((item) => (
                                            <button
                                                key={item.label}
                                                onClick={() => {
                                                    setActiveScreen(item.id);
                                                    setShowMoreMenu(false);
                                                }}
                                                className={`w-full px-4 py-3 flex items-center gap-3 transition-all duration-200 ${activeScreen === item.id
                                                        ? 'bg-primary/10 text-primary'
                                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                    }`}
                                            >
                                                <item.icon size={18} />
                                                <span className="text-sm font-medium">{item.label}</span>
                                            </button>
                                        ))}

                                        {/* Logout in More menu */}
                                        <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2">
                                            <button
                                                onClick={() => {
                                                    handleLogout();
                                                    setShowMoreMenu(false);
                                                }}
                                                className="w-full px-4 py-3 flex items-center gap-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                                            >
                                                <LogOut size={18} />
                                                <span className="text-sm font-medium">Salir</span>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col fixed left-0 top-0 h-full w-20 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 items-center py-4 z-50 transition-colors duration-300 justify-between">
                <div className="flex flex-col items-center w-full">
                    <div className="mb-6">
                        <div className="w-10 h-10 bg-gradient-to-tr from-primary to-warning rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            AM
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 w-full px-2">
                        {uniqueNavItems.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => setActiveScreen(item.id)}
                                className={`p-2 rounded-xl flex flex-col items-center gap-0.5 transition-all duration-300 group relative ${activeScreen === item.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                    : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <item.icon size={20} className={`transition-transform duration-300 ${activeScreen === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                                <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute left-20 bg-slate-800 text-white px-2 py-1 rounded-lg whitespace-nowrap z-50 pointer-events-none">
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Desktop Logout Button */}
                <div className="px-2 w-full">
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-xl flex flex-col items-center gap-0.5 transition-all duration-300 group relative text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 w-full"
                    >
                        <LogOut size={20} className="transition-transform duration-300 group-hover:scale-110" />
                        <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute left-20 bg-slate-800 text-white px-2 py-1 rounded-lg whitespace-nowrap z-50 pointer-events-none">
                            Salir
                        </span>
                    </button>
                </div>
            </div>
        </>
    );
};


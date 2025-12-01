import React from 'react';
import { User } from '../types';
import { Card } from './ui/Card';

interface DashboardWelcomeProps {
    user: User;
    onNewTransaction: () => void;
}

const DashboardWelcome: React.FC<DashboardWelcomeProps> = ({ user, onNewTransaction }) => {
    const [totalSent, setTotalSent] = React.useState(0);
    const [completedCount, setCompletedCount] = React.useState(0);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data: { session } } = await import('../supabaseClient').then(m => m.supabase.auth.getSession());
                if (!session) {
                    console.warn('DashboardWelcome: No active session found.');
                    return;
                }

                console.log('DashboardWelcome: Fetching stats for user:', user.id);
                // console.log('DashboardWelcome: Token:', session.access_token.substring(0, 10) + '...'); // Debug only

                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                const response = await fetch(`${API_URL}/api/remittances/history?userId=${user.id}`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        const completed = data.filter((tx: any) => tx.status === 'COMPLETADO');
                        const total = completed.reduce((sum: number, tx: any) => sum + (Number(tx.amount_sent) || 0), 0);
                        setTotalSent(total);
                        setCompletedCount(completed.length);
                    }
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user.id]);

    return (
        <div className="space-y-8 animate-fade-in-up mb-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                        Hola, {user.fullName.split(' ')[0]} <span className="inline-block animate-bounce">👋</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-medium">Bienvenido a Remesas A&M</p>
                </div>
                {/* Avatar placeholder if no image */}
                <div className="w-12 h-12 rounded-full bg-secondary/20 border-2 border-secondary p-1 flex items-center justify-center overflow-hidden">
                    <span className="text-xl font-bold text-secondary">
                        {user.fullName.charAt(0)}
                    </span>
                </div>
            </div>

            {/* Main Stats Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300">
                <div className="absolute top-0 right-0 w-64 h-64 bg-warning/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 group-hover:bg-warning/20 transition-colors" />

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-accent/20 text-accent-dark rounded-2xl">
                            {/* TrendingUp Icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-sm">Total Enviado</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl sm:text-6xl font-extrabold text-slate-800 dark:text-white tracking-tighter">
                            ${totalSent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xl text-slate-400 font-bold">USD</span>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 w-fit px-4 py-2 rounded-full">
                        <span className={`w-2 h-2 rounded-full ${loading ? 'bg-gray-400' : 'bg-accent animate-pulse'}`} />
                        <span className="text-sm font-medium">
                            {loading ? 'Cargando...' : `${completedCount} transacciones exitosas`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Primary Action */}
            <button
                onClick={onNewTransaction}
                className="w-full bg-primary hover:bg-primary-dark text-white py-6 rounded-full text-xl font-bold shadow-xl shadow-primary/30 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:scale-95 group"
            >
                <span>Realizar un Nuevo Envío</span>
                <div className="bg-white/20 p-2 rounded-full group-hover:bg-white/30 transition-colors">
                    {/* ArrowRight Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>
            </button>

            {/* Quick Actions Grid - Placeholder for future actions */}
            {/* 
      <div className="grid grid-cols-2 gap-4">
        ...
      </div> 
      */}
        </div>
    );
};

export default DashboardWelcome;

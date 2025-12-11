import React from 'react';
import { User } from '../types';
import { DashboardTile } from './ui/DashboardTile';
import { useExchangeRates } from '../contexts/ExchangeRateContext';
import { motion } from 'framer-motion';
import { HeroSection } from './HeroSection';

interface DashboardWelcomeProps {
    user: User;
    onNewTransaction: (beneficiary?: any) => void;
}

const DashboardWelcome: React.FC<DashboardWelcomeProps> = ({ user, onNewTransaction }) => {
    const [totalSent, setTotalSent] = React.useState(0);
    const [completedCount, setCompletedCount] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [recentRecipients, setRecentRecipients] = React.useState<any[]>([]);

    const { getRate, isLoading: ratesLoading } = useExchangeRates();
    const rateUSDtoVES = getRate('USD', 'VES');

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data: { session } } = await import('../supabaseClient').then(m => m.supabase.auth.getSession());
                if (!session) return;

                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                const response = await fetch(`${API_URL}/api/remittances/history?userId=${user.id}`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        // Calculate totals
                        const completed = data.filter((tx: any) => tx.status === 'COMPLETADO');
                        const total = completed.reduce((sum: number, tx: any) => sum + (Number(tx.amount_sent) || 0), 0);
                        setTotalSent(total);
                        setCompletedCount(completed.length);

                        // Extract unique recent recipients
                        const uniqueRecipients = new Map();
                        data.forEach((tx: any) => {
                            if (!uniqueRecipients.has(tx.recipient_name)) {
                                uniqueRecipients.set(tx.recipient_name, {
                                    name: tx.recipient_name,
                                    bank: tx.recipient_bank,
                                    initials: tx.recipient_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
                                    account_number: tx.recipient_account,
                                    document_id: tx.recipient_id,
                                    country_code: tx.to_country_code
                                });
                            }
                        });
                        setRecentRecipients(Array.from(uniqueRecipients.values()).slice(0, 3));
                    }
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();

        // Realtime Subscription
        const channel = import('../supabaseClient').then(m => {
            const client = m.supabase;
            const subscription = client
                .channel('realtime-dashboard')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'transactions',
                        filter: `user_id=eq.${user.id}`
                    },
                    () => {
                        console.log('Dashboard update received!');
                        fetchStats();
                    }
                )
                .subscribe();

            return subscription;
        });

        return () => {
            channel.then(sub => import('../supabaseClient').then(m => m.supabase.removeChannel(sub)));
        };
    }, [user.id]);

    return (
        <div className="space-y-8 animate-fade-in-up mb-8">
            {/* Hero Section */}
            <HeroSection user={user} onNewTransaction={onNewTransaction} />

            {/* Tiles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Tile 1: Activity Summary (Spans 2 cols on large screens) */}
                <DashboardTile
                    title="Total Enviado"
                    variant="primary"
                    className="lg:col-span-2 min-h-[200px]"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>}
                >
                    <div className="flex flex-col gap-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl sm:text-6xl font-extrabold tracking-tighter">
                                ${totalSent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-xl opacity-60 font-bold">USD</span>
                        </div>

                        {/* Simple Sparkline Visualization */}
                        <div className="h-16 w-full flex items-end gap-1 opacity-50">
                            {[40, 65, 50, 80, 55, 90, 70, 85, 60, 95].map((h, i) => (
                                <div key={i} className="flex-1 bg-current rounded-t-sm" style={{ height: `${h}%` }} />
                            ))}
                        </div>

                        <div className="flex items-center gap-2 text-sm opacity-70">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span>{completedCount} transacciones exitosas</span>
                        </div>
                    </div>
                </DashboardTile>

                {/* Tile 2: Exchange Rate */}
                <DashboardTile
                    title="Tasa del Día"
                    variant="accent"
                    delay={0.1}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
                >
                    <div className="flex flex-col h-full justify-between">
                        <div className="text-center py-4">
                            <p className="text-sm opacity-70 mb-1">1 USD =</p>
                            <div className="text-4xl font-black tracking-tight flex items-center justify-center gap-2">
                                {ratesLoading ? (
                                    <span className="animate-pulse">...</span>
                                ) : (
                                    <>
                                        {rateUSDtoVES.toFixed(2)}
                                        <span className="text-lg opacity-60">VES</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 text-xs text-center">
                            <span className="text-green-600 dark:text-green-400 font-bold">▲ 0.5%</span> vs ayer
                        </div>
                    </div>
                </DashboardTile>

                {/* Tile 3: Quick Action / Recent */}
                <DashboardTile
                    title="Enviar de Nuevo"
                    variant="secondary"
                    className="lg:col-span-3"
                    delay={0.2}
                >
                    <div className="flex flex-wrap gap-4 items-center">
                        <button
                            onClick={() => onNewTransaction()}
                            className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-primary p-4 rounded-2xl shadow-sm flex items-center gap-3 transition-all group"
                        >
                            <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            </div>
                            <span className="font-bold">Nuevo Destinatario</span>
                        </button>

                        <div className="w-px h-12 bg-current opacity-10 mx-2 hidden sm:block" />

                        {recentRecipients.length > 0 ? (
                            recentRecipients.map((recipient, idx) => (
                                <motion.button
                                    key={idx}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onNewTransaction(recipient)}
                                    className="flex items-center gap-3 bg-white/60 dark:bg-black/20 p-3 pr-6 rounded-2xl hover:bg-white/80 dark:hover:bg-black/30 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                        {recipient.initials}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-sm leading-tight">{recipient.name.split(' ')[0]}</p>
                                        <p className="text-[10px] opacity-70">{recipient.bank}</p>
                                    </div>
                                </motion.button>
                            ))
                        ) : (
                            <p className="text-sm opacity-60 italic">Tus envíos recientes aparecerán aquí</p>
                        )}
                    </div>
                </DashboardTile>
            </div>
        </div>
    );
};

export default DashboardWelcome;

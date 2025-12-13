import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { toast } from 'sonner';
import { Gift, Copy, Share2, Users, DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface ReferralsProps {
    user: User;
}

interface Stats {
    totalEarned: number;
    totalInvited: number;
    completed: number;
    pending: number;
    history: {
        name: string;
        status: 'PENDING' | 'COMPLETED';
        date: string;
    }[];
}

export default function Referrals({ user }: ReferralsProps) {
    console.log('Referrals component mounted'); // DEBUG LOG
    const [code, setCode] = useState<string | null>(user.referralCode || null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    useEffect(() => {
        fetchData();
    }, [user.id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // 1. Get Code if not in profile
            if (!code) {
                const res = await fetch(`${API_URL}/api/referrals/generate-code`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                    },
                    body: JSON.stringify({ userId: user.id })
                });
                if (res.ok) {
                    const data = await res.json();
                    setCode(data.code);
                }
            }

            // 2. Get Stats
            const statsRes = await fetch(`${API_URL}/api/referrals/stats?userId=${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                }
            });

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
            }

        } catch (error) {
            console.error('Error fetching referral data:', error);
            toast.error('Error al cargar datos de referidos');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!code) return;
        const link = `https://remesas-a-m.vercel.app/register?ref=${code}`;
        navigator.clipboard.writeText(link);
        toast.success('¡Enlace copiado al portapapeles!');
    };

    const shareOnWhatsApp = () => {
        if (!code) return;
        const link = `https://remesas-a-m.vercel.app/register?ref=${code}`;
        const message = `¡Hola! Te regalo tu primer envío GRATIS en Remesas A&M. Regístrate con mi enlace: ${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
                    <Gift size={200} />
                </div>

                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-2">¡Invita y Gana! 🎁</h2>
                    <p className="text-blue-100 text-lg max-w-xl">
                        Comparte tu código con amigos. Ellos reciben su <strong>primer envío GRATIS</strong> y tú ganas <strong>créditos</strong> para tus próximos envíos.
                    </p>
                </div>
            </div>

            {/* Code Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                        <Share2 className="text-primary" size={20} />
                        Tu Código Único
                    </h3>

                    <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl flex items-center justify-between border-2 border-dashed border-slate-300 dark:border-slate-700">
                        <span className="text-2xl font-mono font-bold tracking-wider text-primary">
                            {code || '...'}
                        </span>
                        <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                            <Copy size={18} />
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button onClick={copyToClipboard} variant="outline" className="w-full">
                            <Copy size={16} className="mr-2" />
                            Copiar Link
                        </Button>
                        <Button onClick={shareOnWhatsApp} className="w-full bg-green-500 hover:bg-green-600 text-white border-none">
                            <Share2 size={16} className="mr-2" />
                            WhatsApp
                        </Button>
                    </div>
                </Card>

                {/* Stats Summary */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <DollarSign className="text-green-500" size={20} />
                        Tus Ganancias
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center">
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Créditos Ganados</p>
                            <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">
                                ${stats?.totalEarned || 0}
                            </p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center">
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Amigos Invitados</p>
                            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                                {stats?.totalInvited || 0}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* History List */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Users className="text-slate-500" size={20} />
                    Historial de Invitaciones
                </h3>

                {stats?.history && stats.history.length > 0 ? (
                    <div className="space-y-3">
                        {stats.history.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold">
                                        {item.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">{item.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(item.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.status === 'COMPLETED'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    }`}>
                                    {item.status === 'COMPLETED' ? 'Completado (+Crédito)' : 'Pendiente'}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        <p>Aún no has invitado a nadie.</p>
                        <p className="text-sm mt-1">¡Comparte tu código y empieza a ganar!</p>
                    </div>
                )}
            </Card>
        </div>
    );
}

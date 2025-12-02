import React from 'react';
import { User } from '../types';
import { Send, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroSectionProps {
    user: User;
    onNewTransaction: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ user, onNewTransaction }) => {
    return (
        <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-purple-600 text-white shadow-2xl shadow-primary/20 mb-8">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-warning/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

            <div className="relative z-10 px-6 py-8 md:px-10 md:py-12 flex flex-col md:flex-row items-center justify-between gap-8">
                {/* Text Content */}
                <div className="flex-1 text-center md:text-left space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-medium text-white/90"
                    >
                        <Sparkles size={12} className="text-warning" />
                        <span>Tu dinero, seguro y al instante</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight"
                    >
                        Hola, {user.fullName.split(' ')[0]} <span className="inline-block animate-bounce">👋</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg text-white/80 max-w-md mx-auto md:mx-0 font-medium"
                    >
                        Envía remesas a Venezuela, Colombia, Perú y más con las mejores tasas del mercado.
                    </motion.p>
                </div>

                {/* CTA Button */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex-shrink-0"
                >
                    <button
                        onClick={onNewTransaction}
                        className="group relative px-8 py-4 bg-white text-primary font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:bg-slate-50 transition-all duration-300 flex items-center gap-3 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <span className="relative">Enviar Dinero</span>
                        <div className="bg-primary/10 p-1.5 rounded-full group-hover:bg-primary/20 transition-colors">
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

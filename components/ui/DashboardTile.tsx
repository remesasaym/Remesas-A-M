import React from 'react';
import { motion } from 'framer-motion';

interface DashboardTileProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'accent' | 'default';
    delay?: number;
}

export const DashboardTile: React.FC<DashboardTileProps> = ({
    title,
    icon,
    children,
    className = '',
    onClick,
    variant = 'default',
    delay = 0
}) => {
    const getVariantClasses = () => {
        switch (variant) {
            case 'primary':
                return 'bg-primary/5 dark:bg-primary/10 border-primary/10 text-primary-dark dark:text-primary-light';
            case 'secondary':
                return 'bg-secondary/5 dark:bg-secondary/10 border-secondary/10 text-secondary-dark dark:text-secondary-light';
            case 'accent':
                return 'bg-accent/5 dark:bg-accent/10 border-accent/10 text-accent-dark dark:text-accent-light';
            default:
                return 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-800 dark:text-white';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            onClick={onClick}
            className={`
        relative overflow-hidden
        rounded-[2rem] p-6
        border shadow-lg shadow-slate-200/50 dark:shadow-none
        transition-all duration-300
        ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-95' : ''}
        ${getVariantClasses()}
        ${className}
      `}
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.03] rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm uppercase tracking-wider opacity-80">{title}</h3>
                    {icon && <div className="p-2 rounded-full bg-white/50 dark:bg-black/20 backdrop-blur-sm">{icon}</div>}
                </div>

                <div className="flex-1 flex flex-col justify-end">
                    {children}
                </div>
            </div>
        </motion.div>
    );
};

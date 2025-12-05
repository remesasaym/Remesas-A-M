// components/ui/Card.tsx
import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface CardProps extends Omit<HTMLMotionProps<"div">, 'children'> {
    children: ReactNode;
    variant?: 'default' | 'gradient' | 'colored' | 'glass';
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = ({
    children,
    variant = 'default',
    hover = true,
    padding = 'md',
    className = '',
    ...props
}: CardProps) => {
    const variantStyles = {
        default: 'bg-white dark:bg-slate-800',
        gradient: 'bg-gradient-to-br from-white to-bg-secondary dark:from-slate-800 dark:to-slate-900',
        colored: 'bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10',
        glass: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-white/20 dark:border-white/10',
    };

    const paddingStyles = {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <motion.div
            className={`
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        rounded-3xl border border-slate-100 dark:border-slate-700
        shadow-xl shadow-slate-200/50 dark:shadow-black/20 transition-all duration-300
        ${className}
      `}
            whileHover={hover ? {
                scale: 1.01,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)'
            } : undefined}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            {...props}
        >
            {children}
        </motion.div>
    );
};

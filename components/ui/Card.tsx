// components/ui/Card.tsx
import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface CardProps extends Omit<HTMLMotionProps<"div">, 'children'> {
    children: ReactNode;
    variant?: 'default' | 'gradient' | 'colored';
    hover?: boolean;
    padding?: 'sm' | 'md' | 'lg';
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
        default: 'bg-white',
        gradient: 'bg-gradient-to-br from-white to-bg-secondary',
        colored: 'bg-gradient-to-br from-primary/5 to-secondary/5',
    };

    const paddingStyles = {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <motion.div
            className={`
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        rounded-3xl border border-border/50
        shadow-sm transition-shadow duration-300
        ${className}
      `}
            whileHover={hover ? {
                y: -4,
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)'
            } : undefined}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            {...props}
        >
            {children}
        </motion.div>
    );
};

// components/ui/Button.tsx
import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    disabled,
    className,
    ...props
}: ButtonProps) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 font-bold transition-all transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

    const variantStyles = {
        primary: "bg-primary hover:bg-primary-dark text-white shadow-xl shadow-primary/30 hover:-translate-y-1 focus:ring-primary",
        secondary: "bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white shadow-md hover:shadow-lg hover:-translate-y-1 focus:ring-primary",
        ghost: "bg-transparent text-primary hover:bg-primary/10 hover:-translate-y-0.5 focus:ring-primary"
    };

    const sizeStyles = {
        sm: "px-4 py-2 text-sm rounded-full",
        md: "px-6 py-3 text-base rounded-full",
        lg: "px-8 py-4 text-lg rounded-full"
    };

    return (
        <motion.button
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ''}`}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <motion.div
                    className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
            ) : (
                <>
                    {leftIcon && <span>{leftIcon}</span>}
                    {children}
                    {rightIcon && <span>{rightIcon}</span>}
                </>
            )}
        </motion.button>
    );
};

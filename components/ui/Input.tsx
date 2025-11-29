// components/ui/Input.tsx
import { motion } from 'framer-motion';
import { InputHTMLAttributes, useState, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    helperText?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

export const Input = ({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    value,
    className = '',
    ...props
}: InputProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value !== undefined && value !== '';

    return (
        <div className="w-full">
            <div className="relative">
                {/* Left Icon */}
                {leftIcon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                        {leftIcon}
                    </div>
                )}

                {/* Input */}
                <motion.input
                    {...props}
                    value={value}
                    onFocus={(e) => {
                        setIsFocused(true);
                        props.onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        props.onBlur?.(e);
                    }}
                    className={`
            w-full px-4 pt-6 pb-2 bg-white border-2 rounded-2xl
            transition-colors duration-200
            ${leftIcon ? 'pl-12' : ''}
            ${rightIcon ? 'pr-12' : ''}
            ${error
                            ? 'border-error focus:border-error'
                            : 'border-border focus:border-primary'
                        }
            focus:outline-none
            disabled:bg-bg-secondary disabled:cursor-not-allowed
            ${className}
          `}
                    animate={{
                        boxShadow: isFocused
                            ? error
                                ? '0 0 0 4px rgba(255, 107, 107, 0.1)'
                                : '0 0 0 4px rgba(255, 107, 157, 0.1)'
                            : '0 0 0 0px rgba(255, 107, 157, 0)'
                    }}
                    transition={{ duration: 0.2 }}
                />

                {/* Floating Label */}
                <motion.label
                    className={`
            absolute left-4 pointer-events-none transition-colors
            ${leftIcon ? 'left-12' : 'left-4'}
            ${error ? 'text-error' : isFocused ? 'text-primary' : 'text-text-secondary'}
          `}
                    animate={{
                        top: isFocused || hasValue ? '0.5rem' : '50%',
                        fontSize: isFocused || hasValue ? '0.75rem' : '1rem',
                        y: isFocused || hasValue ? 0 : '-50%',
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                    {label}
                </motion.label>

                {/* Right Icon */}
                {rightIcon && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">
                        {rightIcon}
                    </div>
                )}
            </div>

            {/* Helper Text / Error */}
            {(error || helperText) && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-2 text-sm ${error ? 'text-error' : 'text-text-secondary'}`}
                >
                    {error || helperText}
                </motion.p>
            )}
        </div>
    );
};

import { motion } from 'framer-motion';
import { InputHTMLAttributes, useState, ReactNode, useId, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    helperText?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    variant?: 'default' | 'big' | 'clean';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    value,
    variant = 'default',
    className = '',
    id,
    ...props
}, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const generatedId = useId();
    const inputId = id || generatedId;
    const hasValue = value !== undefined && value !== '';

    // Variant styles
    const containerStyles = {
        default: "bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl",
        big: "bg-transparent border-none", // For calculator main amount
        clean: "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl" // For simple forms
    };

    const inputStyles = {
        default: "px-4 pt-6 pb-2 text-base",
        big: "px-0 py-2 text-4xl font-extrabold text-right bg-transparent placeholder-slate-200",
        clean: "px-4 py-3 text-base"
    };

    const labelStyles = {
        default: "left-4",
        big: "left-0 text-sm font-bold uppercase tracking-wider text-slate-400",
        clean: "left-4"
    };

    // If variant is 'big', we render a simplified structure
    if (variant === 'big') {
        return (
            <div className={`w-full ${className}`}>
                <div className="flex flex-col">
                    <label htmlFor={inputId} className="text-slate-400 text-sm font-bold uppercase tracking-wider ml-1 mb-1">
                        {label}
                    </label>
                    <div className="flex items-center gap-4">
                        {leftIcon}
                        <input
                            {...props}
                            ref={ref}
                            id={inputId}
                            value={value}
                            className={`
                                w-full outline-none text-slate-800 dark:text-white
                                ${inputStyles.big}
                                ${error ? 'text-error placeholder-error/50' : ''}
                            `}
                        />
                        {rightIcon}
                    </div>
                    {(error || helperText) && (
                        <p className={`mt-1 text-sm ${error ? 'text-error' : 'text-slate-400'}`}>
                            {error || helperText}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full ${className}`}>
            {variant === 'clean' && (
                <label htmlFor={inputId} className="block text-sm font-medium text-slate-600 dark:text-slate-400 ml-1 mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                {/* Left Icon */}
                {leftIcon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary z-10">
                        {leftIcon}
                    </div>
                )}

                {/* Input */}
                <motion.input
                    {...props}
                    ref={ref}
                    id={inputId}
                    value={value}
                    placeholder={variant === 'default' && !isFocused ? '' : props.placeholder}
                    onFocus={(e) => {
                        setIsFocused(true);
                        props.onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        props.onBlur?.(e);
                    }}
                    className={`
                        w-full outline-none transition-all duration-200
                        ${containerStyles[variant]}
                        ${inputStyles[variant]}
                        ${leftIcon ? 'pl-12' : ''}
                        ${rightIcon ? 'pr-12' : ''}
                        ${error
                            ? 'border-error focus:border-error'
                            : variant === 'default' ? 'focus:border-primary' : 'focus:border-primary'
                        }
                        disabled:bg-bg-secondary disabled:cursor-not-allowed
                    `}
                    animate={{
                        boxShadow: isFocused && variant === 'default'
                            ? error
                                ? '0 0 0 4px rgba(255, 107, 107, 0.1)'
                                : '0 0 0 4px rgba(255, 107, 157, 0.1)'
                            : 'none'
                    }}
                />

                {/* Floating Label for Default Variant */}
                {variant === 'default' && (
                    <motion.label
                        htmlFor={inputId}
                        className={`
                            absolute pointer-events-none transition-colors
                            ${leftIcon ? 'left-12' : 'left-4'}
                            ${error ? 'text-error' : isFocused ? 'text-primary' : 'text-text-secondary'}
                        `}
                        animate={{
                            top: isFocused || hasValue ? '0.5rem' : '50%',
                            fontSize: isFocused || hasValue ? '0.75rem' : '1rem',
                            y: isFocused || hasValue ? 0 : '-50%',
                        }}
                    >
                        {label}
                    </motion.label>
                )}

                {/* Right Icon */}
                {rightIcon && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary z-10">
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
});

Input.displayName = 'Input';

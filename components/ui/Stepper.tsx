import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface StepperProps {
    currentStep: number;
    steps: string[];
}

export const Stepper: React.FC<StepperProps> = ({ currentStep, steps }) => {
    return (
        <div className="w-full py-4 px-2">
            <div className="relative flex items-center justify-between">
                {/* Background Line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full -z-10" />

                {/* Active Line Progress */}
                <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full -z-10"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                />

                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isActive = stepNumber === currentStep;
                    const isCompleted = stepNumber < currentStep;

                    return (
                        <div key={step} className="flex flex-col items-center gap-2 relative">
                            <motion.div
                                initial={false}
                                animate={{
                                    backgroundColor: isActive || isCompleted ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                                    scale: isActive ? 1.1 : 1,
                                    borderColor: isActive || isCompleted ? 'var(--color-primary)' : 'var(--color-border)',
                                }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${isActive || isCompleted ? 'border-primary text-white' : 'border-slate-200 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-800'
                                    }`}
                            >
                                {isCompleted ? (
                                    <Check size={16} strokeWidth={3} />
                                ) : (
                                    <span className="text-xs font-bold">{stepNumber}</span>
                                )}
                            </motion.div>

                            <span className={`absolute top-10 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors duration-300 ${isActive ? 'text-primary' : isCompleted ? 'text-slate-600 dark:text-slate-400' : 'text-slate-300 dark:text-slate-600'
                                }`}>
                                {step}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

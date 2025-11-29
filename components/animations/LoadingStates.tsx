// components/animations/LoadingStates.tsx
import { motion } from 'framer-motion';

// Skeleton loader for cards/content
export const LoadingSkeleton = ({ count = 3 }: { count?: number }) => {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    className="h-20 rounded-2xl overflow-hidden bg-gradient-to-r from-bg-secondary via-bg-tertiary to-bg-secondary"
                    animate={{
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                        delay: i * 0.1,
                    }}
                    style={{
                        backgroundSize: '200% 100%',
                    }}
                />
            ))}
        </div>
    );
};

// Spinner for buttons/inline loading
export const Spinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4',
    };

    return (
        <motion.div
            className={`${sizeClasses[size]} border-primary/20 border-t-primary rounded-full`}
            animate={{ rotate: 360 }}
            transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
            }}
        />
    );
};

// Pulse animation for loading states
export const PulseLoader = () => {
    return (
        <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="w-3 h-3 bg-primary rounded-full"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.5, 1],
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                    }}
                />
            ))}
        </div>
    );
};

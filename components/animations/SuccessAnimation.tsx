// components/animations/SuccessAnimation.tsx
import { motion } from 'framer-motion';
import { useEffect } from 'react';

export const SuccessAnimation = () => {
    useEffect(() => {
        // Optional: Add confetti effect if canvas-confetti is installed
        // import('canvas-confetti').then((confetti) => {
        //   confetti.default({
        //     particleCount: 100,
        //     spread: 70,
        //     origin: { y: 0.6 },
        //     colors: ['#FF6B9D', '#6EC1E4', '#7DCEA0'],
        //   });
        // });
    }, []);

    return (
        <div className="flex flex-col items-center justify-center gap-6">
            {/* Animated checkmark circle */}
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                }}
                className="w-32 h-32 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center shadow-accent"
            >
                <svg
                    className="w-16 h-16 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                >
                    <motion.path
                        d="M5 13l4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    />
                </svg>
            </motion.div>

            {/* Success text */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center"
            >
                <h3 className="text-2xl font-bold text-text-primary mb-2">
                    ¡Remesa enviada! 🎉
                </h3>
                <p className="text-text-secondary">
                    Tu dinero está en camino
                </p>
            </motion.div>
        </div>
    );
};

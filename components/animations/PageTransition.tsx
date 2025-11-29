// components/animations/PageTransition.tsx
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
    children: ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
                duration: 0.4,
                ease: [0.43, 0.13, 0.23, 0.96] // Custom spring easing
            }}
        >
            {children}
        </motion.div>
    );
};

// Decorative thread animation (like Stitch)
export const DecorativeThreads = () => {
    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
            style={{ zIndex: -1 }}
        >
            <defs>
                <linearGradient id="thread-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="50%" stopColor="var(--secondary)" />
                    <stop offset="100%" stopColor="var(--accent)" />
                </linearGradient>
            </defs>

            {/* Animated curved paths */}
            <motion.path
                d="M0,100 Q250,50 500,100 T1000,100"
                stroke="url(#thread-gradient)"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            <motion.path
                d="M0,200 Q300,150 600,200 T1200,200"
                stroke="url(#thread-gradient)"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.2 }}
                transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
            />
        </svg>
    );
};

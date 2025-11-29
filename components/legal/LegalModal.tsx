import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import XIcon from '../icons/XIcon';

interface LegalModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ title, children, onClose }) => {
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, damping: 25, stiffness: 300 } },
    exit: { opacity: 0, y: 50, scale: 0.95 },
  };

  return (
    <motion.div
      key="legal-backdrop"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <motion.div
        key="legal-modal-content"
        variants={modalVariants}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-slate-700"
      >
        <header className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-slate-700">
          <h3 id="legal-modal-title" className="text-lg font-bold text-gray-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700" aria-label="Cerrar">
            <XIcon className="w-5 h-5" />
          </button>
        </header>
        <div className="flex-1 p-6 overflow-y-auto text-gray-700 dark:text-gray-300">
          <div className="prose dark:prose-invert max-w-none">
            {children}
          </div>
        </div>
        <footer className="p-4 bg-gray-50 dark:bg-slate-900/50 flex justify-end items-center rounded-b-2xl">
          <button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
            Cerrar
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
};

export default LegalModal;
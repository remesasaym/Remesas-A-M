import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FlagIcon from './icons/FlagIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import type { Country } from '../types';

interface CountrySelectorProps {
    label?: string; // Made optional as tery design sometimes hides it or puts it outside
    countries: Country[];
    selectedCode: string;
    onSelect: (code: string) => void;
    variant?: 'default' | 'pill'; // Added variant
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
    label,
    countries,
    selectedCode,
    onSelect,
    variant = 'pill' // Default to pill for the new design
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedCountry = countries.find(c => c.code === selectedCode);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const buttonStyles = {
        default: "w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-3 px-4",
        pill: "flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 hover:bg-slate-100 transition-colors"
    };

    return (
        <div className="relative" ref={containerRef}>
            {label && (
                <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">
                    {label}
                </label>
            )}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    ${buttonStyles[variant]}
                    flex items-center justify-between shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20
                `}
            >
                {selectedCountry ? (
                    <div className="flex items-center gap-2">
                        <FlagIcon countryCode={selectedCountry.code} className="w-6 h-6 rounded-full object-cover shadow-sm" />
                        <span className="font-bold text-slate-700 dark:text-white">
                            {selectedCountry.currency}
                        </span>
                    </div>
                ) : (
                    <span className="text-gray-400">Seleccionar</span>
                )}
                <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.ul
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl max-h-80 overflow-auto focus:outline-none p-2"
                    >
                        {countries.map((country) => (
                            <li key={country.code}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onSelect(country.code);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 flex items-center gap-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${selectedCode === country.code ? 'bg-primary/5 text-primary' : 'text-slate-700 dark:text-gray-200'
                                        }`}
                                >
                                    <FlagIcon countryCode={country.code} className="w-6 h-6 rounded-full object-cover shadow-sm" />
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm">{country.name}</span>
                                        <span className="text-xs opacity-70">{country.currency}</span>
                                    </div>
                                    {selectedCode === country.code && (
                                        <span className="ml-auto text-primary">
                                            ✓
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CountrySelector;

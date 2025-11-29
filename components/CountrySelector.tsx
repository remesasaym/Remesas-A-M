import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FlagIcon from './icons/FlagIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import type { Country } from '../types';

interface CountrySelectorProps {
    label: string;
    countries: Country[];
    selectedCode: string;
    onSelect: (code: string) => void;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({ label, countries, selectedCode, onSelect }) => {
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

    return (
        <div className="relative" ref={containerRef}>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                {label}
            </label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-3 px-4 flex items-center justify-between shadow-sm hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            >
                {selectedCountry ? (
                    <div className="flex items-center gap-3">
                        <FlagIcon countryCode={selectedCountry.code} className="w-6 h-auto rounded-sm object-cover shadow-sm" />
                        <span className="text-gray-800 dark:text-white font-medium">{selectedCountry.name}</span>
                    </div>
                ) : (
                    <span className="text-gray-400">Seleccionar país</span>
                )}
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.ul
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-auto focus:outline-none"
                    >
                        {countries.map((country) => (
                            <li key={country.code}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onSelect(country.code);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedCode === country.code ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                                        }`}
                                >
                                    <FlagIcon countryCode={country.code} className="w-6 h-auto rounded-sm object-cover shadow-sm" />
                                    <span className={`block truncate ${selectedCode === country.code ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {country.name}
                                    </span>
                                    {selectedCode === country.code && (
                                        <span className="ml-auto text-indigo-600 dark:text-indigo-400">
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

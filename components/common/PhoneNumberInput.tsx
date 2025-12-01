import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COUNTRIES } from '../../constants';
import type { Country } from '../../types';
import FlagIcon from '../icons/FlagIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';

interface PhoneNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  id?: string;
  autoComplete?: string;
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({ value, onChange, className = '', required = false, id, autoComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Memoize sorted countries to avoid re-sorting on every render
  const sortedCountries = useMemo(() =>
    [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length),
    []
  );

  // Memoize parsing the value to find the country code and national number
  const { countryCode, nationalNumber } = useMemo(() => {
    if (!value) return { countryCode: 'US', nationalNumber: '' };

    for (const country of sortedCountries) {
      if (value.startsWith(country.dialCode)) {
        return {
          countryCode: country.code,
          nationalNumber: value.substring(country.dialCode.length),
        };
      }
    }
    // Fallback if no country code matches (e.g., for legacy numbers)
    return { countryCode: 'US', nationalNumber: value.replace(/\D/g, '') };
  }, [value, sortedCountries]);

  const selectedCountry = useMemo(() =>
    COUNTRIES.find(c => c.code === countryCode) || COUNTRIES.find(c => c.code === 'US')!,
    [countryCode]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (country: Country) => {
    onChange(`${country.dialCode}${nationalNumber}`);
    setIsOpen(false);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits
    const newNationalNumber = e.target.value.replace(/\D/g, '');
    onChange(`${selectedCountry.dialCode}${newNationalNumber}`);
  };

  return (
    <div className={`flex items-center w-full bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 rounded-md shadow-sm focus-within:ring-indigo-500 focus-within:border-indigo-500 focus-within:ring-1 ${className}`}>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className="flex items-center gap-2 h-full pl-3 pr-2 rounded-l-md bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <FlagIcon countryCode={selectedCountry.code} className="w-5 h-auto rounded-sm flex-shrink-0" />
          <span className="text-sm text-gray-500 dark:text-gray-400">{selectedCountry.dialCode}</span>
          <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.ul
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              // FIX: Added `as const` to the `ease` property to satisfy Framer Motion's strict type requirements.
              transition={{ duration: 0.15, ease: 'easeOut' as const }}
              className="absolute z-20 mt-1 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              role="listbox"
            >
              {COUNTRIES.map(country => (
                <li key={country.code}>
                  <button
                    onClick={() => handleCountrySelect(country)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-700"
                    role="option"
                    aria-selected={country.code === selectedCountry.code}
                  >
                    <FlagIcon countryCode={country.code} className="w-5 h-auto rounded-sm flex-shrink-0" />
                    <span className="text-sm text-gray-800 dark:text-white flex-grow">{country.name}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{country.dialCode}</span>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      <input
        id={id}
        type="tel"
        autoComplete={autoComplete}
        value={nationalNumber}
        onChange={handleNumberChange}
        className="w-full bg-transparent py-3 px-3 text-gray-800 dark:text-white focus:outline-none"
        placeholder="Número de teléfono"
        required={required}
      />
    </div>
  );
};

export default PhoneNumberInput;
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
  label?: string; // Added label prop
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  value,
  onChange,
  className = '',
  required = false,
  id,
  autoComplete,
  label = "Número de Teléfono" // Default label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
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

  const hasValue = nationalNumber !== '';

  return (
    <div className={`relative w-full ${className}`}>
      <div
        className={`
          flex items-center w-full 
          bg-gray-50 dark:bg-slate-900 
          border rounded-2xl transition-all duration-200
          ${isFocused
            ? 'border-primary shadow-[0_0_0_4px_rgba(255,107,157,0.1)]'
            : 'border-gray-200 dark:border-slate-700'
          }
        `}
      >
        {/* Country Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(prev => !prev)}
            className="flex items-center gap-2 h-full pl-4 pr-2 py-3.5 rounded-l-2xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border-r border-gray-200 dark:border-slate-700"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <FlagIcon countryCode={selectedCountry.code} className="w-6 h-auto rounded-sm flex-shrink-0 shadow-sm" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{selectedCountry.dialCode}</span>
            <ChevronDownIcon className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.ul
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute z-50 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl max-h-64 overflow-y-auto left-0"
                role="listbox"
              >
                {COUNTRIES.map(country => (
                  <li key={country.code}>
                    <button
                      onClick={() => handleCountrySelect(country)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${country.code === selectedCountry.code ? 'bg-primary/5' : ''}`}
                      role="option"
                      aria-selected={country.code === selectedCountry.code}
                    >
                      <FlagIcon countryCode={country.code} className="w-5 h-auto rounded-sm flex-shrink-0 shadow-sm" />
                      <span className="text-sm font-medium text-slate-700 dark:text-white flex-grow">{country.name}</span>
                      <span className="text-sm text-slate-400 font-mono">{country.dialCode}</span>
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Phone Input */}
        <div className="relative flex-grow">
          <input
            id={id}
            type="tel"
            autoComplete={autoComplete}
            value={nationalNumber}
            onChange={handleNumberChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full bg-transparent py-3.5 px-4 text-base text-slate-800 dark:text-white focus:outline-none placeholder-transparent"
            placeholder=" " // Important for floating label trick if using CSS only, but we use JS
            required={required}
          />

          {/* Floating Label */}
          <motion.label
            htmlFor={id}
            className={`
              absolute left-4 pointer-events-none transition-colors
              ${isFocused ? 'text-primary' : 'text-slate-400'}
            `}
            animate={{
              top: isFocused || hasValue ? '0.5rem' : '50%',
              fontSize: isFocused || hasValue ? '0.75rem' : '1rem',
              y: isFocused || hasValue ? -14 : '-50%',
            }}
          >
            {label}
          </motion.label>
        </div>
      </div>
    </div>
  );
};

export default PhoneNumberInput;
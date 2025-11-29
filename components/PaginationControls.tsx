import React from 'react';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (n: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({ currentPage, totalPages, onPageChange, itemsPerPage = 10, onItemsPerPageChange }) => {
  if (totalPages <= 1) {
    return null; // No se necesita paginación si solo hay una página.
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleJump = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem('jumpPage') as HTMLInputElement;
    const target = Math.max(1, Math.min(totalPages, Number(input.value) || 1));
    onPageChange(target);
  };

  const handleItemsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const n = Number(e.target.value);
    onItemsPerPageChange?.(n);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 px-4 py-2">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600 dark:text-gray-400" htmlFor="itemsPerPage">Items por página</label>
        <select id="itemsPerPage" value={itemsPerPage} onChange={handleItemsChange} className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md px-2 py-1 text-sm text-gray-700 dark:text-gray-200">
          {[5,10,20,50].map(n=> (<option key={n} value={n}>{n}</option>))}
        </select>
        <span className="text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
          Página <span className="font-bold text-gray-800 dark:text-white">{currentPage}</span> de <span className="font-bold text-gray-800 dark:text-white">{totalPages}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página anterior"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Anterior
        </button>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página siguiente"
        >
          Siguiente
          <ChevronRightIcon className="w-4 h-4" />
        </button>
        <form onSubmit={handleJump} className="flex items-center gap-2" aria-label="Saltar a página específica">
          <label htmlFor="jumpPage" className="sr-only">Ir a página</label>
          <input id="jumpPage" name="jumpPage" type="number" min={1} max={totalPages} defaultValue={currentPage} className="w-16 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md px-2 py-1 text-sm text-gray-700 dark:text-gray-200" />
          <button type="submit" className="px-3 py-2 text-sm font-medium text-gray-600 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">Ir</button>
        </form>
      </div>
    </div>
  );
};

export default PaginationControls;
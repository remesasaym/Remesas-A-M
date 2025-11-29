import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Card from './common/Card';
import type { User, Beneficiary } from '../types';
import { supabase } from '../supabaseClient';
import { COUNTRIES } from '../constants';
import FlagIcon from './icons/FlagIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import BeneficiaryModal from './BeneficiaryModal';
import SendIcon from './icons/SendIcon';
import UsersIcon from './icons/UsersIcon';
import PaginationControls from './PaginationControls';

interface BeneficiariesProps {
  user: User;
  onSelectBeneficiary: (beneficiary: Beneficiary) => void;
}

const Beneficiaries: React.FC<BeneficiariesProps> = ({ user, onSelectBeneficiary }) => {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [beneficiaryToEdit, setBeneficiaryToEdit] = useState<Beneficiary | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchBeneficiaries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setBeneficiaries(data || []);
    } catch (e) {
      const err = e as Error;
      setError(err.message || 'No se pudieron cargar los beneficiarios.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, [user.id]);

  const handleAdd = () => {
    setBeneficiaryToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (beneficiary: Beneficiary) => {
    setBeneficiaryToEdit(beneficiary);
    setIsModalOpen(true);
  };

  const handleDelete = async (beneficiaryId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este beneficiario?')) {
        try {
            const { error } = await supabase.from('beneficiaries').delete().eq('id', beneficiaryId);
            if (error) throw error;
            fetchBeneficiaries(); // Recargar la lista
        } catch (e) {
            const err = e as Error;
            alert('Error al eliminar: ' + err.message);
        }
    }
  };

  const handleSave = () => {
    setIsModalOpen(false);
    fetchBeneficiaries();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center p-12 text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          Cargando beneficiarios...
        </div>
      );
    }

    if (error) {
      return <div className="text-center p-12 text-red-500 bg-red-50 dark:bg-red-900/30 rounded-lg">{error}</div>;
    }

    if (beneficiaries.length === 0) {
      return (
        <div className="text-center p-12 text-gray-500 dark:text-gray-400">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-xl font-semibold text-gray-800 dark:text-white">Sin Beneficiarios Guardados</h3>
          <p className="mt-1 text-sm">Añade tu primer beneficiario para agilizar tus envíos.</p>
        </div>
      );
    }

    const start = (currentPage - 1) * itemsPerPage;
    const pageItems = beneficiaries.slice(start, start + itemsPerPage);
    const totalPages = Math.ceil(beneficiaries.length / itemsPerPage) || 1;
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pageItems.map(ben => {
            const country = COUNTRIES.find(c => c.code === ben.country_code);
            return (
              <div key={ben.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                          {country && <FlagIcon countryCode={country.code} className="w-6 h-auto rounded-full" />}
                          <h4 className="font-bold text-gray-800 dark:text-white">{ben.name}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(ben)} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700" aria-label="Editar beneficiario"><PencilIcon className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(ben.id)} className="p-1.5 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50" aria-label="Eliminar beneficiario"><TrashIcon className="w-4 h-4" /></button>
                      </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 pl-9">
                      <p>{ben.bank}</p>
                      <p className="font-mono">...{ben.account_number.slice(-4)}</p>
                  </div>
                </div>
                <button onClick={() => onSelectBeneficiary(ben)} className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
                  <SendIcon className="w-4 h-4" />
                  Enviar Dinero
                </button>
              </div>
            );
          })}
        </div>
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(n)=>{ setItemsPerPage(n); setCurrentPage(1); }}
        />
      </>
    );
  };
  

  return (
    <>
      <Card>
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Mis Beneficiarios</h2>
                <p className="text-gray-500 dark:text-gray-400">Gestiona tus destinatarios para envíos rápidos.</p>
            </div>
            <button onClick={handleAdd} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <PlusCircleIcon className="w-5 h-5" />
                <span>Añadir</span>
            </button>
        </div>
        {renderContent()}
      </Card>

      <AnimatePresence>
        {isModalOpen && (
            <BeneficiaryModal
                user={user}
                beneficiaryToEdit={beneficiaryToEdit}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
            />
        )}
      </AnimatePresence>
    </>
  );
};

export default Beneficiaries;
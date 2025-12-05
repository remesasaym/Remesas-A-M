import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Card } from './ui/Card'; // Updated import
import { Button } from './ui/Button'; // New import
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
        <div className="text-center p-12 text-slate-400">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <UsersIcon className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Sin Beneficiarios</h3>
          <p className="mt-2 text-sm max-w-xs mx-auto">Añade tu primer beneficiario para agilizar tus envíos.</p>
          <Button onClick={handleAdd} className="mt-6 shadow-xl shadow-primary/30">
            Añadir Beneficiario
          </Button>
        </div>
      );
    }

    const start = (currentPage - 1) * itemsPerPage;
    const pageItems = beneficiaries.slice(start, start + itemsPerPage);
    const totalPages = Math.ceil(beneficiaries.length / itemsPerPage) || 1;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pageItems.map(ben => {
            const country = COUNTRIES.find(c => c.code === ben.country_code);
            return (
              <Card key={ben.id} variant="default" padding="md" className="group hover:border-primary/30 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {country && <FlagIcon countryCode={country.code} className="w-10 h-10 rounded-full shadow-sm" />}
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-lg">{ben.name}</h4>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{country?.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(ben)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-primary transition-colors">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(ben.id)} className="p-2 hover:bg-red-50 rounded-full text-slate-400 hover:text-error transition-colors">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mb-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Banco</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{ben.bank}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Cuenta</span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">...{ben.account_number.slice(-4)}</span>
                  </div>
                </div>

                <Button
                  onClick={() => onSelectBeneficiary(ben)}
                  className="w-full shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all"
                >
                  <SendIcon className="w-4 h-4 mr-2" />
                  Enviar Dinero
                </Button>
              </Card>
            );
          })}
        </div>

        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
          />
        )}
      </div>
    );
  };


  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Mis Beneficiarios</h2>
            <p className="text-slate-500 font-medium">Gestiona tus destinatarios frecuentes</p>
          </div>
          {beneficiaries.length > 0 && (
            <Button onClick={handleAdd} className="shadow-xl shadow-primary/30">
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              Nuevo Beneficiario
            </Button>
          )}
        </div>

        {renderContent()}
      </div>

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
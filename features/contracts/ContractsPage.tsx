
import React, { useState, useMemo, useContext } from 'react';
import { DataTable } from '../../components/DataTable';
import { Contract, Vendor } from '../../types';
import Modal from '../../components/Modal';
import { EditIcon, DeleteIcon } from '../../components/IconComponents';
import { useFormWithValidation } from '../../hooks/useFormWithValidation';
import { Tooltip } from '../../components/ui/Tooltip';
import { AppContext } from '../../contexts/AppContext';

interface ContractWithDetails extends Contract {
    vendor: Vendor;
}

const ContractsPage: React.FC = () => {
    const { contracts, vendors } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContract, setEditingContract] = useState<Contract | null>(null);

    const { values, setValues, validate, clearErrors } = useFormWithValidation();
    
    const contractsWithDetails = useMemo((): ContractWithDetails[] => {
        return contracts.map(c => ({
            ...c,
            vendor: vendors.find(v => v.id === c.vendorId)!,
        }));
    }, [contracts, vendors]);

    const handleAddNew = () => {
        setEditingContract(null);
        setValues({});
        clearErrors();
        setIsModalOpen(true);
    };

    const handleEdit = (contract: Contract) => {
        setEditingContract(contract);
        setValues(contract);
        clearErrors();
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => setIsModalOpen(false);

    const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        alert("Funcionalidade de salvar não implementada neste demo.");
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este contrato?")) {
            alert("Funcionalidade de excluir não implementada neste demo.");
        }
    };

    const columns = useMemo(() => [
        { header: 'Número do Contrato', accessor: (row: ContractWithDetails) => row.number, sortable: true, key: 'number' },
        { header: 'Fornecedor', accessor: (row: ContractWithDetails) => row.vendor.name, sortable: true, key: 'vendor.name' },
        { header: 'Data de Início', accessor: (row: ContractWithDetails) => row.startDate ? new Date(row.startDate).toLocaleDateString('pt-BR') : 'N/A', sortable: true, key: 'startDate' },
        { header: 'Data de Fim', accessor: (row: ContractWithDetails) => row.endDate ? new Date(row.endDate).toLocaleDateString('pt-BR') : 'N/A', sortable: true, key: 'endDate' },
        { 
            header: 'Ações', 
            accessor: (row: ContractWithDetails) => (
                <div className="flex space-x-2">
                    <Tooltip text="Editar"><button onClick={() => handleEdit(row)} className="p-1 text-blue-500 hover:text-blue-700"><EditIcon className="w-5 h-5" /></button></Tooltip>
                    <Tooltip text="Excluir"><button onClick={() => handleDelete(row.id)} className="p-1 text-red-500 hover:text-red-700"><DeleteIcon className="w-5 h-5" /></button></Tooltip>
                </div>
            )
        },
    ], []);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gerenciamento de Contratos</h1>
                <button onClick={handleAddNew} className="text-white font-bold py-2 px-4 rounded-lg bg-gradient-primary shadow-lg transition-all duration-300 transform hover:-translate-y-px hover:shadow-xl">
                    + Novo Contrato
                </button>
            </div>
            
            <DataTable 
                data={contractsWithDetails} 
                columns={columns}
                searchKeys={['number', 'vendor.name']}
            />

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingContract ? 'Editar Contrato' : 'Novo Contrato'}>
               <form onSubmit={handleSave} className="space-y-4">
                    {/* Form for contracts */}
                    <div className="pt-4 flex justify-end space-x-2">
                        <button type="button" onClick={handleCloseModal} className="py-2 px-4 font-bold rounded-lg transition-colors duration-300 bg-white dark:bg-dark-secondary border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">Cancelar</button>
                        <button type="submit" className="py-2 px-4 font-bold rounded-lg text-white bg-gradient-primary shadow-lg transition-all duration-300 transform hover:-translate-y-px hover:shadow-xl">Salvar</button>
                    </div>
               </form>
            </Modal>
        </div>
    );
};

export default ContractsPage;
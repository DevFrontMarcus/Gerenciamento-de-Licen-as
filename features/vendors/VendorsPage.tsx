
import React, { useState, useMemo, useContext } from 'react';
import { DataTable } from '../../components/DataTable';
import { Vendor } from '../../types';
import Modal from '../../components/Modal';
import { EditIcon, DeleteIcon, ExportIcon } from '../../components/IconComponents';
import { useFormWithValidation } from '../../hooks/useFormWithValidation';
import { Tooltip } from '../../components/ui/Tooltip';
import { AppContext } from '../../contexts/AppContext';

const VendorsPage: React.FC = () => {
    const { vendors, addNotification } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
    const { values, errors, setValues, validate, clearErrors } = useFormWithValidation();
    
    const handleAddNew = () => {
        setEditingVendor(null);
        setValues({});
        clearErrors();
        setIsModalOpen(true);
    };

    const handleEdit = (vendor: Vendor) => {
        setEditingVendor(vendor);
        setValues(vendor);
        clearErrors();
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => setIsModalOpen(false);

    const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (validate(['name'])) {
            alert("Funcionalidade de salvar não implementada neste demo.");
            handleCloseModal();
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este fornecedor?")) {
            alert("Funcionalidade de excluir não implementada neste demo.");
        }
    };

    const handleExport = () => {
        addNotification({ type: 'info', message: 'Gerando CSV de Fornecedores...'});
        if (vendors.length === 0) {
            addNotification({ type: 'warning', message: 'Nenhum dado para exportar.'});
            return;
        }

        try {
            const csvContent = [
                Object.keys(vendors[0]).join(','),
                ...vendors.map(item => Object.values(item).map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','))
            ].join('\n');
            const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.setAttribute('href', URL.createObjectURL(blob));
            link.setAttribute('download', 'fornecedores.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            addNotification({ type: 'success', message: 'Exportação CSV concluída com sucesso!'});
        } catch(error) {
            console.error("Erro ao gerar CSV:", error);
            addNotification({ type: 'error', message: 'Falha ao gerar o arquivo CSV.'});
        }
    };

    const columns = useMemo(() => [
        { header: 'ID', accessor: (row: Vendor) => <span className="font-mono text-xs">{row.id}</span>, sortable: true, key: 'id' },
        { header: 'Nome do Fornecedor', accessor: (row: Vendor) => <span className="font-semibold">{row.name}</span>, sortable: true, key: 'name' },
        { 
            header: 'Ações', 
            accessor: (row: Vendor) => (
                <div className="flex space-x-2">
                    <Tooltip text="Editar"><button onClick={() => handleEdit(row)} className="p-1 text-blue-500 hover:text-blue-700" aria-label={`Editar ${row.name}`}><EditIcon className="w-5 h-5" /></button></Tooltip>
                    <Tooltip text="Excluir"><button onClick={() => handleDelete(row.id)} className="p-1 text-red-500 hover:text-red-700" aria-label={`Excluir ${row.name}`}><DeleteIcon className="w-5 h-5" /></button></Tooltip>
                </div>
            )
        },
    ], [addNotification]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gerenciamento de Fornecedores</h1>
                <div className="flex space-x-2">
                    <button onClick={handleExport} className="py-2 px-4 font-bold rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center">
                        <ExportIcon className="w-5 h-5 mr-2" /> Exportar CSV
                    </button>
                    <button onClick={handleAddNew} className="text-white font-bold py-2 px-4 rounded-lg bg-gradient-primary shadow-lg transition-all duration-300 transform hover:-translate-y-px hover:shadow-xl">
                        + Novo Fornecedor
                    </button>
                </div>
            </div>
            
            <DataTable 
                data={vendors} 
                columns={columns}
                searchKeys={['id', 'name']}
            />

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingVendor ? 'Editar Fornecedor' : 'Novo Fornecedor'}>
               <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium">Nome do Fornecedor</label>
                        <input 
                            type="text" 
                            name="name" 
                            id="name" 
                            value={values.name || ''}
                            onChange={validate}
                            required 
                            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.name ? 'border-red-500' : 'border-input-border dark:border-input-border-dark'} bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-primary`}
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>
                    <div className="pt-4 flex justify-end space-x-2">
                        <button type="button" onClick={handleCloseModal} className="py-2 px-4 font-bold rounded-lg transition-colors duration-300 bg-white dark:bg-dark-secondary border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">Cancelar</button>
                        <button type="submit" className="py-2 px-4 font-bold rounded-lg text-white bg-gradient-primary shadow-lg transition-all duration-300 transform hover:-translate-y-px hover:shadow-xl">Salvar</button>
                    </div>
               </form>
            </Modal>
        </div>
    );
};

export default VendorsPage;

import React, { useState, useMemo, useContext } from 'react';
import { DataTable } from '../../components/DataTable';
import { SoftwareProductWithDetails, CostPeriod, Vendor } from '../../types';
import Modal from '../../components/Modal';
import { EditIcon, DeleteIcon, ExportIcon } from '../../components/IconComponents';
import { useFormWithValidation } from '../../hooks/useFormWithValidation';
import { Tooltip } from '../../components/ui/Tooltip';
import { AppContext } from '../../contexts/AppContext';

const CatalogPage: React.FC = () => {
    const { productsWithDetails, vendors, addNotification } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<SoftwareProductWithDetails | null>(null);

    const { values, errors, setValues, validate, clearErrors } = useFormWithValidation();
    
    const handleAddNew = () => {
        setEditingProduct(null);
        setValues({});
        clearErrors();
        setIsModalOpen(true);
    };

    const handleEdit = (product: SoftwareProductWithDetails) => {
        setEditingProduct(product);
        setValues({
            ...product,
            tags: product.tags?.join(', ') || ''
        });
        clearErrors();
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => setIsModalOpen(false);

    const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (validate(Object.keys(values))) {
            alert("Funcionalidade de salvar não implementada neste demo.");
            handleCloseModal();
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Tem certeza que deseja excluir este produto do catálogo?")) {
            alert("Funcionalidade de excluir não implementada neste demo.");
        }
    };
    
    const handleExport = () => {
        addNotification({ type: 'info', message: 'Gerando CSV do Catálogo...'});
        const dataToExport = productsWithDetails.map(p => ({
            ID: p.id,
            Produto: p.name,
            Fornecedor: p.vendor?.name || 'N/A',
            'Custo Unitário': p.unitCost,
            'Período de Custo': p.costPeriod,
            Tags: p.tags?.join('; ') || ''
        }));
        
        if (dataToExport.length === 0) {
            addNotification({ type: 'warning', message: 'Nenhum dado para exportar.'});
            return;
        }

        try {
             const csvContent = [
                Object.keys(dataToExport[0]).join(','),
                ...dataToExport.map(item =>
                    Object.values(item).map(val =>
                        `"${String(val || '').replace(/"/g, '""')}"`
                    ).join(',')
                )
            ].join('\n');

            const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.setAttribute('href', URL.createObjectURL(blob));
            link.setAttribute('download', 'catalogo_software.csv');
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
        { header: 'Nome do Produto', accessor: (row: SoftwareProductWithDetails) => <span className="font-semibold">{row.name}</span>, sortable: true, key: 'name' },
        { header: 'Fornecedor', accessor: (row: SoftwareProductWithDetails) => row.vendor?.name || 'N/A', sortable: true, key: 'vendor.name' },
        { header: 'Custo Unitário', accessor: (row: SoftwareProductWithDetails) => `R$ ${row.unitCost.toLocaleString('pt-BR')}`, sortable: true, key: 'unitCost' },
        { header: 'Período', accessor: (row: SoftwareProductWithDetails) => row.costPeriod, sortable: true, key: 'costPeriod' },
        { header: 'Tags', accessor: (row: SoftwareProductWithDetails) => (
            <div className="flex flex-wrap gap-1">{row.tags?.map(t => <span key={t} className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">{t}</span>)}</div>
        )},
        { 
            header: 'Ações', 
            accessor: (row: SoftwareProductWithDetails) => (
                <div className="flex space-x-2">
                    <Tooltip text="Editar"><button onClick={() => handleEdit(row)} className="p-1 text-blue-500 hover:text-blue-700"><EditIcon className="w-5 h-5" /></button></Tooltip>
                    <Tooltip text="Excluir"><button onClick={() => handleDelete(row.id)} className="p-1 text-red-500 hover:text-red-700"><DeleteIcon className="w-5 h-5" /></button></Tooltip>
                </div>
            )
        },
    ], [addNotification]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Catálogo de Software</h1>
                 <div className="flex space-x-2">
                    <button onClick={handleExport} className="py-2 px-4 font-bold rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center">
                        <ExportIcon className="w-5 h-5 mr-2" /> Exportar CSV
                    </button>
                    <button onClick={handleAddNew} className="text-white font-bold py-2 px-4 rounded-lg bg-gradient-primary shadow-lg transition-all duration-300 transform hover:-translate-y-px hover:shadow-xl">
                        + Novo Produto
                    </button>
                 </div>
            </div>
            
            <DataTable 
                data={productsWithDetails} 
                columns={columns}
                searchKeys={['name', 'vendor.name', 'tags']}
            />

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingProduct ? 'Editar Produto' : 'Novo Produto'}>
               <form onSubmit={handleSave} className="space-y-4">
                    {/* Form fields for SoftwareProduct */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium">Nome do Produto</label>
                            <input type="text" name="name" id="name" value={values.name || ''} onChange={validate} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.name ? 'border-red-500' : 'border-input-border dark:border-input-border-dark'} bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-primary`}/>
                        </div>
                         <div>
                            <label htmlFor="vendorId" className="block text-sm font-medium">Fornecedor</label>
                            <select name="vendorId" id="vendorId" value={values.vendorId || ''} onChange={validate} className="mt-1 block w-full rounded-md border-input-border dark:border-input-border-dark bg-white dark:bg-gray-700 shadow-sm sm:text-sm focus:ring-2 focus:ring-primary focus:border-primary">
                                <option value="">Nenhum</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="unitCost" className="block text-sm font-medium">Custo Unitário</label>
                            <input type="number" name="unitCost" id="unitCost" value={values.unitCost || ''} onChange={validate} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.unitCost ? 'border-red-500' : 'border-input-border dark:border-input-border-dark'} bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-primary`}/>
                        </div>
                        <div>
                            <label htmlFor="costPeriod" className="block text-sm font-medium">Período do Custo</label>
                             <select name="costPeriod" id="costPeriod" value={values.costPeriod || ''} onChange={validate} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.costPeriod ? 'border-red-500' : 'border-input-border dark:border-input-border-dark'} bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-primary`}>
                                {Object.values(CostPeriod).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
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

export default CatalogPage;
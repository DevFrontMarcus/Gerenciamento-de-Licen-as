
import React, { useState, useMemo, useContext } from 'react';
import { DataTable } from '../../components/DataTable';
import { SoftwareRequestWithDetails } from '../../types';
import Modal from '../../components/Modal';
import { useFormWithValidation } from '../../hooks/useFormWithValidation';
import { AppContext } from '../../contexts/AppContext';

const StatusBadge: React.FC<{ status: 'Pending' | 'Approved' | 'Denied' }> = ({ status }) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    const colorClasses = {
        'Pending': "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        'Approved': "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        'Denied': "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return <span className={`${baseClasses} ${colorClasses[status]}`}>{status}</span>;
};


const RequestsPage: React.FC = () => {
    const { requestsWithDetails, products, people } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const { values, setValues, validate, clearErrors } = useFormWithValidation();
    
    const handleAddNew = () => {
        setValues({});
        clearErrors();
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => setIsModalOpen(false);

    const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        alert("Funcionalidade de solicitar não implementada neste demo.");
        handleCloseModal();
    };

    const handleApprove = (id: string) => {
        alert(`Aprovando solicitação ${id}. Lógica de alocação seria executada aqui.`);
    };

    const handleDeny = (id: string) => {
        alert(`Negando solicitação ${id}.`);
    };

    const columns = useMemo(() => [
        { header: 'Status', accessor: (row: SoftwareRequestWithDetails) => <StatusBadge status={row.status} /> },
        { header: 'Produto Solicitado', accessor: (row: SoftwareRequestWithDetails) => row.product.name, sortable: true, key: 'product.name' },
        { header: 'Solicitante', accessor: (row: SoftwareRequestWithDetails) => row.requester.displayName, sortable: true, key: 'requester.displayName' },
        { header: 'Data', accessor: (row: SoftwareRequestWithDetails) => new Date(row.createdAt).toLocaleDateString('pt-BR'), sortable: true, key: 'createdAt' },
        { 
            header: 'Ações', 
            accessor: (row: SoftwareRequestWithDetails) => (
                row.status === 'Pending' && (
                    <div className="flex space-x-2">
                        <button onClick={() => handleApprove(row.id)} className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-2 rounded transition-colors">Aprovar</button>
                        <button onClick={() => handleDeny(row.id)} className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-2 rounded transition-colors">Negar</button>
                    </div>
                )
            )
        },
    ], []);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Solicitações de Software</h1>
                <button onClick={handleAddNew} className="text-white font-bold py-2 px-4 rounded-lg bg-gradient-primary shadow-lg transition-all duration-300 transform hover:-translate-y-px hover:shadow-xl">
                    + Nova Solicitação
                </button>
            </div>
            
            <DataTable 
                data={requestsWithDetails} 
                columns={columns}
                searchKeys={['status', 'product.name', 'requester.displayName']}
            />

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Solicitar Software">
               <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label htmlFor="requesterId" className="block text-sm font-medium">Eu sou</label>
                        <select name="requesterId" id="requesterId" value={values.requesterId || ''} onChange={validate} required className="mt-1 block w-full rounded-md border-input-border dark:border-input-border-dark bg-white dark:bg-gray-700 shadow-sm sm:text-sm focus:ring-2 focus:ring-primary focus:border-primary">
                            <option value="">Selecione...</option>
                            {people.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="productId" className="block text-sm font-medium">Software Desejado</label>
                        <select name="productId" id="productId" value={values.productId || ''} onChange={validate} required className="mt-1 block w-full rounded-md border-input-border dark:border-input-border-dark bg-white dark:bg-gray-700 shadow-sm sm:text-sm focus:ring-2 focus:ring-primary focus:border-primary">
                            <option value="">Selecione no catálogo...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="justification" className="block text-sm font-medium">Justificativa</label>
                        <textarea name="justification" id="justification" rows={3} value={values.justification || ''} onChange={validate} required className="mt-1 block w-full rounded-md border-input-border dark:border-input-border-dark bg-white dark:bg-gray-700 shadow-sm sm:text-sm focus:ring-2 focus:ring-primary focus:border-primary"></textarea>
                    </div>
                    <div className="pt-4 flex justify-end space-x-2">
                        <button type="button" onClick={handleCloseModal} className="py-2 px-4 font-bold rounded-lg transition-colors duration-300 bg-white dark:bg-dark-secondary border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">Cancelar</button>
                        <button type="submit" className="py-2 px-4 font-bold rounded-lg text-white bg-gradient-primary shadow-lg transition-all duration-300 transform hover:-translate-y-px hover:shadow-xl">Enviar Solicitação</button>
                    </div>
               </form>
            </Modal>
        </div>
    );
};

export default RequestsPage;
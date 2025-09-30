
import React, { useState, useMemo, useContext } from 'react';
import { DataTable } from '../../components/DataTable';
import { AllocStatus, LicenseAllocationWithDetails } from '../../types';
import Modal from '../../components/Modal';
import { EditIcon, DeleteIcon, ExportIcon } from '../../components/IconComponents';
import { useFormWithValidation } from '../../hooks/useFormWithValidation';
import { Tooltip } from '../../components/ui/Tooltip';
import { AppContext } from '../../contexts/AppContext';

const StatusBadge: React.FC<{ status: AllocStatus }> = ({ status }) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    const colorClasses = {
        [AllocStatus.ACTIVE]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        [AllocStatus.AWAITING_INACT]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        [AllocStatus.HISTORY]: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        [AllocStatus.AVAILABLE]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    };
    return <span className={`${baseClasses} ${colorClasses[status]}`}>{status}</span>;
};


const AllocationsPage: React.FC = () => {
    const { allocationsWithDetails, updateAllocationStatus, addAudit, addNotification } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAlloc, setEditingAlloc] = useState<LicenseAllocationWithDetails | null>(null);
    
    const { values, errors, setValues, validate, clearErrors } = useFormWithValidation();

    const handleEdit = (alloc: LicenseAllocationWithDetails) => {
        setEditingAlloc(alloc);
        setValues({ status: alloc.status });
        clearErrors();
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => setIsModalOpen(false);
    
    const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (editingAlloc && values.status !== editingAlloc.status) {
            updateAllocationStatus(editingAlloc.id, values.status, "Alteração manual pelo admin");
            addAudit({
                actorName: 'Admin',
                entity: 'LicenseAllocation',
                entityId: editingAlloc.id,
                action: 'update_status',
                details: `Status alterado de "${editingAlloc.status}" para "${values.status}". Alocado para ${editingAlloc.person.displayName}.`
            });
            addNotification({
                message: "Status da alocação atualizado com sucesso.",
                type: 'success'
            });
        }
        handleCloseModal();
    };

    const handleDelete = (id: string) => {
        if (window.confirm("A exclusão permanente não é recomendada. Considere mover para 'Histórico'. Deseja continuar?")) {
            alert("Funcionalidade de excluir não implementada neste demo.");
        }
    };

    const handleExport = () => {
        addNotification({ type: 'info', message: 'Gerando CSV...'});
        const dataToExport = allocationsWithDetails.map(a => ({
            ID: a.id,
            Status: a.status,
            Produto: a.pool.product.name,
            'Usuário': a.person.displayName,
            Email: a.person.email,
            'Matrícula': a.person.matricula || 'N/A',
            Departamento: a.department?.name || 'N/A',
            Diretoria: a.department?.directorate || 'N/A',
            'Centro de Custo': a.costCenter?.code || 'N/A',
            Fornecedor: a.pool.product.vendor?.name || 'N/A',
            'Custo (Unitário)': a.unitCost,
            'Período Custo': a.pool.product.costPeriod,
            'Chave de Acesso': a.accessKey || 'N/A',
            Observação: a.observation || '',
            'Data de Criação': new Date(a.createdAt).toLocaleDateString('pt-BR'),
        }));

        if (dataToExport.length === 0) {
            addNotification({ type: 'warning', message: 'Nenhum dado para exportar.'});
            return;
        };

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
            link.setAttribute('download', 'alocacoes_de_licencas.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            addNotification({ type: 'success', message: 'Exportação CSV concluída com sucesso!'});
        } catch (error) {
            console.error("Erro ao gerar CSV:", error);
            addNotification({ type: 'error', message: 'Falha ao gerar o arquivo CSV.'});
        }
    };

    const columns = useMemo(() => [
        { header: 'Status', accessor: (row: LicenseAllocationWithDetails) => <StatusBadge status={row.status} /> },
        { header: 'Produto', accessor: (row: LicenseAllocationWithDetails) => <span className="font-semibold">{row.pool.product.name}</span>, sortable: true, key: 'pool.product.name' },
        { header: 'Pessoa', accessor: (row: LicenseAllocationWithDetails) => row.person.displayName, sortable: true, key: 'person.displayName' },
        { header: 'Departamento', accessor: (row: LicenseAllocationWithDetails) => row.department?.name || 'N/A', sortable: true, key: 'department.name' },
        { header: 'Centro de Custo', accessor: (row: LicenseAllocationWithDetails) => row.costCenter?.code || 'N/A', sortable: true, key: 'costCenter.code' },
        { 
            header: 'Ações', 
            accessor: (row: LicenseAllocationWithDetails) => (
                <div className="flex space-x-2">
                    <Tooltip text="Editar Status">
                      <button onClick={() => handleEdit(row)} className="p-1 text-blue-500 hover:text-blue-700 transition-colors" aria-label={`Editar ${row.pool.product.name}`}><EditIcon className="w-5 h-5" /></button>
                    </Tooltip>
                    <Tooltip text="Excluir">
                      <button onClick={() => handleDelete(row.id)} className="p-1 text-red-500 hover:text-red-700 transition-colors" aria-label={`Excluir ${row.pool.product.name}`}><DeleteIcon className="w-5 h-5" /></button>
                    </Tooltip>
                </div>
            )
        },
    ], [updateAllocationStatus]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gerenciamento de Alocações</h1>
                <div className="flex space-x-2">
                    <button onClick={handleExport} className="text-white font-bold py-2 px-4 rounded-lg bg-gradient-secondary shadow-lg transition-all duration-300 transform hover:-translate-y-px hover:shadow-xl flex items-center">
                        <ExportIcon className="w-5 h-5 mr-2" /> Exportar CSV
                    </button>
                </div>
            </div>
            
            <DataTable data={allocationsWithDetails} columns={columns} searchKeys={['status', 'pool.product.name', 'person.displayName', 'department.name', 'costCenter.code']} />

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`Editar Alocação de ${editingAlloc?.pool.product.name}`}>
               <form onSubmit={handleSave} className="space-y-4">
                   <p>Alocado para: <span className="font-semibold">{editingAlloc?.person.displayName}</span></p>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status da Alocação</label>
                        <select name="status" id="status" value={values.status || ''} onChange={validate} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm border-input-border dark:border-input-border-dark bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-primary`}>
                            {Object.values(AllocStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="pt-4 flex justify-end space-x-2">
                        <button type="button" onClick={handleCloseModal} className="py-2 px-4 font-bold rounded-lg transition-colors duration-300 bg-white dark:bg-dark-secondary border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">Cancelar</button>
                        <button type="submit" className="py-2 px-4 font-bold rounded-lg text-white bg-gradient-primary shadow-lg transition-all duration-300 transform hover:-translate-y-px hover:shadow-xl">Salvar Alteração</button>
                    </div>
               </form>
            </Modal>
        </div>
    );
};

export default AllocationsPage;
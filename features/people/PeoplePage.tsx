
import React, { useState, useMemo, useContext } from 'react';
import { DataTable } from '../../components/DataTable';
import { Person, Department, CostCenter, AllocStatus } from '../../types';
import Modal from '../../components/Modal';
import { EditIcon, DeleteIcon, ExportIcon } from '../../components/IconComponents';
import { useFormWithValidation } from '../../hooks/useFormWithValidation';
import { Tooltip } from '../../components/ui/Tooltip';
import { AppContext } from '../../contexts/AppContext';

interface PersonWithDetails extends Person {
    department?: Department;
    costCenter?: CostCenter; // Note: In a real DB, CC is on allocation, not person. We find the most common one for display.
    activeLicenses: number;
}

const PeoplePage: React.FC = () => {
    const { people, departments, costCenters, allocations, addNotification } = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);

    const { values, errors, setValues, validate, clearErrors } = useFormWithValidation();

    const peopleWithDetails = useMemo((): PersonWithDetails[] => {
        return people.map(p => {
            const personAllocations = allocations.filter(a => a.personId === p.id);
            const activeLicenses = personAllocations.filter(a => a.status === AllocStatus.ACTIVE).length;
            
            const ccCounts = personAllocations.reduce((acc, a) => {
                if (a.costCenterId) {
                    acc[a.costCenterId] = (acc[a.costCenterId] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);

            const mainCostCenterId = Object.keys(ccCounts).sort((a, b) => ccCounts[b] - ccCounts[a])[0];

            return {
                ...p,
                department: departments.find(d => d.id === p.departmentId),
                costCenter: costCenters.find(cc => cc.id === mainCostCenterId),
                activeLicenses: activeLicenses
            };
        });
    }, [people, departments, costCenters, allocations]);

    const handleAddNew = () => {
        setEditingPerson(null);
        setValues({});
        clearErrors();
        setIsModalOpen(true);
    };

    const handleEdit = (person: Person) => {
        setEditingPerson(person);
        setValues(person);
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
        if (window.confirm("Tem certeza que deseja excluir esta pessoa?")) {
            alert("Funcionalidade de excluir não implementada neste demo.");
        }
    };
    
    const handleExport = () => {
        addNotification({ type: 'info', message: 'Gerando CSV de Pessoas...'});
        const dataToExport = peopleWithDetails.map(p => ({
            ID: p.id,
            Nome: p.displayName,
            Email: p.email,
            Matricula: p.matricula || 'N/A',
            Status: p.status,
            Departamento: p.department?.name || 'N/A',
            Diretoria: p.department?.directorate || 'N/A',
            'Centro de Custo Principal': p.costCenter?.code || 'N/A',
            'Licenças Ativas': p.activeLicenses
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
            link.setAttribute('download', 'pessoas.csv');
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
        { header: 'Nome', accessor: (row: PersonWithDetails) => <span className="font-semibold">{row.displayName}</span>, sortable: true, key: 'displayName' },
        { header: 'Email', accessor: (row: PersonWithDetails) => row.email, sortable: true, key: 'email' },
        { header: 'Departamento', accessor: (row: PersonWithDetails) => row.department?.name || 'N/A', sortable: true, key: 'department.name' },
        { header: 'Status', accessor: (row: PersonWithDetails) => row.status },
        { header: 'Licenças Ativas', accessor: (row: PersonWithDetails) => <span className="font-bold text-center block">{row.activeLicenses}</span>, sortable: true, key: 'activeLicenses' },
        { 
            header: 'Ações', 
            accessor: (row: PersonWithDetails) => (
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
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gerenciamento de Pessoas</h1>
                <div className="flex space-x-2">
                    <button onClick={handleExport} className="py-2 px-4 font-bold rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center"><ExportIcon className="w-5 h-5 mr-2" /> Exportar CSV</button>
                    <button onClick={handleAddNew} className="text-white font-bold py-2 px-4 rounded-lg bg-gradient-primary shadow-lg transition-all duration-300 transform hover:-translate-y-px hover:shadow-xl">+ Nova Pessoa</button>
                </div>
            </div>
            
            <DataTable 
                data={peopleWithDetails} 
                columns={columns}
                searchKeys={['displayName', 'email', 'matricula', 'status', 'department.name']}
            />

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingPerson ? 'Editar Pessoa' : 'Nova Pessoa'}>
               <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="displayName" className="block text-sm font-medium">Nome</label>
                            <input type="text" name="displayName" id="displayName" value={values.displayName || ''} onChange={validate} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.displayName ? 'border-red-500' : 'border-input-border dark:border-input-border-dark'} bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-primary`}/>
                            {errors.displayName && <p className="mt-1 text-xs text-red-500">{errors.displayName}</p>}
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium">Email</label>
                            <input type="email" name="email" id="email" value={values.email || ''} onChange={validate} required className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${errors.email ? 'border-red-500' : 'border-input-border dark:border-input-border-dark'} bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-primary`}/>
                            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
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

export default PeoplePage;

import React, { useContext, useMemo } from 'react';
import { DataTable } from '../../components/DataTable';
import { LicenseAllocationWithDetails, AllocStatus, UserStatus } from '../../types';
import { AppContext } from '../../contexts/AppContext';
import { ReharvestingIcon } from '../../components/IconComponents';

const ReharvestingPage: React.FC = () => {
    const { allocationsWithDetails, runReharvestingJob } = useContext(AppContext);

    const reclaimableLicenses = useMemo((): LicenseAllocationWithDetails[] => {
        return allocationsWithDetails.filter(a => 
            a.status === AllocStatus.AWAITING_INACT || a.person.status === UserStatus.Inactive && a.status === AllocStatus.ACTIVE
        );
    }, [allocationsWithDetails]);

    const getReason = (alloc: LicenseAllocationWithDetails): string => {
        if (alloc.status === AllocStatus.AWAITING_INACT) {
            return "Marcada para inativação";
        }
        if (alloc.person.status === UserStatus.Inactive) {
            return "Usuário inativo";
        }
        return "";
    };

    const columns = useMemo(() => [
        { header: 'Produto', accessor: (row: LicenseAllocationWithDetails) => row.pool.product.name, sortable: true, key: 'pool.product.name' },
        { header: 'Pessoa', accessor: (row: LicenseAllocationWithDetails) => row.person.displayName, sortable: true, key: 'person.displayName' },
        { header: 'Status da Pessoa', accessor: (row: LicenseAllocationWithDetails) => row.person.status },
        { header: 'Motivo do Reaproveitamento', accessor: (row: LicenseAllocationWithDetails) => <span className="font-semibold text-yellow-600">{getReason(row)}</span> },
    ], []);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Reaproveitamento de Licenças</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Licenças atribuídas a usuários inativos ou marcadas para inativação.</p>
                </div>
                <button 
                    onClick={runReharvestingJob} 
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 flex items-center"
                    disabled={reclaimableLicenses.length === 0}
                >
                    <ReharvestingIcon className="w-5 h-5 mr-2" /> Executar Reaproveitamento
                </button>
            </div>
            
            <DataTable 
                data={reclaimableLicenses} 
                columns={columns}
                searchKeys={['pool.product.name', 'person.displayName']}
            />
        </div>
    );
};

export default ReharvestingPage;


import React, { useMemo, useContext } from 'react';
import { DataTable } from '../../components/DataTable';
import { LicensePoolWithDetails, PoolStatus } from '../../types';
import { AppContext } from '../../contexts/AppContext';

const StatusBadge: React.FC<{ status: PoolStatus }> = ({ status }) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    const colorClasses = {
        [PoolStatus.ACTIVE]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        [PoolStatus.INACTIVE]: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        [PoolStatus.EXHAUSTED]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return <span className={`${baseClasses} ${colorClasses[status]}`}>{status}</span>;
};

const AvailabilityBar: React.FC<{ available: number; total: number }> = ({ available, total }) => {
    const percentage = total > 0 ? (available / total) * 100 : 0;
    let barColor = 'bg-green-500';
    if (percentage < 25) barColor = 'bg-yellow-500';
    if (percentage === 0) barColor = 'bg-red-500';

    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className={`${barColor} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
        </div>
    );
};


const PoolsPage: React.FC = () => {
    const { poolsWithDetails } = useContext(AppContext);

    const columns = useMemo(() => [
        { header: 'Produto', accessor: (row: LicensePoolWithDetails) => row.product.name, sortable: true, key: 'product.name' },
        { header: 'Status', accessor: (row: LicensePoolWithDetails) => <StatusBadge status={row.status} /> },
        { header: 'Disponível', accessor: (row: LicensePoolWithDetails) => row.availableQty, sortable: true, key: 'availableQty' },
        { header: 'Total', accessor: (row: LicensePoolWithDetails) => row.totalQuantity, sortable: true, key: 'totalQuantity' },
        {
            header: 'Disponibilidade',
            accessor: (row: LicensePoolWithDetails) => (
                <div className="flex items-center">
                    <div className="w-2/3">
                        <AvailabilityBar available={row.availableQty} total={row.totalQuantity} />
                    </div>
                    <span className="ml-2 text-sm font-medium">{`${row.availableQty} / ${row.totalQuantity}`}</span>
                </div>
            )
        },
        { header: 'Contrato', accessor: (row: LicensePoolWithDetails) => row.contract?.number || 'N/A', sortable: true, key: 'contract.number' },
    ], []);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Pools de Licenças</h1>
            </div>
            
            <DataTable 
                data={poolsWithDetails} 
                columns={columns}
                searchKeys={['product.name', 'contract.number', 'status']}
            />
        </div>
    );
};

export default PoolsPage;

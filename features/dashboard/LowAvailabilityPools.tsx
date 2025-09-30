import React from 'react';
import { LicensePoolWithDetails } from '../../types';
import { PoolIcon } from '../../components/IconComponents';

interface LowAvailabilityPoolsProps {
    pools: LicensePoolWithDetails[];
}

const AvailabilityBar: React.FC<{ available: number; total: number }> = ({ available, total }) => {
    const percentage = total > 0 ? (available / total) * 100 : 0;
    let barColor = 'bg-yellow-500';
    if (percentage < 10) barColor = 'bg-red-500';

    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className={`${barColor} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

const LowAvailabilityPools: React.FC<LowAvailabilityPoolsProps> = ({ pools }) => {
    return (
        <div className="bg-white dark:bg-dark-secondary rounded-xl shadow-md p-6 h-full">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Pools com Baixa Disponibilidade</h2>
            {pools.length > 0 ? (
                <ul className="space-y-4">
                    {pools.map(pool => (
                        <li key={pool.id} className="flex items-center space-x-4">
                           <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                                <PoolIcon className="w-5 h-5 text-orange-500" />
                           </div>
                           <div className="flex-1">
                                <div className="flex justify-between items-baseline">
                                    <p className="font-semibold text-sm truncate">{pool.product.name}</p>
                                    <p className="text-sm font-bold">{pool.availableQty} <span className="text-gray-500">/ {pool.totalQuantity}</span></p>
                                </div>
                                <AvailabilityBar available={pool.availableQty} total={pool.totalQuantity} />
                           </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 pt-10">
                    <p className="font-semibold">Ótimo trabalho!</p>
                    <p className="text-sm mt-1">Nenhum pool com baixa disponibilidade de licenças.</p>
                </div>
            )}
        </div>
    );
};

export default LowAvailabilityPools;

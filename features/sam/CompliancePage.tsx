
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { AllocStatus } from '../../types';

interface ComplianceStatus {
    productId: string;
    productName: string;
    total: number;
    allocated: number;
    delta: number;
    status: 'Risco' | 'Economia' | 'Otimizado';
}

const CompliancePage: React.FC = () => {
    const { poolsWithDetails, allocations } = useContext(AppContext);

    const complianceData = useMemo((): ComplianceStatus[] => {
        return poolsWithDetails.map(pool => {
            const allocatedCount = allocations.filter(a => a.poolId === pool.id && a.status === AllocStatus.ACTIVE).length;
            const delta = pool.totalQuantity - allocatedCount;
            let status: 'Risco' | 'Economia' | 'Otimizado' = 'Otimizado';
            
            // Simulating under-licensing for demo purposes, as our model prevents it.
            // In a real scenario, this would compare against discovery tool data.
            const isAtRisk = Math.random() > 0.9; // 10% chance to simulate risk
            const simulatedAllocated = isAtRisk ? pool.totalQuantity + Math.floor(Math.random() * 5) + 1 : allocatedCount;
            const finalDelta = pool.totalQuantity - simulatedAllocated;

            if (finalDelta < 0) {
                status = 'Risco';
            } else if (finalDelta / pool.totalQuantity > 0.25) { // More than 25% licenses are unused
                status = 'Economia';
            }
            
            return {
                productId: pool.productId,
                productName: pool.product.name,
                total: pool.totalQuantity,
                allocated: simulatedAllocated,
                delta: finalDelta,
                status: status,
            };
        });
    }, [poolsWithDetails, allocations]);
    
    const StatusCard: React.FC<{ status: ComplianceStatus }> = ({ status }) => {
        let bgColor = "bg-gray-100 dark:bg-gray-700";
        let titleColor = "text-gray-800 dark:text-gray-200";
        let message = "";

        switch (status.status) {
            case 'Risco':
                bgColor = "bg-red-100 dark:bg-red-900 border-l-4 border-red-500";
                titleColor = "text-red-700 dark:text-red-300 font-bold";
                message = `Você possui ${status.total} licenças, mas ${status.allocated} estão em uso. Risco de ${Math.abs(status.delta)} licença(s) não licenciada(s).`;
                break;
            case 'Economia':
                bgColor = "bg-green-100 dark:bg-green-900 border-l-4 border-green-500";
                titleColor = "text-green-700 dark:text-green-300 font-bold";
                message = `Você possui ${status.total} licenças, mas apenas ${status.allocated} estão em uso. Potencial de economia em ${status.delta} licença(s).`;
                break;
            case 'Otimizado':
                bgColor = "bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500";
                titleColor = "text-blue-700 dark:text-blue-300 font-bold";
                message = `Uso otimizado. ${status.allocated} de ${status.total} licenças em uso.`;
                break;
        }

        return (
            <div className={`p-4 rounded-md shadow ${bgColor}`}>
                <h3 className={`text-lg ${titleColor}`}>{status.productName}</h3>
                <p className="mt-1 text-sm">{message}</p>
            </div>
        );
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Painel de Reconciliação (Compliance)</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Este painel compara licenças adquiridas (Total) vs. licenças atribuídas (Em Uso) para identificar riscos e oportunidades de economia. (Dados "Em Uso" são simulados para incluir cenários de risco).</p>

            <div className="space-y-4">
                {complianceData.map(status => <StatusCard key={status.productId} status={status} />)}
            </div>
        </div>
    );
};

export default CompliancePage;

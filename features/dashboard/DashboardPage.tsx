import React, { useMemo, useContext } from 'react';
import Card from '../../components/Card';
import { LicenseIcon, CostIcon, CatalogIcon, UsersIcon } from '../../components/IconComponents';
import CostChart from './CostChart';
import AllocationByVendorChart from './AllocationByVendorChart';
import LowAvailabilityPools from './LowAvailabilityPools';
import { AppContext } from '../../contexts/AppContext';
import { AllocStatus, CostPeriod } from '../../types';
import { Page } from '../../App';

interface DashboardProps {
    setCurrentPage: (page: Page) => void;
}

const DashboardPage: React.FC<DashboardProps> = ({ setCurrentPage }) => {
    const { allocationsWithDetails, poolsWithDetails, products } = useContext(AppContext);

    // KPI Calculations
    const stats = useMemo(() => {
        const activeAllocs = allocationsWithDetails.filter(a => a.status === AllocStatus.ACTIVE);
        const awaiting = allocationsWithDetails.filter(a => a.status === AllocStatus.AWAITING_INACT).length;
        
        const totalCost = activeAllocs.reduce((sum, a) => {
            const cost = a.unitCost || 0;
            const period = a.pool.product.costPeriod;
            return sum + (period === CostPeriod.MONTH ? cost * 12 : cost);
        }, 0);
        
        return { 
            active: activeAllocs.length,
            awaiting,
            totalCost,
            totalProducts: products.length
        };
    }, [allocationsWithDetails, products]);

    // Chart Data Calculations
    const allocationsByVendor = useMemo(() => {
        const vendorMap: Record<string, number> = {};
        allocationsWithDetails
            .filter(a => a.status === AllocStatus.ACTIVE)
            .forEach(a => {
                const vendorName = a.pool.product.vendor?.name || 'Outros';
                vendorMap[vendorName] = (vendorMap[vendorName] || 0) + 1;
            });
        return Object.entries(vendorMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a,b) => b.value - a.value);
    }, [allocationsWithDetails]);

    const top10ExpensiveSoftware = useMemo(() => {
        const costByProduct: Record<string, { name: string; value: number }> = {};
        allocationsWithDetails
            .filter(a => a.status === AllocStatus.ACTIVE)
            .forEach(a => {
                const product = a.pool.product;
                const annualCost = product.costPeriod === CostPeriod.MONTH ? a.unitCost * 12 : a.unitCost;
                if (!costByProduct[product.id]) {
                    costByProduct[product.id] = { name: product.name, value: 0 };
                }
                costByProduct[product.id].value += annualCost;
            });
        return Object.values(costByProduct).sort((a, b) => b.value - a.value).slice(0, 10);
    }, [allocationsWithDetails]);

    const costByCostCenter = useMemo(() => {
        const costMap: Record<string, { name: string; value: number }> = {};
        allocationsWithDetails
            .filter(a => a.status === AllocStatus.ACTIVE)
            .forEach(a => {
                const cc = a.costCenter;
                const ccName = cc ? `${cc.code}` : 'N/A';
                const annualCost = a.pool.product.costPeriod === CostPeriod.MONTH ? a.unitCost * 12 : a.unitCost;
                
                if (!costMap[cc?.id || 'na']) {
                    costMap[cc?.id || 'na'] = { name: ccName, value: 0 };
                }
                costMap[cc?.id || 'na'].value += annualCost;
            });
        return Object.values(costMap).sort((a, b) => b.value - a.value).slice(0, 10);
    }, [allocationsWithDetails]);
    
    const lowAvailabilityPools = useMemo(() => {
        return poolsWithDetails
            .filter(p => p.totalQuantity > 0 && (p.availableQty / p.totalQuantity) < 0.2) // Less than 20%
            .sort((a, b) => (a.availableQty / a.totalQuantity) - (b.availableQty / b.totalQuantity))
            .slice(0, 5); // Top 5
    }, [poolsWithDetails]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard de SAM</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Visão geral do seu ambiente de licenciamento de software.</p>
            </div>
            
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card 
                    title="Alocações Ativas"
                    value={stats.active}
                    icon={<LicenseIcon className="w-6 h-6 text-indigo-500" />}
                    iconBgClass="bg-indigo-100 dark:bg-indigo-900/50"
                />
                 <Card 
                    title="Custo Anual Total"
                    value={`R$ ${Math.round(stats.totalCost / 1000)}k`}
                    icon={<CostIcon className="w-6 h-6 text-emerald-500" />}
                    iconBgClass="bg-emerald-100 dark:bg-emerald-900/50"
                />
                 <Card 
                    title="Softwares no Catálogo"
                    value={stats.totalProducts}
                    icon={<CatalogIcon className="w-6 h-6 text-amber-500" />}
                    iconBgClass="bg-amber-100 dark:bg-amber-900/50"
                />
                <Card 
                    title="Aguardando Reaproveitamento"
                    value={stats.awaiting}
                    icon={<UsersIcon className="w-6 h-6 text-rose-500" />}
                    iconBgClass="bg-rose-100 dark:bg-rose-900/50"
                />
            </div>
            
            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-dark-secondary rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Top 10 Softwares Mais Caros (Anual)</h2>
                    <CostChart data={top10ExpensiveSoftware} layout="horizontal" />
                </div>
                <LowAvailabilityPools pools={lowAvailabilityPools} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                 <div className="lg:col-span-2 bg-white dark:bg-dark-secondary rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Alocações por Fornecedor</h2>
                    <AllocationByVendorChart data={allocationsByVendor} />
                </div>
                <div className="lg:col-span-3 bg-white dark:bg-dark-secondary rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Custo por Centro de Custo (Anual)</h2>
                    <CostChart data={costByCostCenter} />
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
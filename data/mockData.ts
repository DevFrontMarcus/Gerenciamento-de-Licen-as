
import {
    Vendor, Contract, SoftwareProduct, LicensePool, Department, CostCenter, Person, LicenseAllocation,
    AllocStatus, CostPeriod, PoolStatus, UserStatus, AuditLog
} from '../types';

// Helper functions
const cuid = () => `cuid_${Math.random().toString(36).substr(2, 9)}`;
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const formatDate = (date: Date) => date.toISOString();

// 1. Base Data
export const vendors: Vendor[] = [
    { id: '1', name: 'Microsoft' }, { id: '2', name: 'Adobe' }, { id: '3', name: 'Autodesk' },
    { id: '4', name: 'Figma' }, { id: '5', name: 'Miro' }, { id: '6', name: 'Outros' },
];

export const contracts: Contract[] = [
    { id: 'C1', number: 'MS-EA-2024', vendorId: '1', startDate: '2024-01-01', endDate: '2026-12-31' },
    { id: 'C2', number: 'ADOBE-VIP-2024', vendorId: '2', startDate: '2024-03-01', endDate: '2025-02-28' },
];

export const departments: Department[] = [
    { id: 'D1', name: 'Desenvolvimento', directorate: 'Tecnologia' },
    { id: 'D2', name: 'Marketing Digital', directorate: 'Marketing' },
    { id: 'D3', name: 'RH', directorate: 'Recursos Humanos' },
];

export const costCenters: CostCenter[] = [
    { id: 'CC100', code: 'CC100', name: 'Projetos Internos', departmentId: 'D1' },
    { id: 'CC200', code: 'CC200', name: 'Campanhas', departmentId: 'D2' },
    { id: 'CC300', code: 'CC300', name: 'Recrutamento', departmentId: 'D3' },
];

export const people: Person[] = [
    { id: 'P101', email: 'ana.silva@company.com', matricula: 'M12345', displayName: 'Ana Silva', managerUpn: 'carlos.pereira@company.com', departmentId: 'D1', status: UserStatus.Active },
    { id: 'P102', email: 'bruno.costa@company.com', matricula: 'M12346', displayName: 'Bruno Costa', managerUpn: 'carlos.pereira@company.com', departmentId: 'D1', status: UserStatus.Active },
    { id: 'P103', email: 'carla.dias@company.com', matricula: 'M12347', displayName: 'Carla Dias', managerUpn: 'sofia.lima@company.com', departmentId: 'D2', status: UserStatus.Active },
    { id: 'P104', email: 'daniel.alves@company.com', matricula: 'M12348', displayName: 'Daniel Alves', managerUpn: 'sofia.lima@company.com', departmentId: 'D2', status: UserStatus.Inactive },
    { id: 'P105', email: 'eduarda.rocha@company.com', matricula: 'M12349', displayName: 'Eduarda Rocha', managerUpn: 'roberto.mendes@company.com', departmentId: 'D3', status: UserStatus.Active },
    { id: 'P106', email: 'fabio.martins@company.com', matricula: 'M12350', displayName: 'Fábio Martins', managerUpn: 'roberto.mendes@company.com', departmentId: 'D3', status: UserStatus.Active },
];

// 2. Software Catalog and Pools
const productNames = [
    { name: "MS Project Plan 3", vendorId: '1', cost: 145, period: CostPeriod.MONTH },
    { name: "MS Visio Plan 2", vendorId: '1', cost: 72, period: CostPeriod.MONTH },
    { name: "Adobe Acrobat Pro", vendorId: '2', cost: 96, period: CostPeriod.MONTH },
    { name: "Adobe Photoshop", vendorId: '2', cost: 105, period: CostPeriod.MONTH },
    { name: "Autocad", vendorId: '3', cost: 8500, period: CostPeriod.YEAR },
    { name: "Figma Enterprise", vendorId: '4', cost: 360, period: CostPeriod.YEAR },
    { name: "Miro Business", vendorId: '5', cost: 192, period: CostPeriod.YEAR },
];

export const softwareProducts: SoftwareProduct[] = productNames.map((p, i) => ({
    id: `PROD${i + 1}`,
    name: p.name,
    vendorId: p.vendorId,
    unitCost: p.cost,
    costPeriod: p.period,
    tags: p.name.includes("Adobe") ? ['Design', 'Criação'] : (p.name.includes("MS") ? ['Produtividade', 'Microsoft'] : ['Engenharia'])
}));

export const licensePools: LicensePool[] = softwareProducts.map(p => ({
    id: `POOL-${p.id}`,
    productId: p.id,
    contractId: p.vendorId === '1' ? 'C1' : (p.vendorId === '2' ? 'C2' : undefined),
    totalQuantity: Math.floor(Math.random() * 20) + 10, // 10 to 29
    availableQty: 0, // Will be calculated later
    status: PoolStatus.ACTIVE
}));

// 3. Allocations
export const licenseAllocations: LicenseAllocation[] = [];
let allocCounter = 1;

licensePools.forEach(pool => {
    let assigned = 0;
    const qtyToAssign = Math.floor(pool.totalQuantity * (0.6 + Math.random() * 0.3)); // Assign 60-90%
    for (let i = 0; i < qtyToAssign; i++) {
        const person = getRandomItem(people);
        const statuses = [AllocStatus.ACTIVE, AllocStatus.ACTIVE, AllocStatus.ACTIVE, AllocStatus.AWAITING_INACT, AllocStatus.HISTORY];
        const status = (person.status === UserStatus.Inactive && Math.random() > 0.3) ? AllocStatus.AWAITING_INACT : getRandomItem(statuses);

        const now = new Date();
        const createdAt = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000); // within last year
        
        if (status !== AllocStatus.HISTORY) {
            assigned++;
        }
        
        const product = softwareProducts.find(p => p.id === pool.productId)!;

        licenseAllocations.push({
            id: `ALLOC${allocCounter++}`,
            poolId: pool.id,
            personId: person.id,
            costCenterId: getRandomItem(costCenters).id,
            status: status,
            accessKey: `KEY-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
            observation: Math.random() > 0.9 ? 'Uso em projeto especial.' : '',
            thirdParty: person.displayName.includes("Terceiro"),
            unitCost: product.unitCost,
            createdAt: formatDate(createdAt),
            updatedAt: formatDate(new Date(createdAt.getTime() + Math.random() * (now.getTime() - createdAt.getTime()))),
            history: [{
                id: cuid(),
                to: status,
                reason: 'Importação inicial',
                createdAt: formatDate(createdAt)
            }]
        });
    }
    pool.availableQty = pool.totalQuantity - assigned;
});


// 4. Initial Audit Log
export const auditLogs: AuditLog[] = [
    {
        id: cuid(),
        actorId: 'P101',
        actorName: 'Ana Silva',
        entity: 'System',
        entityId: 'SYSTEM',
        action: 'login',
        details: 'Usuário logado com sucesso.',
        createdAt: formatDate(new Date())
    },
    {
        id: cuid(),
        actorId: 'P105',
        actorName: 'Eduarda Rocha',
        entity: 'SoftwareProduct',
        entityId: 'PROD1',
        action: 'update',
        details: 'Custo unitário do produto "MS Project Plan 3" alterado de 140 para 145.',
        createdAt: formatDate(new Date(Date.now() - 2 * 60 * 60 * 1000))
    }
];

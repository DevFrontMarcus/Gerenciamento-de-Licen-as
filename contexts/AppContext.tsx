
import React, { createContext, useState, useCallback, ReactNode, useMemo } from 'react';
import {
    Vendor, Contract, SoftwareProduct, LicensePool, Department, CostCenter, Person, LicenseAllocation, AuditLog,
    LicenseAllocationWithDetails, LicensePoolWithDetails, SoftwareProductWithDetails, UserStatus, AllocStatus, SoftwareRequest, SoftwareRequestWithDetails, CostPeriod, PoolStatus,
    ImportResult, ImportIssue
} from '../types';
import * as mock from '../data/mockData';
import { validateRow, ValidatedRow } from '../features/import/importValidation';

// Simulating a notification system
interface Notification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
}

// Simulating a cuid generator
const cuid = () => `cuid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

interface AppContextType {
    // State
    vendors: Vendor[];
    contracts: Contract[];
    products: SoftwareProduct[];
    pools: LicensePool[];
    departments: Department[];
    costCenters: CostCenter[];
    people: Person[];
    allocations: LicenseAllocation[];
    auditLog: AuditLog[];
    requests: SoftwareRequest[];
    notifications: Notification[];

    // Computed Details (for UI)
    productsWithDetails: SoftwareProductWithDetails[];
    poolsWithDetails: LicensePoolWithDetails[];
    allocationsWithDetails: LicenseAllocationWithDetails[];
    requestsWithDetails: SoftwareRequestWithDetails[];

    // Actions (Simulating Backend)
    addAudit: (log: Omit<AuditLog, 'id' | 'createdAt'>) => void;
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    removeNotification: (id: number) => void;
    
    // Reharvesting
    runReharvestingJob: () => void;

    // Allocation Management
    updateAllocationStatus: (allocationId: string, newStatus: AllocStatus, reason: string) => void;
    
    // Import
    importDataFromCSV: (file: File, mapping: Record<string, string>, dryRun: boolean) => Promise<ImportResult>;
}

export const AppContext = createContext<AppContextType>(null!);

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // State Management (In-memory Database)
    const [vendors, setVendors] = useState<Vendor[]>(mock.vendors);
    const [contracts, setContracts] = useState<Contract[]>(mock.contracts);
    const [products, setProducts] = useState<SoftwareProduct[]>(mock.softwareProducts);
    const [pools, setPools] = useState<LicensePool[]>(mock.licensePools);
    const [departments, setDepartments] = useState<Department[]>(mock.departments);
    const [costCenters, setCostCenters] = useState<CostCenter[]>(mock.costCenters);
    const [people, setPeople] = useState<Person[]>(mock.people);
    const [allocations, setAllocations] = useState<LicenseAllocation[]>(mock.licenseAllocations);
    const [auditLog, setAuditLog] = useState<AuditLog[]>(mock.auditLogs);
    const [requests, setRequests] = useState<SoftwareRequest[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // --- Computed Selectors (like SQL Views) ---
    const productsWithDetails = useMemo((): SoftwareProductWithDetails[] => {
        return products.map(p => ({
            ...p,
            vendor: vendors.find(v => v.id === p.vendorId),
        }));
    }, [products, vendors]);

    const poolsWithDetails = useMemo((): LicensePoolWithDetails[] => {
        return pools.map(p => ({
            ...p,
            product: productsWithDetails.find(prod => prod.id === p.productId)!,
            contract: contracts.find(c => c.id === p.contractId),
        }));
    }, [pools, productsWithDetails, contracts]);

    const allocationsWithDetails = useMemo((): LicenseAllocationWithDetails[] => {
        return allocations.map(a => {
            const person = people.find(p => p.id === a.personId)!;
            const department = departments.find(d => d.id === person.departmentId);
            return {
                ...a,
                pool: poolsWithDetails.find(p => p.id === a.poolId)!,
                person,
                costCenter: costCenters.find(cc => cc.id === a.costCenterId),
                department,
            };
        });
    }, [allocations, poolsWithDetails, people, departments, costCenters]);
    
    const requestsWithDetails = useMemo((): SoftwareRequestWithDetails[] => {
        return requests.map(r => ({
            ...r,
            requester: people.find(p => p.id === r.requesterId)!,
            product: products.find(p => p.id === r.productId)!,
        }))
    }, [requests, people, products]);

    // --- Actions ---
    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const newNotification = { ...notification, id: Date.now() };
        setNotifications(prev => [newNotification, ...prev].slice(0, 10));
    }, []);

    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const addAudit = useCallback((log: Omit<AuditLog, 'id' | 'createdAt'>) => {
        const newLog = {
            ...log,
            id: `log_${Date.now()}`,
            createdAt: new Date().toISOString()
        };
        setAuditLog(prev => [newLog, ...prev]);
    }, []);

    const updateAllocationStatus = useCallback((allocationId: string, newStatus: AllocStatus, reason: string) => {
        const now = new Date().toISOString();
        let poolIdToUpdate: string | null = null;
        let shouldIncrement = false;
        let shouldDecrement = false;
        
        setAllocations(prev => {
            return prev.map(alloc => {
                if (alloc.id === allocationId) {
                    // If moving from an active state to an inactive one
                    if (alloc.status !== AllocStatus.HISTORY && newStatus === AllocStatus.HISTORY) {
                       poolIdToUpdate = alloc.poolId;
                       shouldIncrement = true;
                    }
                    // If moving from an inactive state to an active one
                    else if (alloc.status === AllocStatus.HISTORY && newStatus !== AllocStatus.HISTORY) {
                       poolIdToUpdate = alloc.poolId;
                       shouldDecrement = true;
                    }

                    const newHistoryEntry = {
                        id: `hist_${Date.now()}`,
                        from: alloc.status,
                        to: newStatus,
                        reason,
                        createdById: 'P_ADMIN', // Simulated admin user
                        createdAt: now,
                    };
                    return {
                        ...alloc,
                        status: newStatus,
                        history: [...alloc.history, newHistoryEntry],
                        updatedAt: now,
                    };
                }
                return alloc;
            });
        });

        if (poolIdToUpdate) {
            setPools(prevPools => prevPools.map(pool => {
                if (pool.id === poolIdToUpdate) {
                    let newAvailableQty = pool.availableQty;
                    if (shouldIncrement) newAvailableQty++;
                    if (shouldDecrement) newAvailableQty--;
                    return { ...pool, availableQty: newAvailableQty };
                }
                return pool;
            }));
        }
    }, []);

    const runReharvestingJob = useCallback(() => {
        let reharvestedCount = 0;
        const now = new Date().toISOString();
        const poolUpdates: Record<string, number> = {};

        setAllocations(prevAllocs => {
            const updatedAllocations = prevAllocs.map(alloc => {
                if (alloc.status === AllocStatus.AWAITING_INACT) {
                    reharvestedCount++;
                    poolUpdates[alloc.poolId] = (poolUpdates[alloc.poolId] || 0) + 1;
                    const newHistoryEntry = {
                        id: `hist_${Date.now()}_${alloc.id}`,
                        from: AllocStatus.AWAITING_INACT,
                        to: AllocStatus.HISTORY,
                        reason: 'Reharvesting automático',
                        createdById: 'SYSTEM',
                        createdAt: now,
                    };
                    return {
                        ...alloc,
                        status: AllocStatus.HISTORY,
                        history: [...alloc.history, newHistoryEntry],
                        updatedAt: now,
                    };
                }
                return alloc;
            });
            return updatedAllocations;
        });

        if (Object.keys(poolUpdates).length > 0) {
            setPools(prevPools => {
                return prevPools.map(pool => {
                    if (poolUpdates[pool.id]) {
                        return { ...pool, availableQty: pool.availableQty + poolUpdates[pool.id] };
                    }
                    return pool;
                });
            });
        }

        addAudit({
            actorId: 'SYSTEM',
            actorName: 'Sistema',
            entity: 'LicenseReharvesting',
            entityId: 'JOB',
            action: 'execute',
            details: `${reharvestedCount} licença(s) foram movidas para o Histórico e seus pools atualizados.`
        });
        addNotification({
            message: `Processo de Reaproveitamento concluído. ${reharvestedCount} licença(s) recuperada(s).`,
            type: 'success'
        });
    }, [addAudit, addNotification]);
    
    const importDataFromCSV = useCallback(async (file: File, mapping: Record<string, string>, dryRun: boolean = false): Promise<ImportResult> => {
        // A more robust CSV parser
        const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
            const lines = text.split(/[\r\n]+/).filter(line => line.trim() !== '');
            if (lines.length === 0) return { headers: [], rows: [] };
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
            return { headers, rows };
        };

        const text = await file.text();
        const { headers, rows: dataRows } = parseCSV(text);

        const results: ImportResult = { ok: 0, errors: [], warnings: [], duplicates: [] };
        
        // Data to be added if not dryRun
        const newVendors: Vendor[] = [];
        const newProducts: SoftwareProduct[] = [];
        const newPeople: Person[] = [];
        const newPools: LicensePool[] = [];
        const newAllocations: LicenseAllocation[] = [];
        
        const existingAllocationsSet = new Set(allocations.filter(a => a.status !== AllocStatus.HISTORY).map(a => `${a.personId}|${a.poolId}`));
        const batchAllocationsSet = new Set<string>();

        for (let i = 0; i < dataRows.length; i++) {
            const rowArray = dataRows[i];
            const rowData: Record<string, any> = {};
            const originalRowData: Record<string, any> = {};
            headers.forEach((h, index) => originalRowData[h] = rowArray[index]);
            
            // Apply user mapping
            for (const key in mapping) {
                const header = mapping[key];
                const index = headers.findIndex(h => h === header);
                if (index !== -1) {
                    rowData[key] = rowArray[index];
                }
            }
            
            // 1. Validate row structure and types
            const validation = validateRow(rowData, i + 2); // i+2 for 1-based index + header
            if (validation.error) {
                results.errors.push({ rowIndex: i + 2, rowData: originalRowData, message: validation.error });
                continue;
            }
            const { data } = validation as { data: ValidatedRow };

            // 2. Process entities ("get or create" logic)
            // Vendor
            let vendor = vendors.find(v => v.name.toLowerCase() === data.vendorName?.toLowerCase()) || newVendors.find(v => v.name.toLowerCase() === data.vendorName?.toLowerCase());
            if (data.vendorName && !vendor) {
                vendor = { id: `vendor_${cuid()}`, name: data.vendorName };
                if (!dryRun) newVendors.push(vendor);
            }

            // Product
            let product = products.find(p => p.name.toLowerCase() === data.productName.toLowerCase()) || newProducts.find(p => p.name.toLowerCase() === data.productName.toLowerCase());
            if (!product) {
                product = {
                    id: `prod_${cuid()}`, name: data.productName, vendorId: vendor?.id,
                    unitCost: data.cost ?? 0,
                    costPeriod: data.cost !== undefined ? CostPeriod.UNKNOWN : CostPeriod.FREE, 
                    tags: []
                };
                if (!dryRun) newProducts.push(product);
            } else if (data.cost !== undefined && product.unitCost !== data.cost) {
                results.warnings.push({ rowIndex: i + 2, rowData: originalRowData, message: `Custo do produto '${product.name}' existente (${product.unitCost}) é diferente do importado (${data.cost}). O custo existente será mantido.`});
            }

            // Person
            let person = people.find(p => p.email.toLowerCase() === data.personEmail.toLowerCase()) || newPeople.find(p => p.email.toLowerCase() === data.personEmail.toLowerCase());
            if (!person) {
                person = {
                    id: `person_${cuid()}`, email: data.personEmail, displayName: data.personName,
                    status: UserStatus.Active
                };
                if (!dryRun) newPeople.push(person);
            }

            // Pool
            let pool = pools.find(p => p.productId === product!.id) || newPools.find(p => p.productId === product!.id);
            if (!pool) {
                pool = {
                    id: `pool_${cuid()}`, productId: product.id, totalQuantity: 0,
                    availableQty: 0, status: PoolStatus.ACTIVE
                };
                 if (!dryRun) newPools.push(pool);
            }

            // 3. Check for Duplicate Allocations
            const allocIdentifier = `${person.id}|${pool.id}`;
            if (existingAllocationsSet.has(allocIdentifier) || batchAllocationsSet.has(allocIdentifier)) {
                results.duplicates.push({ rowIndex: i + 2, rowData: originalRowData, message: `Alocação para '${person.displayName}' do produto '${product.name}' já existe e está ativa (ou duplicada no arquivo).`});
                continue;
            }

            // 4. Create Allocation object (if valid so far)
            const newAlloc: LicenseAllocation = {
                id: `alloc_${cuid()}`, poolId: pool.id, personId: person.id,
                status: AllocStatus.ACTIVE,
                unitCost: product.unitCost,
                thirdParty: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                history: [{ id: cuid(), to: AllocStatus.ACTIVE, reason: 'Importação CSV', createdAt: new Date().toISOString() }]
            };
            if (!dryRun) {
                newAllocations.push(newAlloc);
                batchAllocationsSet.add(allocIdentifier);
            }

            results.ok++;
        }
        
        if (dryRun) {
            return results;
        }
        
        if (results.ok === 0) {
            addNotification({type: 'warning', message: 'Nenhum registro válido para importar.'});
            return results;
        }

        // 5. Batch update state
        setVendors(v => [...v, ...newVendors]);
        setProducts(p => [...p, ...newProducts]);
        setPeople(p => [...p, ...newPeople]);
        
        setPools(currentPools => {
            const poolsMap = new Map(currentPools.map(p => [p.id, {...p}]));
            
            newPools.forEach(p => poolsMap.set(p.id, {...p}));

            newAllocations.forEach(alloc => {
                const pool = poolsMap.get(alloc.poolId)!;
                pool.totalQuantity++;
            });
            
            return Array.from(poolsMap.values());
        });

        // Recalculate available quantities after all state updates
        setPools(currentPools => {
             const allAllocations = [...allocations, ...newAllocations];
             const assignedCounts = allAllocations
                .filter(a => a.status !== AllocStatus.HISTORY)
                .reduce((acc, a) => {
                    acc[a.poolId] = (acc[a.poolId] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);
            
            return currentPools.map(p => ({
                ...p,
                availableQty: p.totalQuantity - (assignedCounts[p.id] || 0)
            }));
        });
        
        setAllocations(a => [...a, ...newAllocations]);

        addAudit({
            actorName: 'Admin', entity: 'Import', entityId: 'CSV', action: 'create_bulk',
            details: `Importação concluída. ${results.ok} sucessos, ${results.errors.length} erros, ${results.duplicates.length} duplicatas.`
        });
        addNotification({
            type: results.errors.length > 0 ? 'warning' : 'success',
            message: `Importação concluída: ${results.ok} sucessos, ${results.errors.length} erros.`
        });

        return results;
    }, [vendors, products, people, pools, allocations, addAudit, addNotification]);
    
    
    const contextValue: AppContextType = {
        vendors, contracts, products, pools, departments, costCenters, people, allocations, auditLog, requests, notifications,
        productsWithDetails, poolsWithDetails, allocationsWithDetails, requestsWithDetails,
        addAudit, addNotification, removeNotification, runReharvestingJob, updateAllocationStatus, importDataFromCSV
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export enum LicenseStatus {
    Active = 'Ativa',
    Pending = 'Pendente',
    Expired = 'Expirada',
    Suspended = 'Suspensa'
}

// New normalized data model based on Prisma schema

export enum CostPeriod {
    MONTH = 'Mensal',
    YEAR = 'Anual',
    ONE_TIME = 'Pagamento Único',
    FREE = 'Gratuito',
    UNKNOWN = 'Desconhecido'
}

export enum PoolStatus {
    ACTIVE = 'Ativo',
    INACTIVE = 'Inativo',
    EXHAUSTED = 'Esgotado'
}

export enum AllocStatus {
    ACTIVE = 'Ativo',
    AVAILABLE = 'Disponível', // Not used directly on allocation, but a concept
    AWAITING_INACT = 'Aguardando Inativação',
    HISTORY = 'Histórico'
}

export enum UserStatus {
    Active = 'Ativo',
    Inactive = 'Inativo'
}

export interface Vendor {
    id: string;
    name: string;
}

export interface Contract {
    id: string;
    number: string;
    vendorId: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
}

export interface SoftwareProduct {
    id: string;
    name: string;
    vendorId?: string;
    unitCost: number;
    costPeriod: CostPeriod;
    tags: string[];
}

export interface LicensePool {
    id: string;
    productId: string;
    contractId?: string;
    totalQuantity: number;
    availableQty: number;
    status: PoolStatus;
}

export interface Department {
    id: string;
    name: string; // e.g., 'Desenvolvimento'
    directorate: string; // e.g., 'Tecnologia'
}

export interface CostCenter {
    id: string;
    code: string;
    name?: string;
    departmentId?: string;
}

export interface Person {
    id: string;
    email: string;
    matricula?: string;
    displayName: string;
    managerUpn?: string;
    departmentId?: string;
    status: UserStatus;
}

export interface StatusHistory {
    id: string;
    from?: AllocStatus;
    to: AllocStatus;
    reason?: string;
    createdById?: string; // Should be Person['id']
    createdAt: string;
}

export interface LicenseAllocation {
    id: string;
    poolId: string;
    personId: string;
    costCenterId?: string;
    status: AllocStatus;
    accessKey?: string;
    observation?: string;
    thirdParty: boolean;
    unitCost: number; // Snapshot of product.unitCost at time of allocation
    history: StatusHistory[];
    createdAt: string;
    updatedAt: string;
}

// For UI display, we'll need combined types
export interface SoftwareProductWithDetails extends SoftwareProduct {
    vendor?: Vendor;
}

export interface LicensePoolWithDetails extends LicensePool {
    product: SoftwareProductWithDetails;
    contract?: Contract;
}

export interface LicenseAllocationWithDetails extends Omit<LicenseAllocation, 'poolId' | 'personId' | 'costCenterId'> {
    pool: LicensePoolWithDetails;
    person: Person;
    costCenter?: CostCenter;
    department?: Department; // Denormalized for easier display
}

export interface AuditLog {
    id: string;
    actorId?: string; // Person ID
    actorName?: string; // Denormalized for display
    entity: string; // e.g., 'LicenseAllocation', 'SoftwareProduct'
    entityId: string;
    action: string; // e.g., 'create', 'update', 'delete', 'assign', 'reharvest'
    details: string;
    createdAt: string;
}

export interface SoftwareRequest {
    id: string;
    requesterId: string;
    productId: string;
    justification: string;
    status: 'Pending' | 'Approved' | 'Denied';
    createdAt: string;
}

export interface SoftwareRequestWithDetails extends SoftwareRequest {
    requester: Person;
    product: SoftwareProduct;
}

export interface ImportIssue {
    rowIndex: number; // The original index in the CSV file (1-based for user display)
    rowData: Record<string, any>; // The raw row data from the CSV
    message: string;
}

export interface ImportResult {
    ok: number;
    warnings: ImportIssue[];
    errors: ImportIssue[];
    duplicates: ImportIssue[];
}
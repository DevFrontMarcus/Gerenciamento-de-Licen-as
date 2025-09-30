import { Person, SoftwareProduct } from "../../types";

// Very basic email regex
const isEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export interface ValidatedRow {
    productName: string;
    vendorName?: string;
    personEmail: string;
    personName: string;
    cost?: number;
}

// FIX: Define and export ImportColumn type
export interface ImportColumn {
    id: string;
    name: string;
    aliases: string[];
}

export const REQUIRED_COLUMNS: ImportColumn[] = [
    { id: 'productName', name: 'Nome do Produto', aliases: ['nome licença', 'software', 'produto', 'nome licençaa - z'] },
    { id: 'personEmail', name: 'Email do Usuário', aliases: ['e-mail do usuário', 'email', 'e-mail'] },
    { id: 'personName', name: 'Nome do Usuário', aliases: ['nome a - z', 'nome', 'usuário'] },
];

export const OPTIONAL_COLUMNS: ImportColumn[] = [
    { id: 'vendorName', name: 'Fornecedor', aliases: ['fornecedor', 'fabricante'] },
    { id: 'cost', name: 'Custo Unitário', aliases: ['valor', 'custo'] },
];

export const validateRow = (rowData: Record<string, any>, rowIndex: number): { data?: ValidatedRow; error?: string } => {
    const productName = rowData.productName;
    const personEmail = rowData.personEmail;
    const personName = rowData.personName;
    const vendorName = rowData.vendorName;
    const cost = rowData.cost;

    if (!productName || typeof productName !== 'string' || productName.trim() === '') {
        return { error: `'Nome do Produto' é obrigatório.` };
    }
    if (!personEmail || typeof personEmail !== 'string' || personEmail.trim() === '') {
        return { error: `'Email do Usuário' é obrigatório.` };
    }
    if (!isEmail(personEmail)) {
        return { error: `Email '${personEmail}' é inválido.` };
    }
    if (!personName || typeof personName !== 'string' || personName.trim() === '') {
        return { error: `'Nome do Usuário' é obrigatório.` };
    }

    let parsedCost: number | undefined = undefined;
    if (cost && String(cost).trim() !== '') {
        if (typeof cost === 'string') {
            const num = parseFloat(cost.replace(',', '.'));
            if (isNaN(num)) {
                return { error: `Custo '${cost}' não é um número válido.` };
            }
            parsedCost = num;
        } else if (typeof cost === 'number') {
            parsedCost = cost;
        } else {
             return { error: `Custo '${cost}' não é um número válido.` };
        }
    }
    
    return {
        data: {
            productName: productName.trim(),
            personEmail: personEmail.trim().toLowerCase(),
            personName: personName.trim(),
            vendorName: vendorName?.trim(),
            cost: parsedCost,
        }
    };
};

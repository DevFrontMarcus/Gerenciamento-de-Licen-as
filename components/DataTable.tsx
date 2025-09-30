import React, { useState, useMemo, useCallback } from 'react';
import { CloseIcon } from './IconComponents';

type SortDirection = 'asc' | 'desc';

interface Column<T> {
    header: string;
    accessor: (row: T) => React.ReactNode;
    sortable?: boolean;
    key?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    searchKeys: string[];
}

const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export function DataTable<T extends { id: string }>({ data, columns, searchKeys }: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection } | null>(null);
    const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
    const itemsPerPage = 10;
    
    const updateAutocomplete = useCallback((term: string) => {
        if (!term) {
            setAutocompleteSuggestions([]);
            return;
        }
        const lowerCaseTerm = term.toLowerCase();
        const suggestions = new Set<string>();
        for (const item of data) {
            if (suggestions.size >= 5) break;
            for (const key of searchKeys) {
                const value = getNestedValue(item, key);
                if (value) {
                    const stringValue = Array.isArray(value) ? value.join(' ') : String(value);
                    if (stringValue.toLowerCase().includes(lowerCaseTerm)) {
                        suggestions.add(stringValue);
                    }
                }
            }
        }
        setAutocompleteSuggestions(Array.from(suggestions));
    }, [data, searchKeys]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        setCurrentPage(1);
        updateAutocomplete(term);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setSearchTerm(suggestion);
        setAutocompleteSuggestions([]);
    };
    
    const clearSearch = () => {
        setSearchTerm('');
        setAutocompleteSuggestions([]);
    };

    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        return data.filter(item =>
            searchKeys.some(key => {
                const value = getNestedValue(item, key);
                if (!value) return false;
                
                if (Array.isArray(value)) {
                    return value.some(tag => String(tag).toLowerCase().includes(searchTerm.toLowerCase()));
                }
                
                return String(value).toLowerCase().includes(searchTerm.toLowerCase());
            })
        );
    }, [data, searchTerm, searchKeys]);
    
    const sortedData = useMemo(() => {
        let sortableItems = [...filteredData];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = getNestedValue(a, sortConfig.key);
                const bValue = getNestedValue(b, sortConfig.key);
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredData, sortConfig]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedData, currentPage]);

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);

    const handleSort = (key: string) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="bg-white dark:bg-dark-secondary rounded-xl shadow-lg overflow-hidden">
            <div className="p-4">
                <div className="relative w-full md:w-1/3">
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onBlur={() => setTimeout(() => setAutocompleteSuggestions([]), 150)}
                        className="w-full p-2 pr-10 border border-input-border dark:border-input-border-dark rounded-lg bg-light dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                    />
                    {searchTerm && (
                        <button 
                            onClick={clearSearch} 
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            aria-label="Limpar busca"
                        >
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    )}
                    {autocompleteSuggestions.length > 0 && (
                        <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-secondary border dark:border-gray-700 rounded-lg shadow-xl overflow-hidden">
                            {autocompleteSuggestions.map((suggestion, index) => (
                                <li 
                                    key={index} 
                                    className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    onClick={() => handleSuggestionClick(suggestion)}
                                >
                                    {suggestion}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            {columns.map((col, index) => (
                                <th key={index} scope="col" className="px-6 py-3">
                                    {col.sortable && col.key ? (
                                        <button onClick={() => handleSort(col.key!)} className="flex items-center space-x-1 font-bold">
                                            <span>{col.header}</span>
                                            <span className="text-gray-400">
                                                {sortConfig?.key === col.key ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                                            </span>
                                        </button>
                                    ) : (
                                        col.header
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((item) => (
                            <tr key={item.id} className="bg-white dark:bg-dark-secondary border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                {columns.map((col, index) => (
                                    <td key={index} className="px-6 py-4">
                                        {col.accessor(item)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {paginatedData.length === 0 && <div className="text-center p-4">Nenhum resultado encontrado.</div>}
            </div>
            <div className="p-4 flex justify-between items-center flex-wrap gap-2 border-t dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    Mostrando {paginatedData.length} de {sortedData.length} registros
                </span>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-lg disabled:opacity-50 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">Anterior</button>
                    <span className="text-sm px-2">Página {currentPage} de {totalPages}</span>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-lg disabled:opacity-50 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">Próximo</button>
                </div>
            </div>
        </div>
    );
}
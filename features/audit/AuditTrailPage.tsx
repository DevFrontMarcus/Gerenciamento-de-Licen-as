
import React, { useMemo, useContext } from 'react';
import { DataTable } from '../../components/DataTable';
import { AuditLog } from '../../types';
import { AppContext } from '../../contexts/AppContext';

const AuditTrailPage: React.FC = () => {
    const { auditLog } = useContext(AppContext);

    const columns = useMemo(() => [
        { 
            header: 'Data', 
            accessor: (row: AuditLog) => new Date(row.createdAt).toLocaleString('pt-BR'), 
            sortable: true, 
            key: 'createdAt' 
        },
        { 
            header: 'Ator', 
            accessor: (row: AuditLog) => row.actorName || row.actorId || 'Sistema', 
            sortable: true, 
            key: 'actorName' 
        },
        { 
            header: 'Ação', 
            accessor: (row: AuditLog) => `${row.action.toUpperCase()} ${row.entity}`,
            sortable: true, 
            key: 'action'
        },
        { 
            header: 'Detalhes', 
            accessor: (row: AuditLog) => <p className="text-sm whitespace-pre-wrap">{row.details}</p> 
        },
    ], []);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Trilha de Auditoria</h1>
            
            <DataTable 
                data={auditLog} 
                columns={columns}
                searchKeys={['actorName', 'action', 'entity', 'details']}
            />
        </div>
    );
};

export default AuditTrailPage;

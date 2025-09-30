
import React from 'react';
import { DashboardIcon, LicenseIcon, UsersIcon, SuppliersIcon, AppIcon, CatalogIcon, PoolIcon, ContractIcon, RequestIcon, ImportIcon, AuditIcon, ReharvestingIcon, ComplianceIcon } from './IconComponents';
import { Page } from '../App';

interface SidebarProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
}

const NavLink: React.FC<{
    item: { id: Page; label: string; icon: React.FC<{className: string}> };
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
  }> = ({ item, currentPage, setCurrentPage }) => {
    const isActive = currentPage === item.id;
    return (
      <li>
        <button
          onClick={() => setCurrentPage(item.id)}
          className={`flex items-center p-3 my-1 w-full text-sm rounded-lg transition-all duration-300 transform group
            ${isActive
              ? 'bg-gradient-primary text-white shadow-lg -mr-2'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-primary-dark dark:hover:text-primary-light'}`
          }
        >
          <item.icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary'}`} />
          <span className="font-medium">{item.label}</span>
        </button>
      </li>
    );
  };

const NavSection: React.FC<{ title: string }> = ({ title }) => (
    <h3 className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
    const navSections = [
        {
            title: 'Principal',
            items: [
                { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
            ]
        },
        {
            title: 'Operações',
            items: [
                { id: 'allocations', label: 'Alocações', icon: LicenseIcon },
                { id: 'requests', label: 'Solicitações', icon: RequestIcon },
                { id: 'people', label: 'Pessoas', icon: UsersIcon },
                { id: 'import', label: 'Importar Excel', icon: ImportIcon },
            ]
        },
        {
            title: 'Governança & SAM',
            items: [
                { id: 'compliance', label: 'Compliance', icon: ComplianceIcon },
                { id: 'reharvesting', label: 'Reaproveitamento', icon: ReharvestingIcon },
                { id: 'audit', label: 'Trilha de Auditoria', icon: AuditIcon },

            ]
        },
        {
            title: 'Configuração',
            items: [
                { id: 'catalog', label: 'Produtos', icon: CatalogIcon },
                { id: 'pools', label: 'Pools de Licenças', icon: PoolIcon },
                { id: 'contracts', label: 'Contratos', icon: ContractIcon },
                { id: 'vendors', label: 'Fornecedores', icon: SuppliersIcon },
            ]
        }
    ];

    return (
        <aside className="w-64 bg-white dark:bg-dark-secondary flex-shrink-0 flex flex-col transition-all duration-300">
            <div className="flex items-center justify-center h-20 border-b dark:border-gray-700">
                <AppIcon className="w-8 h-8 text-primary" />
                <h1 className="ml-3 text-xl font-bold text-gray-800 dark:text-white">SAM Suite</h1>
            </div>
            <nav className="flex-1 px-4 py-4 overflow-y-auto">
                {navSections.map(section => (
                    <div key={section.title}>
                        <NavSection title={section.title} />
                        <ul>
                            {section.items.map((item) => (
                                <NavLink key={item.id} item={item as any} currentPage={currentPage} setCurrentPage={setCurrentPage} />
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>
            <div className="p-4 border-t dark:border-gray-700">
                <p className="text-xs text-center text-gray-500">© 2024 SAM Suite</p>
            </div>
        </aside>
    );
};

export default Sidebar;
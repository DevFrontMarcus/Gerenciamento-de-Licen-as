
import React, { useState, useContext, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { AppContextProvider } from './contexts/AppContext';

// Page Imports
import DashboardPage from './features/dashboard/DashboardPage';
import AllocationsPage from './features/allocations/AllocationsPage';
import PeoplePage from './features/people/PeoplePage';
import VendorsPage from './features/vendors/VendorsPage';
import CatalogPage from './features/catalog/CatalogPage';
import PoolsPage from './features/pools/PoolsPage';
import ContractsPage from './features/contracts/ContractsPage';
import RequestsPage from './features/requests/RequestsPage';
import ImportPage from './features/import/ImportPage';
import AuditTrailPage from './features/audit/AuditTrailPage';
import ReharvestingPage from './features/sam/ReharvestingPage';
import CompliancePage from './features/sam/CompliancePage';


export type Page = 
    'dashboard' | 
    'allocations' | 
    'people' | 
    'vendors' | 
    'catalog' | 
    'pools' | 
    'contracts' |
    'requests' |
    'import' |
    'audit' |
    'reharvesting' |
    'compliance';

const AppContent: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard': return <DashboardPage setCurrentPage={setCurrentPage} />;
            case 'allocations': return <AllocationsPage />;
            case 'people': return <PeoplePage />;
            case 'vendors': return <VendorsPage />;
            case 'catalog': return <CatalogPage />;
            case 'pools': return <PoolsPage />;
            case 'contracts': return <ContractsPage />;
            case 'requests': return <RequestsPage />;
            case 'import': return <ImportPage />;
            case 'audit': return <AuditTrailPage />;
            case 'reharvesting': return <ReharvestingPage />;
            case 'compliance': return <CompliancePage />;
            default: return <DashboardPage setCurrentPage={setCurrentPage} />;
        }
    };

    return (
        <div className="flex h-screen bg-light dark:bg-dark">
            <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
            <div className="flex flex-col flex-1">
                <Header />
                <main className="flex-1 p-6 sm:p-8 overflow-y-auto bg-light dark:bg-dark">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    return (
        <AppContextProvider>
            <AppContent />
        </AppContextProvider>
    );
};


export default App;
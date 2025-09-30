
import React, { useState, useContext, useRef, useEffect } from 'react';
import { BellIcon } from './IconComponents';
// Fix: Use AppContext which contains the notification state and logic.
import { AppContext } from '../contexts/AppContext';

const Header: React.FC = () => {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    // Fix: Use AppContext to get notifications and removeNotification function.
    const { notifications, removeNotification } = useContext(AppContext);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="h-20 bg-white dark:bg-dark-secondary flex-shrink-0 flex items-center justify-end px-6 sm:px-8 border-b dark:border-gray-700">
            <div className="flex items-center space-x-6">
                <div className="relative" ref={dropdownRef}>
                    <button onClick={() => setIsNotificationsOpen(prev => !prev)} className="relative text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary">
                        <BellIcon className="w-6 h-6" />
                        {notifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                        )}
                    </button>
                    {isNotificationsOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-secondary rounded-lg shadow-xl border dark:border-gray-700 z-20">
                            <div className="p-4 font-bold border-b dark:border-gray-700">Notificações</div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map(notif => (
                                        <div key={notif.id} className="p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{notif.message}</p>
                                            <button onClick={() => removeNotification(notif.id)} className="text-xs text-blue-500 hover:underline mt-1">Marcar como lida</button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="p-4 text-sm text-gray-500">Nenhuma notificação nova.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-600">A</div>
                    <div>
                        <p className="font-semibold text-sm">Admin</p>
                        <p className="text-xs text-gray-500">admin@licensemgr.com</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
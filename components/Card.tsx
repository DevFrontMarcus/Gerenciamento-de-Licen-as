import React from 'react';

interface CardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    iconBgClass: string;
}

const Card: React.FC<CardProps> = ({ title, value, icon, iconBgClass }) => {
    return (
        <div className="bg-white dark:bg-dark-secondary rounded-xl shadow-lg p-5 flex flex-col justify-start hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBgClass}`}>
                {icon}
            </div>
            <div className="mt-4">
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{value}</p>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            </div>
        </div>
    );
};

export default Card;
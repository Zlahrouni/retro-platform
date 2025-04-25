// src/components/session/WaitingForActivity.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';

interface WaitingForActivityProps {
    showHelp?: boolean;
}

const WaitingForActivity: React.FC<WaitingForActivityProps> = ({ showHelp = true }) => {
    const { t } = useTranslation();

    return (
        <div className="bg-white rounded-lg shadow-md p-8 text-center my-6">
            <div className="flex flex-col items-center">
                {/* Animation d'attente */}
                <div className="relative w-24 h-24 mb-6">
                    {/* Cercle principal */}
                    <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>

                    {/* Cercle animé */}
                    <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>

                    {/* Icône centrale */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                </div>

                <h3 className="text-xl font-medium text-gray-800 mb-3">
                    {t('session.waitingForActivity')}
                </h3>

                {showHelp && (
                    <p className="text-gray-600 max-w-md mx-auto">
                        {t('session.waitingForActivityDescription')}
                    </p>
                )}

                <div className="mt-6 animate-pulse text-gray-500">
                    <div className="flex space-x-2 justify-center">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaitingForActivity;
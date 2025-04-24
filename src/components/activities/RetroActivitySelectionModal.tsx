// src/components/activities/RetroActivitySelectionModal.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityType, ACTIVITY_COLUMNS } from '../../types/types';

interface RetroActivitySelectionModalProps {
    onClose: () => void;
    onSelect: (type: ActivityType) => void;
}

const RetroActivitySelectionModal: React.FC<RetroActivitySelectionModalProps> = ({
                                                                                     onClose,
                                                                                     onSelect
                                                                                 }) => {
    const { t } = useTranslation();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">
                            {t('activities.selectRetroActivity')}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 focus:outline-none"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-600 mb-6">
                        {t('activities.retroSelectionDescription')}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Map through available activity types */}
                        {(Object.keys(ACTIVITY_COLUMNS) as ActivityType[]).map(activityType => (
                            <button
                                key={activityType}
                                onClick={() => onSelect(activityType)}
                                className="flex flex-col items-center p-4 border-2 border-indigo-100 hover:border-indigo-300 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors h-full"
                            >
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-center mb-2">
                                    {t(`activities.types.${activityType}`)}
                                </h3>
                                <div className="text-xs text-gray-500 w-full">
                                    {ACTIVITY_COLUMNS[activityType].map(column => (
                                        <div
                                            key={column}
                                            className="bg-white p-1 rounded mb-1 border border-gray-200 text-center"
                                        >
                                            {t(`activities.columns.${activityType}.${column}`)}
                                        </div>
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                    >
                        {t('general.cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RetroActivitySelectionModal;
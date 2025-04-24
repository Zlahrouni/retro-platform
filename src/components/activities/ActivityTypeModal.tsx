// src/components/activities/ActivityTypeModal.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';

interface ActivityTypeModalProps {
    onClose: () => void;
    onSelectIceBreaker: () => void;
    onSelectRetro: () => void;
}

const ActivityTypeModal: React.FC<ActivityTypeModalProps> = ({
                                                                 onClose,
                                                                 onSelectIceBreaker,
                                                                 onSelectRetro
                                                             }) => {
    const { t } = useTranslation();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">
                            {t('activities.selectType')}
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
                        {t('activities.typeDescription')}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Ice Breaker Button */}
                        <button
                            onClick={onSelectIceBreaker}
                            className="flex flex-col items-center p-6 border-2 border-blue-100 hover:border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-lg mb-1">
                                🔸 {t('activities.iceBreaker')}
                            </h3>
                            <p className="text-gray-500 text-sm text-center">
                                {t('activities.iceBreakerDescription')}
                            </p>
                        </button>

                        {/* Retro Activity Button */}
                        <button
                            onClick={onSelectRetro}
                            className="flex flex-col items-center p-6 border-2 border-indigo-100 hover:border-indigo-300 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
                        >
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-lg mb-1">
                                🔹 {t('activities.retroActivity')}
                            </h3>
                            <p className="text-gray-500 text-sm text-center">
                                {t('activities.retroDescription')}
                            </p>
                        </button>
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

export default ActivityTypeModal;
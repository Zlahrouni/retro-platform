// src/components/activities/IceBreakerSelectionModal.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';

interface IceBreakerSelectionModalProps {
    onClose: () => void;
    onSelect: (type: string) => void;
}

const IceBreakerSelectionModal: React.FC<IceBreakerSelectionModalProps> = ({
                                                                               onClose,
                                                                               onSelect
                                                                           }) => {
    const { t } = useTranslation();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">
                            {t('activities.selectIceBreaker')}
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
                        {t('activities.iceBreakerSelectionDescription')}
                    </p>

                    <div className="space-y-4">
                        {/* For now, only one option is available */}
                        <button
                            onClick={() => onSelect('funQuestion')}
                            className="w-full flex items-center p-4 border-2 border-blue-100 hover:border-blue-300 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">
                                    {t('activities.iceBreakerTypes.funQuestion')}
                                </h3>
                                <p className="text-gray-500 text-sm">
                                    {t('activities.iceBreakerTypes.funQuestionDescription')}
                                </p>
                            </div>
                        </button>

                        {/* Placeholder for future ice breakers (disabled) */}
                        <div className="w-full flex items-center p-4 border-2 border-gray-200 rounded-lg bg-gray-50 opacity-60 cursor-not-allowed">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mr-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-gray-400">
                                    {t('activities.comingSoon')}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    {t('activities.moreOptionsComingSoon')}
                                </p>
                            </div>
                        </div>
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

export default IceBreakerSelectionModal;
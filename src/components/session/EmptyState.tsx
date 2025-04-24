// src/components/session/EmptyState.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
    onAddActivity: () => void;
    isFirstActivity?: boolean;
}

/**
 * Composant d'état vide avec animation et style ludique
 * pour encourager l'ajout d'activités
 */
const EmptyState: React.FC<EmptyStateProps> = ({
                                                   onAddActivity,
                                                   isFirstActivity = true
                                               }) => {
    const { t } = useTranslation();

    return (
        <div className="bg-white rounded-lg shadow-md p-6 text-center mb-8 border-2 border-dashed border-blue-200">
            <div className="py-4">
                {isFirstActivity ? (
                    <>
                        {/* SVG Animation pour première activité */}
                        <div className="w-32 h-32 mx-auto mb-4 relative">
                            <div className="absolute inset-0 flex items-center justify-center animate-bounce-slow">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     className="w-20 h-20 text-blue-500" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            {/* Small fun elements */}
                            <div className="absolute top-0 right-0 animate-pulse-slow">
                                <span className="text-xl">🎯</span>
                            </div>
                            <div className="absolute bottom-0 left-0 animate-pulse-delay">
                                <span className="text-xl">💡</span>
                            </div>
                        </div>
                        <h3 className="text-lg font-medium text-gray-700 mb-2">
                            {t('session.noActivitiesYet')}
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            {t('session.addFirstActivityHelp')}
                        </p>
                    </>
                ) : (
                    <>
                        {/* SVG Animation pour activités supplémentaires */}
                        <div className="w-24 h-24 mx-auto mb-3 opacity-80">
                            <span className="text-4xl animate-pulse-slow inline-block">✨</span>
                        </div>
                        <p className="text-gray-600 mb-4">
                            {t('session.addAnotherActivity')}
                        </p>
                    </>
                )}

                <button
                    onClick={onAddActivity}
                    className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 inline-flex items-center shadow-md"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('session.addActivity')}
                </button>
            </div>
        </div>
    );
};

export default EmptyState;
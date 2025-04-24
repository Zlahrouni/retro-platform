// src/components/session/SessionControls.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SessionStatus } from '../../types/types';

interface SessionControlsProps {
    isAdmin: boolean;
    sessionStatus: SessionStatus;
    onClose: () => void;
    onPause: () => void;
    onResume: () => void;
    onShare: () => void;
}

const SessionControls: React.FC<SessionControlsProps> = ({
                                                             isAdmin,
                                                             sessionStatus,
                                                             onClose,
                                                             onPause,
                                                             onResume,
                                                             onShare
                                                         }) => {
    const { t } = useTranslation();

    return (
        <div className="flex justify-end space-x-2">
            {/* Bouton de partage (accessible à tous) */}
            <button
                className="py-2 px-4 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center"
                onClick={onShare}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935-2.186 2.25 2.25 0 0 0-3.935-2.186zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185z" />
                </svg>
                <span>{t('session.shareLink')}</span>
            </button>

            {/* Contrôles admin */}
            {isAdmin && sessionStatus !== 'closed' && (
                <>
                    {sessionStatus === 'open' ? (
                        <button
                            className="py-2 px-4 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 flex items-center"
                            onClick={onPause}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                            </svg>
                            <span>Mettre en pause</span>
                        </button>
                    ) : (
                        <button
                            className="py-2 px-4 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center"
                            onClick={onResume}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                            </svg>
                            <span>Reprendre</span>
                        </button>
                    )}

                    <button
                        className="py-2 px-4 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center"
                        onClick={onClose}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                        <span>{t('session.closeSession')}</span>
                    </button>
                </>
            )}
        </div>
    );
};

export default SessionControls;
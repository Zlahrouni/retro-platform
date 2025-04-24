// src/components/session/SessionStatusBanner.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SessionStatus } from '../../types/types';

interface SessionStatusBannerProps {
    status: SessionStatus;
    isAdmin: boolean;
}

const SessionStatusBanner: React.FC<SessionStatusBannerProps> = ({
                                                                     status,
                                                                     isAdmin
                                                                 }) => {
    const { t } = useTranslation();

    if (status === 'open') {
        return null; // Pas de bannière en mode normal (ouvert)
    }

    return (
        <div className={`p-4 rounded-md mb-6 flex items-center ${
            status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
        }`}>
            {status === 'paused' ? (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                        <p className="font-medium">Session en pause</p>
                        <p className="text-sm">
                            {isAdmin
                                ? "Vous avez mis cette session en pause. Les participants ne peuvent pas ajouter de cartes."
                                : "L'administrateur a mis cette session en pause. Vous ne pouvez pas ajouter de cartes pour le moment."}
                        </p>
                    </div>
                </>
            ) : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                        <p className="font-medium">{t('session.sessionClosed')}</p>
                        <p className="text-sm">
                            Aucune nouvelle carte ne peut être ajoutée.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

export default SessionStatusBanner;
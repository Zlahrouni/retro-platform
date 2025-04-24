// src/pages/SessionPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { userService } from '../services/userService';
import SessionControls from '../components/session/SessionControls';
import ParticipantsList from '../components/session/ParticipantsList';

const SessionPage: React.FC = () => {
    const { t } = useTranslation();
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [showShareMessage, setShowShareMessage] = useState(false);
    const [retries, setRetries] = useState(0);
    const maxRetries = 3;

    // Utiliser notre hook personnalisé
    const {
        session,
        isLoading,
        error,
        closeSession,
        pauseSession,
        resumeSession,
        isSessionCreator
    } = useSession(sessionId);

    // Vérifier si l'utilisateur a un nom au chargement
    useEffect(() => {
        if (!userService.hasUserName() && sessionId) {
            // Rediriger vers la page d'authentification si l'utilisateur n'a pas de nom
            navigate(`/auth/${sessionId}`);
        }
    }, [sessionId, navigate]);

    // Effet pour les tentatives de reconnexion
    useEffect(() => {
        if (error && retries < maxRetries) {
            const timer = setTimeout(() => {
                console.log(`Tentative de reconnexion ${retries + 1}/${maxRetries}...`);
                setRetries(prev => prev + 1);
                // Forcer un rechargement de la page pour réessayer
                window.location.reload();
            }, 3000); // 3 secondes entre les tentatives

            return () => clearTimeout(timer);
        }
    }, [error, retries, maxRetries]);

    const handleShareLink = useCallback(() => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            setShowShareMessage(true);
            setTimeout(() => setShowShareMessage(false), 2000);
        });
    }, []);

    const handleCloseSession = useCallback(async () => {
        if (window.confirm(t('session.confirmClose'))) {
            await closeSession();
        }
    }, [closeSession, t]);

    const handlePauseSession = useCallback(async () => {
        await pauseSession();
    }, [pauseSession]);

    const handleResumeSession = useCallback(async () => {
        await resumeSession();
    }, [resumeSession]);

    // Fonctions de rendu conditionnelles
    const renderLoading = () => (
        <div className="flex justify-center items-center h-64">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">{t('general.loading')}</p>
            </div>
        </div>
    );

    const renderError = () => (
        <div className="bg-red-100 p-4 rounded-md text-red-700 max-w-md mx-auto mt-8">
            <p>{error || t('session.notFound')}</p>
            {retries < maxRetries ? (
                <p className="mt-2">
                    Tentative de reconnexion {retries + 1}/{maxRetries}...
                    <span className="ml-2 inline-block">
                        <div className="animate-spin h-4 w-4 border-t-2 border-red-700 rounded-full"></div>
                    </span>
                </p>
            ) : (
                <button
                    onClick={() => navigate('/')}
                    className="mt-4 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
                >
                    {t('general.backToHome')}
                </button>
            )}
        </div>
    );

    const renderSessionContent = () => {
        if (!session) return null;

        return (
            <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center flex-wrap">
                            <span className="mr-3">Session de rétrospective</span>
                            <span className="text-sm text-gray-500 font-normal">#{sessionId}</span>
                        </h1>

                        {/* Badge et nom de l'utilisateur */}
                        <div className="flex items-center mt-2 flex-wrap gap-2">
                            {isSessionCreator && (
                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    {t('session.adminBadge')}
                                </span>
                            )}
                            {userService.hasUserName() && (
                                <div className="inline-flex items-center bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">
                                    <span className="mr-1">👤</span>
                                    {userService.getUserName()}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls for admin or participants */}
                    <div>
                        <SessionControls
                            isAdmin={isSessionCreator}
                            sessionStatus={session.status}
                            onClose={handleCloseSession}
                            onPause={handlePauseSession}
                            onResume={handleResumeSession}
                            onShare={handleShareLink}
                        />
                    </div>
                </div>

                {/* Liste des participants */}
                {sessionId && <ParticipantsList sessionId={sessionId} />}

                {/* Message de partage */}
                {showShareMessage && (
                    <div className="fixed top-4 right-4 bg-green-100 text-green-700 py-2 px-4 rounded shadow-md animate-fadeOut">
                        {t('session.copied')}
                    </div>
                )}

                {/* Interface simplifiée pour ajouter une activité */}
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                    <p className="text-lg text-gray-600 mb-4">{t('session.noActivities')}</p>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors">
                        {t('session.addActivity')}
                    </button>
                </div>
            </>
        );
    };

    // Rendu principal
    return (
        <div className="max-w-6xl mx-auto mt-4 px-4 pb-16">
            {isLoading ? renderLoading() :
                error || !session ? renderError() :
                    renderSessionContent()
            }
        </div>
    );
};

export default SessionPage;
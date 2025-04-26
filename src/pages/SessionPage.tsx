// src/pages/SessionPage.tsx - Version mise à jour avec la correction
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { useActivities } from '../hooks/useActivities';
import { userService } from '../services/userService';
import SessionControls from '../components/session/SessionControls';
import ParticipantsList from '../components/session/ParticipantsList';
import ActivityTypeModal from '../components/activities/ActivityTypeModal';
import IceBreakerSelectionModal from '../components/activities/IceBreakerSelectionModal';
import RetroActivitySelectionModal from '../components/activities/RetroActivitySelectionModal';
import AdminActivityList from '../components/session/AdminActivityList';
import WaitingForActivity from '../components/session/WaitingForActivity';
import SessionStatusBanner from '../components/session/SessionStatusBanner';
import { ActivityType } from '../types/types';
import EmptyState from "../components/session/EmptyState";

const SessionPage: React.FC = () => {
    const { t } = useTranslation();
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [showShareMessage, setShowShareMessage] = useState(false);
    const [retries, setRetries] = useState(0);
    const maxRetries = 3;

    // États pour les modals
    const [showActivityTypeModal, setShowActivityTypeModal] = useState(false);
    const [showIceBreakerModal, setShowIceBreakerModal] = useState(false);
    const [showRetroModal, setShowRetroModal] = useState(false);

    // Utiliser notre hook personnalisé pour la session
    const {
        session,
        isLoading: sessionLoading,
        error: sessionError,
        closeSession,
        pauseSession,
        resumeSession,
        isSessionCreator,
        setCurrentActivity // Fonction pour mettre à jour l'activité courante
    } = useSession(sessionId);

    // Vérifier si l'utilisateur a un nom au chargement
    useEffect(() => {
        if (!userService.hasUserName() && sessionId) {
            // Rediriger vers la page d'authentification si l'utilisateur n'a pas de nom
            console.log("Redirection vers la page d'authentification: utilisateur sans nom");
            navigate(`/auth/${sessionId}`);
        }
    }, [sessionId, navigate]);

    // Effet pour rediriger si une activité courante est détectée
    useEffect(() => {
        if (session && session.currentActivityId) {
            console.log(`✅ Redirection vers l'activité: ${session.currentActivityId}`);

            // Ajouter un délai pour s'assurer que les logs apparaissent avant la redirection
            const redirectTimeout = setTimeout(() => {
                navigate(`/session/${sessionId}/activity/${session.currentActivityId}`);
            }, 100);

            // Nettoyer le timeout si le composant est démonté
            return () => clearTimeout(redirectTimeout);
        }
    }, [session, sessionId, navigate]);

    // Utiliser notre hook pour les activités
    const {
        activities: firestoreActivities,
        isLoading: activitiesLoading,
        error: activitiesError,
        addActivity,
        launchActivity,
        deleteActivity,
        hasLaunchedRetroActivity,
        getLaunchedRetroActivity
    } = useActivities(sessionId, isSessionCreator);

    // État combiné de chargement
    const isLoading = sessionLoading || activitiesLoading;
    const error = sessionError || activitiesError;

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

    // Nouvelles fonctions pour la gestion des activités
    const handleAddActivityClick = useCallback(() => {
        setShowActivityTypeModal(true);
    }, []);

    const handleSelectIceBreaker = useCallback(() => {
        setShowActivityTypeModal(false);
        setShowIceBreakerModal(true);
    }, []);

    const handleSelectRetro = useCallback(() => {
        setShowActivityTypeModal(false);
        setShowRetroModal(true);
    }, []);

    const handleIceBreakerSelected = useCallback((type: string) => {
        setShowIceBreakerModal(false);

        // Utiliser le hook pour ajouter l'activité à Firestore
        if (userService.hasUserName()) {
            const userName = userService.getUserName();
            addActivity('iceBreaker', userName, type);
        }
    }, [addActivity]);

    const handleRetroActivitySelected = useCallback((type: ActivityType) => {
        setShowRetroModal(false);

        // Utiliser le hook pour ajouter l'activité à Firestore
        if (userService.hasUserName()) {
            const userName = userService.getUserName();
            addActivity(type, userName);
        }
    }, [addActivity]);

    // CORRECTION: Amélioration de la fonction pour lancer une activité
    const handleLaunchActivity = useCallback(async (activityId: string) => {
        if (!isSessionCreator || !sessionId) return;

        try {
            console.log(`Lancement de l'activité ${activityId}`);

            // Étape 1: Lancer l'activité (la rendre visible pour tous)
            const launchSuccess = await launchActivity(activityId);

            if (launchSuccess) {
                console.log(`Activité ${activityId} lancée avec succès`);

                // Étape 2: Définir cette activité comme l'activité courante de la session
                console.log(`Définition de l'activité ${activityId} comme activité courante de la session ${sessionId}`);
                const updateSuccess = await setCurrentActivity(activityId);

                if (updateSuccess) {
                    console.log(`Activité courante mise à jour avec succès dans Firebase, redirection imminente...`);
                    // La redirection se fera automatiquement via l'useEffect qui surveille session.currentActivityId
                } else {
                    console.error("Erreur: Impossible de mettre à jour l'activité courante dans Firebase");
                }
            } else {
                console.error("Erreur: Impossible de lancer l'activité");
            }
        } catch (err) {
            console.error("Erreur lors du lancement de l'activité:", err);
        }
    }, [isSessionCreator, sessionId, launchActivity, setCurrentActivity]);

    const handleDeleteActivity = useCallback(async (activityId: string) => {
        if (!isSessionCreator) return;

        if (window.confirm(t('activities.confirmDelete'))) {
            await deleteActivity(activityId);
        }
    }, [isSessionCreator, deleteActivity, t]);

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

    const renderAdminView = () => {
        return (
            <>
                {/* Liste des activités pour l'admin avec contrôles */}
                {firestoreActivities.length > 0 ? (
                    <AdminActivityList
                        activities={firestoreActivities}
                        onLaunchActivity={handleLaunchActivity}
                        onDeleteActivity={handleDeleteActivity}
                    />
                ) : (
                    <EmptyState
                        onAddActivity={handleAddActivityClick}
                        isFirstActivity={true}
                    />
                )}

                {/* Interface pour ajouter une activité si session non fermée */}
                {session && session.status !== 'closed' && firestoreActivities.length > 0 && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={handleAddActivityClick}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {t('session.addActivity')}
                        </button>
                    </div>
                )}
            </>
        );
    };

    const renderParticipantView = () => {
        // Vérifier s'il y a une activité de rétro lancée
        const hasActiveRetro = hasLaunchedRetroActivity();

        if (hasActiveRetro) {
            // Si une activité est lancée, on affichera l'activité
            const activeActivity = getLaunchedRetroActivity();
            return (
                <div className="mb-6">
                    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border-l-4 border-green-500">
                        <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="font-medium text-lg text-gray-800">
                                {t('activities.activeRetro')}: {activeActivity && t(`activities.types.${activeActivity.type}`)}
                            </h3>
                        </div>
                        <p className="mt-2 text-gray-600">
                            {t('activities.activeRetroDescription')}
                        </p>
                    </div>

                    {/* Ici, on intégrerait les colonnes pour l'activité en cours */}
                    {/* Ce code sera implémenté dans une partie future */}
                </div>
            );
        } else {
            // Sinon, afficher l'écran d'attente
            return <WaitingForActivity />;
        }
    };

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

                {/* Session status banner (if paused or closed) */}
                {session.status !== 'open' && (
                    <SessionStatusBanner
                        status={session.status}
                        isAdmin={isSessionCreator}
                    />
                )}

                {/* Liste des participants */}
                {sessionId && <ParticipantsList sessionId={sessionId} />}

                {/* Vue différente selon que l'utilisateur est admin ou non */}
                {isSessionCreator ? renderAdminView() : renderParticipantView()}

                {/* Message de partage */}
                {showShareMessage && (
                    <div className="fixed top-4 right-4 bg-green-100 text-green-700 py-2 px-4 rounded shadow-md animate-fadeOut">
                        {t('session.copied')}
                    </div>
                )}

                {/* Modals for activity selection */}
                {showActivityTypeModal && (
                    <ActivityTypeModal
                        onClose={() => setShowActivityTypeModal(false)}
                        onSelectIceBreaker={handleSelectIceBreaker}
                        onSelectRetro={handleSelectRetro}
                    />
                )}

                {showIceBreakerModal && (
                    <IceBreakerSelectionModal
                        onClose={() => setShowIceBreakerModal(false)}
                        onSelect={handleIceBreakerSelected}
                    />
                )}

                {showRetroModal && (
                    <RetroActivitySelectionModal
                        onClose={() => setShowRetroModal(false)}
                        onSelect={handleRetroActivitySelected}
                    />
                )}
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
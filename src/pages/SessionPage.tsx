// src/pages/SessionPage.tsx
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
import { ActivityType, ColumnType } from '../types/types';
import EmptyState from "../components/session/EmptyState";
import InteractiveBoard from "../components/InteractiveBoard";
import { ActivityData } from '../services/activitiesService';
import ParticipantCircles from "../components/session/ParticipantCircles";
import ConfirmationModal from '../components/commons/ConfirmationModal';


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

    // État pour le mode plein écran
    const [isFullscreen, setIsFullscreen] = useState(false);

    // État pour le filtrage par utilisateur
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    // État pour suivre le lancement d'une activité
    const [isLaunching, setIsLaunching] = useState(false);

    // État pour l'activité courante
    const [currentActivity, setCurrentActivity] = useState<ActivityData | null>(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeletingSession, setIsDeletingSession] = useState(false);

    // Utiliser notre hook personnalisé pour la session
    const {
        session,
        cards,
        isLoading: sessionLoading,
        error: sessionError,
        closeSession,
        pauseSession,
        resumeSession,
        isSessionCreator,
        setCurrentActivity: setSessionCurrentActivity,
        addCard
    } = useSession(sessionId);

    // Utiliser notre hook pour les activités
    const {
        activities,
        isLoading: activitiesLoading,
        error: activitiesError,
        addActivity,
        launchActivity,
        deleteActivity,
        completeActivity,
        hasLaunchedRetroActivity,
        getLaunchedRetroActivity
    } = useActivities(sessionId, isSessionCreator);

    // État combiné de chargement
    const isLoading = sessionLoading || activitiesLoading;
    const error = sessionError || activitiesError;

    // Vérifier si l'utilisateur a un nom au chargement
    useEffect(() => {
        if (!userService.hasUserName() && sessionId) {
            // Rediriger vers la page d'authentification si l'utilisateur n'a pas de nom
            navigate(`/auth/${sessionId}`);
        }
    }, [sessionId, navigate]);

    // Ajouter des écouteurs pour le mode plein écran
    useEffect(() => {
        // Gérer la touche Escape pour quitter le mode plein écran
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Désactiver le défilement du body en mode plein écran
        if (isFullscreen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isFullscreen]);

    // Effect pour suivre l'activité courante basée sur currentActivityId
    useEffect(() => {
        if (session?.currentActivityId && activities.length > 0) {
            const activity = activities.find(act => act.id === session.currentActivityId);
            if (activity) {
                console.log("Activité courante trouvée:", activity);
                setCurrentActivity(activity);
            } else {
                console.log("Activité introuvable pour ID:", session.currentActivityId);
            }
        } else if (!session?.currentActivityId) {
            // Réinitialiser l'activité courante si aucune n'est définie
            setCurrentActivity(null);
        }
    }, [session?.currentActivityId, activities]);

    // Debug session and activities state
    useEffect(() => {
        if (session) {
            console.log("📋 Session state:", {
                id: session.id,
                status: session.status,
                currentActivityId: session.currentActivityId
            });
        }

        if (activities.length > 0) {
            console.log("📋 Activities array:", activities.map(a => ({
                id: a.id,
                type: a.type,
                status: a.status,
                launched: a.launched
            })));
        }
    }, [session, activities]);

    // Effet pour les tentatives de reconnexion
    useEffect(() => {
        if (error && retries < maxRetries) {
            const timer = setTimeout(() => {
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


    const handleCloseSession = useCallback(() => {
        // Ouvrir le modal de confirmation au lieu d'utiliser window.confirm
        setShowDeleteModal(true);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        try {
            // Marquer comme en cours de suppression
            setIsDeletingSession(true);

            // Appeler le service pour fermer et supprimer la session
            await closeSession();

            // Rediriger vers la page d'accueil après suppression
            navigate('/');
        } catch (error) {
            console.error("Erreur lors de la suppression de la session:", error);
            // Réinitialiser l'état même en cas d'erreur
            setIsDeletingSession(false);
            setShowDeleteModal(false);

            // Afficher un message d'erreur
            alert(t('session.deleteError'));
        }
    }, [closeSession, navigate, t]);

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

    // Fonction améliorée pour lancer une activité
    const handleLaunchActivity = useCallback(async (activityId: string) => {
        if (!isSessionCreator || !sessionId) return;

        try {
            console.log(`🔴 LAUNCHING ACTIVITY ${activityId}`);

            // Add a loading state to prevent multiple clicks
            setIsLaunching(true);

            // Step 1: Launch the activity (make it visible to everyone)
            console.log(`Step 1: Launching activity in Firebase...`);
            const launchSuccess = await launchActivity(activityId);

            if (launchSuccess) {
                console.log(`✅ Activity ${activityId} launched successfully`);

                // Step 2: Set this activity as the current activity of the session
                console.log(`Step 2: Setting activity ${activityId} as current activity...`);
                const updateSuccess = await setSessionCurrentActivity(activityId);

                if (updateSuccess) {
                    console.log(`✅ Current activity updated successfully in Firebase`);
                } else {
                    console.error("❌ Error: Failed to update current activity in Firebase");
                }
            } else {
                console.error("❌ Error: Failed to launch activity");
                alert("Error launching activity. Please try again.");
            }
        } catch (err) {
            console.error("❌ Error launching activity:", err);
            alert("An error occurred while launching the activity.");
        } finally {
            setIsLaunching(false);
        }
    }, [isSessionCreator, sessionId, launchActivity, setSessionCurrentActivity]);

    // Fonction pour terminer une activité (remplace la redirection)
    const handleCompleteActivity = useCallback(async () => {
        if (!isSessionCreator || !session?.currentActivityId) return;

        try {
            console.log(`Completing activity ${session.currentActivityId}`);

            // Terminer l'activité
            const success = await completeActivity(session.currentActivityId);

            if (success) {
                // Réinitialiser currentActivityId dans la session
                await setSessionCurrentActivity(null);
                console.log("Activity completed and removed from session");

                // Quitter le mode plein écran si actif
                if (isFullscreen) {
                    setIsFullscreen(false);
                }
            } else {
                console.error("Failed to complete activity");
            }
        } catch (err) {
            console.error("Error completing activity:", err);
        }
    }, [isSessionCreator, session?.currentActivityId, completeActivity, setSessionCurrentActivity, isFullscreen]);

    const handleDeleteActivity = useCallback(async (activityId: string) => {
        if (!isSessionCreator) return;

        if (window.confirm(t('activities.confirmDelete'))) {
            await deleteActivity(activityId);
        }
    }, [isSessionCreator, deleteActivity, t]);

    // Fonction pour ajouter une carte au tableau
    const handleAddCard = async (text: string, columnType: ColumnType) => {
        try {
            console.log(`Adding card to ${columnType} column: "${text.substring(0, 20)}..."`);
            await addCard(text, columnType);
        } catch (error) {
            console.error("Error adding card:", error);
        }
    };

    // Toggle fullscreen mode
    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
        // Réinitialiser la sélection d'utilisateur lors du changement de mode
        setSelectedUser(null);
    };

    // Sélectionner un utilisateur pour le filtrage
    const handleSelectUser = (username: string | null) => {
        setSelectedUser(username);
    };

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
                {activities.length > 0 ? (
                    <AdminActivityList
                        activities={activities}
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
                {session && session.status !== 'closed' && activities.length > 0 && (
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
                </div>
            );
        } else {
            // Sinon, afficher l'écran d'attente
            return <WaitingForActivity />;
        }
    };

    // Nouveau rendu pour le tableau interactif
    const renderBoard = () => {
        if (!currentActivity || !sessionId) return null;

        // Determine si les cartes peuvent être ajoutées
        const isReadOnly = session?.status === 'closed' || session?.status === 'paused';

        return (
            <div className={`transition-all duration-300 ${
                isFullscreen
                    ? 'fixed inset-0 z-50 bg-gray-100 p-6 overflow-auto flex flex-col'
                    : 'relative'
            }`}>
                {/* Overlay pour sortir du mode plein écran en mode mobile */}
                {isFullscreen && (
                    <div className="absolute top-2 right-2 z-10 md:hidden">
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 rounded-full bg-white shadow-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Quitter le plein écran"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Controls for admin and fullscreen header */}
                <div className={`${isFullscreen ? 'mb-6' : 'mb-4'} flex flex-wrap justify-between items-center`}>
                    <div className="flex items-center">
                        <h2 className={`${isFullscreen ? 'text-2xl' : 'text-xl'} font-bold text-gray-800`}>
                            {t(`activities.types.${currentActivity.type}`)}
                        </h2>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
                            aria-label={isFullscreen ? "Quitter le plein écran" : "Mode plein écran"}
                        >
                            {isFullscreen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                                </svg>
                            )}
                        </button>

                        {isSessionCreator && (
                            <button
                                onClick={handleCompleteActivity}
                                className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {t('activities.completeActivity')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Affichage des participants en cercles avec filtrage */}
                {isFullscreen && (
                    <div className="mb-6">
                        <ParticipantCircles
                            sessionId={sessionId}
                            isFullscreen={true}
                            selectedUser={selectedUser}
                            onSelectUser={handleSelectUser}
                        />
                    </div>
                )}

                {/* Board Component - utilisation de la prop isFullscreen */}
                <div className={`${isFullscreen ? 'flex-grow' : ''}`}>
                    <InteractiveBoard
                        activityType={currentActivity.type as ActivityType | 'iceBreaker'}
                        cards={session?.status !== 'closed' ? cards : []}
                        onAddCard={handleAddCard}
                        isReadOnly={isReadOnly}
                        isAdmin={isSessionCreator}
                        sessionId={sessionId}
                        isFullscreen={isFullscreen}
                        selectedAuthor={selectedUser}
                    />
                </div>
            </div>
        );
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

                {/* Conditional rendering based on currentActivity */}
                {currentActivity ? (
                    // Mode tableau interactif
                    renderBoard()
                ) : (
                    // Mode session normale
                    <>
                        {/* Liste des participants */}
                        {sessionId && <ParticipantsList sessionId={sessionId} />}

                        {/* Vue différente selon que l'utilisateur est admin ou non */}
                        {isSessionCreator ? renderAdminView() : renderParticipantView()}
                    </>
                )}

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
        <div className={`max-w-6xl mx-auto mt-4 px-4 pb-16 ${isFullscreen ? 'hidden' : ''}`}>
            {isLoading ? renderLoading() :
                error || !session ? renderError() :
                    renderSessionContent()
            }
            {showDeleteModal && (
                <ConfirmationModal
                    isOpen={showDeleteModal}
                    title={t('session.closeSession')}
                    message={t('session.confirmCloseWarning')}
                    confirmText={t('general.confirm')}
                    cancelText={t('general.cancel')}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setShowDeleteModal(false)}
                    type="danger"
                    isLoading={isDeletingSession}
                />
            )}
        </div>
    );
};

export default SessionPage;
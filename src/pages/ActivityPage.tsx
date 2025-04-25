// src/pages/ActivityPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '../hooks/useSession';
import { useActivities } from '../hooks/useActivities';
import { userService } from '../services/userService';
import { ActivityData } from '../services/activitiesService';
import { ActivityType, ACTIVITY_COLUMNS, ColumnType } from '../types/types';
import SessionControls from '../components/session/SessionControls';
import ParticipantsList from '../components/session/ParticipantsList';

const ActivityPage: React.FC = () => {
    const { t } = useTranslation();
    const { sessionId, activityId } = useParams<{ sessionId: string, activityId: string }>();
    const navigate = useNavigate();

    // États locaux
    const [showShareMessage, setShowShareMessage] = useState(false);
    const [currentActivity, setCurrentActivity] = useState<ActivityData | null>(null);

    // Récupérer les données de session
    const {
        session,
        isLoading: sessionLoading,
        error: sessionError,
        closeSession,
        pauseSession,
        resumeSession,
        isSessionCreator,
        setCurrentActivity: setSessionCurrentActivity
    } = useSession(sessionId);

    // Récupérer les activités
    const {
        activities,
        isLoading: activitiesLoading,
        error: activitiesError,
        addActivity,
        launchActivity,
        completeActivity,
        deleteActivity
    } = useActivities(sessionId, isSessionCreator);

    // État combiné de chargement
    const isLoading = sessionLoading || activitiesLoading;
    const error = sessionError || activitiesError;

    // Effet pour vérifier le nom d'utilisateur
    useEffect(() => {
        if (!userService.hasUserName() && sessionId) {
            navigate(`/auth/${sessionId}`);
        }
    }, [sessionId, navigate]);

    // Effet pour récupérer l'activité courante
    useEffect(() => {
        if (activities.length > 0 && activityId) {
            const activity = activities.find(act => act.id === activityId);
            if (activity) {
                setCurrentActivity(activity);
            } else {
                // Redirection si l'activité n'est pas trouvée
                navigate(`/session/${sessionId}`);
            }
        }
    }, [activities, activityId, sessionId, navigate]);

    // Vérifier que l'activité courante de la session correspond toujours à activityId
    useEffect(() => {
        if (session && session.currentActivityId !== activityId) {
            if (session.currentActivityId) {
                // Redirection vers la nouvelle activité
                navigate(`/session/${sessionId}/activity/${session.currentActivityId}`);
            } else {
                // Redirection vers la page de session si aucune activité n'est active
                navigate(`/session/${sessionId}`);
            }
        }
    }, [session, sessionId, activityId, navigate]);

    // Fonction pour terminer l'activité
    const handleCompleteActivity = async () => {
        if (activityId && isSessionCreator) {
            await completeActivity(activityId);
            // Remettre currentActivityId à null dans la session
            await setSessionCurrentActivity(null);
            // Redirection vers la page de session
            navigate(`/session/${sessionId}`);
        }
    };

    // Fonction pour partager le lien
    const handleShareLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            setShowShareMessage(true);
            setTimeout(() => setShowShareMessage(false), 2000);
        });
    };

    // Rendu conditionnel pour le chargement
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">{t('general.loading')}</p>
                </div>
            </div>
        );
    }

    // Rendu conditionnel pour les erreurs
    if (error || !session || !currentActivity) {
        return (
            <div className="bg-red-100 p-4 rounded-md text-red-700 max-w-md mx-auto mt-8">
                <p>{error || t('session.notFound')}</p>
                <button
                    onClick={() => navigate(`/session/${sessionId}`)}
                    className="mt-4 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
                >
                    {t('general.backToSession')}
                </button>
            </div>
        );
    }

    // Fonction pour obtenir le nom d'une activité
    const getActivityName = (type: ActivityType | 'iceBreaker') => {
        if (type === 'iceBreaker') return t('activities.iceBreaker');
        return t(`activities.types.${type}`);
    };

    // Fonction pour récupérer les colonnes d'une activité
    const getActivityColumns = (type: ActivityType | 'iceBreaker'): ColumnType[] => {
        if (type === 'iceBreaker' || !Object.keys(ACTIVITY_COLUMNS).includes(type)) {
            return [];
        }
        return ACTIVITY_COLUMNS[type as ActivityType];
    };

    return (
        <div className="max-w-6xl mx-auto mt-4 px-4 pb-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center flex-wrap">
                        <span className="mr-3">{getActivityName(currentActivity.type)}</span>
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
                        onClose={closeSession}
                        onPause={pauseSession}
                        onResume={resumeSession}
                        onShare={handleShareLink}
                    />

                    {/* Bouton pour terminer l'activité (admin seulement) */}
                    {isSessionCreator && (
                        <button
                            onClick={handleCompleteActivity}
                            className="ml-2 py-2 px-4 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Terminer l'activité
                        </button>
                    )}
                </div>
            </div>

            {/* Liste des participants */}
            {sessionId && <ParticipantsList sessionId={sessionId} />}

            {/* Contenu de l'activité */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">
                    {getActivityName(currentActivity.type)}
                </h2>

                {/* Ici, vous pouvez afficher les colonnes et les fonctionnalités spécifiques à chaque type d'activité */}
                {currentActivity.type !== 'iceBreaker' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getActivityColumns(currentActivity.type).map(column => (
                            <div key={column} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="font-medium mb-3 text-center">
                                    {t(`activities.columns.${currentActivity.type}.${column}`)}
                                </h3>
                                {/* Ici, vous afficherez les cartes et le formulaire d'ajout */}
                                <p className="text-gray-500 text-center py-4">
                                    {t('session.noCards')}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-lg">
                            Ice Breaker: {currentActivity.iceBreakerType === 'funQuestion' ?
                            t('activities.iceBreakerTypes.funQuestion') :
                            t('activities.iceBreaker')}
                        </p>
                        {/* Contenu spécifique à l'ice breaker */}
                    </div>
                )}
            </div>

            {/* Message de partage */}
            {showShareMessage && (
                <div className="fixed top-4 right-4 bg-green-100 text-green-700 py-2 px-4 rounded shadow-md animate-fadeOut">
                    {t('session.copied')}
                </div>
            )}
        </div>
    );
};

export default ActivityPage;
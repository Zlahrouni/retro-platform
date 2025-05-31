// src/pages/ActivityPage.tsx
import React, {useState, useEffect, useCallback} from 'react';
import {useParams, useNavigate, useLocation} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSession } from '../hooks/useSession';
import { useActivities } from '../hooks/useActivities';
import { userService } from '../services/userService';
import { ActivityData } from '../services/activitiesService';
import { ActivityType, ColumnType } from '../types/types';
import SessionControls from '../components/session/SessionControls';
import ParticipantsList from '../components/session/ParticipantsList';
import SessionStatusBanner from '../components/session/SessionStatusBanner';
import InteractiveBoard from '../components/InteractiveBoard';
import Button from '../components/commons/Button';
import {toast} from "react-toastify";
import ConfirmationModal from "../components/commons/ConfirmationModal";

const ActivityPage: React.FC = () => {
    const { t } = useTranslation();
    const { sessionId, activityId } = useParams<{ sessionId: string, activityId: string }>();
    const navigate = useNavigate();
    const [directAccess, setDirectAccess] = useState(true);

    // States
    const [showShareMessage, setShowShareMessage] = useState(false);
    const [currentActivity, setCurrentActivity] = useState<ActivityData | null>(null);
    const [loadingAttempts, setLoadingAttempts] = useState(0);
    const maxLoadingAttempts = 5;

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [redirectBackAttempted, setRedirectBackAttempted] = useState(false);
    const location = useLocation();
    const fromLaunch = location.state?.fromLaunch;
    const bypassCheck = location.state?.bypassCheck;

    const [showCompleteActivityModal, setShowCompleteActivityModal] = useState(false);
    const [isCompletingActivity, setIsCompletingActivity] = useState(false);
    const [showNavigationModal, setShowNavigationModal] = useState(false);

    const openCompleteActivityModal = useCallback(() => {
        setShowCompleteActivityModal(true);
    }, []);
    // Get session data
    const {
        session,
        cards,
        isLoading: sessionLoading,
        error: sessionError,
        closeSession,
        pauseSession,
        resumeSession,
        isSessionCreator,
        addCard,
        setCurrentActivity: setSessionCurrentActivity
    } = useSession(sessionId);

    // Get activities
    const {
        activities,
        isLoading: activitiesLoading,
        error: activitiesError,
        completeActivity
    } = useActivities(sessionId, isSessionCreator);

    // Combined loading state
    const isLoading = sessionLoading || activitiesLoading;
    const error = sessionError || activitiesError;

    useEffect(() => {
        if (directAccess && activityId && !currentActivity && !activitiesLoading) {
            console.log(`⚠️ Direct access detected to activity ${activityId}`);

            // Find the activity in the activities array
            const activity = activities.find(act => act.id === activityId);

            if (activity) {
                console.log(`✅ Activity found on direct access:`, activity);
                setCurrentActivity(activity);
                setDirectAccess(false); // Reset the flag
                setIsInitialLoading(false);

                // IMPORTANT: If this is a valid activity, make sure it's set as current in session
                if (session && session.currentActivityId !== activityId && isSessionCreator) {
                    console.log("Updating session's currentActivityId to match URL");
                    setSessionCurrentActivity(activityId);
                }
            } else if (activities.length > 0 && loadingAttempts >= 2) {
                console.log(`❌ Activity ${activityId} not found in ${activities.length} activities`);

                // Only redirect to session if we've tried multiple times and the current activity is different
                if (session?.currentActivityId && session.currentActivityId !== activityId) {
                    console.log(`Session has a different current activity: ${session.currentActivityId}`);
                    navigate(`/session/${sessionId}/activity/${session.currentActivityId}`, { replace: true });
                } else {
                    console.log(`Redirecting to session after ${loadingAttempts} attempts`);
                    navigate(`/session/${sessionId}`, { replace: true });
                }
            } else {
                // Increment the counter for the next attempt
                setLoadingAttempts(prev => prev + 1);
            }
        } else if (!directAccess || activitiesLoading === false) {
            // If we're done with direct access or activity loading
            setIsInitialLoading(false);
        }
    }, [directAccess, activityId, currentActivity, activities, activitiesLoading,
        sessionId, navigate, loadingAttempts, session, isSessionCreator, setSessionCurrentActivity]);

    // Check for username
    useEffect(() => {
        if (!userService.hasUserName() && sessionId) {
            console.log("Redirection: User has no name");
            navigate(`/auth/${sessionId}`);
        }
    }, [sessionId, navigate]);

    // Log activity information when component mounts
    useEffect(() => {
        console.log(`ActivityPage: Mounted with sessionId: ${sessionId}, activityId: ${activityId}`);

        if (activities.length > 0) {
            console.log(`Activities loaded: ${activities.length}`);
            console.log("Activity IDs:", activities.map(a => a.id).join(", "));
        } else {
            console.log("No activities loaded yet");
        }
    }, [sessionId, activityId, activities]);

    // Get current activity from activities list
    useEffect(() => {
        console.log(`Looking for activity ${activityId} in ${activities.length} activities`);

        if (activities.length > 0 && activityId) {
            const activity = activities.find(act => act.id === activityId);

            if (activity) {
                console.log(`Activity found:`, {
                    id: activity.id,
                    type: activity.type,
                    status: activity.status
                });
                setCurrentActivity(activity);
                setLoadingAttempts(0); // Reset attempt counter when activity is found
            } else {
                console.error(`Activity ${activityId} not found in activities array`);

                // Increment loading attempts
                setLoadingAttempts(prev => prev + 1);
            }
        } else if (activities.length === 0 && activityId && !activitiesLoading) {
            // Increment loading attempts if activities are empty
            setLoadingAttempts(prev => prev + 1);
        }
    }, [activities, activityId, activitiesLoading]);

    // Handle loading attempts timeout
    useEffect(() => {
        if (loadingAttempts >= maxLoadingAttempts && !currentActivity) {
            console.error(`Failed to find activity after ${maxLoadingAttempts} attempts`);
            console.log("Redirecting to session page");
            navigate(`/session/${sessionId}`);
        }
    }, [loadingAttempts, currentActivity, sessionId, navigate, maxLoadingAttempts]);

    // Check if current activity still matches
    useEffect(() => {
        // if redirect already attempted, or if we're bypassing checks
        if (isInitialLoading || redirectBackAttempted || fromLaunch || bypassCheck) {
            console.log("Skipping redirect check - initial loading, already attempted, from launch, or bypass flag set");
            return;
        }

        // Skip checks if we don't have session data yet
        if (!session) return;

        // Don't check until we've given Firebase time to update
        const hasCompleteSyncedData =
            session &&
            !sessionLoading &&
            !activitiesLoading &&
            activities.length > 0;

        if (!hasCompleteSyncedData) {
            console.log("Waiting for complete data sync before checking redirects");
            return;
        }

        if (session && activityId) {
            console.log(`Current activity in session: ${session.currentActivityId}, URL activityId: ${activityId}`);

            // IMPORTANT: Check if activityId is valid (exists in activities list)
            const activityExists = activities.some(a => a.id === activityId);

            // Only redirect if:
            // 1. The session has a different currentActivityId than URL
            // 2. We haven't already attempted a redirect
            // 3. The current URL activity doesn't exist OR the session has a different currentActivityId
            if (session.currentActivityId !== activityId &&
                !redirectBackAttempted &&
                (!activityExists || session.currentActivityId)) {

                console.log("Redirect condition met - marking redirect as attempted");
                setRedirectBackAttempted(true);

                // We have another activity to go to
                if (session.currentActivityId) {
                    const newActivityExists = activities.some(a => a.id === session.currentActivityId);

                    if (newActivityExists) {
                        console.log(`Redirecting to new activity: ${session.currentActivityId}`);
                        navigate(`/session/${sessionId}/activity/${session.currentActivityId}`, {
                            replace: true // Use replace to avoid browser history buildup
                        });
                        return;
                    }
                }

                // If we get here - either the session has no current activity or the activity doesn't exist
                console.log("No valid current activity in session, waiting before redirecting...");

                // Add a much longer delay to prevent rapid navigation loops
                setTimeout(() => {
                    if (!session.currentActivityId) {
                        console.log("Still no current activity, redirecting to session page");
                        navigate(`/session/${sessionId}`, { replace: true });
                    }
                }, 3000); // Use 3 seconds instead of 1.5
            } else if (session.currentActivityId === activityId) {
                // This is good - we're on the right activity page!
                console.log("URL activity matches session currentActivityId - staying on page");
            }
        }
    }, [session, sessionId, activityId, navigate, isInitialLoading, redirectBackAttempted,
        fromLaunch, activities, sessionLoading, activitiesLoading]);

    // Handle card addition
    const handleAddCard = async (text: string, columnType: ColumnType) => {
        try {
            console.log(`Adding card to ${columnType} column: "${text.substring(0, 20)}..."`);
            await addCard(text, columnType);
        } catch (error) {
            console.error("Error adding card:", error);
        }
    };

    // Complete activity function
    const handleCompleteActivity = useCallback(async () => {
        if (!isSessionCreator || !session?.currentActivityId) return;

        setIsCompletingActivity(true);

        try {
            console.log(`Completing activity ${session.currentActivityId}`);

            // Terminer l'activité
            const success = await completeActivity(session.currentActivityId);

            if (success) {
                // Réinitialiser currentActivityId dans la session
                await setSessionCurrentActivity(null);
                console.log("Activity completed and removed from session");

                // CHANGEMENT: Ne plus rediriger automatiquement
                // Afficher un message de succès à la place
                toast.success("Activité terminée avec succès");
                setShowCompleteActivityModal(false);

                // Remplacer la modale de navigation par une nouvelle modale de retour
                setShowNavigationModal(true);
            } else {
                console.error("Failed to complete activity");
                toast.error("Erreur lors de la complétion de l'activité");
            }
        } catch (err) {
            console.error("Error completing activity:", err);
            toast.error("Erreur lors de la complétion de l'activité");
        } finally {
            setIsCompletingActivity(false);
        }
    }, [isSessionCreator, session?.currentActivityId, completeActivity, setSessionCurrentActivity]);

    const handleReturnToSession = () => {
        setShowNavigationModal(false);
        navigate(`/session/${sessionId}`);
    };

    const handleStayOnActivity = () => {
        setShowNavigationModal(false);
    };

    // Share link function
    const handleShareLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            setShowShareMessage(true);
            setTimeout(() => setShowShareMessage(false), 2000);
        });
    };

    // Loading state
    if (isLoading || (!currentActivity && loadingAttempts < maxLoadingAttempts)) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">{t('general.loading')}</p>
                    {loadingAttempts > 0 && (
                        <p className="mt-2 text-sm text-gray-500">
                            Tentative {loadingAttempts}/{maxLoadingAttempts}...
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Error state
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

    // Determine if cards can be added
    const isReadOnly = session.status === 'closed' || session.status === 'paused';

    return (
        <div className="max-w-6xl mx-auto mt-4 px-4 pb-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center flex-wrap">
                        <span className="mr-3">{t(`activities.types.${currentActivity.type}`)}</span>
                        <span className="text-sm text-gray-500 font-normal">#{sessionId}</span>
                    </h1>

                    {/* User badges */}
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

                <div className="flex flex-wrap gap-2">
                    {/* Session controls */}
                    <SessionControls
                        isAdmin={isSessionCreator}
                        sessionStatus={session.status}
                        onClose={closeSession}
                        onPause={pauseSession}
                        onResume={resumeSession}
                        onShare={handleShareLink}
                    />

                    {/* Complete activity button (admin only) */}
                    {isSessionCreator && (
                        <div className="flex space-x-2">
                            <Button
                                variant="secondary"
                                onClick={() => navigate(`/session/${sessionId}`)}
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                }
                                className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                            >
                                Retour à la session
                            </Button>

                            {/* Bouton Terminer désactivé temporairement pour les admins */}
                            {isSessionCreator && (
                                <Button
                                    variant="success"
                                    onClick={openCompleteActivityModal}
                                    icon={
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    }
                                    className="p-2 opacity-50"
                                    disabled={true} // Temporairement désactivé
                                >
                                    {t('activities.completeActivity')}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Session status banner */}
            {session.status !== 'open' && (
                <SessionStatusBanner
                    status={session.status}
                    isAdmin={isSessionCreator}
                />
            )}

            {/* Participants list */}
            {sessionId && <ParticipantsList sessionId={sessionId} />}

            {/* Interactive board component */}
            <InteractiveBoard
                activityType={currentActivity.type as ActivityType | 'iceBreaker'}
                cards={cards}
                onAddCard={handleAddCard}
                isReadOnly={isReadOnly}
                isAdmin={isSessionCreator}
            />

            {/* Share message */}
            {showShareMessage && (
                <div className="fixed top-4 right-4 bg-green-100 text-green-700 py-2 px-4 rounded shadow-md animate-fadeOut">
                    {t('session.copied')}
                </div>
            )}

            {showCompleteActivityModal && (
                <ConfirmationModal
                    isOpen={showCompleteActivityModal}
                    title="Terminer l'activité"
                    message="Êtes-vous sûr de vouloir terminer cette activité ? L'activité sera marquée comme terminée pour tous les participants."
                    confirmText="Terminer l'activité"
                    cancelText="Annuler"
                    onConfirm={handleCompleteActivity}
                    onCancel={() => setShowCompleteActivityModal(false)}
                    type="warning"
                    isLoading={isCompletingActivity}
                />
            )}

        </div>
    );
};

export default ActivityPage;
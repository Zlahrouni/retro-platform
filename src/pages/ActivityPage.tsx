// src/pages/ActivityPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const ActivityPage: React.FC = () => {
    const { t } = useTranslation();
    const { sessionId, activityId } = useParams<{ sessionId: string, activityId: string }>();
    const navigate = useNavigate();

    // States
    const [showShareMessage, setShowShareMessage] = useState(false);
    const [currentActivity, setCurrentActivity] = useState<ActivityData | null>(null);

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

    // Check for username
    useEffect(() => {
        if (!userService.hasUserName() && sessionId) {
            navigate(`/auth/${sessionId}`);
        }
    }, [sessionId, navigate]);

    // Get current activity from activities list
    useEffect(() => {
        if (activities.length > 0 && activityId) {
            const activity = activities.find(act => act.id === activityId);
            if (activity) {
                setCurrentActivity(activity);
            } else {
                // Redirect if activity not found
                navigate(`/session/${sessionId}`);
            }
        }
    }, [activities, activityId, sessionId, navigate]);

    // Check if current activity still matches
    useEffect(() => {
        if (session && session.currentActivityId !== activityId) {
            if (session.currentActivityId) {
                // Redirect to new activity
                navigate(`/session/${sessionId}/activity/${session.currentActivityId}`);
            } else {
                // Redirect to session page if no active activity
                navigate(`/session/${sessionId}`);
            }
        }
    }, [session, sessionId, activityId, navigate]);

    // Handle card addition
    const handleAddCard = async (text: string, columnType: ColumnType) => {
        try {
            await addCard(text, columnType);
        } catch (error) {
            console.error("Error adding card:", error);
        }
    };

    // Complete activity function
    const handleCompleteActivity = async () => {
        if (activityId && isSessionCreator) {
            await completeActivity(activityId);
            // Reset currentActivityId in the session
            await setSessionCurrentActivity(null);
            // Redirect to session page
            navigate(`/session/${sessionId}`);
        }
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
                        <button
                            onClick={handleCompleteActivity}
                            className="py-2 px-4 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {t('activities.completeActivity')}
                        </button>
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
        </div>
    );
};

export default ActivityPage;
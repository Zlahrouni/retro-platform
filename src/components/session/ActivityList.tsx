// src/components/session/ActivityList.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityType } from '../../types/types';

// Interface for an activity item
export interface ActivityItem {
    id: string;
    type: ActivityType | 'iceBreaker';
    iceBreakerType?: string;
    status: 'pending' | 'active' | 'completed';
    createdAt: Date;
}

interface ActivityListProps {
    activities: ActivityItem[];
    onStartActivity?: (activityId: string) => void;
    onDeleteActivity?: (activityId: string) => void;
    isAdmin?: boolean;
}

const ActivityList: React.FC<ActivityListProps> = ({
                                                       activities,
                                                       onStartActivity,
                                                       onDeleteActivity,
                                                       isAdmin = false
                                                   }) => {
    const { t } = useTranslation();

    if (activities.length === 0) {
        return null;
    }

    const getActivityEmoji = (type: ActivityType | 'iceBreaker', iceBreakerType?: string) => {
        if (type === 'iceBreaker') {
            if (iceBreakerType === 'funQuestion') return '🎲';
            return '🧊';
        }

        // Retro activities
        switch (type) {
            case 'startStopContinue': return '🚦';
            case 'madSadGlad': return '😊';
            case 'whatWentWell': return '👍';
            case 'likedLearnedLacked': return '💡';
            case '4Ls': return '🔄';
            default: return '📝';
        }
    };

    const getActivityIcon = (type: ActivityType | 'iceBreaker') => {
        if (type === 'iceBreaker') {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        }

        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        );
    };

    const getActivityName = (activity: ActivityItem) => {
        if (activity.type === 'iceBreaker') {
            if (activity.iceBreakerType === 'funQuestion') {
                return t('activities.iceBreakerTypes.funQuestion');
            }
            return t('activities.iceBreaker');
        }

        return t(`activities.types.${activity.type}`);
    };

    const getActivityCategory = (type: ActivityType | 'iceBreaker') => {
        if (type === 'iceBreaker') {
            return t('activities.iceBreaker');
        }
        return t('activities.retroActivity');
    };

    const getStatusBadge = (status: 'pending' | 'active' | 'completed') => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full" aria-label={t('activities.status.pending')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t('activities.status.pending')}
                    </span>
                );
            case 'active':
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full" aria-label={t('activities.status.active')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                        {t('activities.status.active')}
                    </span>
                );
            case 'completed':
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full" aria-label={t('activities.status.completed')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {t('activities.status.completed')}
                    </span>
                );
        }
    };

    // Trier les activités par statut puis par date (les actives en premier, puis les en attente, puis les complétées)
    const sortedActivities = [...activities].sort((a, b) => {
        const statusOrder = { active: 0, pending: 1, completed: 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
        }

        // Si même statut, trier par date (plus récent en premier)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return (
        <div className="mb-6" aria-labelledby="activities-heading">
            <h3 id="activities-heading" className="font-bold text-gray-700 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {t('activities.sessionActivities')}
                <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                    {activities.length}
                </span>
            </h3>

            {/* Timeline version for desktop */}
            <div className="hidden md:block relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                {/* Activities */}
                <div className="space-y-4 ml-6">
                    {sortedActivities.map((activity, index) => (
                        <div
                            key={activity.id}
                            className={`relative bg-white rounded-lg shadow-sm border border-gray-200 p-5 ${
                                activity.status === 'active'
                                    ? 'ring-2 ring-green-400'
                                    : activity.status === 'completed'
                                        ? 'opacity-70'
                                        : ''
                            }`}
                            tabIndex={0}
                            aria-label={`${getActivityName(activity)}, ${t(`activities.status.${activity.status}`)}`}
                        >
                            {/* Timeline dot */}
                            <div className={`absolute -left-10 top-1/2 transform -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white ${
                                activity.status === 'active'
                                    ? 'bg-green-400 text-white'
                                    : activity.status === 'completed'
                                        ? 'bg-gray-300 text-gray-700'
                                        : 'bg-blue-400 text-white'
                            }`}>
                                <span role="img" aria-hidden="true">
                                    {getActivityEmoji(activity.type, activity.iceBreakerType)}
                                </span>
                            </div>

                            <div className="flex flex-col">
                                {/* Header with title and status */}
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-medium text-lg">
                                            {getActivityName(activity)}
                                        </h4>
                                        <div className="text-xs text-gray-500 flex items-center mt-1">
                                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded mr-2">
                                                {getActivityCategory(activity.type)}
                                            </span>
                                            <time dateTime={activity.createdAt.toISOString()}>
                                                {new Date(activity.createdAt).toLocaleString()}
                                            </time>
                                        </div>
                                    </div>
                                    {getStatusBadge(activity.status)}
                                </div>

                                {/* Actions */}
                                {isAdmin && (
                                    <div className="flex justify-end space-x-2 mt-2">
                                        {activity.status === 'pending' && onStartActivity && (
                                            <button
                                                onClick={() => onStartActivity(activity.id)}
                                                className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 inline-flex items-center"
                                                aria-label={`${t('activities.start')} ${getActivityName(activity)}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {t('activities.start')}
                                            </button>
                                        )}

                                        {onDeleteActivity && (
                                            <button
                                                onClick={() => onDeleteActivity(activity.id)}
                                                className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 inline-flex items-center"
                                                aria-label={`${t('activities.delete')} ${getActivityName(activity)}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                {t('activities.delete')}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Card list version for mobile */}
            <div className="md:hidden space-y-4">
                {sortedActivities.map(activity => (
                    <div
                        key={activity.id}
                        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${
                            activity.status === 'active' ? 'ring-2 ring-green-400' : ''
                        }`}
                        tabIndex={0}
                    >
                        <div className="flex items-start">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                                activity.type === 'iceBreaker'
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-indigo-100 text-indigo-600'
                            }`} aria-hidden="true">
                                <span className="text-lg">{getActivityEmoji(activity.type, activity.iceBreakerType)}</span>
                            </div>
                            <div className="flex-grow">
                                <div className="flex flex-col">
                                    <div className="flex justify-between">
                                        <h4 className="font-medium">{getActivityName(activity)}</h4>
                                        {getStatusBadge(activity.status)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded mr-2">
                                            {getActivityCategory(activity.type)}
                                        </span>
                                    </div>
                                </div>

                                {/* Mobile actions */}
                                {isAdmin && (
                                    <div className="flex space-x-2 mt-3">
                                        {activity.status === 'pending' && onStartActivity && (
                                            <button
                                                onClick={() => onStartActivity(activity.id)}
                                                className="flex-1 px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-blue-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none inline-flex items-center justify-center"
                                                aria-label={`${t('activities.start')} ${getActivityName(activity)}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {t('activities.start')}
                                            </button>
                                        )}

                                        {onDeleteActivity && (
                                            <button
                                                onClick={() => onDeleteActivity(activity.id)}
                                                className="flex-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors focus:ring-2 focus:ring-red-500 focus:outline-none inline-flex items-center justify-center"
                                                aria-label={`${t('activities.delete')} ${getActivityName(activity)}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                {t('activities.delete')}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityList;
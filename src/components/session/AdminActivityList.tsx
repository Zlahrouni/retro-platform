// src/components/session/AdminActivityList.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityData } from '../../services/activitiesService';
import { formatTimeHHMM, getTimestamp } from '../../utils/dateUtils';

interface AdminActivityListProps {
    activities: ActivityData[];
    onLaunchActivity: (activityId: string) => void;
    onDeleteActivity: (activityId: string) => void;
}

const AdminActivityList: React.FC<AdminActivityListProps> = ({
                                                                 activities,
                                                                 onLaunchActivity,
                                                                 onDeleteActivity
                                                             }) => {
    const { t } = useTranslation();

    // Plus besoin de cette fonction, nous utilisons formatTimeHHMM importé

    if (activities.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <p className="text-gray-500 text-center py-4">
                    {t('activities.noActivitiesYet')}
                </p>
                <div className="text-center text-sm text-gray-400">
                    {t('activities.addActivityInstruction')}
                </div>
            </div>
        );
    }

    const getActivityIcon = (activity: ActivityData) => {
        // Déterminer l'émoji/icône en fonction du type d'activité
        if (activity.type === 'iceBreaker') {
            return '🧊';
        }

        // Pour les activités de rétro
        switch (activity.type) {
            case 'startStopContinue': return '🚦';
            case 'madSadGlad': return '😊';
            case 'whatWentWell': return '👍';
            case 'likedLearnedLacked': return '💡';
            case '4Ls': return '🔄';
            default: return '📝';
        }
    };

    const getActivityName = (activity: ActivityData) => {
        // Obtenir le nom de l'activité selon son type
        if (activity.type === 'iceBreaker') {
            if (activity.iceBreakerType === 'funQuestion') {
                return t('activities.iceBreakerTypes.funQuestion');
            }
            return t('activities.iceBreaker');
        }

        return t(`activities.types.${activity.type}`);
    };

    // Trier les activités : d'abord les activités lancées, puis en attente
    const sortedActivities = [...activities].sort((a, b) => {
        // Priorité 1: Les activités lancées (active) en premier
        if (a.launched && !b.launched) return -1;
        if (!a.launched && b.launched) return 1;

        // Priorité 2: Par date de création (plus récentes d'abord)
        return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
    });

    return (
        <div className="mb-6 space-y-4">
            <h3 className="font-bold text-gray-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {t('activities.adminView')}
                <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                    {activities.length}
                </span>
            </h3>

            <div className="text-sm mb-2 text-gray-500">
                {t('activities.adminInstructions')}
            </div>

            <div className="space-y-3">
                {sortedActivities.map(activity => (
                    <div
                        key={activity.id}
                        className={`bg-white rounded-lg border ${
                            activity.launched
                                ? 'border-green-500 shadow-md'
                                : 'border-gray-200 shadow-sm'
                        } p-4 relative`}
                    >
                        {/* Statut visible/invisible */}
                        <div className="absolute top-3 right-3 flex items-center text-xs text-gray-500">
                            {activity.visibleToAll ? (
                                <span className="flex items-center text-green-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    {t('activities.visibleToAll')}
                                </span>
                            ) : (
                                <span className="flex items-center text-orange-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                    {t('activities.adminOnlyVisible')}
                                </span>
                            )}
                        </div>

                        <div className="flex items-start mb-3">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                                activity.type === 'iceBreaker'
                                    ? 'bg-blue-100 text-blue-600'
                                    : 'bg-indigo-100 text-indigo-600'
                            }`}>
                                <span className="text-lg">{getActivityIcon(activity)}</span>
                            </div>

                            <div className="flex-grow">
                                <h4 className="font-medium text-gray-800">
                                    {getActivityName(activity)}
                                </h4>

                                <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                                    {/* Status badge */}
                                    <span className={`px-2 py-0.5 rounded-full ${
                                        activity.launched
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {activity.launched ? t('activities.launched') : t('activities.notLaunched')}
                                    </span>

                                    {/* Type badge */}
                                    <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                                        {activity.type === 'iceBreaker'
                                            ? t('activities.iceBreaker')
                                            : t('activities.retroActivity')}
                                    </span>

                                    {/* Time */}
                                    {activity.createdAt && (
                                        <span>
                                            {formatTimeHHMM(activity.createdAt)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions pour l'admin */}
                        <div className="border-t pt-3 flex justify-end space-x-2">
                            {/* Bouton Lancer - uniquement pour les activités non lancées */}
                            {!activity.launched && (
                                <button
                                    onClick={() => onLaunchActivity(activity.id)}
                                    className="px-3 py-1.5 bg-primary text-white text-sm rounded hover:bg-blue-600 transition-colors flex items-center"
                                    aria-label={`${t('activities.launch')} ${getActivityName(activity)}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {t('activities.launch')}
                                </button>
                            )}

                            {/* Bouton activité en cours - pour les activités déjà lancées */}
                            {activity.launched && (
                                <button
                                    disabled
                                    className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded flex items-center cursor-default"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {t('activities.inProgress')}
                                </button>
                            )}

                            {/* Bouton Supprimer */}
                            <button
                                onClick={() => onDeleteActivity(activity.id)}
                                className="px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded hover:bg-red-100 transition-colors flex items-center"
                                aria-label={`${t('activities.delete')} ${getActivityName(activity)}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                {t('activities.delete')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminActivityList;
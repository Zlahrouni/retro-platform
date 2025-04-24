// src/components/activities/ActivityIcon.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityType } from '../../types/types';

interface ActivityIconProps {
    type: ActivityType | 'iceBreaker';
    iceBreakerType?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * Composant qui affiche une icône ou un émoji selon le type d'activité
 * avec prise en charge de l'accessibilité.
 */
const ActivityIcon: React.FC<ActivityIconProps> = ({
                                                       type,
                                                       iceBreakerType,
                                                       size = 'md',
                                                       className = ''
                                                   }) => {
    const { t } = useTranslation();

    // Déterminer l'émoji à afficher
    const getEmoji = () => {
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

    // Déterminer le nom de l'activité (pour l'aria-label)
    const getActivityName = () => {
        if (type === 'iceBreaker') {
            if (iceBreakerType === 'funQuestion') {
                return t('activities.iceBreakerTypes.funQuestion');
            }
            return t('activities.iceBreaker');
        }

        return t(`activities.types.${type}`);
    };

    // Taille de l'icône
    const getSizeClass = () => {
        switch (size) {
            case 'sm': return 'w-8 h-8 text-base';
            case 'lg': return 'w-14 h-14 text-2xl';
            default: return 'w-10 h-10 text-lg';
        }
    };

    // Couleur et style selon le type
    const getStyleClass = () => {
        if (type === 'iceBreaker') {
            return 'bg-blue-100 text-blue-600 border-blue-200';
        }
        return 'bg-indigo-100 text-indigo-600 border-indigo-200';
    };

    return (
        <div
            className={`rounded-full flex items-center justify-center border ${getSizeClass()} ${getStyleClass()} ${className}`}
            role="img"
            aria-label={getActivityName()}
        >
            <span aria-hidden="true">{getEmoji()}</span>
        </div>
    );
};

export default ActivityIcon;
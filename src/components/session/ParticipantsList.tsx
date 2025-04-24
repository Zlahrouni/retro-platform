// src/components/session/ParticipantsList.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Participant } from '../../types/types';
import { sessionsService } from '../../services/firebaseService';
import { userService } from '../../services/userService';
import { Timestamp } from 'firebase/firestore';

interface ParticipantsListProps {
    sessionId: string;
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({ sessionId }) => {
    const { t } = useTranslation();
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const currentUsername = userService.getUserName();

    // S'abonner aux mises à jour des participants
    useEffect(() => {
        if (!sessionId) return;

        console.log('Écoute des participants pour la session:', sessionId);
        setIsLoading(true);

        // Charger les participants initiaux
        sessionsService.getSessionParticipants(sessionId).then(initialParticipants => {
            console.log('Participants initiaux chargés:', initialParticipants);
            if (initialParticipants && initialParticipants.length > 0) {
                setParticipants(initialParticipants);
            }
            setIsLoading(false);
        }).catch(error => {
            console.error('Erreur lors du chargement initial des participants:', error);
            setIsLoading(false);
        });

        // Écouter les mises à jour
        const unsubscribe = sessionsService.onParticipantsUpdate(sessionId, (updatedParticipants) => {
            console.log('Participants mis à jour (listener):', updatedParticipants);

            // Convertir les timestamps en dates si nécessaire
            const processedParticipants = updatedParticipants.map(participant => {
                // Vérifier si joinedAt est un Timestamp Firebase
                if (participant.joinedAt &&
                    typeof participant.joinedAt === 'object' &&
                    'toDate' in participant.joinedAt) {
                    return {
                        ...participant,
                        joinedAt: (participant.joinedAt as Timestamp).toDate()
                    };
                }
                return participant;
            });

            setParticipants(processedParticipants);
            setIsLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, [sessionId]);

    // Obtenir les initiales d'un nom
    const getInitials = (name: string) => {
        if (!name) return '?';
        const parts = name.split(/\s+/);
        if (parts.length === 1) return name.substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    // Fonction pour générer une couleur unique basée sur le nom
    const getColorForUser = (username: string) => {
        // Liste de couleurs tailwind prédéfinies
        const colors = [
            'bg-blue-100 text-blue-800 border-blue-300',
            'bg-green-100 text-green-800 border-green-300',
            'bg-purple-100 text-purple-800 border-purple-300',
            'bg-yellow-100 text-yellow-800 border-yellow-300',
            'bg-pink-100 text-pink-800 border-pink-300',
            'bg-indigo-100 text-indigo-800 border-indigo-300',
            'bg-red-100 text-red-800 border-red-300',
            'bg-orange-100 text-orange-800 border-orange-300',
            'bg-teal-100 text-teal-800 border-teal-300',
        ];

        // Utiliser une somme simple des codes de caractères pour une distribution déterministe
        const sum = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[sum % colors.length];
    };

    // Formatter le temps depuis que l'utilisateur a rejoint
    const formatJoinTime = (joinedAt: Date | string | any) => {
        if (!joinedAt) return '';

        try {
            // Gérer différents formats possibles
            let date: Date;

            if (typeof joinedAt === 'string') {
                // Format ISO ou autre format de chaîne
                date = new Date(joinedAt);
            } else if (joinedAt instanceof Date) {
                date = joinedAt;
            } else if (typeof joinedAt === 'object' && 'toDate' in joinedAt) {
                // C'est un Timestamp Firebase
                date = joinedAt.toDate();
            } else {
                console.error('Format de date inconnu:', joinedAt);
                return '';
            }

            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / (1000 * 60));

            if (diffMins < 1) {
                return t('participants.justJoined');
            } else if (diffMins < 60) {
                return t('participants.joinedMinutesAgo', { minutes: diffMins });
            } else {
                const hours = Math.floor(diffMins / 60);
                return t('participants.joinedHoursAgo', { hours });
            }
        } catch (e) {
            console.error('Erreur formatage date:', e);
            return '';
        }
    };

    if (isLoading) {
        return (
            <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
                <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse"></div>
                    <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse delay-150"></div>
                    <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse delay-300"></div>
                    <span className="ml-2 text-gray-600">{t('participants.loading')}</span>
                </div>
            </div>
        );
    }

    if (participants.length === 0) {
        return (
            <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
                <div className="text-gray-500 text-center py-2">
                    {t('participants.empty')}
                </div>
            </div>
        );
    }

    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-700 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{t('participants.title')}</span>
                    <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                        {participants.length}
                    </span>
                </h3>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                    {isExpanded ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            {t('participants.hide')}
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            {t('participants.show')}
                        </>
                    )}
                </button>
            </div>

            {isExpanded && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4">
                        {participants.map(participant => {
                            const colorClass = getColorForUser(participant.username);
                            const isCurrentUser = participant.username === currentUsername;
                            const joinTime = formatJoinTime(participant.joinedAt);

                            return (
                                <div key={participant.id}
                                     className={`flex items-center p-3 rounded-lg border ${
                                         isCurrentUser ? 'ring-2 ring-blue-500 shadow-sm' : 'border-gray-200'
                                     } hover:shadow-md transition-shadow`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${colorClass} border`}>
                                        {getInitials(participant.username)}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex items-center">
                                            <div className="text-sm font-medium text-gray-800 truncate">
                                                {participant.username}
                                            </div>
                                            {isCurrentUser && (
                                                <span className="ml-1.5 text-xs bg-green-100 border border-green-200 text-green-800 px-1.5 py-0.5 rounded-full">
                                                    {t('participants.you')}
                                                </span>
                                            )}
                                        </div>
                                        {participant.status === 'online' && (
                                            <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                                                {joinTime}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParticipantsList;
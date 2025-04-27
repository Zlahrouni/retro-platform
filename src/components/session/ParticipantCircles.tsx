// src/components/session/ParticipantCircles.tsx
import React, { useState, useEffect } from 'react';
import { Participant } from '../../types/types';
import { sessionsService } from '../../services/firebaseService';
import { userService } from '../../services/userService';
import { Timestamp } from 'firebase/firestore';

interface ParticipantCirclesProps {
    sessionId: string;
    onSelectUser?: (username: string | null) => void;
    selectedUser?: string | null;
    isFullscreen?: boolean;
}

const ParticipantCircles: React.FC<ParticipantCirclesProps> = ({
                                                                   sessionId,
                                                                   onSelectUser,
                                                                   selectedUser,
                                                                   isFullscreen = false
                                                               }) => {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showTooltip, setShowTooltip] = useState<string | null>(null);
    const currentUsername = userService.getUserName();

    // S'abonner aux mises à jour des participants
    useEffect(() => {
        if (!sessionId) return;
        setIsLoading(true);

        // Charger les participants initiaux
        sessionsService.getSessionParticipants(sessionId).then(initialParticipants => {
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
            'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200',
            'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
            'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200',
            'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200',
            'bg-pink-100 text-pink-800 border-pink-300 hover:bg-pink-200',
            'bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200',
            'bg-red-100 text-red-800 border-red-300 hover:bg-red-200',
            'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200',
            'bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-200',
        ];

        // Lorsqu'un utilisateur est sélectionné, utiliser des couleurs plus vives
        const selectedColors = [
            'bg-blue-500 text-white border-blue-600 hover:bg-blue-600',
            'bg-green-500 text-white border-green-600 hover:bg-green-600',
            'bg-purple-500 text-white border-purple-600 hover:bg-purple-600',
            'bg-yellow-500 text-white border-yellow-600 hover:bg-yellow-600',
            'bg-pink-500 text-white border-pink-600 hover:bg-pink-600',
            'bg-indigo-500 text-white border-indigo-600 hover:bg-indigo-600',
            'bg-red-500 text-white border-red-600 hover:bg-red-600',
            'bg-orange-500 text-white border-orange-600 hover:bg-orange-600',
            'bg-teal-500 text-white border-teal-600 hover:bg-teal-600',
        ];

        // Utiliser une somme simple des codes de caractères pour une distribution déterministe
        const sum = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const index = sum % colors.length;

        // Si l'utilisateur est l'utilisateur sélectionné, utiliser une couleur plus vive
        if (selectedUser === username) {
            return selectedColors[index];
        }

        return colors[index];
    };

    // Gérer le clic sur un utilisateur
    const handleUserClick = (username: string) => {
        if (onSelectUser) {
            // Si l'utilisateur est déjà sélectionné, le désélectionner
            if (selectedUser === username) {
                onSelectUser(null);
            } else {
                onSelectUser(username);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center space-x-1">
                <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse"></div>
                <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse"></div>
            </div>
        );
    }

    if (participants.length === 0) {
        return null;
    }

    // Déterminer la taille des cercles en fonction du mode
    const circleSize = isFullscreen ? 'w-14 h-14 text-lg' : 'w-10 h-10 text-sm';
    const marginSize = isFullscreen ? 'm-2' : 'm-1';

    return (
        <div className={`flex items-center flex-wrap ${isFullscreen ? 'justify-center mt-4 mb-6' : ''}`}>
            {participants.map((participant) => {
                const colorClass = getColorForUser(participant.username);
                const isCurrentUser = participant.username === currentUsername;
                const isSelected = selectedUser === participant.username;
                const initials = getInitials(participant.username);

                return (
                    <div key={participant.id} className="relative">
                        <button
                            className={`${circleSize} ${marginSize} rounded-full flex items-center justify-center border-2 transition-all duration-300 cursor-pointer
                                ${isSelected ? 'ring-4 ring-blue-300 scale-110' : ''}
                                ${isCurrentUser ? 'border-blue-500' : 'border-gray-200'}
                                ${colorClass}`}
                            title={participant.username}
                            onClick={() => handleUserClick(participant.username)}
                            onMouseEnter={() => setShowTooltip(participant.id)}
                            onMouseLeave={() => setShowTooltip(null)}
                        >
                            <span className="font-bold">{initials}</span>
                        </button>

                        {isCurrentUser && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                        )}

                        {/* Tooltip amélioré */}
                        {showTooltip === participant.id && (
                            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded shadow-lg z-10 whitespace-nowrap">
                                {participant.username}
                                {isCurrentUser && <span className="ml-1">(Vous)</span>}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Compteur de participants */}
            {participants.length > 0 && isFullscreen && (
                <div className="text-sm text-gray-500 mt-2">
                    {participants.length} participant{participants.length > 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
};

export default ParticipantCircles;
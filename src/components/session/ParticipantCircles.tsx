// src/components/session/ParticipantCircles.tsx
import React, { useState, useEffect } from 'react';
import { Participant } from '../../types/types';
import { sessionsService } from '../../services/firebaseService';
import { userService } from '../../services/userService';
import { Timestamp } from 'firebase/firestore';

interface ParticipantCirclesProps {
    sessionId: string;
}

const ParticipantCircles: React.FC<ParticipantCirclesProps> = ({ sessionId }) => {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
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

    return (
        <div className="flex items-center flex-wrap">
            {participants.map((participant) => {
                const colorClass = getColorForUser(participant.username);
                const isCurrentUser = participant.username === currentUsername;
                const initials = getInitials(participant.username);

                return (
                    <div
                        key={participant.id}
                        className={`w-10 h-10 rounded-full flex items-center justify-center m-1 border-2 transition-transform hover:scale-110 ${
                            isCurrentUser ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'
                        } ${colorClass}`}
                        title={participant.username}
                    >
                        <span className="font-bold text-xs">{initials}</span>
                        {isCurrentUser && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ParticipantCircles;
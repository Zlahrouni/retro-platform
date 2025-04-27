// src/components/icebreakers/ParticipantProgress.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import {Participant} from "../../../types/types";

interface ParticipantProgressProps {
    participants: Participant[];
    askedPlayerIds: string[];
    currentPlayerId?: string;
}

const ParticipantProgress: React.FC<ParticipantProgressProps> = ({
                                                                     participants,
                                                                     askedPlayerIds,
                                                                     currentPlayerId
                                                                 }) => {
    const { t } = useTranslation();

    // Trier les participants : d'abord le joueur courant, ensuite les joueurs qui ont répondu, puis les restants
    const sortedParticipants = [...participants].sort((a, b) => {
        // Le joueur courant en premier
        if (a.id === currentPlayerId) return -1;
        if (b.id === currentPlayerId) return 1;

        // Ensuite les joueurs qui ont répondu
        const aAnswered = askedPlayerIds.includes(a.id);
        const bAnswered = askedPlayerIds.includes(b.id);

        if (aAnswered && !bAnswered) return -1;
        if (!aAnswered && bAnswered) return 1;

        // Par défaut, ordre alphabétique
        return a.username.localeCompare(b.username);
    });

    // Obtenir les initiales d'un nom
    const getInitials = (name: string) => {
        if (!name) return '?';
        const parts = name.split(/\s+/);
        if (parts.length === 1) return name.substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
        <div className="mt-8 max-w-md mx-auto">
            <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {t('icebreaker.funQuestion.participants')}
            </h3>

            <div className="flex flex-wrap justify-center gap-2 mt-2">
                {sortedParticipants.map((participant) => {
                    const isCurrentPlayer = participant.id === currentPlayerId;
                    const hasAnswered = askedPlayerIds.includes(participant.id);
                    const isPending = !hasAnswered && !isCurrentPlayer;

                    // Déterminer les styles en fonction du statut
                    let styles = "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ";

                    if (isCurrentPlayer) {
                        // Joueur actuel - surbrillance verte pulsante
                        styles += "border-green-500 bg-green-100 text-green-700 transform scale-110 shadow-md animate-pulse";
                    } else if (hasAnswered) {
                        // Joueur ayant déjà répondu - vert plus discret
                        styles += "border-green-300 bg-green-50 text-green-600 opacity-70";
                    } else {
                        // Joueur en attente - gris
                        styles += "border-gray-300 bg-gray-50 text-gray-500";
                    }

                    return (
                        <div key={participant.id} className="relative">
                            <div className={styles}>
                                <span className="font-bold">{getInitials(participant.username)}</span>
                            </div>

                            {isCurrentPlayer && (
                                <span className="absolute -top-1 -right-1 bg-green-500 rounded-full w-4 h-4 border border-white flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </span>
                            )}

                            {hasAnswered && (
                                <span className="absolute -top-1 -right-1 bg-green-500 rounded-full w-4 h-4 border border-white flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                            )}

                            <div className="mt-1 text-xs text-center overflow-hidden text-ellipsis max-w-[60px]">
                                {participant.username.length > 8
                                    ? `${participant.username.substring(0, 7)}...`
                                    : participant.username}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Statistiques de progression */}
            <div className="mt-4 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                    className="bg-gradient-to-r from-green-500 to-green-400 h-full transition-all duration-500"
                    style={{ width: `${(askedPlayerIds.length / participants.length) * 100}%` }}
                ></div>
            </div>
            <div className="mt-1 text-xs text-gray-500 text-center">
                {askedPlayerIds.length} / {participants.length} participants
            </div>
        </div>
    );
};

export default ParticipantProgress;
// src/types/types.ts

// Types pour les activités de rétrospective
export type ActivityType =
    | 'startStopContinue'
    | 'madSadGlad'
    | 'whatWentWell'
    | 'likedLearnedLacked'
    | '4Ls';

// Types pour les Ice Breakers
export type IceBreakerType =
    | 'funQuestion';

// Types pour les colonnes selon l'activité
export type ColumnType =
    | 'start' | 'stop' | 'continue'
    | 'mad' | 'sad' | 'glad'
    | 'wentWell' | 'toImprove'
    | 'liked' | 'learned' | 'lacked' | 'longedFor';

// Types pour le statut de session
export type SessionStatus = 'open' | 'paused' | 'closed';

// Types pour le statut d'activité
export type ActivityStatus = 'pending' | 'active' | 'completed';

// Interface pour les participants
export interface Participant {
    id: string;
    username: string;
    joinedAt: Date | any; // Accepte Date ou Timestamp de Firebase
    status?: 'online' | 'offline'; // Statut du participant
}

export interface Session {
    id: string;
    activityType: ActivityType;
    status: SessionStatus;
    createdBy: string;
    createdAt: Date;
    duration?: number;
    endTime?: Date;
    participants?: Participant[]; // Liste des participants
}

export interface Activity {
    id: string;
    sessionId: string;
    type: ActivityType | 'iceBreaker';
    iceBreakerType?: IceBreakerType;
    status: ActivityStatus;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}

export interface Card {
    id: string;
    sessionId: string;
    activityId?: string; // Référence à l'activité associée
    text: string;
    author?: string;
    type: ColumnType;
    createdAt: Date;
}

// Mappage des colonnes par type d'activité
export const ACTIVITY_COLUMNS: Record<ActivityType, ColumnType[]> = {
    'startStopContinue': ['start', 'stop', 'continue'],
    'madSadGlad': ['mad', 'sad', 'glad'],
    'whatWentWell': ['wentWell', 'toImprove'],
    'likedLearnedLacked': ['liked', 'learned', 'lacked'],
    '4Ls': ['liked', 'learned', 'lacked', 'longedFor']
};
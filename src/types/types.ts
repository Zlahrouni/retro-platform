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

export interface IceBreakerActivity {
    id: string;
    type: 'iceBreaker';
    iceBreakerType: IceBreakerType;
    sessionId: string;
    createdAt: Date | any;
    status: 'pending' | 'active' | 'completed';
    visibleToAll: boolean;
    launched: boolean;
}

export interface CurrentTurn {
    playerId: string;
    playerName: string;
    questionId: string;
    question: {
        fr: string;
        en: string;
    };
}

export interface Question {
    id: string;
    fr: string;
    en: string;
}

export interface QuestionFunExpressData {
    id: string;
    askedQuestions: string[];  // IDs des questions déjà posées
    askedPlayers: string[];    // IDs des joueurs ayant déjà répondu
    currentTurn: CurrentTurn | null;
    allPlayersAsked?: boolean; // Flag indiquant si tous les joueurs ont été interrogés
}

export interface IceBreakerTypeData {
    funQuestion: QuestionFunExpressData;
    // Autres types à venir...
}

// Interface pour les participants
export interface Participant {
    id: string;
    username: string;
    joinedAt: Date | any; // Accepte Date ou Timestamp de Firebase
    status?: 'online' | 'offline'; // Statut du participant
}

export interface Session {
    id: string;
    sessionType?: string;
    status: SessionStatus;
    createdBy: string;
    adminId: string;
    createdAt: Date;
    duration?: number;
    endTime?: Date;
    participants?: Participant[];
    currentActivityId?: string;
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
    visibleToAll: boolean; // Indique si l'activité est visible pour tous les participants
    launched: boolean; // Indique si l'activité a été lancée par l'admin
    addedBy: string; // Nom d'utilisateur de l'admin qui a ajouté l'activité
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
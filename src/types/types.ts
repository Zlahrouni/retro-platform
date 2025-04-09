// src/types/types.ts

// Types pour les activités de rétrospective
export type ActivityType =
    | 'startStopContinue'
    | 'madSadGlad'
    | 'whatWentWell'
    | 'likedLearnedLacked'
    | '4Ls';

// Types pour les colonnes selon l'activité
export type ColumnType =
    | 'start' | 'stop' | 'continue'
    | 'mad' | 'sad' | 'glad'
    | 'wentWell' | 'toImprove'
    | 'liked' | 'learned' | 'lacked' | 'longedFor';

export interface Session {
    id: string;
    activityType: ActivityType;
    status: 'open' | 'closed';
    createdBy: string;
    createdAt: Date;
}

export interface Card {
    id: string;
    sessionId: string;
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
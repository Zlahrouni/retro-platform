// src/hooks/useSession.ts
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionsService, cardsService } from '../services/firebaseService';
import { userService } from '../services/userService';
import { Session, Card, ActivityType, ColumnType } from '../types/types';

// Hook pour créer une session
export const useCreateSession = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const createSession = async (activityType: ActivityType, userName?: string) => {
        setIsLoading(true);
        setError(null);

        try {
            // Stocker le nom d'utilisateur si fourni
            if (userName) {
                userService.setUserName(userName);
            }

            // Créer la session
            const sessionId = await sessionsService.createSession(
                activityType,
                userName || userService.getUserName()
            );

            // Rediriger vers la page de session
            navigate(`/session/${sessionId}`);
        } catch (err) {
            console.error('Failed to create session:', err);
            setError('Impossible de créer la session. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    return { createSession, isLoading, error };
};

// Hook pour charger et écouter une session
export const useSession = (sessionId?: string) => {
    const [session, setSession] = useState<Session | null>(null);
    const [cards, setCards] = useState<Card[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!sessionId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        // Observer pour les mises à jour de session
        const unsubscribeSession = sessionsService.onSessionUpdate(
            sessionId,
            (updatedSession) => {
                if (updatedSession) {
                    setSession(updatedSession);
                } else {
                    // Session non trouvée
                    setError('Session non trouvée');
                    navigate('/404');
                }
                setIsLoading(false);
            }
        );

        // Observer pour les mises à jour de cartes
        const unsubscribeCards = cardsService.onCardsUpdate(
            sessionId,
            (updatedCards) => {
                setCards(updatedCards);
            }
        );

        // Nettoyer les abonnements lorsque le composant est démonté
        return () => {
            unsubscribeSession();
            unsubscribeCards();
        };
    }, [sessionId, navigate]);

    // Fonction pour ajouter une carte
    const addCard = async (text: string, type: ColumnType) => {
        if (!sessionId) return;

        try {
            await cardsService.addCard(
                sessionId,
                text,
                type,
                userService.getUserName()
            );
        } catch (err) {
            console.error('Failed to add card:', err);
            setError('Impossible d\'ajouter la carte. Veuillez réessayer.');
        }
    };

    // Fonction pour fermer une session
    const closeSession = async () => {
        if (!sessionId) return;

        try {
            await sessionsService.closeSession(sessionId);
        } catch (err) {
            console.error('Failed to close session:', err);
            setError('Impossible de fermer la session. Veuillez réessayer.');
        }
    };

    // Obtenir les cartes organisées par type de colonne
    const getCardsByType = (type: ColumnType): Card[] => {
        return cards.filter(card => card.type === type);
    };

    return {
        session,
        cards,
        isLoading,
        error,
        addCard,
        closeSession,
        getCardsByType
    };
};
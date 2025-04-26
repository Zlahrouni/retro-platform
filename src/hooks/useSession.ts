// src/hooks/useSession.ts
import { useState, useEffect, useCallback, useRef } from 'react';
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
            // Stocker le nom d'utilisateur si fourni (pour s'assurer qu'il est défini avant de créer la session)
            if (userName && userName.trim()) {
                userService.setUserName(userName.trim());
            } else if (!userService.hasUserName()) {
                // Si aucun nom n'est fourni et qu'il n'y en a pas déjà un, afficher une erreur
                setError('Le nom d\'utilisateur est obligatoire');
                setIsLoading(false);
                return;
            }

            // Créer la session - la fonction createSession récupère maintenant directement le nom depuis userService
            const sessionId = await sessionsService.createSession();

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
    const [isSessionCreator, setIsSessionCreator] = useState(false);
    const navigate = useNavigate();

    // Utiliser useRef pour suivre si le hook est toujours monté
    const isMounted = useRef(true);

    // Garder une référence au sessionId pour les fermetures
    const sessionIdRef = useRef(sessionId);

    // Référence à session pour éviter la dépendance circulaire
    const sessionRef = useRef<Session | null>(null);

    // Mettre à jour les références quand les valeurs changent
    useEffect(() => {
        sessionIdRef.current = sessionId;
    }, [sessionId]);

    useEffect(() => {
        sessionRef.current = session;

        // Vérifier si l'utilisateur actuel est l'administrateur de la session
        if (session) {
            const userName = userService.getUserName();

            // Déterminer le statut d'administrateur
            let isAdmin = false;

            // Vérifier d'abord le champ adminId (prioritaire)
            if (session.adminId) {
                isAdmin = session.adminId === userName;
            }
            // Si pas d'adminId, vérifier createdBy (compatibilité)
            else if (session.createdBy && session.createdBy !== "temp-session-creator") {
                isAdmin = session.createdBy === userName;
            }

            setIsSessionCreator(isAdmin);
        }
    }, [session]);

    useEffect(() => {
        // Définir isMounted à true au montage
        isMounted.current = true;

        // Marquer comme démonté lors du nettoyage
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (session) {
            // Déboguer les données de session reçues
            console.log("Session mise à jour:", {
                id: session.id,
                status: session.status,
                currentActivityId: session.currentActivityId
            });
        }
    }, [session]);

    useEffect(() => {
        if (!sessionId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        let unsubscribeSession: (() => void) | undefined;
        let unsubscribeCards: (() => void) | undefined;

        // Fonction pour initialiser les listeners
        const initializeListeners = async () => {
            try {
                // 1. Charger d'abord la session directement pour une réponse plus rapide
                const initialSession = await sessionsService.getSessionById(sessionId);

                if (initialSession && isMounted.current) {
                    console.log("Session chargée avec succès:", initialSession);
                    setSession(initialSession);

                    // Vérifier si l'utilisateur est le créateur
                    const userName = userService.getUserName();
                    setIsSessionCreator(initialSession.createdBy === userName);

                    setIsLoading(false);
                } else {
                    // Si la session n'existe pas
                    if (isMounted.current) {
                        console.error("Session non trouvée ou invalide:", sessionId);
                        setError('Session non trouvée ou invalide');
                        setIsLoading(false);
                        return; // Sortir tôt pour ne pas configurer les listeners
                    }
                }

                // 2. Chargement des cartes initiales
                try {
                    const initialCards = await cardsService.getCardsBySession(sessionId);

                    if (isMounted.current) {
                        setCards(initialCards);
                    }
                } catch (cardsError) {
                    console.error("Erreur lors du chargement initial des cartes:", cardsError);
                    // Continuer même en cas d'erreur, le listener pourra récupérer les cartes plus tard
                }

                // 3. Observer pour les mises à jour de session
                try {
                    unsubscribeSession = sessionsService.onSessionUpdate(
                        sessionId,
                        (updatedSession) => {
                            if (!isMounted.current) return;

                            if (updatedSession) {
                                setSession(updatedSession);
                                setIsLoading(false);
                            } else {
                                // Utiliser sessionRef au lieu de session pour éviter la dépendance circulaire
                                if (!sessionRef.current) {
                                    setError('Session non trouvée');
                                }
                            }
                        }
                    );
                } catch (sessionListenerError) {
                    console.error("Erreur lors de la configuration du listener de session:", sessionListenerError);
                    // Continuer même en cas d'erreur de configuration du listener
                }

                // 4. Observer pour les mises à jour de cartes
                try {
                    unsubscribeCards = cardsService.onCardsUpdate(
                        sessionId,
                        (updatedCards) => {
                            if (!isMounted.current) return;

                            setCards(updatedCards);
                        }
                    );
                } catch (cardsListenerError) {
                    console.error("Erreur lors de la configuration du listener de cartes:", cardsListenerError);
                    // Continuer même en cas d'erreur de configuration du listener
                }
            } catch (err) {
                console.error("Erreur d'initialisation:", err);
                if (isMounted.current) {
                    setError('Erreur lors du chargement de la session');
                    setIsLoading(false);
                }
            }
        };

        // Initialiser les listeners
        initializeListeners();

        // Nettoyer les abonnements lorsque le composant est démonté
        return () => {
            if (unsubscribeSession) {
                try {
                    unsubscribeSession();
                } catch (error) {
                    console.error("Erreur lors du désabonnement de session:", error);
                }
            }
            if (unsubscribeCards) {
                try {
                    unsubscribeCards();
                } catch (error) {
                    console.error("Erreur lors du désabonnement des cartes:", error);
                }
            }
        };
    }, [sessionId, navigate]); // Pas besoin d'ajouter session comme dépendance grâce à sessionRef

    // Fonction pour ajouter une carte avec gestion optimiste
    const addCard = useCallback(async (text: string, type: ColumnType) => {
        const currentSessionId = sessionIdRef.current;
        if (!currentSessionId || !text.trim()) return;

        try {
            // Vérifier si l'utilisateur a un nom
            if (!userService.hasUserName()) {
                throw new Error('Nom d\'utilisateur requis pour ajouter une carte');
            }

            // Vérifier si la session est en pause ou fermée
            const currentSession = sessionRef.current;
            if (currentSession?.status === 'paused') {
                throw new Error('La session est en pause. Vous ne pouvez pas ajouter de carte actuellement.');
            }
            if (currentSession?.status === 'closed') {
                throw new Error('La session est fermée. Vous ne pouvez pas ajouter de carte.');
            }

            const userName = userService.getUserName();

            // Créer un objet temporaire pour la mise à jour optimiste de l'UI
            const tempCard: Card = {
                id: 'temp_' + Date.now(),
                sessionId: currentSessionId,
                text: text.trim(),
                type,
                author: userName,
                createdAt: new Date()
            };

            // Ajouter temporairement la carte à l'UI
            if (isMounted.current) {
                setCards(prevCards => [...prevCards, tempCard]);
            }

            try {
                // Ajouter réellement la carte dans Firebase
                await cardsService.addCard(
                    currentSessionId,
                    text,
                    type,
                    userName
                );

                console.log("Carte ajoutée avec succès dans Firebase");
                // Le listener onCardsUpdate sera déclenché par Firebase

            } catch (error) {
                console.error("Erreur lors de l'ajout de la carte dans Firebase:", error);
                // En cas d'erreur, retirer la carte temporaire
                if (isMounted.current) {
                    setCards(prevCards => prevCards.filter(card => card.id !== tempCard.id));
                }
                throw error;
            }

        } catch (err) {
            console.error('Failed to add card:', err);
            if (isMounted.current) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Impossible d\'ajouter la carte. Veuillez réessayer.');
                }
            }
        }
    }, []);

    const setCurrentActivity = useCallback(async (activityId: string | null): Promise<boolean> => {
        const currentSessionId = sessionIdRef.current;
        if (!currentSessionId) {
            console.error("Impossible de définir l'activité courante: sessionId manquant");
            return false;
        }

        try {
            console.log(`Tentative de définir l'activité courante ${activityId} pour la session ${currentSessionId}`);
            // Appeler la fonction du service pour mettre à jour l'activité courante dans Firebase
            const success = await sessionsService.setCurrentActivity(currentSessionId, activityId);

            if (success) {
                console.log(`Activité courante définie avec succès: ${activityId}`);
                return true;
            } else {
                console.error(`Échec de la définition de l'activité courante: ${activityId}`);
                return false;
            }
        } catch (err) {
            console.error('Erreur lors de la définition de l\'activité courante:', err);
            if (isMounted.current) {
                setError("Erreur lors de la définition de l'activité courante");
            }
            return false;
        }
    }, []);

    // Fonction pour fermer une session
    const closeSession = useCallback(async () => {
        const currentSessionId = sessionIdRef.current;
        if (!currentSessionId) return;

        try {
            await sessionsService.closeSession(currentSessionId);
            // La mise à jour sera reçue via le listener onSessionUpdate
        } catch (err) {
            console.error('Failed to close session:', err);
            if (isMounted.current) {
                setError('Impossible de fermer la session. Veuillez réessayer.');
            }
        }
    }, []);

    // Fonction pour mettre en pause une session
    const pauseSession = useCallback(async () => {
        const currentSessionId = sessionIdRef.current;
        if (!currentSessionId) return;

        try {
            await sessionsService.pauseSession(currentSessionId);
            // La mise à jour sera reçue via le listener onSessionUpdate
        } catch (err) {
            console.error('Failed to pause session:', err);
            if (isMounted.current) {
                setError('Impossible de mettre en pause la session. Veuillez réessayer.');
            }
        }
    }, []);

    // Fonction pour reprendre une session
    const resumeSession = useCallback(async () => {
        const currentSessionId = sessionIdRef.current;
        if (!currentSessionId) return;

        try {
            await sessionsService.resumeSession(currentSessionId);
            // La mise à jour sera reçue via le listener onSessionUpdate
        } catch (err) {
            console.error('Failed to resume session:', err);
            if (isMounted.current) {
                setError('Impossible de reprendre la session. Veuillez réessayer.');
            }
        }
    }, []);

    // Obtenir les cartes organisées par type de colonne
    const getCardsByType = useCallback((type: ColumnType): Card[] => {
        return cards.filter(card => card.type === type);
    }, [cards]);

    return {
        session,
        cards,
        isLoading,
        error,
        addCard,
        closeSession,
        pauseSession,
        resumeSession,
        getCardsByType,
        isSessionCreator,
        setCurrentActivity
    };
};
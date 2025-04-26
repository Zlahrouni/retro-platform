// src/hooks/useActivities.ts - Version corrigée
import { useState, useEffect, useCallback, useRef } from 'react';
import { activitiesService, ActivityData } from '../services/activitiesService';
import { ActivityType } from '../types/types';

export const useActivities = (sessionId?: string, isAdmin: boolean = false) => {
    const [activities, setActivities] = useState<ActivityData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Utiliser useRef pour suivre si le hook est monté
    const isMounted = useRef(true);
    const sessionIdRef = useRef(sessionId);

    // Mettre à jour la référence quand sessionId change
    useEffect(() => {
        sessionIdRef.current = sessionId;
    }, [sessionId]);

    // Définir isMounted à true au montage, false au démontage
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Charger et écouter les activités
    useEffect(() => {
        if (!sessionId) {
            setIsLoading(false);
            return;
        }

        console.log(`Chargement des activités pour la session ${sessionId}, isAdmin: ${isAdmin}`);
        setIsLoading(true);
        setError(null);

        let unsubscribe: (() => void) | undefined;

        const initializeActivities = async () => {
            try {
                // Charger les activités initiales
                console.log(`Tentative de chargement initial des activités pour la session ${sessionId}`);
                const initialActivities = await activitiesService.getActivitiesBySession(sessionId, isAdmin);

                if (isMounted.current) {
                    console.log(`${initialActivities.length} activités chargées initialement:`,
                        initialActivities.map(a => ({ id: a.id, type: a.type, status: a.status, launched: a.launched })));

                    setActivities(initialActivities);
                    setIsLoading(false);
                }

                // Configurer l'écoute en temps réel
                unsubscribe = activitiesService.onActivitiesUpdate(
                    sessionId,
                    isAdmin,
                    (updatedActivities) => {
                        if (isMounted.current) {
                            console.log(`Mise à jour des activités reçue: ${updatedActivities.length} activités`,
                                updatedActivities.map(a => ({ id: a.id, type: a.type, status: a.status, launched: a.launched })));

                            setActivities(updatedActivities);
                            setIsLoading(false);
                        }
                    }
                );
            } catch (err) {
                console.error("Erreur lors du chargement des activités:", err);
                if (isMounted.current) {
                    setError("Erreur lors du chargement des activités");
                    setIsLoading(false);
                }
            }
        };

        initializeActivities();

        // Nettoyer l'abonnement
        return () => {
            console.log("Nettoyage de l'écouteur d'activités");
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [sessionId, isAdmin]);

    // Ajouter une nouvelle activité
    const addActivity = useCallback(async (
        type: ActivityType | 'iceBreaker',
        addedBy: string,
        iceBreakerType?: string
    ): Promise<string | null> => {
        const currentSessionId = sessionIdRef.current;
        if (!currentSessionId) return null;

        try {
            console.log(`Ajout d'une activité de type ${type} par ${addedBy}`);
            return await activitiesService.addActivity(currentSessionId, type, addedBy, iceBreakerType);
        } catch (err) {
            console.error("Erreur lors de l'ajout d'une activité:", err);
            if (isMounted.current) {
                setError("Erreur lors de l'ajout d'une activité");
            }
            return null;
        }
    }, []);

    // CORRECTION: Fonction pour lancer une activité (mise à jour pour mieux gérer les erreurs)
    const launchActivity = useCallback(async (activityId: string): Promise<boolean> => {
        if (!activityId) {
            console.error("ID d'activité manquant");
            return false;
        }

        try {
            console.log(`Lancement de l'activité ${activityId}`);
            const success = await activitiesService.launchActivity(activityId);

            if (success) {
                console.log(`Activité ${activityId} lancée avec succès`);
                return true;
            } else {
                console.error(`Échec du lancement de l'activité ${activityId}`);
                return false;
            }
        } catch (err) {
            console.error("Erreur lors du lancement d'une activité:", err);
            if (isMounted.current) {
                setError("Erreur lors du lancement d'une activité");
            }
            return false;
        }
    }, []);

    // Terminer une activité
    const completeActivity = useCallback(async (activityId: string): Promise<boolean> => {
        try {
            console.log(`Complétion de l'activité ${activityId}`);
            return await activitiesService.completeActivity(activityId);
        } catch (err) {
            console.error("Erreur lors de la complétion d'une activité:", err);
            if (isMounted.current) {
                setError("Erreur lors de la complétion d'une activité");
            }
            return false;
        }
    }, []);

    // Supprimer une activité
    const deleteActivity = useCallback(async (activityId: string): Promise<boolean> => {
        try {
            console.log(`Suppression de l'activité ${activityId}`);
            return await activitiesService.deleteActivity(activityId);
        } catch (err) {
            console.error("Erreur lors de la suppression d'une activité:", err);
            if (isMounted.current) {
                setError("Erreur lors de la suppression d'une activité");
            }
            return false;
        }
    }, []);

    // Vérifier si une activité de rétro est actuellement lancée
    const hasLaunchedRetroActivity = useCallback(() => {
        return activities.some(activity =>
            activity.launched &&
            activity.type !== 'iceBreaker' &&
            activity.status === 'active');
    }, [activities]);

    // Obtenir l'activité de rétro actuellement lancée
    const getLaunchedRetroActivity = useCallback(() => {
        return activities.find(activity =>
            activity.launched &&
            activity.type !== 'iceBreaker' &&
            activity.status === 'active');
    }, [activities]);

    return {
        activities,
        isLoading,
        error,
        addActivity,
        launchActivity,
        completeActivity,
        deleteActivity,
        hasLaunchedRetroActivity,
        getLaunchedRetroActivity
    };
};
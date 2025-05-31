// src/hooks/useCreateSession.ts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionsService } from '../services/firebaseService';
import { userService } from '../services/userService';
import { ActivityType } from '../types/types';

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
// src/services/timerService.ts
import { doc, getDoc, updateDoc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Interface pour les données du minuteur
export interface TimerData {
    endTime: string | null; // Date ISO au format string
    isRunning: boolean;
    isComplete: boolean;
    durationMinutes: number;
}

// Préfixe pour le document du minuteur
const TIMER_DOC_PREFIX = 'activity_timer_';

// Obtenir la référence au document du minuteur pour une session donnée
const getTimerDocRef = (sessionId: string) => {
    return doc(db, 'timers', `${TIMER_DOC_PREFIX}${sessionId}`);
};

// Service de minuteur utilisant Firebase
export const timerService = {
    // Initialiser un minuteur pour une session
    async initTimer(sessionId: string, durationMinutes: number): Promise<boolean> {
        try {
            const timerRef = getTimerDocRef(sessionId);

            // Calculer l'heure de fin
            const endTime = new Date();
            endTime.setMinutes(endTime.getMinutes() + durationMinutes);

            // Données initiales du minuteur
            const timerData: TimerData = {
                endTime: endTime.toISOString(),
                isRunning: true,
                isComplete: false,
                durationMinutes
            };

            // Créer/mettre à jour le document avec setDoc (fonctionne pour créer et mettre à jour)
            // Le merge: true permet de mettre à jour partiellement un document existant
            await setDoc(timerRef, timerData, { merge: true });

            return true;
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du minuteur:', error);
            return false;
        }
    },

    // Mettre en pause un minuteur
    async pauseTimer(sessionId: string): Promise<boolean> {
        try {
            const timerRef = getTimerDocRef(sessionId);
            const timerDoc = await getDoc(timerRef);

            if (!timerDoc.exists()) {
                return false;
            }

            const data = timerDoc.data() as TimerData;

            // Si le minuteur est déjà terminé, ne rien faire
            if (data.isComplete) {
                return true;
            }

            // Calculer le temps restant
            const now = new Date();
            const endTime = new Date(data.endTime || '');
            const remainingMs = endTime.getTime() - now.getTime();

            if (remainingMs <= 0) {
                // Si le temps est écoulé, marquer comme terminé
                await updateDoc(timerRef, {
                    isRunning: false,
                    isComplete: true
                });
            } else {
                // Mettre en pause et sauvegarder le temps restant en minutes
                const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
                await updateDoc(timerRef, {
                    isRunning: false,
                    durationMinutes: remainingMinutes
                });
            }

            return true;
        } catch (error) {
            console.error('Erreur lors de la mise en pause du minuteur:', error);
            return false;
        }
    },

    // Reprendre un minuteur en pause
    async resumeTimer(sessionId: string): Promise<boolean> {
        try {
            const timerRef = getTimerDocRef(sessionId);
            const timerDoc = await getDoc(timerRef);

            if (!timerDoc.exists()) {
                return false;
            }

            const data = timerDoc.data() as TimerData;

            // Si le minuteur est déjà terminé, ne rien faire
            if (data.isComplete) {
                return true;
            }

            // Calculer la nouvelle heure de fin
            const now = new Date();
            const newEndTime = new Date(now.getTime() + (data.durationMinutes * 60 * 1000));

            await updateDoc(timerRef, {
                endTime: newEndTime.toISOString(),
                isRunning: true
            });

            return true;
        } catch (error) {
            console.error('Erreur lors de la reprise du minuteur:', error);
            return false;
        }
    },

    // Arrêter un minuteur
    async stopTimer(sessionId: string): Promise<boolean> {
        try {
            const timerRef = getTimerDocRef(sessionId);

            await updateDoc(timerRef, {
                endTime: null,
                isRunning: false,
                isComplete: false,
                durationMinutes: 0
            });

            return true;
        } catch (error) {
            console.error('Erreur lors de l\'arrêt du minuteur:', error);
            return false;
        }
    },

    // Marquer un minuteur comme terminé
    async completeTimer(sessionId: string): Promise<boolean> {
        try {
            const timerRef = getTimerDocRef(sessionId);

            await updateDoc(timerRef, {
                isRunning: false,
                isComplete: true
            });

            return true;
        } catch (error) {
            console.error('Erreur lors de la complétion du minuteur:', error);
            return false;
        }
    },

    // Supprimer complètement le minuteur de la base de données
    async removeTimer(sessionId: string): Promise<boolean> {
        try {
            const timerRef = getTimerDocRef(sessionId);
            await deleteDoc(timerRef);
            console.log('Minuteur supprimé avec succès de la base de données');
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression du minuteur:', error);
            return false;
        }
    },

    // Observer les changements du minuteur en temps réel
    onTimerUpdate(sessionId: string, callback: (data: TimerData | null) => void): () => void {
        const timerRef = getTimerDocRef(sessionId);

        return onSnapshot(
            timerRef,
            (doc) => {
                if (doc.exists()) {
                    const data = doc.data() as TimerData;
                    callback(data);
                } else {
                    callback(null);
                }
            },
            (error) => {
                console.error('Erreur lors de l\'observation du minuteur:', error);
                callback(null);
            }
        );
    }
};
// src/services/activitiesService.ts
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    onSnapshot,
    Timestamp,
} from 'firebase/firestore';
import { db } from "../config/firebase";
import { ActivityType, IceBreakerType, ActivityStatus } from '../types/types';

// Interface pour représenter une activité stockée dans Firestore
export interface ActivityData {
    id: string;
    sessionId: string;
    type: ActivityType | 'iceBreaker';
    iceBreakerType?: string;
    status: ActivityStatus;
    createdAt: Date | Timestamp | any; // Pour supporter à la fois Date et Timestamp Firebase
    startedAt?: Date | Timestamp | any;
    completedAt?: Date | Timestamp | any;
    visibleToAll: boolean; // Visible pour tous les participants ou seulement admin
    launched: boolean; // Activité lancée ou en attente
    addedBy: string; // Username de l'admin qui a ajouté l'activité
}

export const activitiesService = {
    // Ajouter une nouvelle activité (visible uniquement pour l'admin initialement)
    async addActivity(
        sessionId: string,
        type: ActivityType | 'iceBreaker',
        addedBy: string,
        iceBreakerType?: string
    ): Promise<string> {
        if (!sessionId) {
            throw new Error("ID de session requis pour ajouter une activité");
        }

        const activityData: any = {
            sessionId,
            type,
            status: 'pending' as ActivityStatus,
            createdAt: serverTimestamp(),
            visibleToAll: false, // Par défaut, visible uniquement pour l'admin
            launched: false, // Pas encore lancée
            addedBy,
        };

        // Ajouter le type d'ice breaker si c'est une activité de type ice breaker
        if (type === 'iceBreaker' && iceBreakerType) {
            activityData.iceBreakerType = iceBreakerType;
        }

        try {
            const docRef = await addDoc(collection(db, 'activities'), activityData);
            console.log(`Activité ajoutée avec succès, ID: ${docRef.id}`);
            return docRef.id;
        } catch (error) {
            console.error("Erreur lors de l'ajout de l'activité:", error);
            throw error;
        }
    },

    // Lancer une activité (la rendre visible pour tous et la marquer comme lancée)
    async launchActivity(activityId: string): Promise<boolean> {
        if (!activityId) {
            throw new Error("ID d'activité requis pour lancer une activité");
        }

        try {
            const activityRef = doc(db, 'activities', activityId);

            await updateDoc(activityRef, {
                visibleToAll: true,
                launched: true,
                status: 'active' as ActivityStatus,
                startedAt: serverTimestamp()
            });

            console.log(`Activité lancée avec succès, ID: ${activityId}`);
            return true;
        } catch (error) {
            console.error("Erreur lors du lancement de l'activité:", error);
            return false;
        }
    },

    // Terminer une activité
    async completeActivity(activityId: string): Promise<boolean> {
        if (!activityId) {
            throw new Error("ID d'activité requis pour terminer une activité");
        }

        try {
            const activityRef = doc(db, 'activities', activityId);

            await updateDoc(activityRef, {
                status: 'completed' as ActivityStatus,
                completedAt: serverTimestamp()
            });

            console.log(`Activité terminée avec succès, ID: ${activityId}`);
            return true;
        } catch (error) {
            console.error("Erreur lors de la complétion de l'activité:", error);
            return false;
        }
    },

    // Supprimer une activité
    async deleteActivity(activityId: string): Promise<boolean> {
        if (!activityId) {
            throw new Error("ID d'activité requis pour supprimer une activité");
        }

        try {
            const activityRef = doc(db, 'activities', activityId);
            await deleteDoc(activityRef);
            console.log(`Activité supprimée avec succès, ID: ${activityId}`);
            return true;
        } catch (error) {
            console.error("Erreur lors de la suppression de l'activité:", error);
            return false;
        }
    },

    // Récupérer les activités d'une session (filtrées selon si l'utilisateur est admin ou non)
    async getActivitiesBySession(sessionId: string, isAdmin: boolean): Promise<ActivityData[]> {
        if (!sessionId) {
            console.error("SessionId manquant pour récupérer les activités");
            return [];
        }

        try {
            // Construire la requête en fonction du statut d'admin
            let q;

            if (isAdmin) {
                // Admin voit toutes les activités de la session
                q = query(
                    collection(db, 'activities'),
                    where('sessionId', '==', sessionId),
                    orderBy('createdAt', 'desc')
                );
            } else {
                // Participant voit uniquement les activités marquées comme visibles pour tous
                q = query(
                    collection(db, 'activities'),
                    where('sessionId', '==', sessionId),
                    where('visibleToAll', '==', true),
                    orderBy('createdAt', 'desc')
                );
            }

            const querySnapshot = await getDocs(q);

            const activities = querySnapshot.docs.map(doc => {
                const data = doc.data();

                // Convertir les timestamps en dates
                let createdAt = data.createdAt;
                if (createdAt && 'toDate' in createdAt) {
                    createdAt = createdAt.toDate();
                }

                let startedAt = data.startedAt;
                if (startedAt && 'toDate' in startedAt) {
                    startedAt = startedAt.toDate();
                }

                let completedAt = data.completedAt;
                if (completedAt && 'toDate' in completedAt) {
                    completedAt = completedAt.toDate();
                }

                return {
                    id: doc.id,
                    ...data,
                    createdAt,
                    startedAt,
                    completedAt
                } as ActivityData;
            });

            console.log(`${activities.length} activités récupérées pour la session ${sessionId}`);
            return activities;
        } catch (error) {
            console.error("Erreur lors de la récupération des activités:", error);
            return [];
        }
    },

    // Observer les changements sur les activités d'une session en temps réel
    onActivitiesUpdate(sessionId: string, isAdmin: boolean, callback: (activities: ActivityData[]) => void): () => void {
        if (!sessionId) {
            console.error("SessionId manquant pour l'écoute des activités");
            callback([]);
            return () => {}; // Retourner une fonction de nettoyage vide
        }

        try {
            // Construire la requête en fonction du statut d'admin
            let q;

            if (isAdmin) {
                // Admin voit toutes les activités de la session
                q = query(
                    collection(db, 'activities'),
                    where('sessionId', '==', sessionId),
                    orderBy('createdAt', 'desc')
                );
            } else {
                // Participant voit uniquement les activités marquées comme visibles pour tous
                q = query(
                    collection(db, 'activities'),
                    where('sessionId', '==', sessionId),
                    where('visibleToAll', '==', true),
                    orderBy('createdAt', 'desc')
                );
            }

            // Écouter les changements
            return onSnapshot(q, (querySnapshot) => {
                const activities = querySnapshot.docs.map(doc => {
                    const data = doc.data();

                    // Convertir les timestamps en dates
                    let createdAt = data.createdAt;
                    if (createdAt && 'toDate' in createdAt) {
                        createdAt = createdAt.toDate();
                    }

                    let startedAt = data.startedAt;
                    if (startedAt && 'toDate' in startedAt) {
                        startedAt = startedAt.toDate();
                    }

                    let completedAt = data.completedAt;
                    if (completedAt && 'toDate' in completedAt) {
                        completedAt = completedAt.toDate();
                    }

                    return {
                        id: doc.id,
                        ...data,
                        createdAt,
                        startedAt,
                        completedAt
                    } as ActivityData;
                });

                callback(activities);
            });
        } catch (error) {
            console.error("Erreur lors de la configuration de l'écoute des activités:", error);
            callback([]);
            return () => {}; // Retourner une fonction de nettoyage vide
        }
    }
};
// src/services/firebaseService.ts
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
    runTransaction,
    Timestamp,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { Session, Card, ActivityType, ColumnType, SessionStatus } from '../types/types';
import {db} from "../config/firebase";
import {userService} from "./userService";

// Type pour les participants
export interface Participant {
    id: string;
    username: string;
    joinedAt: Date | Timestamp;
}

// Gestion des sessions de rétrospective
export const sessionsService = {
    // Créer une nouvelle session
    async createSession(): Promise<string> {
        // Générer un code court pour la session (pour faciliter l'accès)
        const sessionCode = nanoid(6);

        // Récupérer le vrai nom d'utilisateur depuis localStorage
        const currentUsername = userService.getUserName();

        // Si pas de nom d'utilisateur, demander à l'utilisateur d'en définir un
        if (!currentUsername || !currentUsername.trim()) {
            throw new Error("Un nom d'utilisateur est requis pour créer une session");
        }

        const sessionData: any = {
            // Plus de champ activityType
            sessionType: 'standard', // Valeur générique, utilisée uniquement pour compatibilité
            status: 'open' as SessionStatus,
            createdBy: currentUsername,
            adminId: currentUsername,
            createdAt: serverTimestamp(),
            code: sessionCode,
            participants: [] // Initialiser un tableau vide de participants
        };


        // Laisser Firebase générer l'ID
        const docRef = await addDoc(collection(db, 'sessions'), sessionData);

        // Ajouter automatiquement le créateur comme premier participant
        await this.addParticipant(docRef.id, currentUsername);

        return docRef.id;
    },

    async setSessionCardsVisibility(sessionId: string, visible: boolean): Promise<boolean> {
        if (!sessionId) {
            console.error("SessionId manquant pour la mise à jour de la visibilité des cartes");
            return false;
        }

        try {
            const sessionRef = doc(db, 'sessions', sessionId);
            await updateDoc(sessionRef, {
                cardsVisible: visible,
                lastUpdated: serverTimestamp()
            });
            console.log(`Visibilité des cartes de la session ${sessionId} définie à: ${visible}`);
            return true;
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la visibilité des cartes:", error);
            return false;
        }
    },

    async setActivityCardsVisibility(sessionId: string, activityId: string, visible: boolean): Promise<boolean> {
        if (!sessionId || !activityId) {
            console.error("SessionId ou ActivityId manquant pour la mise à jour de la visibilité des cartes");
            return false;
        }

        try {
            const activityRef = doc(db, 'activities', activityId);
            await updateDoc(activityRef, {
                cardsVisible: visible,
                lastUpdated: serverTimestamp()
            });
            console.log(`Visibilité des cartes de l'activité ${activityId} définie à: ${visible}`);
            return true;
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la visibilité des cartes de l'activité:", error);
            return false;
        }
    },

    async setCurrentActivity(sessionId: string, activityId: string | null): Promise<boolean> {
        if (!sessionId) {
            console.error("❌ SessionId missing for setting current activity");
            return false;
        }

        try {
            console.log(`📝 Setting current activity: sessionId=${sessionId}, activityId=${activityId}`);

            const sessionRef = doc(db, 'sessions', sessionId);

            // Verify the session exists first
            const sessionDoc = await getDoc(sessionRef);
            if (!sessionDoc.exists()) {
                console.error(`❌ Session ${sessionId} does not exist`);
                return false;
            }

            // Log the current state before update
            console.log(`Session before update:`, sessionDoc.data());

            // Using simple updateDoc instead of transaction for more reliable updates
            await updateDoc(sessionRef, {
                currentActivityId: activityId,
                lastUpdated: serverTimestamp()
            });

            // Add a small delay before verification
            await new Promise(resolve => setTimeout(resolve, 200));

            // Verify the update was successful
            const updatedSessionDoc = await getDoc(sessionRef);
            const updatedData = updatedSessionDoc.data();

            console.log(`Session after update:`, updatedData);

            // Verify update was successful
            const updateSuccessful = updatedData &&
                ((activityId === null && !updatedData.currentActivityId) ||
                    (activityId !== null && updatedData.currentActivityId === activityId));

            if (updateSuccessful) {
                console.log(`✅ Current activity of session ${sessionId} set to: ${activityId}`);
                return true;
            } else {
                console.error(`❌ Update failed: currentActivityId = ${updatedData?.currentActivityId}, expected = ${activityId}`);

                // If first attempt failed, try one more time
                console.log("Retrying update...");

                // Second attempt with direct update
                await updateDoc(sessionRef, {
                    currentActivityId: activityId,
                    lastUpdated: serverTimestamp()
                });

                // Verify second attempt
                await new Promise(resolve => setTimeout(resolve, 500));
                const retryDoc = await getDoc(sessionRef);
                const retryData = retryDoc.data();

                const retrySuccessful = retryData &&
                    ((activityId === null && !retryData.currentActivityId) ||
                        (activityId !== null && retryData.currentActivityId === activityId));

                if (retrySuccessful) {
                    console.log(`✅ Retry successful: Current activity set to: ${activityId}`);
                    return true;
                } else {
                    console.error(`❌ Retry failed: currentActivityId = ${retryData?.currentActivityId}`);
                    return false;
                }
            }
        } catch (error) {
            console.error("❌ Error setting current activity:", error);
            return false;
        }
    },


    async addParticipant(sessionId: string, username: string): Promise<string> {
        if (!sessionId || !username.trim()) {
            throw new Error("SessionId et username requis pour ajouter un participant");
        }

        try {
            // Vérifier si la session existe
            const sessionRef = doc(db, 'sessions', sessionId);
            const sessionDoc = await getDoc(sessionRef);

            if (!sessionDoc.exists()) {
                throw new Error(`Session ${sessionId} n'existe pas`);
            }

            // Récupérer les participants actuels
            const sessionData = sessionDoc.data();
            const currentParticipants = sessionData?.participants || [];

            // Vérifier si le nom d'utilisateur existe déjà dans cette session
            const usernameExists = currentParticipants.some(
                (participant: any) => participant.username.toLowerCase() === username.trim().toLowerCase()
            );

            if (usernameExists) {
                console.log(`Le nom d'utilisateur "${username}" existe déjà dans la session ${sessionId}. Le participant ne sera pas ajouté à nouveau.`);

                // Trouver et retourner l'ID du participant existant
                const existingParticipant = currentParticipants.find(
                    (participant: any) => participant.username.toLowerCase() === username.trim().toLowerCase()
                );

                return existingParticipant.id;
            }

            // Si le nom n'existe pas encore, générer un ID unique pour le participant
            const participantId = nanoid(8);

            // Créer l'objet participant avec une date JavaScript normale
            const participantData = {
                id: participantId,
                username: username.trim(),
                joinedAt: new Date().toISOString(), // Utiliser une chaîne ISO pour éviter des problèmes de sérialisation
                status: 'online'
            };

            // Ajouter le nouveau participant
            const updatedParticipants = [...currentParticipants, participantData];

            // Mettre à jour le document avec la liste complète des participants
            await updateDoc(sessionRef, {
                participants: updatedParticipants
            });

            console.log(`Participant ${username} ajouté avec succès à la session ${sessionId}`);
            return participantId;
        } catch (error) {
            console.error("Erreur lors de l'ajout du participant:", error);
            throw error;
        }
    },

    // Récupérer les participants d'une session
    async getSessionParticipants(sessionId: string): Promise<Participant[]> {
        if (!sessionId) {
            console.error("SessionId manquant pour récupérer les participants");
            return [];
        }

        try {
            const docRef = doc(db, 'sessions', sessionId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists() && docSnap.data().participants) {
                const data = docSnap.data();
                const participants = data.participants || [];

                // Convertir les Timestamps en Date
                return participants.map((participant: any) => {
                    if (participant.joinedAt &&
                        typeof participant.joinedAt === 'object' &&
                        'toDate' in participant.joinedAt) {
                        return {
                            ...participant,
                            joinedAt: participant.joinedAt.toDate()
                        };
                    }
                    return participant;
                });
            }
            return [];
        } catch (error) {
            console.error("Erreur lors de la récupération des participants:", error);
            return [];
        }
    },

    // Observer les participants en temps réel
    onParticipantsUpdate(sessionId: string, callback: (participants: Participant[]) => void) {
        if (!sessionId) {
            console.error("SessionId manquant pour l'écoute des participants");
            callback([]);
            return () => {}; // Retourner une fonction de nettoyage vide
        }

        try {
            const docRef = doc(db, 'sessions', sessionId);

            return onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists() && docSnap.data().participants) {
                    const data = docSnap.data();
                    const participants = data.participants || [];

                    // Convertir les Timestamps en Date
                    const processedParticipants = participants.map((participant: any) => {
                        if (participant.joinedAt &&
                            typeof participant.joinedAt === 'object' &&
                            'toDate' in participant.joinedAt) {
                            return {
                                ...participant,
                                joinedAt: participant.joinedAt.toDate()
                            };
                        }
                        return participant;
                    });

                    callback(processedParticipants);
                } else {
                    callback([]);
                }
            });
        } catch (error) {
            console.error("Erreur dans onParticipantsUpdate:", error);
            callback([]);
            return () => {};
        }
    },

    // Récupérer une session par ID
    async getSessionById(sessionId: string): Promise<Session | null> {
        if (!sessionId) {
            console.error("SessionId manquant");
            return null;
        }

        try {
            const docRef = doc(db, 'sessions', sessionId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                // Vérifier que les données attendues sont présentes
                if (!data.activityType) {
                    console.warn("La session existe mais activityType manquant:", sessionId);
                    // Continuer quand même, peut-être que les données sont juste mal formatées
                }

                // Gérer correctement les dates
                let createdAt: Date;
                if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                    createdAt = data.createdAt.toDate();
                } else if (data.createdAt) {
                    createdAt = new Date(data.createdAt);
                } else {
                    createdAt = new Date();
                }

                return {
                    id: docSnap.id,
                    status: data.status || 'open',
                    createdBy: data.createdBy || 'Unknown',
                    adminId: data.adminId || data.createdBy || 'Unknown', // Ajouter adminId
                    createdAt: createdAt,
                    participants: data.participants || []
                };
            } else {
                console.log("Session non trouvée:", sessionId);
                return null;
            }
        } catch (error) {
            console.error("Erreur lors de la récupération de la session:", error);
            // Retourner null au lieu de laisser l'erreur se propager
            return null;
        }
    },

    async isSessionAdmin(sessionId: string, username: string): Promise<boolean> {
        if (!sessionId || !username) return false;

        try {
            const session = await this.getSessionById(sessionId);
            if (!session) return false;

            // Vérifier d'abord adminId, puis createdBy
            return (
                (session.adminId && session.adminId === username) ||
                (session.createdBy === username && session.createdBy !== "temp-session-creator")
            );
        } catch (error) {
            console.error("Erreur lors de la vérification du statut d'administrateur:", error);
            return false;
        }
    },

    // Récupérer une session par code
    async getSessionByCode(code: string): Promise<Session | null> {
        if (!code || !code.trim()) {
            console.error("Code de session manquant");
            return null;
        }

        const q = query(collection(db, 'sessions'), where('code', '==', code.trim()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            const data = docSnap.data();

            // Gérer correctement les dates
            let createdAt: Date;
            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                createdAt = data.createdAt.toDate();
            } else if (data.createdAt) {
                createdAt = new Date(data.createdAt);
            } else {
                createdAt = new Date();
            }

            return {
                id: docSnap.id,
                status: data.status,
                createdBy: data.createdBy,
                adminId: data.adminId || data.createdBy,
                createdAt: createdAt,
                participants: data.participants || []
            };
        }
        return null;
    },

    async createSessionWithTemporaryAdmin(activityType: ActivityType): Promise<string> {
        // Générer un code court pour la session
        const sessionCode = nanoid(6);

        const sessionData: any = {
            activityType,
            status: 'open' as SessionStatus,
            createdBy: "temp-session-creator",
            adminId: null,
            createdAt: serverTimestamp(),
            code: sessionCode,
            participants: []
        };

        console.log("Création d'une session avec administrateur temporaire");

        // Laisser Firebase générer l'ID
        const docRef = await addDoc(collection(db, 'sessions'), sessionData);

        return docRef.id;
    },

    async updateSessionAdmin(sessionId: string, username: string): Promise<boolean> {
        if (!sessionId || !username.trim()) {
            console.error("SessionId et nom d'utilisateur requis pour définir l'administrateur");
            return false;
        }

        try {
            const sessionRef = doc(db, 'sessions', sessionId);

            // Mise à jour des deux champs pour assurer la compatibilité avec le code existant
            await updateDoc(sessionRef, {
                adminId: username.trim(),
                createdBy: username.trim()
            });

            console.log(`Administrateur de la session ${sessionId} défini: ${username}`);
            return true;
        } catch (error) {
            console.error("Erreur lors de la définition de l'administrateur:", error);
            return false;
        }
    },

    // Mettre à jour le statut d'une session
    async updateSessionStatus(sessionId: string, status: SessionStatus): Promise<void> {
        if (!sessionId) {
            console.error("SessionId manquant pour la mise à jour du statut");
            throw new Error("SessionId requis pour mettre à jour le statut d'une session");
        }

        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, { status });
    },

    // Fermer une session
    async closeSession(sessionId: string): Promise<void> {
        if (!sessionId) {
            console.error("SessionId manquant pour la fermeture/suppression de session");
            throw new Error("SessionId requis pour fermer et supprimer une session");
        }

        try {
            console.log(`Début de la suppression de la session ${sessionId} et de ses données associées`);

            // Obtenir une référence à la session
            const sessionRef = doc(db, 'sessions', sessionId);

            // 1. D'abord marquer la session comme fermée (pour la compatibilité avec les anciens clients)
            await updateDoc(sessionRef, { status: 'closed' });
            console.log(`Session ${sessionId} marquée comme fermée`);

            // 2. Récupérer tous les documents liés à cette session
            // a. Cartes
            const cardsQuery = query(collection(db, 'cards'), where('sessionId', '==', sessionId));
            const cardsSnapshot = await getDocs(cardsQuery);
            console.log(`${cardsSnapshot.docs.length} cartes trouvées pour suppression`);

            // b. Activités
            const activitiesQuery = query(collection(db, 'activities'), where('sessionId', '==', sessionId));
            const activitiesSnapshot = await getDocs(activitiesQuery);
            console.log(`${activitiesSnapshot.docs.length} activités trouvées pour suppression`);

            // 3. Supprimer toutes les cartes
            const deleteCards = cardsSnapshot.docs.map(doc => {
                console.log(`Suppression de la carte ${doc.id}`);
                return deleteDoc(doc.ref);
            });

            // 4. Supprimer toutes les activités
            const deleteActivities = activitiesSnapshot.docs.map(doc => {
                console.log(`Suppression de l'activité ${doc.id}`);
                return deleteDoc(doc.ref);
            });

            // 5. Exécuter toutes les suppressions en parallèle
            console.log("Exécution des suppressions en parallèle...");
            await Promise.all([...deleteCards, ...deleteActivities]);

            // 6. Finalement, supprimer la session elle-même
            console.log(`Suppression de la session ${sessionId}`);
            await deleteDoc(sessionRef);

            console.log(`Session ${sessionId} et toutes ses données associées supprimées avec succès`);
        } catch (error) {
            console.error("Erreur lors de la suppression de la session et ses données:", error);
            throw error;
        }
    },

    // Mettre en pause une session
    async pauseSession(sessionId: string): Promise<void> {
        await this.updateSessionStatus(sessionId, 'paused');
    },

    // Reprendre une session mise en pause
    async resumeSession(sessionId: string): Promise<void> {
        await this.updateSessionStatus(sessionId, 'open');
    },

    // Écouter les changements sur une session (temps réel)
    onSessionUpdate(sessionId: string, callback: (session: Session | null) => void) {
        if (!sessionId) {
            console.error("SessionId missing for listening");
            callback(null);
            return () => {}; // Return empty cleanup function
        }

        try {
            const docRef = doc(db, 'sessions', sessionId);

            // Use onSnapshot with options for better reliability
            return onSnapshot(
                docRef,
                { includeMetadataChanges: true }, // This helps detect online/offline changes
                (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        try {
                            // Process timestamp correctly
                            let createdAt: Date;
                            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                                createdAt = data.createdAt.toDate();
                            } else if (data.createdAt) {
                                createdAt = new Date(data.createdAt);
                            } else {
                                createdAt = new Date();
                            }

                            const session: Session = {
                                id: docSnap.id,
                                status: data.status || 'open',
                                createdBy: data.createdBy || 'Unknown',
                                adminId: data.adminId || data.createdBy || 'Unknown',
                                createdAt: createdAt,
                                participants: data.participants || [],
                                currentActivityId: data.currentActivityId || null,
                            };

                            console.log(`Session update received:`, {
                                id: session.id,
                                status: session.status,
                                currentActivityId: session.currentActivityId
                            });

                            callback(session);
                        } catch (error) {
                            console.error("Error processing session data:", error);
                        }
                    } else {
                        console.log("Session does not exist:", sessionId);
                        callback(null);
                    }
                },
                (error) => {
                    console.error("Error in session listener:", error);
                }
            );
        } catch (error) {
            console.error("Exception setting up session listener:", error);
            return () => {};
        }
    }
};

// Gestion des cartes
export const cardsService = {
    // Ajouter une nouvelle carte
    async addCard(sessionId: string, text: string, type: ColumnType, author?: string): Promise<string> {
        if (!sessionId) {
            console.error("SessionId manquant pour l'ajout de carte");
            throw new Error("SessionId requis pour ajouter une carte");
        }

        console.log("Ajout de carte:", { sessionId, text, type, author });

        const cardData = {
            sessionId, // Vérifiez que cette valeur est bien celle attendue
            text: text.trim(),
            type,
            author: author?.trim() || 'Anonyme',
            createdAt: serverTimestamp()
        };

        try {
            // Ajouter la carte avec une tentative de nouvelle tentative en cas d'échec
            const addCardWithRetry = async (attempt = 0): Promise<string> => {
                try {
                    const docRef = await addDoc(collection(db, 'cards'), cardData);
                    console.log("Carte ajoutée avec succès, ID:", docRef.id);
                    return docRef.id;
                } catch (error) {
                    if (attempt < 2) {  // Tenter jusqu'à 3 fois (0, 1, 2)
                        console.warn("Échec de l'ajout de carte, tentative", attempt + 1, ":", error);
                        await new Promise(resolve => setTimeout(resolve, 1000));  // Attendre 1 seconde
                        return addCardWithRetry(attempt + 1);
                    } else {
                        throw error;  // Propager l'erreur après les tentatives
                    }
                }
            };

            return await addCardWithRetry();
        } catch (error) {
            console.error("Erreur finale lors de l'ajout de la carte:", error);
            throw error;
        }
    },

    // Récupérer les cartes d'une session
    async getCardsBySession(sessionId: string): Promise<Card[]> {
        if (!sessionId) {
            console.error("SessionId manquant pour la récupération des cartes");
            return [];
        }

        console.log("Récupération des cartes pour la session:", sessionId);

        try {
            const q = query(
                collection(db, 'cards'),
                where('sessionId', '==', sessionId),
                orderBy('createdAt', 'asc')
            );

            const querySnapshot = await getDocs(q);
            const cards = querySnapshot.docs.map(doc => {
                const data = doc.data();

                // Gérer le cas où createdAt est un Timestamp Firebase, null ou undefined
                let createdAt;
                if (data.createdAt instanceof Timestamp) {
                    createdAt = data.createdAt.toDate();
                } else if (data.createdAt) {
                    // Tenter de convertir si c'est un objet ou une chaîne
                    createdAt = new Date(data.createdAt);
                } else {
                    // Fallback sur la date actuelle
                    createdAt = new Date();
                }

                return {
                    id: doc.id,
                    sessionId: data.sessionId,
                    text: data.text || "",
                    author: data.author || "Anonyme",
                    type: data.type,
                    createdAt: createdAt,
                };
            });

            console.log("Cartes récupérées:", cards.length);
            return cards;
        } catch (error) {
            console.error("Erreur lors de la récupération des cartes:", error);
            throw error;
        }
    },

    // Écouter les cartes d'une session en temps réel
    onCardsUpdate(sessionId: string, callback: (cards: Card[]) => void) {
        if (!sessionId) {
            console.error("SessionId manquant pour l'écoute des cartes");
            callback([]);
            return () => {}; // Retourner une fonction de nettoyage vide
        }
        try {
            const q = query(
                collection(db, 'cards'),
                where('sessionId', '==', sessionId),
                orderBy('createdAt', 'asc')
            );

            return onSnapshot(q,
                // Succès
                (querySnapshot) => {
                    // Code existant pour traiter les documents
                    const cards = querySnapshot.docs.map(doc => {
                        const data = doc.data();

                        // Gérer le cas où createdAt est un Timestamp Firebase, null ou undefined
                        let createdAt;
                        if (data.createdAt instanceof Timestamp) {
                            createdAt = data.createdAt.toDate();
                        } else if (data.createdAt) {
                            // Tenter de convertir si c'est un objet ou une chaîne
                            createdAt = new Date(data.createdAt);
                        } else {
                            // Fallback sur la date actuelle
                            createdAt = new Date();
                        }

                        return {
                            id: doc.id,
                            sessionId: data.sessionId,
                            text: data.text || "",
                            author: data.author || "Anonyme",
                            type: data.type,
                            createdAt: createdAt,
                        };
                    });

                    callback(cards);
                },
                // Erreur
                (error) => {
                    console.error("Erreur dans l'écoute des cartes:", error);
                    // On ne vide pas les cartes en cas d'erreur pour éviter de perdre l'état
                }
            );
        } catch (error) {
            console.error("Exception lors de la configuration de l'écoute des cartes:", error);
            return () => {}; // Retourner une fonction de nettoyage vide
        }
    },

    // Supprimer une carte
    async deleteCard(cardId: string): Promise<void> {
        if (!cardId) {
            console.error("CardId manquant pour la suppression");
            throw new Error("CardId requis pour supprimer une carte");
        }

        try {
            await deleteDoc(doc(db, 'cards', cardId));
        } catch (error) {
            console.error("Erreur lors de la suppression de la carte:", error);
            throw error;
        }
    },

    // Mettre à jour une carte
    async updateCard(cardId: string, text: string): Promise<void> {
        if (!cardId) {
            console.error("CardId manquant pour la mise à jour");
            throw new Error("CardId requis pour mettre à jour une carte");
        }

        try {
            const cardRef = doc(db, 'cards', cardId);
            await updateDoc(cardRef, { text: text.trim() });
            console.log("Carte mise à jour avec succès:", cardId);
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la carte:", error);
            throw error;
        }
    },

    // Basculer la visibilité d'une carte individuelle
    async toggleCardVisibility(cardId: string, isVisible: boolean): Promise<boolean> {
        if (!cardId) {
            console.error("CardId manquant pour basculer la visibilité");
            return false;
        }

        try {
            const cardRef = doc(db, 'cards', cardId);
            await updateDoc(cardRef, {
                isVisible: isVisible,
                lastUpdated: serverTimestamp()
            });
            console.log(`Visibilité de la carte ${cardId} définie à: ${isVisible}`);
            return true;
        } catch (error) {
            console.error("Erreur lors de la modification de la visibilité de la carte:", error);
            return false;
        }
    },

    // Basculer la visibilité de toutes les cartes d'une colonne
    async toggleColumnCardsVisibility(sessionId: string, columnType: ColumnType, isVisible: boolean): Promise<boolean> {
        if (!sessionId || !columnType) {
            console.error("SessionId ou columnType manquant pour basculer la visibilité de la colonne");
            return false;
        }

        try {
            const q = query(
                collection(db, 'cards'),
                where('sessionId', '==', sessionId),
                where('type', '==', columnType)
            );

            const querySnapshot = await getDocs(q);
            const updatePromises = querySnapshot.docs.map(cardDoc =>
                updateDoc(cardDoc.ref, {
                    isVisible: isVisible,
                    lastUpdated: serverTimestamp()
                })
            );

            await Promise.all(updatePromises);
            console.log(`Visibilité de ${querySnapshot.docs.length} cartes de la colonne ${columnType} définie à: ${isVisible}`);
            return true;
        } catch (error) {
            console.error("Erreur lors de la modification de la visibilité des cartes de la colonne:", error);
            return false;
        }
    },

    // Révéler toutes les cartes d'une session
    async revealAllCards(sessionId: string): Promise<boolean> {
        if (!sessionId) {
            console.error("SessionId manquant pour révéler toutes les cartes");
            return false;
        }

        try {
            const q = query(
                collection(db, 'cards'),
                where('sessionId', '==', sessionId)
            );

            const querySnapshot = await getDocs(q);
            const updatePromises = querySnapshot.docs.map(cardDoc =>
                updateDoc(cardDoc.ref, {
                    isVisible: true,
                    lastUpdated: serverTimestamp()
                })
            );

            await Promise.all(updatePromises);
            console.log(`${querySnapshot.docs.length} cartes révélées pour la session ${sessionId}`);
            return true;
        } catch (error) {
            console.error("Erreur lors de la révélation de toutes les cartes:", error);
            return false;
        }
    },

    // Masquer toutes les cartes d'une session
    async hideAllCards(sessionId: string): Promise<boolean> {
        if (!sessionId) {
            console.error("SessionId manquant pour masquer toutes les cartes");
            return false;
        }

        try {
            const q = query(
                collection(db, 'cards'),
                where('sessionId', '==', sessionId)
            );

            const querySnapshot = await getDocs(q);
            const updatePromises = querySnapshot.docs.map(cardDoc =>
                updateDoc(cardDoc.ref, {
                    isVisible: false,
                    lastUpdated: serverTimestamp()
                })
            );

            await Promise.all(updatePromises);
            console.log(`${querySnapshot.docs.length} cartes masquées pour la session ${sessionId}`);
            return true;
        } catch (error) {
            console.error("Erreur lors du masquage de toutes les cartes:", error);
            return false;
        }
    },

    // Récupérer les cartes avec filtrage par visibilité
    async getCardsBySessionWithVisibility(sessionId: string, isAdmin?: boolean): Promise<Card[]> {
        if (!sessionId) {
            console.error("SessionId manquant pour la récupération des cartes");
            return [];
        }

        try {
            let q;

            if (isAdmin === true) {
                // Admin voit toutes les cartes
                q = query(
                    collection(db, 'cards'),
                    where('sessionId', '==', sessionId),
                    orderBy('createdAt', 'asc')
                );
            } else {
                // Participants ne voient que les cartes visibles
                q = query(
                    collection(db, 'cards'),
                    where('sessionId', '==', sessionId),
                    where('isVisible', '==', true),
                    orderBy('createdAt', 'asc')
                );
            }

            const querySnapshot = await getDocs(q);
            const cards = querySnapshot.docs.map(doc => {
                const data = doc.data();

                let createdAt;
                if (data.createdAt instanceof Timestamp) {
                    createdAt = data.createdAt.toDate();
                } else if (data.createdAt) {
                    createdAt = new Date(data.createdAt);
                } else {
                    createdAt = new Date();
                }

                return {
                    id: doc.id,
                    sessionId: data.sessionId,
                    text: data.text || "",
                    author: data.author || "Anonyme",
                    type: data.type,
                    createdAt: createdAt,
                    isVisible: data.isVisible !== false, // Par défaut visible si non spécifié
                };
            });

            console.log(`Cartes récupérées avec filtrage visibilité: ${cards.length} (admin: ${isAdmin})`);
            return cards;
        } catch (error) {
            console.error("Erreur lors de la récupération des cartes avec visibilité:", error);
            return [];
        }
    },

    // Modifier l'ajout de carte pour prendre en compte la visibilité par défaut
    async addCardWithVisibility(sessionId: string, text: string, type: ColumnType, author?: string, isVisible: boolean = false): Promise<string> {
        if (!sessionId) {
            console.error("SessionId manquant pour l'ajout de carte");
            throw new Error("SessionId requis pour ajouter une carte");
        }

        const cardData = {
            sessionId,
            text: text.trim(),
            type,
            author: author?.trim() || 'Anonyme',
            createdAt: serverTimestamp(),
            isVisible: isVisible // Par défaut masquée
        };

        try {
            const docRef = await addDoc(collection(db, 'cards'), cardData);
            console.log("Carte ajoutée avec visibilité:", docRef.id, "visible:", isVisible);
            return docRef.id;
        } catch (error) {
            console.error("Erreur lors de l'ajout de la carte avec visibilité:", error);
            throw error;
        }
    },
};
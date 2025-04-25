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

        console.log("Création d'une session avec administrateur:", currentUsername);

        // Laisser Firebase générer l'ID
        const docRef = await addDoc(collection(db, 'sessions'), sessionData);

        // Ajouter automatiquement le créateur comme premier participant
        await this.addParticipant(docRef.id, currentUsername);

        return docRef.id;
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

            console.log(`Ajout du participant ${username} (${participantId}) à la session ${sessionId}`);

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
        await this.updateSessionStatus(sessionId, 'closed');
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
            console.error("SessionId manquant pour l'écoute");
            callback(null);
            return () => {}; // Retourner une fonction de nettoyage vide
        }

        // Tenter d'abord de récupérer la session directement
        this.getSessionById(sessionId)
            .then(session => {
                if (session) {
                    callback(session);
                }
            })
            .catch(error => {
                console.error("Erreur lors de la récupération initiale de la session:", error);
            });

        try {
            const docRef = doc(db, 'sessions', sessionId);

            // Utiliser onSnapshot avec options pour une meilleure fiabilité
            return onSnapshot(
                docRef,
                { includeMetadataChanges: true }, // Cette option aide à détecter les changements offline/online
                // Succès
                (docSnap) => {
                    console.log("Mise à jour reçue pour la session:", sessionId, "existe:", docSnap.exists());
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        try {
                            // Gérer correctement les dates
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
                                adminId: data.adminId || data.createdBy || 'Unknown', // Ajouter adminId
                                createdAt: createdAt,
                                participants: data.participants || []
                            };

                            callback(session);
                        } catch (error) {
                            console.error("Erreur lors du traitement des données de session:", error);
                            // Ne pas appeler callback(null) pour éviter de perdre l'état en cas d'erreur temporaire
                        }
                    } else {
                        console.log("La session n'existe pas:", sessionId);
                        callback(null);
                    }
                },
                // Erreur
                (error) => {
                    console.error("Erreur dans onSessionUpdate:", error);
                    // Ne pas mettre callback(null) ici pour éviter de perdre l'état en cas d'erreur temporaire
                }
            );
        } catch (error) {
            console.error("Exception dans onSessionUpdate:", error);
            // Si on ne peut pas configurer le listener, on retourne une fonction vide
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

        console.log("Initialisation de l'écoute des cartes pour la session:", sessionId);

        try {
            const q = query(
                collection(db, 'cards'),
                where('sessionId', '==', sessionId),
                orderBy('createdAt', 'asc')
            );

            return onSnapshot(q,
                // Succès
                (querySnapshot) => {
                    console.log("Mise à jour reçue avec", querySnapshot.docs.length, "documents");
                    console.log("Documents IDs:", querySnapshot.docs.map(doc => doc.id));

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

                    console.log("Cartes traitées et envoyées:", cards.length);
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
            console.log("Carte supprimée avec succès:", cardId);
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
    }
};
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
    Timestamp
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { Session, Card, ActivityType, ColumnType } from '../types/types';
import {db} from "../config/firebase";

// Gestion des sessions de rétrospective
export const sessionsService = {
    // Créer une nouvelle session
    async createSession(activityType: ActivityType, createdBy: string): Promise<string> {
        // Générer un code court pour la session (pour faciliter l'accès)
        const sessionCode = nanoid(6);

        const sessionData = {
            activityType,
            status: 'open',
            createdBy,
            createdAt: serverTimestamp(),
            code: sessionCode
        };

        // Option 1: Laisser Firebase générer l'ID
        const docRef = await addDoc(collection(db, 'sessions'), sessionData);
        return docRef.id;

        // Option 2: Utiliser un ID personnalisé
        // const sessionId = nanoid(10);
        // await setDoc(doc(db, 'sessions', sessionId), sessionData);
        // return sessionId;
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
                    activityType: data.activityType,
                    status: data.status || 'open',
                    createdBy: data.createdBy || 'Unknown',
                    createdAt: createdAt,
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
            return {
                id: docSnap.id,
                activityType: data.activityType,
                status: data.status,
                createdBy: data.createdBy,
                createdAt: data.createdAt?.toDate() || new Date(),
            };
        }
        return null;
    },

    // Fermer une session
    async closeSession(sessionId: string): Promise<void> {
        if (!sessionId) {
            console.error("SessionId manquant pour la fermeture");
            throw new Error("SessionId requis pour fermer une session");
        }

        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
            status: 'closed'
        });
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
                                activityType: data.activityType,
                                status: data.status || 'open',
                                createdBy: data.createdBy || 'Unknown',
                                createdAt: createdAt,
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

            // REMPLACEZ LE CODE EXISTANT DE onSnapshot PAR CELUI-CI
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
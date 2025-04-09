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
    onSnapshot
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
        const docRef = doc(db, 'sessions', sessionId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                activityType: data.activityType,
                status: data.status,
                createdBy: data.createdBy,
                createdAt: data.createdAt.toDate(),
            };
        }
        return null;
    },

    // Récupérer une session par code
    async getSessionByCode(code: string): Promise<Session | null> {
        const q = query(collection(db, 'sessions'), where('code', '==', code));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            const data = docSnap.data();
            return {
                id: docSnap.id,
                activityType: data.activityType,
                status: data.status,
                createdBy: data.createdBy,
                createdAt: data.createdAt.toDate(),
            };
        }
        return null;
    },

    // Fermer une session
    async closeSession(sessionId: string): Promise<void> {
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
            status: 'closed'
        });
    },

    // Écouter les changements sur une session (temps réel)
    onSessionUpdate(sessionId: string, callback: (session: Session | null) => void) {
        const docRef = doc(db, 'sessions', sessionId);

        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                callback({
                    id: docSnap.id,
                    activityType: data.activityType,
                    status: data.status,
                    createdBy: data.createdBy,
                    createdAt: data.createdAt.toDate(),
                });
            } else {
                callback(null);
            }
        });
    }
};

// Gestion des cartes
export const cardsService = {
    // Ajouter une nouvelle carte
    async addCard(sessionId: string, text: string, type: ColumnType, author?: string): Promise<string> {
        const cardData = {
            sessionId,
            text,
            type,
            author: author || 'Anonyme',
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'cards'), cardData);
        return docRef.id;
    },

    // Récupérer les cartes d'une session
    async getCardsBySession(sessionId: string): Promise<Card[]> {
        const q = query(
            collection(db, 'cards'),
            where('sessionId', '==', sessionId),
            orderBy('createdAt', 'asc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                sessionId: data.sessionId,
                text: data.text,
                author: data.author,
                type: data.type,
                createdAt: data.createdAt.toDate(),
            };
        });
    },

    // Écouter les cartes d'une session en temps réel
    onCardsUpdate(sessionId: string, callback: (cards: Card[]) => void) {
        const q = query(
            collection(db, 'cards'),
            where('sessionId', '==', sessionId),
            orderBy('createdAt', 'asc')
        );

        return onSnapshot(q, (querySnapshot) => {
            const cards = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    sessionId: data.sessionId,
                    text: data.text,
                    author: data.author,
                    type: data.type,
                    createdAt: data.createdAt.toDate(),
                };
            });

            callback(cards);
        });
    },

    // Supprimer une carte
    async deleteCard(cardId: string): Promise<void> {
        await deleteDoc(doc(db, 'cards', cardId));
    },

    // Mettre à jour une carte
    async updateCard(cardId: string, text: string): Promise<void> {
        const cardRef = doc(db, 'cards', cardId);
        await updateDoc(cardRef, { text });
    }
};
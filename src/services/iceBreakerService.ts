// src/services/iceBreakerService.ts
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
import { db } from '../config/firebase';
import { Participant } from '../types/types';

// Interface for Fun Express Questions
export interface FunExpressQuestion {
    id: string;
    fr: string;
    en: string;
    createdAt?: Timestamp | Date;
    updatedAt?: Timestamp | Date;
}

// Old hardcoded questions as fallback
export const FALLBACK_QUESTIONS = [
    { id: 'q1', fr: 'Si tu pouvais avoir un super pouvoir, lequel choisirais-tu et pourquoi?', en: 'If you could have one superpower, what would it be and why?' },
    { id: 'q2', fr: 'Quelle est ta plus grande fierté professionnelle?', en: 'What is your greatest professional achievement?' },
    { id: 'q3', fr: 'Quel est ton film préféré de tous les temps?', en: 'What is your favorite movie of all time?' },
    { id: 'q4', fr: 'Si tu pouvais dîner avec une personne célèbre, morte ou vivante, qui serait-ce?', en: 'If you could have dinner with any famous person, dead or alive, who would it be?' },
    { id: 'q5', fr: 'Quel est ton hobby ou passe-temps favori en dehors du travail?', en: 'What is your favorite hobby or pastime outside of work?' },
];

export interface CurrentTurn {
    playerId: string;
    playerName: string;
    questionId: string;
    question: {
        fr: string;
        en: string;
    };
}

// Service pour gérer les ice-breakers
export const iceBreakerService = {
    // Fetch questions from Firebase
    async getFunExpressQuestions(): Promise<FunExpressQuestion[]> {
        try {
            console.log("Fetching questions from Firebase...");
            const questionsRef = collection(db, 'questionFunExpress');
            const q = query(questionsRef, orderBy('createdAt', 'asc'));
            const querySnapshot = await getDocs(q);

            const questions: FunExpressQuestion[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                questions.push({
                    id: data.id || doc.id,
                    fr: data.fr,
                    en: data.en,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt
                });
            });

            console.log(`Fetched ${questions.length} questions from Firebase`);

            // If no questions found, use fallback
            if (questions.length === 0) {
                console.log("No questions found in Firebase, using fallback questions");
                return FALLBACK_QUESTIONS;
            }

            return questions;
        } catch (error) {
            console.error("Error fetching questions from Firebase:", error);
            // Return fallback questions in case of error
            return FALLBACK_QUESTIONS;
        }
    },

    // Initialiser une activité "Question Fun Express" avec un premier joueur et une première question
    async initializeQuestionFunExpress(activityId: string, participants: Participant[]): Promise<boolean> {
        try {
            if (!activityId || participants.length === 0) {
                console.error('ID d\'activité ou participants manquants');
                return false;
            }

            // Fetch questions from Firebase
            const questions = await this.getFunExpressQuestions();

            // Sélectionner aléatoirement un joueur et une question
            const randomPlayerIndex = Math.floor(Math.random() * participants.length);
            const randomPlayer = participants[randomPlayerIndex];

            const randomQuestionIndex = Math.floor(Math.random() * questions.length);
            const randomQuestion = questions[randomQuestionIndex];

            // Créer le nouveau tour
            const newTurn: CurrentTurn = {
                playerId: randomPlayer.id,
                playerName: randomPlayer.username,
                questionId: randomQuestion.id,
                question: {
                    fr: randomQuestion.fr,
                    en: randomQuestion.en
                }
            };

            // Mettre à jour Firestore
            const activityRef = doc(db, 'activities', activityId);
            await updateDoc(activityRef, {
                askedQuestions: [randomQuestion.id],
                askedPlayers: [randomPlayer.id],
                currentTurn: newTurn,
                allPlayersAsked: false,
                updatedAt: serverTimestamp()
            });

            console.log(`Activité "Question Fun Express" initialisée avec succès, ID: ${activityId}`);
            return true;
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de l\'activité:', error);
            return false;
        }
    },

    // Changer la question pour le même joueur
    async changeQuestion(activityId: string, currentData: any): Promise<boolean> {
        if (!activityId || !currentData || !currentData.currentTurn) {
            console.error('Données insuffisantes pour changer la question');
            return false;
        }

        try {
            // Fetch questions from Firebase
            const allQuestions = await this.getFunExpressQuestions();

            // Trouver une question qui n'a pas encore été posée
            const availableQuestions = allQuestions.filter(q =>
                !currentData.askedQuestions.includes(q.id)
            );

            // Si toutes les questions ont été posées, réutiliser une question (sauf la dernière posée)
            let newQuestion;
            let updatedAskedQuestions = [...currentData.askedQuestions];

            if (availableQuestions.length === 0) {
                // Trouver une question différente de la dernière
                const questionsExceptCurrent = allQuestions.filter(q =>
                    q.id !== currentData.currentTurn.questionId
                );
                const randomIndex = Math.floor(Math.random() * questionsExceptCurrent.length);
                newQuestion = questionsExceptCurrent[randomIndex];
            } else {
                // Sélectionner une nouvelle question au hasard
                const randomIndex = Math.floor(Math.random() * availableQuestions.length);
                newQuestion = availableQuestions[randomIndex];
                updatedAskedQuestions.push(newQuestion.id);
            }

            // Mettre à jour avec la nouvelle question
            const newTurn: CurrentTurn = {
                ...currentData.currentTurn,
                questionId: newQuestion.id,
                question: {
                    fr: newQuestion.fr,
                    en: newQuestion.en
                }
            };

            // Mettre à jour Firestore
            const activityRef = doc(db, 'activities', activityId);
            await updateDoc(activityRef, {
                askedQuestions: updatedAskedQuestions,
                currentTurn: newTurn,
                updatedAt: serverTimestamp()
            });

            console.log(`Question changée pour ${currentData.currentTurn.playerName}`);
            return true;
        } catch (error) {
            console.error('Erreur lors du changement de question:', error);
            return false;
        }
    },

    // Changer de joueur et de question
    async changePlayer(activityId: string, currentData: any, participants: Participant[]): Promise<boolean> {
        if (!activityId || !currentData || participants.length === 0) {
            console.error('Données insuffisantes pour changer de joueur');
            return false;
        }

        try {
            // Trouver les joueurs qui n'ont pas encore été interrogés
            const availablePlayers = participants.filter(p =>
                !currentData.askedPlayers.includes(p.id)
            );

            // Vérifier si tous les joueurs ont été interrogés
            if (availablePlayers.length === 0) {
                // Si tous les joueurs ont été interrogés, mettre à jour le statut
                const activityRef = doc(db, 'activities', activityId);
                await updateDoc(activityRef, {
                    allPlayersAsked: true,
                    updatedAt: serverTimestamp()
                });

                console.log('Tous les joueurs ont été interrogés');
                return true;
            }

            // Sélectionner un nouveau joueur au hasard
            const randomPlayerIndex = Math.floor(Math.random() * availablePlayers.length);
            const newPlayer = availablePlayers[randomPlayerIndex];

            // Fetch questions from Firebase
            const allQuestions = await this.getFunExpressQuestions();

            // Trouver une question qui n'a pas encore été posée
            const availableQuestions = allQuestions.filter(q =>
                !currentData.askedQuestions.includes(q.id)
            );

            // Si toutes les questions ont été posées, réutiliser une question au hasard
            let newQuestion;
            let updatedAskedQuestions = [...currentData.askedQuestions];

            if (availableQuestions.length === 0) {
                const randomQuestionIndex = Math.floor(Math.random() * allQuestions.length);
                newQuestion = allQuestions[randomQuestionIndex];
            } else {
                const randomQuestionIndex = Math.floor(Math.random() * availableQuestions.length);
                newQuestion = availableQuestions[randomQuestionIndex];
                updatedAskedQuestions.push(newQuestion.id);
            }

            // Créer le nouveau tour
            const newTurn: CurrentTurn = {
                playerId: newPlayer.id,
                playerName: newPlayer.username,
                questionId: newQuestion.id,
                question: {
                    fr: newQuestion.fr,
                    en: newQuestion.en
                }
            };

            const updatedAskedPlayers = [...currentData.askedPlayers, newPlayer.id];

            // Mettre à jour Firestore
            const activityRef = doc(db, 'activities', activityId);
            await updateDoc(activityRef, {
                askedQuestions: updatedAskedQuestions,
                askedPlayers: updatedAskedPlayers,
                currentTurn: newTurn,
                updatedAt: serverTimestamp()
            });

            console.log(`Changement de joueur : ${newPlayer.username}`);
            return true;
        } catch (error) {
            console.error('Erreur lors du changement de joueur:', error);
            return false;
        }
    },

    // Redémarrer le jeu avec un nouveau tour
    async restartGame(activityId: string, participants: Participant[]): Promise<boolean> {
        try {
            if (!activityId || participants.length === 0) {
                console.error('ID d\'activité ou participants manquants');
                return false;
            }

            // Fetch questions from Firebase
            const questions = await this.getFunExpressQuestions();

            // Réinitialiser le jeu avec un nouveau joueur et une nouvelle question
            const randomPlayerIndex = Math.floor(Math.random() * participants.length);
            const randomPlayer = participants[randomPlayerIndex];

            const randomQuestionIndex = Math.floor(Math.random() * questions.length);
            const randomQuestion = questions[randomQuestionIndex];

            // Créer le nouveau tour
            const newTurn: CurrentTurn = {
                playerId: randomPlayer.id,
                playerName: randomPlayer.username,
                questionId: randomQuestion.id,
                question: {
                    fr: randomQuestion.fr,
                    en: randomQuestion.en
                }
            };

            // Mettre à jour Firestore
            const activityRef = doc(db, 'activities', activityId);
            await updateDoc(activityRef, {
                askedQuestions: [randomQuestion.id],
                askedPlayers: [randomPlayer.id],
                currentTurn: newTurn,
                allPlayersAsked: false,
                updatedAt: serverTimestamp()
            });

            console.log('Jeu redémarré avec succès');
            return true;
        } catch (error) {
            console.error('Erreur lors du redémarrage du jeu:', error);
            return false;
        }
    },

    // Ajouter une nouvelle activité "Question Fun Express" à une session
    async addQuestionFunExpressActivity(sessionId: string, addedBy: string): Promise<string | null> {
        try {
            if (!sessionId || !addedBy) {
                console.error('ID de session ou nom d\'utilisateur manquant');
                return null;
            }

            // Créer l'activité avec les valeurs par défaut
            const activityData: any = {
                sessionId,
                type: 'iceBreaker',
                iceBreakerType: 'funQuestion',
                status: 'pending',
                createdAt: serverTimestamp(),
                visibleToAll: false,
                launched: false,
                addedBy,
                askedQuestions: [],
                askedPlayers: [],
                currentTurn: null,
                allPlayersAsked: false
            };

            // Ajouter à Firestore
            const docRef = await addDoc(collection(db, 'activities'), activityData);
            console.log(`Nouvelle activité "Question Fun Express" ajoutée, ID: ${docRef.id}`);
            return docRef.id;
        } catch (error) {
            console.error('Erreur lors de l\'ajout de l\'activité:', error);
            return null;
        }
    },

    // Récupérer les données d'une activité "Question Fun Express"
    async getQuestionFunExpressData(activityId: string): Promise<any | null> {
        try {
            if (!activityId) {
                console.error('ID d\'activité manquant');
                return null;
            }

            const activityRef = doc(db, 'activities', activityId);
            const activityDoc = await getDoc(activityRef);

            if (activityDoc.exists()) {
                const data = activityDoc.data();

                // Vérifier si c'est bien une activité "Question Fun Express"
                if (data.type !== 'iceBreaker' || data.iceBreakerType !== 'funQuestion') {
                    console.error('Cette activité n\'est pas du type "Question Fun Express"');
                    return null;
                }

                // Préparer les données à retourner
                return {
                    id: activityDoc.id,
                    askedQuestions: data.askedQuestions || [],
                    askedPlayers: data.askedPlayers || [],
                    currentTurn: data.currentTurn || null,
                    allPlayersAsked: data.allPlayersAsked || false,
                    ...data
                };
            } else {
                console.error('Activité non trouvée');
                return null;
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des données:', error);
            return null;
        }
    }
};

export default iceBreakerService;
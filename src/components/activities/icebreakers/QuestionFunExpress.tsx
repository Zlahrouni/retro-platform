// src/components/activities/icebreakers/QuestionFunExpress.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import ParticipantProgress from './ParticipantProgress';
import './QuestionFunAnimations.css';
import { db } from "../../../config/firebase";
import { Participant } from "../../../types/types";
import { iceBreakerService, FunExpressQuestion } from '../../../services/iceBreakerService';

interface CurrentTurn {
    playerId: string;
    playerName: string;
    questionId: string;
    question: {
        fr: string;
        en: string;
    };
}

interface ActivityData {
    id: string;
    askedQuestions: string[];
    askedPlayers: string[];
    currentTurn: CurrentTurn | null;
    allPlayersAsked?: boolean;
}

interface QuestionFunExpressProps {
    sessionId: string;
    activityId: string;
    isAdmin: boolean;
    participants: Participant[];
}

const QuestionFunExpress: React.FC<QuestionFunExpressProps> = ({
                                                                   sessionId,
                                                                   activityId,
                                                                   isAdmin,
                                                                   participants
                                                               }) => {
    const [activityData, setActivityData] = useState<ActivityData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isChanging, setIsChanging] = useState(false);
    const { i18n } = useTranslation();
    const currentLanguage = i18n.language;
    const [questions, setQuestions] = useState<FunExpressQuestion[]>([]);

    // Fetch questions from Firebase
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const fetchedQuestions = await iceBreakerService.getFunExpressQuestions();
                setQuestions(fetchedQuestions);
                console.log("Fetched questions:", fetchedQuestions.length);
            } catch (err) {
                console.error("Error fetching questions:", err);
                // We'll use the fallback questions from the service
            }
        };

        fetchQuestions();
    }, []);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const fetchActivityData = async () => {
            try {
                const activityRef = doc(db, 'activities', activityId);
                const activityDoc = await getDoc(activityRef);

                if (activityDoc.exists()) {
                    const data = activityDoc.data();

                    // Si les données de jeu n'existent pas encore, les initialiser
                    if (!data.askedQuestions || !data.askedPlayers || !data.currentTurn) {
                        if (isAdmin) {
                            await initializeGame();
                        }
                    } else {
                        setActivityData({
                            id: activityDoc.id,
                            askedQuestions: data.askedQuestions || [],
                            askedPlayers: data.askedPlayers || [],
                            currentTurn: data.currentTurn || null,
                            allPlayersAsked: data.allPlayersAsked || false
                        });
                    }
                } else {
                    setError("L'activité n'existe pas");
                }
            } catch (err) {
                console.error("Erreur lors du chargement de l'activité:", err);
                setError("Erreur lors du chargement de l'activité");
            } finally {
                setLoading(false);
            }
        };

        // Écouter les changements en temps réel
        const setupRealTimeListener = () => {
            const activityRef = doc(db, 'activities', activityId);

            unsubscribe = onSnapshot(activityRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setActivityData({
                        id: docSnap.id,
                        askedQuestions: data.askedQuestions || [],
                        askedPlayers: data.askedPlayers || [],
                        currentTurn: data.currentTurn || null,
                        allPlayersAsked: data.allPlayersAsked || false
                    });
                    setLoading(false);
                }
            }, (error) => {
                console.error("Erreur lors de l'écoute en temps réel:", error);
                setError("Erreur de connexion");
            });
        };

        // Charger les données initiales puis configurer l'écouteur
        fetchActivityData().then(() => {
            setupRealTimeListener();
        });

        // Nettoyer l'écouteur lorsque le composant est démonté
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [activityId, sessionId, isAdmin]);

    // Initialiser le jeu avec le premier joueur et la première question
    const initializeGame = async () => {
        try {
            if (participants.length === 0) {
                setError("Aucun participant disponible");
                return;
            }

            if (questions.length === 0) {
                const fetchedQuestions = await iceBreakerService.getFunExpressQuestions();
                setQuestions(fetchedQuestions);
            }

            // Use iceBreakerService to initialize the game
            const success = await iceBreakerService.initializeQuestionFunExpress(activityId, participants);

            if (!success) {
                setError("Erreur lors de l'initialisation du jeu");
            }
        } catch (err) {
            console.error("Erreur lors de l'initialisation du jeu:", err);
            setError("Erreur lors de l'initialisation du jeu");
        }
    };

    // Changer de question pour le même joueur
    const handleChangeQuestion = async () => {
        if (!activityData || !activityData.currentTurn || isChanging) return;

        try {
            setIsChanging(true);
            await iceBreakerService.changeQuestion(activityId, activityData);
        } catch (err) {
            console.error("Erreur lors du changement de question:", err);
            setError("Erreur lors du changement de question");
        } finally {
            setIsChanging(false);
        }
    };

    // Changer de joueur et de question
    const handleChangePlayer = async () => {
        if (!activityData || isChanging) return;

        try {
            setIsChanging(true);
            await iceBreakerService.changePlayer(activityId, activityData, participants);
        } catch (err) {
            console.error("Erreur lors du changement de joueur:", err);
            setError("Erreur lors du changement de joueur");
        } finally {
            setIsChanging(false);
        }
    };

    // Redémarrer le jeu
    const handleRestart = async () => {
        try {
            setIsChanging(true);
            await iceBreakerService.restartGame(activityId, participants);
        } catch (err) {
            console.error("Erreur lors du redémarrage du jeu:", err);
            setError("Erreur lors du redémarrage du jeu");
        } finally {
            setIsChanging(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 p-4 rounded-md text-red-700 max-w-md mx-auto">
                <p>{error}</p>
            </div>
        );
    }

    if (activityData?.allPlayersAsked) {
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-2xl p-8 max-w-md round-complete-animation">
                    {/* Confetti animation */}
                    <div className="confetti-container">
                        <div className="confetti"></div>
                        <div className="confetti"></div>
                        <div className="confetti"></div>
                        <div className="confetti"></div>
                        <div className="confetti"></div>
                        <div className="confetti"></div>
                        <div className="confetti"></div>
                        <div className="confetti"></div>
                        <div className="confetti"></div>
                    </div>

                    <h2 className="text-2xl font-bold mb-4 text-center">🎉 Tour terminé !</h2>
                    <p className="mb-6 text-center">
                        Tous les joueurs ont répondu à une question.
                    </p>
                    {isAdmin && (
                        <div className="flex justify-center">
                            <button
                                onClick={handleRestart}
                                disabled={isChanging}
                                className="px-6 py-3 bg-white text-indigo-600 rounded-full shadow-md hover:bg-gray-100 transition-colors flex items-center button-bounce"
                            >
                                {isChanging ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Chargement...
                                    </span>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 emoji-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Redémarrer un nouveau tour
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Afficher tous les participants ayant participé */}
                    <div className="mt-8 pt-4 border-t border-white border-opacity-20">
                        <h3 className="text-sm font-medium text-white mb-3 text-center">Participants de ce tour</h3>
                        <div className="flex flex-wrap justify-center gap-2">
                            {participants
                                .filter(p => activityData.askedPlayers.includes(p.id))
                                .map(participant => (
                                    <div key={participant.id} className="bg-white bg-opacity-20 rounded-full px-3 py-1 text-xs text-white">
                                        {participant.username}
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!activityData?.currentTurn) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">Initialisation de l'activité...</p>
                </div>
            </div>
        );
    }

    // Déterminer quelle question afficher selon la langue
    const questionText = currentLanguage === 'fr' ?
        activityData.currentTurn.question.fr :
        activityData.currentTurn.question.en;

    return (
        <div className="flex flex-col items-center justify-center py-8">
            {/* Carte de question avec animation */}
            <div className="relative card-animation card-shimmer w-full max-w-md">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:shadow-lg">
                    {/* En-tête de la carte */}
                    <div className="bg-white bg-opacity-20 p-4 text-center">
                        <h2 className="text-xl font-bold text-white">
                            Question pour <span className="emoji-spin inline-block">{activityData.currentTurn.playerName}</span>
                        </h2>
                    </div>

                    {/* Corps de la carte */}
                    <div className="p-6 md:p-8 bg-white m-3 rounded-xl">
                        <div className="text-xl md:text-2xl font-medium text-center text-gray-800">
                            {questionText}
                        </div>
                    </div>

                    {/* Pied de la carte uniquement pour les admins */}
                    {isAdmin && (
                        <div className="bg-white bg-opacity-20 p-4 flex justify-center space-x-4">
                            <button
                                onClick={handleChangeQuestion}
                                disabled={isChanging}
                                className="px-4 py-2 bg-white text-indigo-600 rounded-full shadow hover:bg-gray-100 transition-colors flex items-center button-bounce"
                                aria-label="Changer la question"
                            >
                                {isChanging ? (
                                    <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <>
                                        <span className="mr-2 emoji-spin">🔁</span>
                                        Changer la question
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleChangePlayer}
                                disabled={isChanging}
                                className="px-4 py-2 bg-white text-indigo-600 rounded-full shadow hover:bg-gray-100 transition-colors flex items-center button-bounce"
                                aria-label="Changer de joueur"
                            >
                                {isChanging ? (
                                    <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <>
                                        <span className="mr-2 emoji-spin">👤</span>
                                        Changer de joueur
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Effet de carte */}
                <div className="absolute -bottom-3 -right-3 w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl -z-10 transform rotate-3"></div>
            </div>

            {/* Affichage de la progression des participants */}
            <ParticipantProgress
                participants={participants}
                askedPlayerIds={activityData.askedPlayers}
                currentPlayerId={activityData.currentTurn.playerId}
            />
        </div>
    );
};

export default QuestionFunExpress;
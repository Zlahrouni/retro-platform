// src/components/session/ActivityTimer.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { timerService, TimerData } from '../../services/timerService';
import { sessionsService } from '../../services/firebaseService';

interface ActivityTimerProps {
    isAdmin: boolean;
    sessionId: string;
    onTimerComplete: () => void;
}

const ActivityTimer: React.FC<ActivityTimerProps> = ({ isAdmin, sessionId, onTimerComplete }) => {
    const { t } = useTranslation();
    const [showTimerForm, setShowTimerForm] = useState(false);
    const [timerMinutes, setTimerMinutes] = useState(5); // 5 minutes par défaut
    const [timerData, setTimerData] = useState<TimerData | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Fonction pour mettre en pause la session quand le timer se termine
    const pauseSessionOnTimerComplete = useCallback(async () => {
        // Mettre en pause la session automatiquement quand le timer est terminé
        console.log("Timer terminé - Mise en pause automatique de la session");

        try {
            // 1. Mettre la session en pause
            await sessionsService.pauseSession(sessionId);
            console.log("Session mise en pause avec succès après fin du timer");

            // 2. Supprimer le timer de la base de données
            setTimeout(async () => {
                await timerService.removeTimer(sessionId);
                console.log("Timer supprimé de la base de données");
            }, 2000); // Petit délai pour s'assurer que tout le monde a reçu la notification de fin

            return true;
        } catch (err) {
            console.error("Erreur lors de la mise en pause automatique de la session:", err);
            return false;
        }
    }, [sessionId]);

    // Effet pour s'abonner aux mises à jour du minuteur depuis Firebase
    useEffect(() => {
        if (!sessionId) return;

        console.log(`S'abonnant aux mises à jour du minuteur pour la session ${sessionId}`);

        // S'abonner aux mises à jour du minuteur
        const unsubscribe = timerService.onTimerUpdate(sessionId, (data) => {
            if (data) {
                console.log("Mise à jour du minuteur reçue:", data);
                setTimerData(data);

                if (data.isComplete) {
                    // Si le minuteur est terminé, informer le parent
                    onTimerComplete();
                    setTimeRemaining(0);

                    // Mettre en pause la session automatiquement quand le timer est terminé
                    // Peu importe qui reçoit la notification, nous mettons en pause la session
                    if (isAdmin) {
                        pauseSessionOnTimerComplete();
                    }

                    // Arrêter le compteur local s'il est en cours
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                }
                else if (data.isRunning && data.endTime) {
                    // Démarrer ou continuer le compteur local
                    startLocalCountdown(new Date(data.endTime));
                }
                else {
                    // Minuteur en pause, arrêter le compteur local
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }

                    // Calculer le temps restant pour l'affichage
                    if (data.durationMinutes) {
                        setTimeRemaining(data.durationMinutes * 60);
                    }
                }
            } else {
                // Pas de minuteur actif
                setTimerData(null);
                setTimeRemaining(null);

                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
            }
        });

        // Nettoyer l'abonnement lors du démontage
        return () => {
            unsubscribe();

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [sessionId, onTimerComplete, pauseSessionOnTimerComplete, isAdmin]);

    // Démarrer un compteur local pour mettre à jour l'affichage du temps restant
    const startLocalCountdown = useCallback((endTime: Date) => {
        // Nettoyer l'intervalle existant s'il y en a un
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        const updateTimeRemaining = () => {
            const now = new Date();
            const remainingMs = endTime.getTime() - now.getTime();

            if (remainingMs <= 0) {
                // Le temps est écoulé localement
                clearInterval(timerRef.current!);
                timerRef.current = null;
                setTimeRemaining(0);

                // Vérifier si le statut dans Firebase doit être mis à jour
                if (timerData && !timerData.isComplete) {
                    console.log("Timer terminé localement");
                    timerService.completeTimer(sessionId).then(() => {
                        // Seul l'admin déclenche la mise en pause automatique
                        if (isAdmin) {
                            console.log("Timer terminé localement - Mise en pause automatique de la session");
                            pauseSessionOnTimerComplete();
                        }
                    });
                }
            } else {
                // Mettre à jour le temps restant (en secondes)
                setTimeRemaining(Math.floor(remainingMs / 1000));
            }
        };

        // Mise à jour initiale
        updateTimeRemaining();

        // Démarrer l'intervalle pour les mises à jour
        timerRef.current = setInterval(updateTimeRemaining, 1000);
    }, [sessionId, timerData, pauseSessionOnTimerComplete, isAdmin]);

    // Formater le temps restant pour l'affichage
    const formatTimeRemaining = useCallback(() => {
        if (timeRemaining === null) return null;

        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;

        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, [timeRemaining]);

    // Actions sur le minuteur
    const handleStartTimer = useCallback(async () => {
        if (!sessionId || timerMinutes <= 0) return;

        console.log(`Démarrage d'un minuteur de ${timerMinutes} minutes`);
        const success = await timerService.initTimer(sessionId, timerMinutes);

        if (success) {
            setShowTimerForm(false);
        } else {
            alert("Erreur lors du démarrage du minuteur. Veuillez réessayer.");
        }
    }, [sessionId, timerMinutes]);

    const handlePauseTimer = useCallback(async () => {
        if (!sessionId || !timerData) return;

        console.log("Mise en pause du minuteur");
        await timerService.pauseTimer(sessionId);
    }, [sessionId, timerData]);

    const handleResumeTimer = useCallback(async () => {
        if (!sessionId || !timerData) return;

        console.log("Reprise du minuteur");
        await timerService.resumeTimer(sessionId);
    }, [sessionId, timerData]);

    const handleStopTimer = useCallback(async () => {
        if (!sessionId) return;

        console.log("Arrêt du minuteur");
        await timerService.stopTimer(sessionId);
    }, [sessionId]);

    // Si aucun timer n'est actif et qu'on n'est pas admin, ne rien afficher
    if (!timerData && !isAdmin) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-700">
                    {t('session.activityTimer')}
                </h3>

                {isAdmin && (
                    <div>
                        {!timerData ? (
                            <button
                                onClick={() => setShowTimerForm(true)}
                                className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                                {t('session.setTimer')}
                            </button>
                        ) : (
                            <div className="flex space-x-2">
                                {timerData.isComplete ? (
                                    <button
                                        onClick={handleStopTimer}
                                        className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                    >
                                        {t('session.resetTimer')}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={timerData.isRunning ? handlePauseTimer : handleResumeTimer}
                                            className={`text-sm px-3 py-1 rounded ${
                                                timerData.isRunning
                                                    ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                                    : "bg-green-100 text-green-700 hover:bg-green-200"
                                            }`}
                                        >
                                            {timerData.isRunning ? t('session.pauseTimer') : t('session.resumeTimer')}
                                        </button>
                                        <button
                                            onClick={handleStopTimer}
                                            className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                        >
                                            {t('session.stopTimer')}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {(timeRemaining !== null || (timerData && timerData.durationMinutes > 0)) && (
                <div className="mt-2">
                    <div className="text-center">
                        <span className={`text-3xl font-mono ${timerData?.isComplete ? 'text-red-600 animate-pulse' : ''}`}>
                            {formatTimeRemaining() || '00:00'}
                        </span>
                    </div>
                    {timerData?.isComplete ? (
                        <p className="text-sm text-red-600 font-medium mt-1 text-center">
                            {t('session.timeIsUp')}
                        </p>
                    ) : (
                        <p className="text-xs text-gray-500 mt-1 text-center">
                            {isAdmin ? t('session.timerAdminHelp') : t('session.timerParticipantHelp')}
                        </p>
                    )}
                </div>
            )}

            {showTimerForm && !timerData && (
                <div className="mt-3 border-t pt-3">
                    <div className="flex items-center">
                        <input
                            type="number"
                            min="1"
                            max="60"
                            value={timerMinutes}
                            onChange={(e) => setTimerMinutes(Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded-md mr-2"
                        />
                        <span className="text-sm text-gray-600 mr-4">{t('timer.minutes')}</span>

                        <button
                            onClick={handleStartTimer}
                            className="px-3 py-1 bg-primary text-white rounded hover:bg-blue-600 mr-1"
                        >
                            {t('session.startTimer')}
                        </button>

                        <button
                            onClick={() => setShowTimerForm(false)}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                            {t('general.cancel')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityTimer;
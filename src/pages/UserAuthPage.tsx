// src/pages/UserAuthPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { userService } from '../services/userService';
import { sessionsService } from '../services/firebaseService';

const UserAuthPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { sessionId } = useParams<{ sessionId: string }>();
    const [username, setUsername] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(true);
    const [sessionName, setSessionName] = useState<string | null>(null);

    // Récupérer le nom d'utilisateur existant du localStorage et valider la session
    useEffect(() => {
        // Récupérer le nom d'utilisateur s'il existe déjà
        const savedUsername = userService.getUserName();
        if (savedUsername) {
            setUsername(savedUsername);
        }

        const validateSession = async () => {
            if (!sessionId) {
                navigate('/');
                return;
            }

            try {
                const session = await sessionsService.getSessionById(sessionId);
                if (!session) {
                    setError('Cette session n\'existe pas ou a été supprimée.');
                } else {
                    // Stocker le type d'activité pour l'afficher
                    const activityType = session.activityType;
                    setSessionName(t(`activities.types.${activityType}`));
                }
            } catch (err) {
                setError('Erreur lors de la validation de la session.');
                console.error('Erreur de validation:', err);
            } finally {
                setIsValidating(false);
            }
        };

        validateSession();
    }, [sessionId, navigate, t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation du nom d'utilisateur
        if (!username.trim()) {
            setError('Veuillez entrer un nom d\'utilisateur.');
            return;
        }

        if (username.length > 20) {
            setError('Le nom d\'utilisateur ne doit pas dépasser 20 caractères.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Enregistrer le nom d'utilisateur et l'ajouter à la session
            await userService.setUserNameAndJoinSession(username.trim(), sessionId);

            // Rediriger vers la session
            navigate(`/session/${sessionId}`);
        } catch (err) {
            setError('Une erreur est survenue. Veuillez réessayer.');
            console.error('Erreur lors de l\'authentification:', err);
            setIsLoading(false);
        }
    };

    if (isValidating) {
        return (
            <div className="max-w-md mx-auto mt-16 bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
                <p className="text-center mt-4 text-gray-600">{t('auth.verifyingSession')}</p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-16 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                <h1 className="text-2xl font-bold text-center">{t('auth.joinSession')}</h1>
                {sessionName && (
                    <p className="text-center text-blue-100 mt-2">
                        {t('auth.activityType')}: {sessionName}
                    </p>
                )}
            </div>

            <div className="p-6">
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                            {t('auth.nameQuestion')}
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder={t('auth.namePlaceholder')}
                            maxLength={20}
                            autoFocus
                        />
                        <p className="mt-1 text-xs text-gray-500 flex justify-between">
                            <span>{t('auth.charactersLimit', { count: username.length })}</span>
                            {username.length > 0 && (
                                <span className="text-green-500">
                                    {t('auth.nameAvailable')}
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-700">
                        {t('auth.temporaryConnection')}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-primary hover:bg-blue-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {t('auth.joiningSession')}
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                {t('auth.joinButton')}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UserAuthPage;
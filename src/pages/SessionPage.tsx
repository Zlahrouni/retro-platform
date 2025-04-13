import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ActivityType, ColumnType, ACTIVITY_COLUMNS } from '../types/types';
import { useSession } from '../hooks/useSession';
import { userService } from '../services/userService';
import CardComponent from '../components/cards/CardComponent';
import AddCardForm from '../components/cards/AddCardForm';
import UserNameModal from '../components/user/UserNameModal';
import {cardsService} from "../services/firebaseService";

const SessionPage: React.FC = () => {
    const { t } = useTranslation();
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [showShareMessage, setShowShareMessage] = useState(false);
    const [showNameModal, setShowNameModal] = useState(false);
    const [addingToColumn, setAddingToColumn] = useState<ColumnType | null>(null);
    const [retries, setRetries] = useState(0);
    const maxRetries = 3;

    // Tous les hooks doivent être appelés au niveau supérieur
    const handleUsernameComplete = useCallback(() => {
        setShowNameModal(false);
    }, []);

    const handleShareLink = useCallback(() => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            setShowShareMessage(true);
            setTimeout(() => setShowShareMessage(false), 2000);
        });
    }, []);

    const handleCancelAddCard = useCallback(() => {
        setAddingToColumn(null);
    }, []);

    // Utiliser notre hook personnalisé
    const {
        session,
        cards,
        isLoading,
        error,
        getCardsByType,
        addCard,
        closeSession
    } = useSession(sessionId);

    // Vérifier si l'utilisateur a un nom au chargement
    useEffect(() => {
        if (!userService.hasUserName()) {
            setShowNameModal(true);
        }
    }, []);

    // Débogage : Afficher les cartes dans la console quand elles changent
    useEffect(() => {
        if (cards && cards.length > 0) {
            console.log("Cartes dans SessionPage:", cards.length);
        }
    }, [cards]);

    const handleCloseSession = useCallback(async () => {
        if (window.confirm(t('session.confirmClose'))) {
            await closeSession();
        }
    }, [closeSession, t]);

    const handleAddCard = useCallback((type: ColumnType) => {
        // Vérifier si l'utilisateur a un nom défini avant d'ajouter une carte
        if (!userService.hasUserName()) {
            setShowNameModal(true);
            return;
        }

        setAddingToColumn(type);
    }, []);

    const testLoadCards = async () => {
        try {
            const cards = await cardsService.getCardsBySession(sessionId || '');
            console.log("Test de chargement direct des cartes:", cards);
            alert(`${cards.length} cartes chargées directement`);
        } catch (error) {
            console.error("Erreur de test:", error);
            alert("Erreur lors du test de chargement");
        }
    };

    const handleSubmitCard = useCallback(async (text: string, type: ColumnType) => {
        console.log("Soumission de carte:", { text, type });
        if (!text.trim()) return;

        await addCard(text, type);
        setAddingToColumn(null);
    }, [addCard]);

    // Effet pour les tentatives de reconnexion
    useEffect(() => {
        if (error && retries < maxRetries) {
            const timer = setTimeout(() => {
                console.log(`Tentative de reconnexion ${retries + 1}/${maxRetries}...`);
                setRetries(prev => prev + 1);
                // Forcer un rechargement de la page pour réessayer
                window.location.reload();
            }, 3000); // 3 secondes entre les tentatives

            return () => clearTimeout(timer);
        }
    }, [error, retries]);

    // Fonctions de rendu conditionnelles
    const renderLoading = () => (
        <div className="flex justify-center items-center h-64">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600">{t('general.loading')}</p>
            </div>
        </div>
    );

    const renderError = () => (
        <div className="bg-red-100 p-4 rounded-md text-red-700 max-w-md mx-auto mt-8">
            <p>{error || t('session.notFound')}</p>
            {retries < maxRetries ? (
                <p className="mt-2">
                    Tentative de reconnexion {retries + 1}/{maxRetries}...
                    <span className="ml-2 inline-block">
                    <div className="animate-spin h-4 w-4 border-t-2 border-red-700 rounded-full"></div>
                </span>
                </p>
            ) : (
                <button
                    onClick={() => navigate('/')}
                    className="mt-4 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
                >
                    {t('general.backToHome')}
                </button>
            )}
        </div>
    );

    const renderColumnContent = (columnType: ColumnType) => {
        const cardsForColumn = getCardsByType(columnType);

        return (
            <div key={columnType} className="bg-white rounded-lg shadow-md">
                <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-bold">
                        {t(`activities.columns.${session?.activityType}.${columnType}`)}
                    </h3>
                </div>

                <div className="p-4 min-h-[200px]">
                    {cardsForColumn.length === 0 ? (
                        <div className="text-gray-400 text-center mt-8">
                            {t('session.noCards')}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cardsForColumn.map(card => (
                                <CardComponent key={card.id} card={card} />
                            ))}
                        </div>
                    )}

                    {addingToColumn === columnType && (
                        <div className="mt-4">
                            <AddCardForm
                                onSubmit={(text: string) => handleSubmitCard(text, columnType)}
                                onCancel={handleCancelAddCard}
                            />
                        </div>
                    )}
                </div>

                {session?.status === 'open' && addingToColumn !== columnType && (
                    <div className="p-4 border-t">
                        <button
                            className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 flex items-center justify-center"
                            onClick={() => handleAddCard(columnType)}
                        >
                            <span className="mr-1">+</span>
                            {t('session.addCard')}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderSessionContent = () => {
        if (!session) return null;

        return (
            <>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">
                        {t(`activities.types.${session.activityType}`)}
                        <span className="text-sm ml-2 text-gray-500">#{sessionId}</span>
                    </h1>

                    <button
                        onClick={testLoadCards}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded ml-4"
                    >
                        Test de chargement des cartes
                    </button>

                    <div className="flex space-x-2">
                        <button
                            className="py-2 px-4 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center"
                            onClick={handleShareLink}
                        >
                            <span>{t('session.shareLink')}</span>
                        </button>

                        {session.status === 'open' && (
                            <button
                                className="py-2 px-4 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                onClick={handleCloseSession}
                            >
                                {t('session.closeSession')}
                            </button>
                        )}
                    </div>
                </div>

                {showShareMessage && (
                    <div className="fixed top-4 right-4 bg-green-100 text-green-700 py-2 px-4 rounded shadow-md">
                        {t('session.copied')}
                    </div>
                )}

                {session.status === 'closed' && (
                    <div className="bg-yellow-100 text-yellow-800 p-4 rounded-md mb-6">
                        {t('session.sessionClosed')}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {ACTIVITY_COLUMNS[session.activityType as ActivityType].map(renderColumnContent)}
                </div>

                {/* Afficher le nom d'utilisateur actuel sans possibilité de le changer */}
                {userService.hasUserName() && (
                    <div className="mt-6 text-right">
                        <div className="inline-flex items-center bg-gray-100 px-3 py-2 rounded-lg">
                            <span className="text-sm text-gray-700">
                                {t('user.welcomeBack', { name: userService.getUserName() })}
                            </span>
                        </div>
                    </div>
                )}
            </>
        );
    };

    // Rendu principal
    return (
        <div className="max-w-6xl mx-auto mt-4">
            {/* Si l'utilisateur n'a pas de nom, afficher le modal */}
            {showNameModal && (
                <UserNameModal
                    onComplete={handleUsernameComplete}
                />
            )}

            {isLoading ? renderLoading() :
                error || !session ? renderError() :
                    renderSessionContent()}
        </div>
    );
};

export default SessionPage;
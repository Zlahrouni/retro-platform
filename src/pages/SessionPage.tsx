import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ActivityType, ColumnType, ACTIVITY_COLUMNS } from '../types/types';
import { useSession } from '../hooks/useSession';
import CardComponent from '../components/cards/CardComponent';
import AddCardForm from '../components/cards/AddCardForm';

const SessionPage: React.FC = () => {
    const { t } = useTranslation();
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [showShareMessage, setShowShareMessage] = useState(false);

    // Utiliser notre hook personnalisé
    const {
        session,
        isLoading,
        error,
        getCardsByType,
        addCard,
        closeSession
    } = useSession(sessionId);

    // États locaux pour gérer les formulaires d'ajout de carte
    const [addingToColumn, setAddingToColumn] = useState<ColumnType | null>(null);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">{t('general.loading')}</p>
                </div>
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="bg-red-100 p-4 rounded-md text-red-700 max-w-md mx-auto mt-8">
                <p>{error || t('session.notFound')}</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-4 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
                >
                    {t('general.backToHome')}
                </button>
            </div>
        );
    }

    const handleShareLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            setShowShareMessage(true);
            setTimeout(() => setShowShareMessage(false), 2000);
        });
    };

    const handleCloseSession = async () => {
        if (window.confirm(t('session.confirmClose'))) {
            await closeSession();
        }
    };

    const handleAddCard = (type: ColumnType) => {
        setAddingToColumn(type);
    };

    const handleSubmitCard = async (text: string, type: ColumnType) => {
        await addCard(text, type);
        setAddingToColumn(null);
    };

    const handleCancelAddCard = () => {
        setAddingToColumn(null);
    };

    return (
        <div className="max-w-6xl mx-auto mt-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                    {t(`activities.types.${session.activityType}`)}
                    <span className="text-sm ml-2 text-gray-500">#{sessionId}</span>
                </h1>

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
                {ACTIVITY_COLUMNS[session.activityType as ActivityType].map((columnType: ColumnType) => {
                    const cardsForColumn = getCardsByType(columnType);

                    return (
                        <div key={columnType} className="bg-white rounded-lg shadow-md">
                            <div className="p-4 border-b bg-gray-50">
                                <h3 className="font-bold">
                                    {t(`activities.columns.${session.activityType}.${columnType}`)}
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

                            {session.status === 'open' && addingToColumn !== columnType && (
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
                })}
            </div>
        </div>
    );
};

export default SessionPage;
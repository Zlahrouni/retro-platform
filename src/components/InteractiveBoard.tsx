// src/components/InteractiveBoard.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityType, ColumnType, ACTIVITY_COLUMNS, Card } from '../types/types';
import CardComponent from './cards/CardComponent';
import AddCardForm from './cards/AddCardForm';
import ParticipantCircles from './session/ParticipantCircles';

interface ColumnProps {
    title: string;
    columnType: ColumnType;
    cards: Card[];
    onAddCard: (text: string, columnType: ColumnType) => Promise<void>;
    isReadOnly: boolean;
    isAdmin: boolean;
    sessionId: string;
}

// Individual Column Component
const Column: React.FC<ColumnProps> = ({
                                           title,
                                           columnType,
                                           cards,
                                           onAddCard,
                                           isReadOnly,
                                           isAdmin,
                                           sessionId
                                       }) => {
    // Animation delay based on column index (for staggered entrance)
    const getAnimationDelay = () => {
        const columnIndex = {
            // Mad Sad Glad
            mad: 0, sad: 1, glad: 2,
            // Start Stop Continue
            start: 0, stop: 1, continue: 2,
            // What Went Well
            wentWell: 0, toImprove: 1,
            // Liked Learned Lacked
            liked: 0, learned: 1, lacked: 2, longedFor: 3
        }[columnType] || 0;

        return `${columnIndex * 150}ms`;
    };

    const [isAddingCard, setIsAddingCard] = useState(false);
    const [isDropTarget, setIsDropTarget] = useState(false);
    const { t } = useTranslation();

    const handleAddCardClick = () => {
        setIsAddingCard(true);
    };

    const handleSubmitCard = async (text: string) => {
        try {
            await onAddCard(text, columnType);
            setIsAddingCard(false);
        } catch (error) {
            console.error(`Error adding card to ${columnType} column:`, error);
            // Keep form open if there's an error
        }
    };

    const handleCancelAddCard = () => {
        setIsAddingCard(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDropTarget(true);
    };

    const handleDragLeave = () => {
        setIsDropTarget(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDropTarget(false);
        // Fonctionnalité drag and drop sera implémentée ultérieurement
    };

    return (
        <div
            className={`flex flex-col h-full bg-gray-50 rounded-lg shadow-md border overflow-hidden opacity-0 animate-fadeIn ${
                isDropTarget ? 'ring-2 ring-blue-400 border-blue-300 bg-blue-50' : 'border-gray-200'
            }`}
            style={{
                animationDelay: getAnimationDelay(),
                animationFillMode: 'forwards'
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Column Header */}
            <div className={`p-3 font-semibold text-center text-white ${getColumnHeaderColor(columnType)}`}>
                <h3 className="truncate">{title}</h3>
                <div className="text-xs opacity-80 mt-0.5">{cards.length} {cards.length === 1 ? t('general.card') : t('general.cards')}</div>
            </div>

            {/* Cards Container */}
            <div className="flex-grow p-3 overflow-y-auto bg-gray-50 space-y-3 min-h-[200px]">
                {cards.length > 0 ? (
                    cards.map((card, index) => (
                        <div
                            className="transform transition-transform hover:-translate-y-1 animate-cardEntrance"
                            key={card.id}
                            style={{
                                animationDelay: `${index * 100}ms`,
                                animationFillMode: 'backwards'
                            }}
                            draggable={!isReadOnly}
                        >
                            <CardComponent card={card} />
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4 border-2 border-dashed border-gray-200 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-center">{t('session.noCards')}</p>
                    </div>
                )}
            </div>

            {/* Add Card Button or Form */}
            <div className="p-3 bg-gray-100 border-t border-gray-200">
                {isAddingCard ? (
                    <AddCardForm
                        onSubmit={handleSubmitCard}
                        onCancel={handleCancelAddCard}
                    />
                ) : (
                    <button
                        onClick={handleAddCardClick}
                        disabled={isReadOnly}
                        className={`w-full py-2 px-4 rounded flex items-center justify-center text-sm font-medium transition-colors
              ${isReadOnly
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {t('session.addCard')}
                    </button>
                )}
            </div>
        </div>
    );
};

// Function to determine column header color based on column type
const getColumnHeaderColor = (columnType: ColumnType): string => {
    // Color mapping for different column types
    switch(columnType) {
        // Mad Sad Glad colors
        case 'mad': return 'bg-red-500';
        case 'sad': return 'bg-blue-500';
        case 'glad': return 'bg-green-500';

        // Start Stop Continue colors
        case 'start': return 'bg-green-500';
        case 'stop': return 'bg-red-500';
        case 'continue': return 'bg-blue-500';

        // What Went Well / To Improve colors
        case 'wentWell': return 'bg-green-500';
        case 'toImprove': return 'bg-orange-500';

        // Liked Learned Lacked colors
        case 'liked': return 'bg-green-500';
        case 'learned': return 'bg-blue-500';
        case 'lacked': return 'bg-amber-500';
        case 'longedFor': return 'bg-purple-500';

        // Default color
        default: return 'bg-gray-500';
    }
};

// Main Interactive Board Component
interface BoardProps {
    activityType: ActivityType | 'iceBreaker';
    cards: Card[];
    onAddCard: (text: string, columnType: ColumnType) => Promise<void>;
    isReadOnly: boolean;
    isAdmin: boolean;
    sessionId?: string;
}

const InteractiveBoard: React.FC<BoardProps> = ({
                                                    activityType,
                                                    cards,
                                                    onAddCard,
                                                    isReadOnly,
                                                    isAdmin,
                                                    sessionId = ''
                                                }) => {
    const { t } = useTranslation();
    const [filteredCards, setFilteredCards] = useState<Record<string, Card[]>>({});
    const [animateBoard, setAnimateBoard] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Log activity information when component mounts
    useEffect(() => {
        console.log(`InteractiveBoard: Mounted with activityType: ${activityType}`);
        console.log(`InteractiveBoard: Cards available: ${cards.length}`);
    }, [activityType, cards.length]);

    // Filter cards by column type when cards array changes
    useEffect(() => {
        if (activityType === 'iceBreaker') return;

        // Simple validation to prevent errors
        if (!activityType || !ACTIVITY_COLUMNS[activityType as ActivityType]) {
            console.error(`Invalid activity type: ${activityType}`);
            setError(`Type d'activité non reconnu: ${activityType}`);
            return;
        }

        try {
            console.log(`Filtering ${cards.length} cards for ${activityType} activity`);

            // Group cards by column type
            const grouped = ACTIVITY_COLUMNS[activityType as ActivityType].reduce((acc, columnType) => {
                acc[columnType] = cards.filter(card => card.type === columnType);
                return acc;
            }, {} as Record<string, Card[]>);

            console.log("Cards grouped by column:", Object.keys(grouped).map(col =>
                `${col}: ${grouped[col]?.length || 0} cards`
            ));

            setFilteredCards(grouped);
            setError(null); // Clear any previous errors
        } catch (err) {
            console.error("Error filtering cards:", err);
            setError("Erreur lors du filtrage des cartes");
        }
    }, [cards, activityType]);

    // Add entrance animation for the board
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimateBoard(true);
        }, 300);

        return () => clearTimeout(timer);
    }, []);

    // Don't render for ice breaker activities
    if (activityType === 'iceBreaker') {
        return (
            <div className="text-center py-8 bg-white rounded-lg shadow-md">
                <p className="text-lg">{t('activities.iceBreakerDescription')}</p>
            </div>
        );
    }

    // Show error state if activity type is invalid
    if (error || !ACTIVITY_COLUMNS[activityType as ActivityType]) {
        return (
            <div className="bg-red-100 p-6 rounded-lg shadow-md text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-xl font-semibold text-red-800 mb-2">Type d'activité non reconnu</h3>
                <p className="text-red-700 mb-4">
                    {error || `Le type d'activité "${activityType}" n'est pas pris en charge.`}
                </p>
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded inline-block">
                    Informations de débogage: activityType={activityType}, columnsExist={!!ACTIVITY_COLUMNS[activityType as ActivityType]}
                </div>
            </div>
        );
    }

    // Get columns for the current activity type
    const columns = ACTIVITY_COLUMNS[activityType as ActivityType] || [];

    // Determine column width based on count (responsive)
    const getColumnWidthClass = () => {
        switch(columns.length) {
            case 2: return 'md:w-1/2';
            case 3: return 'md:w-1/3';
            case 4: return 'md:w-1/2 lg:w-1/4';
            default: return 'w-full';
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow-lg p-4 mb-6 overflow-hidden transition-all duration-500 ${animateBoard ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
            {/* Board Header */}
            <div className="mb-6 pb-4 border-b border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <span className="mr-2">{t(`activities.types.${activityType}`)}</span>
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                                {cards.length} {cards.length === 1 ? t('general.card') : t('general.cards')}
                            </span>
                        </h2>
                    </div>

                    {/* Participant circles */}
                    {sessionId && <ParticipantCircles sessionId={sessionId} />}
                </div>

                {isReadOnly && (
                    <div className="mt-2 text-sm text-orange-600 bg-orange-50 p-2 rounded flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {t('session.cannotAddWhenClosed')}
                    </div>
                )}
            </div>

            {/* Columns Container */}
            <div className={`flex flex-col md:flex-row flex-wrap gap-4 min-h-[500px] relative`}>
                {/* Background decoration (subtle grid pattern) */}
                <div className="absolute inset-0 opacity-5 pointer-events-none"
                     style={{
                         backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)',
                         backgroundSize: '20px 20px'
                     }}>
                </div>

                {columns.length === 0 ? (
                    <div className="w-full flex items-center justify-center p-8 text-gray-500">
                        <p>Aucune colonne disponible pour ce type d'activité</p>
                    </div>
                ) : (
                    columns.map(columnType => (
                        <div key={columnType} className={`${getColumnWidthClass()} h-96 md:h-auto`}>
                            <Column
                                title={t(`activities.columns.${activityType}.${columnType}`)}
                                columnType={columnType}
                                cards={filteredCards[columnType] || []}
                                onAddCard={onAddCard}
                                isReadOnly={isReadOnly}
                                isAdmin={isAdmin}
                                sessionId={sessionId}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default InteractiveBoard;
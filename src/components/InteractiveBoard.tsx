// src/components/InteractiveBoard.tsx - Mise à jour avec visibilité des cartes

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityType, ColumnType, ACTIVITY_COLUMNS, Card } from '../types/types';
import CardComponent from './cards/CardComponent';
import AddCardForm from './cards/AddCardForm';
import CardVisibilityControls from './session/CardVisibilityControls';
import {QuestionFunExpress} from "./activities/icebreakers";
import Button from "./commons/Button";

interface ColumnProps {
    title: string;
    columnType: ColumnType;
    cards: Card[];
    allCards: Card[]; // Toutes les cartes (pour l'admin)
    onAddCard: (text: string, columnType: ColumnType) => Promise<void>;
    isReadOnly: boolean;
    isAdmin: boolean;
    sessionId: string;
    selectedAuthor?: string | null;
    onToggleCardVisibility?: (cardId: string, isVisible: boolean) => Promise<void>;
}

// Individual Column Component with card visibility
const Column: React.FC<ColumnProps> = ({
                                           title,
                                           columnType,
                                           cards,
                                           allCards,
                                           onAddCard,
                                           isReadOnly,
                                           isAdmin,
                                           selectedAuthor,
                                           onToggleCardVisibility
                                       }) => {
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

    // Filtrer les cartes par auteur si nécessaire
    const filteredCards = selectedAuthor
        ? cards.filter(card => card.author === selectedAuthor)
        : cards;

    // Pour l'admin, montrer également les cartes masquées avec un style différent
    const allFilteredCards = selectedAuthor
        ? allCards.filter(card => card.author === selectedAuthor && card.type === columnType)
        : allCards.filter(card => card.type === columnType);

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

    const handleToggleCardVisibility = async (cardId: string, currentVisibility: boolean) => {
        if (onToggleCardVisibility) {
            await onToggleCardVisibility(cardId, !currentVisibility);
        }
    };

    const displayCards = isAdmin ? allFilteredCards : filteredCards;
    const visibleCount = filteredCards.length;
    const totalCount = allFilteredCards.length;

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
                <div className="text-xs opacity-80 mt-0.5">
                    {isAdmin && totalCount !== visibleCount ? (
                        <span>
                            {visibleCount} / {totalCount} {totalCount === 1 ? t('general.card') : t('general.cards')}
                            <span className="ml-1 text-yellow-200">({totalCount - visibleCount} masquées)</span>
                        </span>
                    ) : (
                        <span>
                            {visibleCount} {visibleCount === 1 ? t('general.card') : t('general.cards')}
                        </span>
                    )}
                    {selectedAuthor && <span className="ml-1">({selectedAuthor})</span>}
                </div>
            </div>

            {/* Cards Container */}
            <div className="flex-grow p-3 overflow-y-auto bg-gray-50 space-y-3 min-h-[200px] max-h-[600px]">
                {displayCards.length > 0 ? (
                    displayCards.map((card, index) => {
                        const isCardVisible = card.isVisible !== false;
                        return (
                            <div
                                className={`transform transition-all hover:-translate-y-1 animate-cardEntrance ${
                                    isAdmin && !isCardVisible ? 'opacity-50 border-2 border-dashed border-gray-400' : ''
                                }`}
                                key={card.id}
                                style={{
                                    animationDelay: `${index * 100}ms`,
                                    animationFillMode: 'backwards'
                                }}
                                draggable={!isReadOnly}
                            >
                                <div className="relative">
                                    <CardComponent card={card} />

                                    {/* Overlay pour cartes masquées (admin seulement) */}
                                    {isAdmin && !isCardVisible && (
                                        <div className="absolute inset-0 bg-gray-200 bg-opacity-80 flex items-center justify-center rounded-md">
                                            <div className="text-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                </svg>
                                                <p className="text-xs text-gray-600 font-medium">Masquée</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Contrôles de visibilité (admin seulement) */}
                                    {isAdmin && onToggleCardVisibility && (
                                        <div className="absolute top-1 right-1">
                                            <button
                                                onClick={() => handleToggleCardVisibility(card.id, isCardVisible)}
                                                className={`p-1 rounded-full text-xs transition-colors ${
                                                    isCardVisible
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                }`}
                                                title={isCardVisible ? 'Masquer cette carte' : 'Révéler cette carte'}
                                            >
                                                {isCardVisible ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
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
                    <Button
                        variant={isReadOnly ? "secondary" : "secondary"}
                        onClick={handleAddCardClick}
                        disabled={isReadOnly}
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        }
                        className={`w-full py-2 px-4 justify-center text-sm font-medium ${
                            isReadOnly
                                ? 'bg-gray-100 text-gray-400'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                    >
                        {t('session.addCard')}
                    </Button>
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
    allCards?: Card[]; // Toutes les cartes (pour l'admin)
    onAddCard: (text: string, columnType: ColumnType) => Promise<void>;
    isReadOnly: boolean;
    isAdmin: boolean;
    sessionId?: string;
    isFullscreen?: boolean;
    selectedAuthor?: string | null;
    activity?: any;
    participants?: any[];
    // Nouvelles props pour la visibilité
    cardsVisible?: boolean;
    onToggleCardsVisibility?: (visible: boolean) => Promise<void>;
    onToggleColumnVisibility?: (columnType: ColumnType, visible: boolean) => Promise<void>;
    onRevealAllCards?: () => Promise<void>;
    onHideAllCards?: () => Promise<void>;
    onToggleCardVisibility?: (cardId: string, isVisible: boolean) => Promise<void>;
}

const InteractiveBoard: React.FC<BoardProps> = ({
                                                    activityType,
                                                    cards,
                                                    allCards,
                                                    onAddCard,
                                                    isReadOnly,
                                                    isAdmin,
                                                    sessionId = '',
                                                    isFullscreen = false,
                                                    selectedAuthor,
                                                    activity,
                                                    participants = [],
                                                    cardsVisible = true,
                                                    onToggleCardsVisibility,
                                                    onToggleColumnVisibility,
                                                    onRevealAllCards,
                                                    onHideAllCards,
                                                    onToggleCardVisibility
                                                }) => {
    const { t } = useTranslation();
    const [filteredCards, setFilteredCards] = useState<Record<string, Card[]>>({});
    const [allFilteredCards, setAllFilteredCards] = useState<Record<string, Card[]>>({});
    const [animateBoard, setAnimateBoard] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uniqueAuthors, setUniqueAuthors] = useState<string[]>([]);
    const [filterAuthor, setFilterAuthor] = useState<string | null>(selectedAuthor || null);

    // Utiliser allCards si fourni, sinon cards
    const cardsToUse = allCards || cards;

    // Extraire les auteurs uniques des cartes
    useEffect(() => {
        if (cardsToUse && cardsToUse.length > 0) {
            const authorsSet = new Set(cardsToUse.map(card => card.author));
            const authors = Array.from(authorsSet).filter(Boolean) as string[];
            setUniqueAuthors(authors);
        }
    }, [cardsToUse]);

    // Mise à jour du filtre quand selectedAuthor change (prop externe)
    useEffect(() => {
        setFilterAuthor(selectedAuthor || null);
    }, [selectedAuthor]);

    // Spécifique à l'ice breaker
    const iceBreakerType = activity?.iceBreakerType || null;

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
            console.log(`Filtering ${cards.length} visible cards and ${cardsToUse.length} total cards for ${activityType} activity`);

            // Group visible cards by column type
            const grouped = ACTIVITY_COLUMNS[activityType as ActivityType].reduce((acc, columnType) => {
                acc[columnType] = cards.filter(card => card.type === columnType);
                return acc;
            }, {} as Record<string, Card[]>);

            // Group all cards by column type (for admin)
            const allGrouped = ACTIVITY_COLUMNS[activityType as ActivityType].reduce((acc, columnType) => {
                acc[columnType] = cardsToUse.filter(card => card.type === columnType);
                return acc;
            }, {} as Record<string, Card[]>);

            console.log("Visible cards grouped by column:", Object.keys(grouped).map(col =>
                `${col}: ${grouped[col]?.length || 0} cards`
            ));

            console.log("All cards grouped by column:", Object.keys(allGrouped).map(col =>
                `${col}: ${allGrouped[col]?.length || 0} cards`
            ));

            setFilteredCards(grouped);
            setAllFilteredCards(allGrouped);
            setError(null); // Clear any previous errors
        } catch (err) {
            console.error("Error filtering cards:", err);
            setError("Erreur lors du filtrage des cartes");
        }
    }, [cards, cardsToUse, activityType]);

    // Add entrance animation for the board
    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimateBoard(true);
        }, 300);

        return () => clearTimeout(timer);
    }, []);

    // Gestionnaire pour sélectionner un auteur
    const handleAuthorSelect = (author: string) => {
        if (filterAuthor === author) {
            // Si l'auteur est déjà sélectionné, désélectionner
            setFilterAuthor(null);
        } else {
            // Sinon, sélectionner l'auteur
            setFilterAuthor(author);
        }
    };

    // Traitement pour les activités "iceBreaker"
    if (activityType === 'iceBreaker') {
        // Si c'est une "Question Fun Express"
        if (iceBreakerType === 'funQuestion') {
            return (
                <div className="w-full">
                    <QuestionFunExpress
                        sessionId={sessionId}
                        activityId={activity?.id}
                        isAdmin={isAdmin}
                        participants={participants}
                    />
                </div>
            );
        }

        // Rendu par défaut pour les autres types d'icebreakers (si non reconnu)
        return (
            <div className="text-center py-8 bg-white rounded-lg shadow-md">
                <div className="mb-6">
                    <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <span className="text-4xl">🧊</span>
                    </div>
                </div>
                <h2 className="text-xl font-bold mb-4">{t('activities.iceBreaker')}</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                    {t('activities.iceBreakerDescription')}
                </p>
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
            case 2: return isFullscreen ? 'w-1/2' : 'md:w-1/2';
            case 3: return isFullscreen ? 'w-1/3' : 'w-full md:w-1/3';
            case 4: return isFullscreen ? 'w-1/4' : 'md:w-1/2 lg:w-1/4';
            default: return 'w-full';
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow-lg p-4 mb-6 overflow-hidden transition-all duration-500 ${isFullscreen ? 'h-full' : ''} ${animateBoard ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>

            {/* Card Visibility Controls pour admin */}
            {isAdmin && onToggleCardsVisibility && onToggleColumnVisibility && onRevealAllCards && onHideAllCards && (
                <CardVisibilityControls
                    isAdmin={isAdmin}
                    cardsVisible={cardsVisible}
                    onToggleGlobalVisibility={onToggleCardsVisibility}
                    onToggleColumnVisibility={onToggleColumnVisibility}
                    onRevealAllCards={onRevealAllCards}
                    onHideAllCards={onHideAllCards}
                    columns={columns}
                    sessionId={sessionId}
                />
            )}

            {/* Board Header */}
            <div className="mb-6 pb-4 border-b border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <span className="mr-2">{t(`activities.types.${activityType}`)}</span>
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                                {cards.length} {cards.length === 1 ? t('general.card') : t('general.cards')}
                                {isAdmin && cardsToUse.length !== cards.length && (
                                    <span className="ml-1">
                                        / {cardsToUse.length} total
                                    </span>
                                )}
                            </span>
                        </h2>

                        {filterAuthor && (
                            <div className="mt-1 text-sm bg-blue-50 text-blue-600 px-2 py-1 rounded inline-flex items-center">
                                <span>Filtré par: {filterAuthor}</span>
                                <button
                                    onClick={() => setFilterAuthor(null)}
                                    className="ml-2 text-blue-700 hover:text-blue-900"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Utilisateurs participant au board avec une apparence plus attrayante */}
                    <div className="flex items-center flex-wrap gap-2">
                        {uniqueAuthors.map(author => (
                            <button
                                key={author}
                                onClick={() => handleAuthorSelect(author)}
                                className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-all 
                                    ${filterAuthor === author
                                    ? 'bg-blue-500 text-white shadow-md scale-110'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs font-bold">
                                    {author.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="text-sm">{author}</span>
                                {filterAuthor === author && (
                                    <span className="w-2 h-2 rounded-full bg-white"></span>
                                )}
                            </button>
                        ))}
                    </div>
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
            <div className={`flex flex-col md:flex-row flex-wrap md:flex-nowrap gap-4 ${isFullscreen ? 'h-full' : 'min-h-[500px]'} relative justify-center`}>
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
                        <div key={columnType} className={`${getColumnWidthClass()} h-96 md:h-auto mx-auto md:mx-0`}>
                            <Column
                                title={t(`activities.columns.${activityType}.${columnType}`)}
                                columnType={columnType}
                                cards={filteredCards[columnType] || []}
                                allCards={allFilteredCards[columnType] || []}
                                onAddCard={onAddCard}
                                isReadOnly={isReadOnly}
                                isAdmin={isAdmin}
                                sessionId={sessionId}
                                selectedAuthor={filterAuthor}
                                onToggleCardVisibility={onToggleCardVisibility}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default InteractiveBoard;
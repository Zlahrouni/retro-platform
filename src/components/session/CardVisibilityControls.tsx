// src/components/session/CardVisibilityControls.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ColumnType } from '../../types/types';
import Button from '../commons/Button';

interface CardVisibilityControlsProps {
    isAdmin: boolean;
    cardsVisible: boolean;
    onToggleGlobalVisibility: (visible: boolean) => Promise<void>;
    onToggleColumnVisibility: (columnType: ColumnType, visible: boolean) => Promise<void>;
    onRevealAllCards: () => Promise<void>;
    onHideAllCards: () => Promise<void>;
    columns: ColumnType[];
    sessionId: string;
    isLoading?: boolean;
}

const CardVisibilityControls: React.FC<CardVisibilityControlsProps> = ({
                                                                           isAdmin,
                                                                           cardsVisible,
                                                                           onToggleGlobalVisibility,
                                                                           onToggleColumnVisibility,
                                                                           onRevealAllCards,
                                                                           onHideAllCards,
                                                                           columns,
                                                                           sessionId,
                                                                           isLoading = false
                                                                       }) => {
    const { t } = useTranslation();
    const [showAdvancedControls, setShowAdvancedControls] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    if (!isAdmin) {
        return (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cardsVisible ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"} />
                    </svg>
                    <span className="text-sm font-medium">
                        {cardsVisible ? (
                            "Les cartes sont actuellement visibles pour tous"
                        ) : (
                            "Les cartes sont actuellement masquées - seul l'administrateur peut les voir"
                        )}
                    </span>
                </div>
            </div>
        );
    }

    const handleAction = async (action: () => Promise<void>, actionName: string) => {
        setActionLoading(actionName);
        try {
            await action();
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="mb-6 bg-white rounded-lg shadow-md border border-gray-200">
            {/* Header avec contrôle principal */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="font-semibold text-gray-800 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 616 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Contrôle de visibilité des cartes
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {cardsVisible
                                ? "Les participants peuvent voir toutes les cartes"
                                : "Seul l'administrateur peut voir les cartes"
                            }
                        </p>
                    </div>

                    <div className="flex space-x-2">
                        <Button
                            variant={cardsVisible ? "danger" : "primary"}
                            onClick={() => handleAction(
                                async () => await onToggleGlobalVisibility(!cardsVisible),
                                'toggle-global'
                            )}
                            disabled={isLoading || !!actionLoading}
                            icon={
                                cardsVisible ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 616 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )
                            }
                            className={actionLoading === 'toggle-global' ? 'opacity-70' : ''}
                        >
                            {actionLoading === 'toggle-global' ? 'Chargement...' : (
                                cardsVisible ? 'Masquer toutes les cartes' : 'Révéler toutes les cartes'
                            )}
                        </Button>

                        <button
                            onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                            Contrôles avancés
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 inline transition-transform ${showAdvancedControls ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Contrôles avancés (collapsibles) */}
            {showAdvancedControls && (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <div className="space-y-4">
                        {/* Actions globales */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Actions globales</h4>
                            <div className="flex space-x-2">
                                <Button
                                    variant="success"
                                    onClick={() => handleAction(async () => await onRevealAllCards(), 'reveal-all')}
                                    disabled={isLoading || !!actionLoading}
                                    icon={
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 616 0z" />
                                        </svg>
                                    }
                                    className={`text-sm ${actionLoading === 'reveal-all' ? 'opacity-70' : ''}`}
                                >
                                    {actionLoading === 'reveal-all' ? 'Révélation...' : 'Révéler tout'}
                                </Button>

                                <Button
                                    variant="danger"
                                    onClick={() => handleAction(async () => await onHideAllCards(), 'hide-all')}
                                    disabled={isLoading || !!actionLoading}
                                    icon={
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 711.563-3.029" />
                                        </svg>
                                    }
                                    className={`text-sm ${actionLoading === 'hide-all' ? 'opacity-70' : ''}`}
                                >
                                    {actionLoading === 'hide-all' ? 'Masquage...' : 'Masquer tout'}
                                </Button>
                            </div>
                        </div>

                        {/* Contrôles par colonne */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Contrôle par colonne</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {columns.map(columnType => (
                                    <div key={columnType} className="flex space-x-1">
                                        <button
                                            onClick={() => handleAction(
                                                async () => await onToggleColumnVisibility(columnType, true),
                                                `show-${columnType}`
                                            )}
                                            disabled={isLoading || !!actionLoading}
                                            className={`flex-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors ${
                                                actionLoading === `show-${columnType}` ? 'opacity-70' : ''
                                            }`}
                                        >
                                            ✓ {t(`activities.columns.${columnType}`) || columnType}
                                        </button>
                                        <button
                                            onClick={() => handleAction(
                                                async () => await onToggleColumnVisibility(columnType, false),
                                                `hide-${columnType}`
                                            )}
                                            disabled={isLoading || !!actionLoading}
                                            className={`flex-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors ${
                                                actionLoading === `hide-${columnType}` ? 'opacity-70' : ''
                                            }`}
                                        >
                                            ✗ {t(`activities.columns.${columnType}`) || columnType}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CardVisibilityControls;
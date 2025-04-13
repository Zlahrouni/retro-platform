// src/components/cards/CardComponent.tsx
import React, { useMemo } from 'react';
import { Card } from '../../types/types';

interface CardComponentProps {
    card: Card;
}

const CardComponent: React.FC<CardComponentProps> = ({ card }) => {
    // Utiliser useMemo pour éviter des recalculs inutiles lors des rendus
    const formattedDate = useMemo(() => {
        if (!card.createdAt) return '';

        try {
            // Créer une date correcte, même si card.createdAt n'est pas un objet Date valide
            const date = new Date(card.createdAt);
            return new Intl.DateTimeFormat('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
            }).format(date);
        } catch (error) {
            console.error("Erreur de formatage de date:", error);
            return '';
        }
    }, [card.createdAt]);

    return (
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200 shadow-sm hover:shadow transition-shadow">
            <p className="text-gray-800 whitespace-pre-wrap break-words">{card.text || ''}</p>

            <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
                <span>{card.author || 'Anonyme'}</span>
                <span>{formattedDate}</span>
            </div>
        </div>
    );
};

// Utiliser React.memo pour éviter les rendus inutiles
export default React.memo(CardComponent);
// src/components/cards/CardComponent.tsx
import React from 'react';
import { Card } from '../../types/types';

interface CardComponentProps {
    card: Card;
}

const CardComponent: React.FC<CardComponentProps> = ({ card }) => {
    // Formater la date pour l'affichage
    const formatDate = (date: Date): string => {
        return new Intl.DateTimeFormat('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200 shadow-sm hover:shadow transition-shadow">
            <p className="text-gray-800 whitespace-pre-wrap">{card.text}</p>

            <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
                <span>{card.author}</span>
                <span>{formatDate(card.createdAt)}</span>
            </div>
        </div>
    );
};

export default CardComponent;
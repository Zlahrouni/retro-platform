// src/components/icebreakers/CardTransition.tsx
import React, { useState, useEffect } from 'react';

interface CardTransitionProps {
    show: boolean;
    type: 'question' | 'player';
    onAnimationComplete?: () => void;
}

const CardTransition: React.FC<CardTransitionProps> = ({
                                                           show,
                                                           type,
                                                           onAnimationComplete
                                                       }) => {
    const [animationClass, setAnimationClass] = useState('');

    useEffect(() => {
        if (show) {
            const typeClass = type === 'question' ? 'card-flip-transition' : 'player-change-transition';
            setAnimationClass(`transition-overlay ${typeClass}`);

            // Déclencher la fonction de callback après la durée de l'animation
            const timer = setTimeout(() => {
                setAnimationClass('');
                if (onAnimationComplete) onAnimationComplete();
            }, 1200); // Légèrement plus long que l'animation CSS

            return () => clearTimeout(timer);
        }
    }, [show, type, onAnimationComplete]);

    if (!animationClass) return null;

    return (
        <div className={animationClass}>
            <div className="transition-content">
                {type === 'question' ? (
                    <div className="question-change">
                        <div className="emoji-animation">🔁</div>
                        <div className="label">Nouvelle question...</div>
                    </div>
                ) : (
                    <div className="player-change">
                        <div className="emoji-animation">👤</div>
                        <div className="label">Changement de joueur...</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CardTransition;
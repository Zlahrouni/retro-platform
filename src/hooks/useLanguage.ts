// src/hooks/useLanguage.ts
import { useState, useEffect } from 'react';
import i18n from '../i18n/i18n'; // Assurez-vous que le chemin est correct

export type SupportedLanguage = 'fr' | 'en';

export const useLanguage = () => {
    // N'utilisez pas directement useTranslation() ici
    const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
        (localStorage.getItem('language') as SupportedLanguage) || 'fr'
    );

    useEffect(() => {
        try {
            // Utilisez l'instance i18n importée directement
            if (typeof i18n.changeLanguage === 'function') {
                i18n.changeLanguage(currentLanguage);
            } else {
                // Méthode alternative si changeLanguage n'existe pas
                i18n.language = currentLanguage;
            }
            // Sauvegarder la préférence de langue dans localStorage
            localStorage.setItem('language', currentLanguage);
        } catch (error) {
            console.error('Erreur lors du changement de langue:', error);
        }
    }, [currentLanguage]);

    const changeLanguage = (language: SupportedLanguage) => {
        setCurrentLanguage(language);
    };

    // Créez une fonction simple pour traduire
    const translate = (key: string): string => {
        try {
            // @ts-ignore
            return i18n.t(key) || key;
        } catch (error) {
            return key;
        }
    };

    return {
        currentLanguage,
        changeLanguage,
        t: translate
    };
};
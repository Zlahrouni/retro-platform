// src/i18n/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import des fichiers de traduction
import translationEN from './locales/en.json';
import translationFR from './locales/fr.json';

declare module 'i18next' {
    interface CustomTypeOptions {
        returnNull: false;
        resources: {
            translation: typeof translationEN;
        };
    }
}

// Les ressources de traduction
const resources = {
    en: {
        translation: translationEN
    },
    fr: {
        translation: translationFR
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'fr',
        debug: process.env.NODE_ENV === 'development',
        interpolation: {
            escapeValue: false
        },
        returnNull: false
    });

export default i18n;
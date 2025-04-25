// src/utils/dateUtils.ts
import { Timestamp } from 'firebase/firestore';

/**
 * Convertit une valeur de date (Date, Timestamp Firebase, string ou number) en objet Date JavaScript
 * @param dateValue - La valeur à convertir en Date
 * @returns Objet Date JavaScript ou null si la conversion échoue
 */
export const toJsDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;

    try {
        // Si c'est déjà une Date
        if (dateValue instanceof Date) {
            return dateValue;
        }

        // Si c'est un Timestamp Firebase
        if (typeof dateValue === 'object' && 'toDate' in dateValue && typeof dateValue.toDate === 'function') {
            return dateValue.toDate();
        }

        // Sinon, essayer de créer une Date à partir de la valeur
        return new Date(dateValue);
    } catch (error) {
        console.error("Erreur de conversion de date:", error);
        return null;
    }
};

/**
 * Formate une date en heure locale (HH:MM)
 * @param dateValue - La valeur à formater
 * @returns Chaîne formatée ou chaîne vide si la date est invalide
 */
export const formatTimeHHMM = (dateValue: any): string => {
    const date = toJsDate(dateValue);
    if (!date) return '';

    try {
        return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    } catch (error) {
        console.error("Erreur de formatage d'heure:", error);
        return '';
    }
};

/**
 * Formate une date en format court (JJ/MM/YYYY)
 * @param dateValue - La valeur à formater
 * @returns Chaîne formatée ou chaîne vide si la date est invalide
 */
export const formatShortDate = (dateValue: any): string => {
    const date = toJsDate(dateValue);
    if (!date) return '';

    try {
        return date.toLocaleDateString();
    } catch (error) {
        console.error("Erreur de formatage de date:", error);
        return '';
    }
};

/**
 * Obtient un timestamp au format milliseconds à partir d'une valeur de date
 * Utile pour les comparaisons de dates
 * @param dateValue - La valeur à convertir
 * @returns timestamp en millisecondes ou 0 si la date est invalide
 */
export const getTimestamp = (dateValue: any): number => {
    const date = toJsDate(dateValue);
    if (!date) return 0;

    return date.getTime();
};